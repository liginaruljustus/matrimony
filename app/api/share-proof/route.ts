/**
 * POST /api/share-proof — the member uploads a screenshot of their WhatsApp
 *   status after sharing our poster/video (multipart field "file"). Creates a
 *   PENDING share proof, confirmed by a click on their personal link or by an admin.
 * GET  /api/share-proof — the member's latest share proof.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, ShareProofModel, UserModel } from "@/lib/models";
import { cloudinary } from "@/lib/cloudinary";
import { currentPromo, getActivationSettings, isLive } from "@/lib/activation";
import { latestShareProof } from "@/lib/shareProof";

const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  return Response.json({ proof: await latestShareProof(session.user.id) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file || typeof file === "string") {
    return Response.json({ error: "Please choose the screenshot of your WhatsApp status" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "The screenshot must be an image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "The screenshot is too large (max 8 MB)" }, { status: 400 });
  }

  await connectToDatabase();
  const [user, profile, settings] = await Promise.all([
    UserModel.findById(session.user.id).select("profileId").lean() as Promise<any>,
    ProfileModel.findOne({ userId: session.user.id }).select("profileStatus liveAt").lean() as Promise<any>,
    getActivationSettings(),
  ]);
  if (!profile) return Response.json({ error: "Complete your profile first" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "regin_matrimony/share_proofs", resource_type: "image" },
      (err, result) => (err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result as { secure_url: string })),
    ).end(buffer);
  });

  const promo = currentPromo(settings);
  const fields = {
    profileId:     user?.profileId ?? "",
    purpose:       isLive(profile) ? "REGULAR" : "ACTIVATION",
    promo:         promo ? { category: promo.category, title: promo.title, mediaUrl: promo.mediaUrl } : undefined,
    screenshotUrl: uploaded.secure_url,
  };

  // A new screenshot replaces one still waiting for review
  const pending = await ShareProofModel.findOne({ userId: session.user.id, status: "PENDING" }).sort({ createdAt: -1 });
  if (pending) {
    await ShareProofModel.updateOne({ _id: pending._id }, { $set: fields });
  } else {
    await ShareProofModel.create({ userId: session.user.id, ...fields });
  }

  return Response.json({ ok: true, proof: await latestShareProof(session.user.id) });
}
