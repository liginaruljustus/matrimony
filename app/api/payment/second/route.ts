/**
 * POST /api/payment/second
 *
 * Submit 2nd payment for a single bride's contact details.
 *
 * Body: {
 *   favoriteId: string,      // FavoriteModel _id (single profile)
 *   transactionId: string,
 *   paymentMethod: string,
 * }
 *
 * Rules:
 *  - 1st payment must already be admin-approved (firstPaidAt set)
 *  - Inbox freeze (30 days) must have passed, OR this is allowed any time (configurable)
 *  - 2nd payment amount = same as 1st (based on bride's familyClass)
 *  - Creates PaymentModel with tier=SECOND_PAYMENT
 *  - Admin approves → unlocks CD card for this profile
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { PAYMENT_AMOUNTS, addDays } from "@/lib/cardGenerator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { favoriteId, transactionId, paymentMethod } = await req.json();
    if (!favoriteId) return Response.json({ error: "favoriteId required" }, { status: 400 });
    if (!transactionId?.trim()) return Response.json({ error: "transactionId required" }, { status: 400 });

    await connectToDatabase();

    // Block suspended / banned accounts
    const groomUser = await UserModel.findById(session.user.id).select("status").lean() as any;
    if (!groomUser || groomUser.status !== "ACTIVE") {
      return Response.json(
        { error: "Your account is not active. Contact support for assistance." },
        { status: 403 },
      );
    }

    const fav = await FavoriteModel.findOne({
      _id:    favoriteId,
      userId: session.user.id,
    }).lean() as any;

    if (!fav) return Response.json({ error: "Favorite not found" }, { status: 404 });
    if (!fav.firstPaidAt || !fav.firstPaymentId) {
      return Response.json({ error: "1st payment not completed" }, { status: 400 });
    }
    // Guard against submission while the 1st payment is still pending admin review.
    // firstPaidAt is set at submission time, not at approval time — so we must verify
    // the linked payment record is actually APPROVED.
    const firstPayment = await PaymentModel.findById(fav.firstPaymentId)
      .select("approvalStatus")
      .lean() as any;
    if (!firstPayment || firstPayment.approvalStatus !== "APPROVED") {
      return Response.json({ error: "1st payment not yet approved by admin" }, { status: 400 });
    }
    if (fav.secondPaidAt) return Response.json({ error: "2nd payment already submitted" }, { status: 400 });

    // Enforce 30-day inbox freeze — must wait before unlocking contact details
    if (fav.inboxFrozenUntil && new Date(fav.inboxFrozenUntil) > new Date()) {
      const daysLeft = Math.ceil(
        (new Date(fav.inboxFrozenUntil).getTime() - Date.now()) / 86400000,
      );
      return Response.json(
        { error: `Inbox period active — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining before 2nd payment is allowed` },
        { status: 400 },
      );
    }

    // Get bride's family class for amount
    const targetUser = await UserModel.findById(fav.favoriteUserId).lean() as any;
    if (!targetUser) return Response.json({ error: "Bride profile not found" }, { status: 404 });

    const familyClass = targetUser.familyClass ?? "MC";
    const amount = PAYMENT_AMOUNTS[familyClass as keyof typeof PAYMENT_AMOUNTS] ?? 500;

    const now = new Date();
    const payment = await PaymentModel.create({
      userId:        session.user.id,
      receiverIds:   [fav.favoriteUserId],
      receiverId:    fav.favoriteUserId,
      amount,
      tier:          "SECOND_PAYMENT",
      status:        "PENDING",
      transactionId: transactionId.trim(),
      paymentMethod: paymentMethod ?? "upi",
      paymentDate:   now,
      approvalStatus:"PENDING_ADMIN_REVIEW",
    });

    await FavoriteModel.findByIdAndUpdate(favoriteId, {
      $set: {
        secondPaymentId:  payment._id,
        secondPaidAt:     now,
        movedToSecondPayment: true,
        movedToSecondPaymentAt: now,
      },
    });

    return Response.json({
      ok:       true,
      paymentId:String(payment._id),
      amount,
      message:  "2nd payment submitted for admin approval.",
    });
  } catch (error) {
    console.error("POST /api/payment/second error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
