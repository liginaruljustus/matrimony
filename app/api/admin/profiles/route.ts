import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel, AuditLogModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";
import { buildFDCard } from "@/lib/cardGenerator";
import { sendFDCardEmail } from "@/lib/sendFDCardEmail";
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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const filter: any = {};
    if (status) filter.profileStatus = status;
    if (type) filter.profileType = type;
    if (search) {
      // Escape regex metacharacters to prevent ReDoS with adversarial input.
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const userIds = await UserModel.find({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
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
            // Awaited (not fire-and-forget) — a detached promise can be killed
            // mid-send once this serverless function's response is returned.
            await sendFDCardEmail(user.email, user.name, fd);
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
