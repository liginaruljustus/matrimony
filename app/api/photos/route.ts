import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel } from "@/lib/models";
import { cloudinary } from "@/lib/cloudinary";
import { toObjectId } from "@/lib/mongoUtils";



const MAX_PHOTOS = 1;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

  const contentType = req.headers.get("content-type") ?? "";

  let url: string;

  if (contentType.includes("multipart/form-data")) {
    // File upload: receive file, upload via Cloudinary SDK (signed — no preset needed)
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "regin_matrimony", resource_type: "image" },
        (err, result) => {
          if (err || !result) reject(err ?? new Error("Upload failed"));
          else resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });
    url = uploaded.secure_url;
  } else {
    // Legacy: client already uploaded and is just saving the URL
    const body = (await req.json()) as { url?: string };
    if (!body.url) return NextResponse.json({ message: "No URL provided" }, { status: 400 });
    url = body.url;
  }

  await ProfileModel.findOneAndUpdate({ userId }, { $push: { photos: url } });
  return NextResponse.json({ url });
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
