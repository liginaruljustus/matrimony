"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { profileSchema, matrimonyProfileSchema } from "@/lib/validators";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

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

  // On finalize, permanently lock the profile (status is left unchanged).
  const lockFields = finalize ? { isLocked: true, lockedAt: new Date() } : {};

  await Promise.all([
    ProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: { ...profileFields, ...lockFields, userId },
        $setOnInsert: { photos: [] },
      },
      { upsert: true, new: true },
    ),
    name ? UserModel.findByIdAndUpdate(userId, { $set: { name } }) : Promise.resolve(),
  ]);

  const user = await UserModel.findById(userId).select("profileId autoPassword").lean() as { profileId?: string; autoPassword?: string } | null;

  return {
    ok: true,
    locked: finalize,
    message: finalize
      ? "Profile submitted successfully. It is now locked — contact the admin for any changes."
      : "Profile saved successfully",
    profileId: user?.profileId,
  };
}
