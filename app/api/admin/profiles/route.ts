import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel, AuditLogModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";
import { buildFDCard } from "@/lib/cardGenerator";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25"));
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const filter: any = {};
    if (status) filter.profileStatus = status;
    if (type) filter.profileType = type;
    if (search) {
      const userIds = await UserModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.userId = { $in: userIds.map((u) => u._id) };
    }

    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      ProfileModel.find(filter)
        .populate("userId", "name email profileId profileType")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ProfileModel.countDocuments(filter),
    ]);

    const profilesData = profiles.map((profile) => ({
      id: profile._id.toString(),
      userId: (profile.userId as any)?._id?.toString(),
      userName: (profile.userId as any)?.name,
      userEmail: (profile.userId as any)?.email,
      userProfileId: (profile.userId as any)?.profileId,
      profileType: profile.profileType,
      profileStatus: profile.profileStatus,
      contentScore: profile.contentScore || 0,
      createdAt: profile.createdAt,
      flaggedReason: profile.flaggedReason,
    }));

    return NextResponse.json({
      profiles: profilesData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { action, profileIds, reason } = await request.json();

    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ error: "Invalid profileIds" }, { status: 400 });
    }

    const objectIds = profileIds.map((id) => new (require("mongodb").ObjectId)(id));
    let updateData: any = {};

    const now = new Date();

    switch (action) {
      case "approve":
        updateData = {
          profileStatus:    "APPROVED",
          approvedBy:       session.user.id,
          approvalDate:     now,
          // Mark all 4 cards generated (mirrors individual approve route)
          generatedCards:   { MD: true, AD: true, CD: true, FD: true },
          cardsGeneratedAt: now,
        };
        break;
      case "reject":
        updateData = {
          profileStatus:   "REJECTED",
          rejectionReason: reason || "Rejected by admin",
        };
        break;
      case "flag":
        updateData = {
          profileStatus: "FLAGGED",
          flaggedReason: reason || "Flagged for review",
        };
        break;
      case "delete":
        // Soft delete — hide from all views but keep in DB for audit trail
        updateData = {
          profileStatus:   "REJECTED",
          rejectionReason: "Removed by admin",
          isFrozen:        true,
          frozenAt:        now,
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await ProfileModel.updateMany({ _id: { $in: objectIds } }, { $set: updateData });

    // For bulk approve: send FD card email to each user (fire-and-forget)
    if (action === "approve") {
      const approvedProfiles = await ProfileModel.find({ _id: { $in: objectIds } }).lean() as any[];
      const userIds          = approvedProfiles.map((p: any) => p.userId);
      const users            = await UserModel.find({ _id: { $in: userIds } }).lean() as any[];
      const userMap          = Object.fromEntries(users.map((u: any) => [String(u._id), u]));

      for (const profile of approvedProfiles) {
        const user = userMap[String(profile.userId)];
        if (user?.email) {
          try {
            const fd = buildFDCard(user, profile);
            void sendFDCardEmail(user.email, user.name, fd).catch(console.error);
          } catch (e) {
            console.error("Bulk approve FD card error:", e);
          }
        }
      }
    }

    // Audit log — one entry per profile
    for (const profileId of profileIds) {
      await AuditLogModel.create({
        adminId:    session.user.id,
        action:     `bulk_${action}_profile`,
        targetType: "Profile",
        targetId:   new ObjectId(profileId),
        changes: {
          before: { profileStatus: "PENDING_APPROVAL" },
          after:  updateData,
        },
        timestamp: now,
      });
    }

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating profiles:", error);
    return NextResponse.json({ error: "Failed to update profiles" }, { status: 500 });
  }
}

// ── Shared FD-card email helper (mirrors the one in /api/admin/profiles/[id]) ──
async function sendFDCardEmail(email: string, name: string, fdCard: any) {
  if (!process.env.SMTP_USER) {
    console.log(`[FD Email] Gmail not configured — skipping email to ${email}`);
    return;
  }

  const nodemailer  = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth:    { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const row = (label: string, value: any) =>
    value
      ? `<tr><td style="padding:4px 12px;color:#6b7280;font-size:13px;">${label}</td><td style="padding:4px 12px;font-weight:600;font-size:13px;">${value}</td></tr>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;">
      <div style="background:#7a1f2b;padding:24px;text-align:center;">
        <h1 style="color:#d4af37;margin:0;font-size:22px;">Regin Matrimony</h1>
        <p style="color:#fff;margin:8px 0 0;font-size:14px;">Your Full Profile Details</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#374151;">Dear <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Your profile has been approved. Below are your complete profile details for your records.</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin:16px 0;">
          ${row("Profile ID",     fdCard.profileId)}
          ${row("Name",           fdCard.name)}
          ${row("Age",            fdCard.age ? `${fdCard.age} years` : null)}
          ${row("Religion",       fdCard.religion)}
          ${row("Caste",          fdCard.caste)}
          ${row("District",       fdCard.district)}
          ${row("Education",      fdCard.education)}
          ${row("Nakshatra",      fdCard.nakshatra)}
          ${row("Rashi",          fdCard.rashi)}
          ${row("Monthly Income", fdCard.monthlyIncome ? `₹${fdCard.monthlyIncome}` : null)}
          ${row("Father Name",    fdCard.fatherName)}
          ${row("Mother Name",    fdCard.motherName)}
          ${row("Contact Person", fdCard.contactPersonName)}
          ${row("Contact Number", fdCard.contactNumber)}
          ${row("WhatsApp",       fdCard.whatsappNo)}
        </table>
        <p style="color:#6b7280;font-size:12px;">Please keep this email safe. Do not share your login credentials.</p>
      </div>
      <div style="background:#7a1f2b;padding:12px;text-align:center;">
        <p style="color:#d4af37;margin:0;font-size:12px;">© ${new Date().getFullYear()} Regin Matrimony</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? `"Regin Matrimony" <no-reply@reginmatrimony.com>`,
    to:      email,
    subject: "Your Regin Matrimony Profile Has Been Approved — Full Details",
    html,
  });

  console.log(`[FD Email] Sent to ${email}`);
}
