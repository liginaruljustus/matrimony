/**
 * GET /r/<profileId> — a member's personal link, shared with our poster/video.
 *
 * A visit from a real person confirms the member's latest pending share
 * (lib/shareProof.ts) and counts towards their reach, then opens the home page.
 * Link previews (WhatsApp/Facebook fetching the page) and the member opening
 * their own link do not count.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ShareProofModel, UserModel } from "@/lib/models";
import { CLICK_CONFIRM_DAYS, confirmShareProof } from "@/lib/shareProof";

const BOT_UA = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|bot|crawler|spider|preview|curl|wget/i;

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const home = new URL("/", req.url);
  try {
    const ua = req.headers.get("user-agent") ?? "";
    const code = String(params.code ?? "").trim().toUpperCase();
    if (!code || code.length > 30 || BOT_UA.test(ua)) return NextResponse.redirect(home);

    await connectToDatabase();
    const member = await UserModel.findOne({ profileId: code }).select("_id").lean() as any;
    if (!member) return NextResponse.redirect(home);

    // The member opening their own link doesn't count
    const session = await getServerSession(authOptions);
    if (session?.user?.id === String(member._id)) return NextResponse.redirect(home);

    const since = new Date(Date.now() - CLICK_CONFIRM_DAYS * 24 * 3600 * 1000);
    const proof = await ShareProofModel.findOneAndUpdate(
      { userId: member._id, createdAt: { $gte: since }, status: { $ne: "REJECTED" } },
      { $inc: { clicks: 1 } },
      { sort: { createdAt: -1 }, new: true },
    ).lean() as any;

    if (proof) {
      if (!proof.firstClickAt) await ShareProofModel.updateOne({ _id: proof._id, firstClickAt: null }, { $set: { firstClickAt: new Date() } });
      if (proof.status === "PENDING") await confirmShareProof(String(proof._id), "AUTO_CONFIRMED");
    }
  } catch (error) {
    console.error("GET /r/[code] error:", error);
  }
  return NextResponse.redirect(home);
}
