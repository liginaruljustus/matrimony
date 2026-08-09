import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel, AuditLogModel, NotificationModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { buildMDCard, buildADCard, buildCDCard, buildFDCard } from "@/lib/cardGenerator";
import { calculateAge } from "@/lib/age";
import { sendFDCardEmail } from "@/lib/sendFDCardEmail";

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
        age: calculateAge(profile.dateOfBirth) ?? profile.age,
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

    const VALID_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "FLAGGED"];
    if (profileStatus !== undefined && !VALID_STATUSES.includes(profileStatus)) {
      return NextResponse.json({ error: `Invalid profileStatus: ${profileStatus}` }, { status: 400 });
    }

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
