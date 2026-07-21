/**
 * POST /api/admin/edit-requests/[id]
 *
 * Admin resolves an edit request by unlocking the user's profile
 * (isLocked = false) so they can edit it themselves again. Re-submitting
 * the profile form afterwards re-locks it automatically (same as first
 * finalize) — see app/actions/profileActions.ts.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileEditRequestModel, ProfileModel, NotificationModel } from "@/lib/models";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const now = new Date();

    // Atomic guard — prevents double-resolving the same request
    const request = await ProfileEditRequestModel.findOneAndUpdate(
      { _id: params.id, status: "PENDING" },
      { $set: { status: "RESOLVED", resolvedBy: session.user.id, resolvedAt: now } },
      { new: false },
    ) as any;

    if (!request) {
      const exists = await ProfileEditRequestModel.exists({ _id: params.id });
      if (!exists) return Response.json({ error: "Request not found" }, { status: 404 });
      return Response.json({ error: "Request already resolved" }, { status: 400 });
    }

    await ProfileModel.findOneAndUpdate(
      { userId: request.userId },
      { $set: { isLocked: false }, $unset: { lockedAt: "" } },
    );

    try {
      await NotificationModel.create({
        userId:  request.userId,
        type:    "EDIT_REQUEST_RESOLVED",
        message: "Your profile has been unlocked — you can now edit it again.",
        link:    "/my-profile",
      });
    } catch { /* non-critical */ }

    return Response.json({ ok: true, message: "Profile unlocked for the user" });
  } catch (error) {
    console.error("POST /api/admin/edit-requests/[id] error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
