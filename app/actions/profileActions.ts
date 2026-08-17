"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { profileSchema, matrimonyProfileSchema } from "@/lib/validators";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";
import { generatePassword, generateProfileId } from "@/lib/profileIdGenerator";
import { sendCredentialsEmail } from "@/lib/sendCredentialsEmail";
import { buildFDCard } from "@/lib/cardGenerator";
import { sendFDCardEmail } from "@/lib/sendFDCardEmail";
import bcrypt from "bcryptjs";

type ProfileInput = {
  age: number;
  religion: string;
  caste: string;
  location: string;
  education: string;
  income: number;
  bio?: string;
};

export async function upsertProfileAction(payload: ProfileInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, message: "Unauthorized" };

  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid profile data" };
  }

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return { ok: false, message: "Invalid user ID" };

  await ProfileModel.findOneAndUpdate(
    { userId },
    { $set: parsed.data, $setOnInsert: { photos: [] } },
    { upsert: true, new: true },
  );

  return { ok: true, message: "Profile saved successfully" };
}

export async function getMyProfileAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return null;

  const profile = await ProfileModel.findOne({ userId }).lean<any>();
  if (!profile) return null;

  return {
    age: profile.age as number,
    religion: profile.religion as string,
    caste: profile.caste as string,
    location: profile.location as string,
    education: profile.education as string,
    income: profile.income as number,
    bio: (profile.bio ?? "") as string,
    photos: (profile.photos ?? []) as string[],
  };
}

export async function deleteProfileAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, message: "Unauthorized" };

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return { ok: false, message: "Invalid user ID" };

  const deleted = await ProfileModel.findOneAndDelete({ userId });
  if (!deleted) return { ok: false, message: "No profile found to delete" };

  return { ok: true, message: "Profile deleted" };
}

export async function updateMatrimonyProfileAction(payload: any, finalize = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, message: "Unauthorized" };

  const parsed = matrimonyProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid profile data" };
  }

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return { ok: false, message: "Invalid user ID" };

  // Edit lock — once finalized, the user can no longer change their profile.
  // Enforced server-side so it can't be bypassed by hiding the UI.
  const existing = await ProfileModel.findOne({ userId }).select("isLocked").lean<{ isLocked?: boolean }>();
  if (existing?.isLocked) {
    return {
      ok: false,
      locked: true,
      message: "Your profile is locked and can no longer be edited. Please contact the admin to make changes.",
    };
  }

  // Strip photos (managed via /api/photos) and name (lives on UserModel, not ProfileModel)
  const { photos: _photos, name, ...profileFields } = parsed.data as any;

  // On finalize: permanently lock the profile and it goes live immediately
  // (APPROVED) — no manual admin approval step. Admin can still review and
  // flag/reject afterward via the admin panel if needed.
  const lockFields = finalize
    ? {
        isLocked: true,
        lockedAt: new Date(),
        profileStatus: "APPROVED",
        approvalDate: new Date(),
        generatedCards: { MD: true, AD: true, CD: true, FD: true },
        cardsGeneratedAt: new Date(),
      }
    : {};

  const updatedProfile = await ProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: { ...profileFields, ...lockFields, userId },
      $setOnInsert: { photos: [] },
    },
    { upsert: true, new: true },
  ).lean<any>();

  const user = await UserModel.findById(userId)
    .select("profileId name email phone createdAt profileType familyClass religion")
    .lean() as {
      profileId?: string; name?: string; email?: string; phone?: string; createdAt?: Date;
      profileType?: "GROOM" | "BRIDE"; familyClass?: "MC" | "UC" | "EC"; religion?: string;
    } | null;

  // Derive all classification fields from either UserModel or the submitted profile form data
  const derivedProfileType = user?.profileType || (parsed.data.gender === "FEMALE" ? "BRIDE" : "GROOM");
  const derivedFamilyClass = (user?.familyClass || parsed.data.familyStatus || "MC") as "MC" | "UC" | "EC";
  const derivedReligion = user?.religion || parsed.data.religion || "OTHER";
  const derivedPhone = user?.phone || parsed.data.contactNumber || "";
  const derivedEmail = user?.email || parsed.data.emailId || "";
  const userName = name || user?.name || "Member";

  // Sync classification fields back to UserModel
  await UserModel.findByIdAndUpdate(userId, {
    $set: {
      name: userName,
      profileType: derivedProfileType,
      familyClass: derivedFamilyClass,
      religion: derivedReligion,
      ...(derivedPhone ? { phone: derivedPhone } : {}),
      ...(derivedEmail ? { email: derivedEmail } : {}),
    },
  });

  let profileId = user?.profileId;

  // On finalize, assign sequential Profile ID if not already assigned
  if (finalize && !profileId) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = await generateProfileId(
        derivedProfileType === "BRIDE" ? "FEMALE" : "MALE",
        derivedReligion,
        derivedFamilyClass,
      );
      try {
        await UserModel.findByIdAndUpdate(userId, { $set: { profileId: candidate } });
        profileId = candidate;
        break;
      } catch (updateErr: any) {
        if (updateErr?.code === 11000 && updateErr?.keyPattern?.profileId) {
          console.warn(`[finalize] profileId collision (${candidate}), retrying…`);
          continue;
        }
        throw updateErr;
      }
    }
  }

  // Credentials email is sent here — once the user has actually saved their
  // profile — with derived password and updated passwordHash in database.
  if (finalize && derivedEmail && derivedPhone && profileId) {
    const createdAt = user?.createdAt ? new Date(user.createdAt) : new Date();
    const firstName = userName.split(" ")[0] || "Member";
    const autoPassword = generatePassword(derivedPhone, createdAt, firstName);

    // Synchronize passwordHash in DB so login with this password is guaranteed
    try {
      const passwordHash = await bcrypt.hash(autoPassword, 10);
      await UserModel.findByIdAndUpdate(userId, { $set: { passwordHash } });
    } catch (hashErr) {
      console.error("[finalize] Failed to update passwordHash:", hashErr);
    }

    try {
      await sendCredentialsEmail(derivedEmail, userName, profileId, autoPassword);
      console.log(`[Credentials Email] Sent to ${derivedEmail} for profile ${profileId}`);
    } catch (err) {
      console.error("[Credentials Email] Failed to send:", err);
    }
  }

  // Profile goes live immediately on finalize — send the FD (full details) card
  if (finalize && derivedEmail && updatedProfile && profileId) {
    try {
      const fd = buildFDCard({ ...(user ?? {}), name: userName, email: derivedEmail, profileId }, updatedProfile);
      await sendFDCardEmail(derivedEmail, userName, fd);
      console.log(`[FD Card Email] Sent to ${derivedEmail}`);
    } catch (e) {
      console.error("FD card build error:", e);
    }
  }

  return {
    ok: true,
    locked: finalize,
    message: finalize
      ? "Profile submitted successfully. It is now locked — contact the admin for any changes."
      : "Profile saved successfully",
    profileId,
  };
}
