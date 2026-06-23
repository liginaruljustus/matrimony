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

export async function updateMatrimonyProfileAction(payload: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, message: "Unauthorized" };

  const parsed = matrimonyProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid profile data" };
  }

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return { ok: false, message: "Invalid user ID" };

  // Strip photos (managed via /api/photos) and name (lives on UserModel, not ProfileModel)
  const { photos: _photos, name, ...profileFields } = parsed.data as any;

  await Promise.all([
    ProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: { ...profileFields, userId },
        $setOnInsert: { photos: [] },
      },
      { upsert: true, new: true },
    ),
    name ? UserModel.findByIdAndUpdate(userId, { $set: { name } }) : Promise.resolve(),
  ]);

  const user = await UserModel.findById(userId).select("profileId autoPassword").lean() as { profileId?: string; autoPassword?: string } | null;

  return {
    ok: true,
    message: "Profile saved successfully",
    profileId: user?.profileId,
  };
}
