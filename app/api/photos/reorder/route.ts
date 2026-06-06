/**
 * POST /api/photos/reorder
 *
 * Persists a new photo order for the current user's profile.
 * Body: { photos: string[] }  — full ordered array of existing Cloudinary URLs.
 *
 * Security: only URLs that already exist in the profile are accepted.
 * Any foreign URL is silently stripped before saving.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.photos)) {
    return Response.json({ message: "photos array required" }, { status: 400 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) return Response.json({ message: "Invalid user ID" }, { status: 400 });

  await connectToDatabase();

  const existing = await ProfileModel.findOne({ userId })
    .select("photos")
    .lean<{ photos: string[] }>();

  if (!existing) {
    return Response.json({ message: "Profile not found" }, { status: 404 });
  }

  const existingSet = new Set(existing.photos ?? []);

  // Only keep URLs that are already in the profile — strip any injected URLs
  const reordered = (body.photos as string[]).filter((url) => existingSet.has(url));

  await ProfileModel.findOneAndUpdate({ userId }, { $set: { photos: reordered } });

  return Response.json({ ok: true, photos: reordered });
}
