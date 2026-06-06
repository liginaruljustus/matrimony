import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, AuditLogModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";
// ProfileModel is already imported — used in DELETE to hide the profile

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
    // Select everything except the bcrypt hash
    const user = await UserModel.findById(params.id).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await ProfileModel.findOne({ userId: user._id });

    const auditLogs = await AuditLogModel.find({
      targetId: user._id,
      targetType: "User",
    })
      .sort({ timestamp: -1 })
      .limit(20);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        image: user.image ?? null,
        profileId: user.profileId ?? null,
        profileType: user.profileType ?? null,
        familyClass: user.familyClass ?? null,
        // Plain-text auto-generated password (admin visibility only)
        autoPassword: user.autoPassword ?? null,
        // Status
        status: user.status,
        verificationStatus: user.verificationStatus,
        suspendReason: user.suspendReason ?? null,
        suspendedAt: user.suspendedAt ?? null,
        notes: user.notes ?? null,
        // Freeze
        isFrozen: user.isFrozen ?? false,
        frozenAt: user.frozenAt ?? null,
        isAutoFrozen: user.isAutoFrozen ?? false,
        autoFrozenAt: user.autoFrozenAt ?? null,
        // Dates
        termsAcceptedAt: user.termsAcceptedAt ?? null,
        lastLogin: user.lastLogin ?? null,
        lastActivity: user.lastActivity ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Documents
        verificationDocuments: user.verificationDocuments ?? [],
      },
      profile: profile
        ? {
            id: profile._id.toString(),
            profileStatus: profile.profileStatus,
            profileType: profile.profileType ?? null,
            familyClass: profile.familyClass ?? null,
            // Personal
            age: profile.age ?? null,
            gender: profile.gender ?? null,
            dateOfBirth: profile.dateOfBirth ?? null,
            religion: profile.religion ?? null,
            caste: profile.caste ?? null,
            subCaste: profile.subCaste ?? null,
            maritalStatus: profile.maritalStatus ?? null,
            motherTongue: profile.motherTongue ?? null,
            // Physical
            height: profile.height ?? null,
            weight: profile.weight ?? null,
            complexion: profile.complexion ?? null,
            physicallyChallenge: profile.physicallyChallenge ?? false,
            // Location & Birth
            location: profile.location ?? null,
            address: profile.address ?? null,
            nativeDistrict: profile.nativeDistrict ?? null,
            placeOfBirth: profile.placeOfBirth ?? null,
            timeOfBirth: profile.timeOfBirth ?? null,
            // Astrology
            rashi: profile.rashi ?? null,
            nakshatra: profile.nakshatra ?? null,
            lagnam: profile.lagnam ?? null,
            // Education & Career
            education: profile.education ?? null,
            currentJob: profile.currentJob ?? null,
            income: profile.income ?? null,
            monthlyIncome: profile.monthlyIncome ?? null,
            // Family
            fatherName: profile.fatherName ?? null,
            fatherOccupation: profile.fatherOccupation ?? null,
            motherName: profile.motherName ?? null,
            motherOccupation: profile.motherOccupation ?? null,
            totalBrothers: profile.totalBrothers ?? null,
            marriedBrothers: profile.marriedBrothers ?? null,
            totalSisters: profile.totalSisters ?? null,
            marriedSisters: profile.marriedSisters ?? null,
            houseDetails: profile.houseDetails ?? null,
            familyStatus: profile.familyStatus ?? null,
            // Contact
            contactPersonName: profile.contactPersonName ?? null,
            contactNumber: profile.contactNumber ?? null,
            whatsappNo: profile.whatsappNo ?? null,
            // Content
            bio: profile.bio ?? null,
            expectations: profile.expectations ?? null,
            photos: profile.photos ?? [],
            otherDetails: profile.otherDetails ?? null,
            // Moderation
            approvalDate: profile.approvalDate ?? null,
            rejectionReason: profile.rejectionReason ?? null,
            flaggedReason: profile.flaggedReason ?? null,
            moderationNotes: profile.moderationNotes ?? null,
            contentScore: profile.contentScore ?? null,
            generatedCards: profile.generatedCards ?? { MD: false, AD: false, CD: false, FD: false },
            // Freeze
            isFrozen: profile.isFrozen ?? false,
            frozenAt: profile.frozenAt ?? null,
            frozenReason: profile.frozenReason ?? null,
            isAutoFrozen: profile.isAutoFrozen ?? false,
            autoFrozenAt: profile.autoFrozenAt ?? null,
            lastActivity: profile.lastActivity ?? null,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      auditLogs: auditLogs.map((log) => ({
        id: log._id.toString(),
        action: log.action,
        changes: log.changes,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
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
    const user = await UserModel.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { status, verificationStatus, notes, suspendReason } = await request.json();

    const before = {
      status: user.status,
      verificationStatus: user.verificationStatus,
      notes: user.notes,
    };

    if (status !== undefined) user.status = status;
    if (verificationStatus !== undefined) user.verificationStatus = verificationStatus;
    if (notes !== undefined) user.notes = notes;
    if (suspendReason !== undefined) user.suspendReason = suspendReason;

    if (status === "SUSPENDED" && !user.suspendedAt) {
      user.suspendedAt = new Date();
    } else if (status === "ACTIVE") {
      user.suspendedAt = null;
    }

    await user.save();

    await AuditLogModel.create({
      adminId: session.user.id,
      action: "update_user",
      targetType: "User",
      targetId: user._id,
      changes: {
        before,
        after: { status, verificationStatus, notes },
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        status: user.status,
        verificationStatus: user.verificationStatus,
        notes: user.notes,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const user = await UserModel.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    user.status   = "INACTIVE";
    user.isFrozen = true;
    user.frozenAt = now;
    await user.save();

    // Also freeze the profile so it immediately disappears from all groom searches
    await ProfileModel.findOneAndUpdate(
      { userId: user._id },
      { $set: { isFrozen: true, frozenAt: now, frozenReason: "User account deleted" } },
    );

    await AuditLogModel.create({
      adminId: session.user.id,
      action: "delete_user",
      targetType: "User",
      targetId: user._id,
      changes: {
        before: { status: "ACTIVE" },
        after:  { status: "INACTIVE", isFrozen: true },
      },
      timestamp: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
