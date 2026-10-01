/**
 * POST /api/bride/respond
 *
 * Bride accepts a groom's interest. (Declining was removed — a proposal simply
 * stays pending until she accepts.)
 *
 * Body: { favoriteId: string, action: "accept" }
 *
 * Rules:
 *  - Must be a bride
 *  - favoriteId must point to this bride as favoriteUserId
 *  - 1st payment must be admin-approved
 *  - Can only accept once (idempotent)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, FavoriteModel, PaymentModel, NotificationModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { favoriteId, action } = await req.json();
    if (!favoriteId) return Response.json({ error: "favoriteId required" }, { status: 400 });
    if (action !== "accept") {
      return Response.json({ error: "action must be accept" }, { status: 400 });
    }

    await connectToDatabase();

    // Must be a bride
    const brideUser = await UserModel.findById(session.user.id).lean() as any;
    if (!brideUser || brideUser.profileType !== "BRIDE") {
      return Response.json({ error: "Only bride profiles can respond" }, { status: 403 });
    }

    // Find the favorite — this bride must be the target
    const fav = await FavoriteModel.findOne({
      _id:            favoriteId,
      favoriteUserId: session.user.id,
      firstPaidAt:    { $exists: true, $ne: null },
    }).lean() as any;

    if (!fav) {
      return Response.json({ error: "Favorite not found or payment not completed" }, { status: 404 });
    }

    // Verify payment is approved
    if (fav.firstPaymentId) {
      const payment = await PaymentModel.findById(fav.firstPaymentId).lean() as any;
      if (!payment || payment.approvalStatus !== "APPROVED") {
        return Response.json({ error: "Payment not yet approved by admin" }, { status: 400 });
      }
    }

    // Accepting is final. (Legacy declined proposals count as pending and can be accepted.)
    if (fav.isAccepted) {
      return Response.json(
        { error: "You have already accepted this proposal" },
        { status: 409 },
      );
    }

    const now = new Date();

    // Track activity so the bride isn't auto-frozen for inactivity
    await UserModel.findByIdAndUpdate(session.user.id, { $set: { lastActivity: now } });

    await FavoriteModel.findByIdAndUpdate(favoriteId, {
      $set: { isAccepted: true, acceptedAt: now },
      $unset: { declinedAt: "" },
    });
    // Notify the groom
    try {
      await NotificationModel.create({
        userId:  fav.userId,
        type:    "INTEREST_ACCEPTED",
        message: `Bride ${brideUser.profileId} has accepted your proposal! Open your Inbox to see the details.`,
        link:    "/inbox",
      });
    } catch { /* non-critical */ }
    return Response.json({ ok: true, message: "Groom interest accepted" });
  } catch (error) {
    console.error("POST /api/bride/respond error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
