/**
 * GET  /api/profile/edit-request — check if the current user has a pending
 *      request (so the UI can show "Request pending" instead of the button)
 * POST /api/profile/edit-request — submit a new request to unlock the profile
 *
 * Only meaningful for users whose profile is currently locked; the route
 * doesn't hard-require that (harmless if submitted otherwise) but the UI
 * only ever shows the button when isLocked is true.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileEditRequestModel } from "@/lib/models";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const pending = await ProfileEditRequestModel.findOne({
      userId: session.user.id,
      status: "PENDING",
    }).lean() as any;

    return Response.json({ pending: !!pending, request: pending ?? null });
  } catch (error) {
    console.error("GET /api/profile/edit-request error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message?.trim()) {
      return Response.json({ error: "Please describe what you'd like to change" }, { status: 400 });
    }

    await connectToDatabase();

    // Don't allow piling up duplicate pending requests
    const existing = await ProfileEditRequestModel.findOne({
      userId: session.user.id,
      status: "PENDING",
    }).lean();
    if (existing) {
      return Response.json({ error: "You already have a pending request" }, { status: 400 });
    }

    await ProfileEditRequestModel.create({
      userId:  session.user.id,
      message: message.trim().slice(0, 500),
    });

    return Response.json({ ok: true, message: "Request sent — admin will review it shortly." });
  } catch (error) {
    console.error("POST /api/profile/edit-request error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
