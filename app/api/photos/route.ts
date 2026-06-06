import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel } from "@/lib/models";
import { cloudinary } from "@/lib/cloudinary";
import { toObjectId } from "@/lib/mongoUtils";

const MAX_PHOTOS = 6;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ message: "File too large (max 5 MB)" }, { status: 400 });
  }

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  const existing = await ProfileModel.findOne({ userId }).select("photos").lean<{ photos: string[] }>();
  if (!existing) {
    return NextResponse.json({ message: "Create your profile before uploading photos" }, { status: 404 });
  }
  if ((existing.photos?.length ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json({ message: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

  const upload = await cloudinary.uploader.upload(base64, {
    folder: "regin_matrimony",
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  });

  await ProfileModel.findOneAndUpdate({ userId }, { $push: { photos: upload.secure_url } });

  return NextResponse.json({ url: upload.secure_url });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ message: "No URL provided" }, { status: 400 });

  await connectToDatabase();
  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  await ProfileModel.findOneAndUpdate({ userId }, { $pull: { photos: url } });

  // Extract Cloudinary public_id from URL and delete from storage
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  if (match?.[1]) {
    await cloudinary.uploader.destroy(match[1]).catch(() => null);
  }

  return NextResponse.json({ message: "Photo removed" });
}
