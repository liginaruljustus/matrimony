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

  if (name) await UserModel.findByIdAndUpdate(userId, { $set: { name } });

  const user = await UserModel.findById(userId)
    .select("profileId name email phone createdAt profileType familyClass religion")
    .lean() as {
      profileId?: string; name?: string; email?: string; phone?: string; createdAt?: Date;
      profileType?: "GROOM" | "BRIDE"; familyClass?: "MC" | "UC" | "EC"; religion?: string;
    } | null;

  let profileId = user?.profileId;

  // On finalize, a real sequential Profile ID is assigned for the first time
  // (registration no longer generates one — see /api/register/verify-otp).
  if (finalize && user && !profileId && user.profileType && user.familyClass) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = await generateProfileId(
        user.profileType === "BRIDE" ? "FEMALE" : "MALE",
        user.religion ?? "OTHER",
        user.familyClass,
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
  // profile — rather than at bare registration, per the client's requested flow.
  if (finalize && user?.email && user?.phone && user?.createdAt && profileId) {
    const firstName = (user.name ?? "").split(" ")[0];
    const autoPassword = generatePassword(user.phone, new Date(user.createdAt), firstName);
    sendCredentialsEmail(user.email, user.name ?? "", profileId, autoPassword).catch((err) => {
      console.error("[Credentials Email] Failed to send:", err);
    });
  }

  // Profile goes live immediately on finalize — send the FD (full details) card,
  // same content the admin's manual approval used to send.
  if (finalize && user?.email && updatedProfile && profileId) {
    try {
      const fd = buildFDCard({ ...user, profileId }, updatedProfile);
      sendFDCardEmail(user.email, user.name ?? "", fd).catch((err) => {
        console.error("[FD Card Email] Failed to send:", err);
      });
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
