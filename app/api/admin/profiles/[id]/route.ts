import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel, AuditLogModel, NotificationModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { buildMDCard, buildADCard, buildCDCard, buildFDCard } from "@/lib/cardGenerator";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const profile = await ProfileModel.findById(params.id).populate("userId approvedBy", "-passwordHash");
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const auditLogs = await AuditLogModel.find({
      targetId: profile._id,
      targetType: "Profile",
    })
      .sort({ timestamp: -1 })
      .limit(20);

    return NextResponse.json({
      profile: {
        id: profile._id.toString(),
        userId: (profile.userId as any)?._id?.toString(),
        userName: (profile.userId as any)?.name,
        userEmail: (profile.userId as any)?.email,
        userProfileId: (profile.userId as any)?.profileId,
        age: profile.age,
        religion: profile.religion,
        caste: profile.caste,
        subCaste: profile.subCaste,
        location: profile.location,
        address: profile.address,
        nativeDistrict: profile.nativeDistrict,
        education: profile.education,
        income: profile.income,
        monthlyIncome: profile.monthlyIncome,
        currentJob: profile.currentJob,
        bio: profile.bio,
        dateOfBirth: profile.dateOfBirth,
        maritalStatus: profile.maritalStatus,
        gender: profile.gender,
        placeOfBirth: profile.placeOfBirth,
        timeOfBirth: profile.timeOfBirth,
        rashi: profile.rashi,
        nakshatra: profile.nakshatra,
        lagnam: profile.lagnam,
        motherTongue: profile.motherTongue,
        height: profile.height,
        weight: profile.weight,
        complexion: profile.complexion,
        physicallyChallenge: profile.physicallyChallenge,
        otherDetails: profile.otherDetails,
        fatherName: profile.fatherName,
        fatherOccupation: profile.fatherOccupation,
        motherName: profile.motherName,
        motherOccupation: profile.motherOccupation,
        totalBrothers: profile.totalBrothers,
        marriedBrothers: profile.marriedBrothers,
        totalSisters: profile.totalSisters,
        marriedSisters: profile.marriedSisters,
        houseDetails: profile.houseDetails,
        familyStatus: profile.familyStatus,
        contactPersonName: profile.contactPersonName,
        contactNumber: profile.contactNumber,
        whatsappNo: profile.whatsappNo,
        profileType: profile.profileType,
        familyClass: profile.familyClass,
        expectations: profile.expectations,
        photos: profile.photos,
        profileStatus: profile.profileStatus,
        generatedCards: profile.generatedCards,
        approvedBy: (profile.approvedBy as any)?._id?.toString(),
        approvalDate: profile.approvalDate,
        rejectionReason: profile.rejectionReason,
        flaggedReason: profile.flaggedReason,
        contentScore: profile.contentScore,
        moderationNotes: profile.moderationNotes,
        createdAt: profile.createdAt,
      },
      auditLogs: auditLogs.map((log) => ({
        id: log._id.toString(),
        action: log.action,
        changes: log.changes,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const profile = await ProfileModel.findById(params.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { profileStatus, rejectionReason, flaggedReason, contentScore, moderationNotes } =
      await request.json();

    const before = {
      profileStatus: profile.profileStatus,
      rejectionReason: profile.rejectionReason,
      flaggedReason: profile.flaggedReason,
      contentScore: profile.contentScore,
    };

    if (profileStatus   !== undefined) profile.profileStatus   = profileStatus;
    if (rejectionReason !== undefined) profile.rejectionReason = rejectionReason;
    if (flaggedReason   !== undefined) profile.flaggedReason   = flaggedReason;
    if (contentScore    !== undefined) profile.contentScore    = contentScore;
    if (moderationNotes !== undefined) profile.moderationNotes = moderationNotes;

    // ── Auto-generate all 4 cards when approving ──────────────────────────
    if (profileStatus === "APPROVED" && before.profileStatus !== "APPROVED") {
      profile.approvedBy   = new ObjectId(session.user.id);
      profile.approvalDate = new Date();

      // Fetch the user to build cards
      const user = await UserModel.findById(profile.userId).lean() as any;
      if (user) {
        // Mark all cards generated
        profile.generatedCards = { MD: true, AD: true, CD: true, FD: true };
        profile.cardsGeneratedAt = new Date();

        // Build FD card for email (fire-and-forget)
        try {
          const fd = buildFDCard(user, profile.toObject());
          // Send email with FD card (non-blocking)
          void sendFDCardEmail(user.email, user.name, fd).catch(console.error);
        } catch (e) {
          console.error("FD card build error:", e);
        }
      }
    }

    await profile.save();

    // ── Send notification to user on status change ────────────────────────
    if (profileStatus && profileStatus !== before.profileStatus) {
      try {
        const notifPayload =
          profileStatus === "APPROVED"
            ? { type: "PROFILE_APPROVED", message: "Your profile has been approved and is now live!", link: "/dashboard" }
            : profileStatus === "REJECTED"
            ? { type: "PROFILE_REJECTED", message: `Your profile was rejected. Reason: ${rejectionReason ?? "See dashboard for details"}. Please update and re-submit.`, link: "/dashboard" }
            : null;
        if (notifPayload) {
          await NotificationModel.create({ userId: profile.userId, ...notifPayload });
        }
      } catch { /* non-critical */ }
    }

    await AuditLogModel.create({
      adminId:    session.user.id,
      action:     "update_profile",
      targetType: "Profile",
      targetId:   profile._id,
      changes: {
        before,
        after: { profileStatus, rejectionReason, flaggedReason, contentScore },
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      profile: {
        id:              profile._id.toString(),
        profileStatus:   profile.profileStatus,
        generatedCards:  profile.generatedCards,
        rejectionReason: profile.rejectionReason,
        flaggedReason:   profile.flaggedReason,
        contentScore:    profile.contentScore,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// ── Gap 7: FD card email helper ───────────────────────────────────────────────
async function sendFDCardEmail(email: string, name: string, fdCard: any) {
  if (!process.env.SMTP_USER) {
    console.log(`[FD Email] Gmail not configured — skipping email to ${email}`);
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fieldRow = (label: string, value: any) =>
    value ? `<tr><td style="padding:4px 12px;color:#6b7280;font-size:13px;">${label}</td><td style="padding:4px 12px;font-weight:600;font-size:13px;">${value}</td></tr>` : "";

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
          ${fieldRow("Profile ID",       fdCard.profileId)}
          ${fieldRow("Name",             fdCard.name)}
          ${fieldRow("Age",              fdCard.age ? `${fdCard.age} years` : null)}
          ${fieldRow("Religion",         fdCard.religion)}
          ${fieldRow("Caste",            fdCard.caste)}
          ${fieldRow("District",         fdCard.district)}
          ${fieldRow("Education",        fdCard.education)}
          ${fieldRow("Nakshatra",        fdCard.nakshatra)}
          ${fieldRow("Rashi",            fdCard.rashi)}
          ${fieldRow("Monthly Income",   fdCard.monthlyIncome ? `₹${fdCard.monthlyIncome}` : null)}
          ${fieldRow("Father Name",      fdCard.fatherName)}
          ${fieldRow("Mother Name",      fdCard.motherName)}
          ${fieldRow("Contact Person",   fdCard.contactPersonName)}
          ${fieldRow("Contact Number",   fdCard.contactNumber)}
          ${fieldRow("WhatsApp",         fdCard.whatsappNo)}
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
