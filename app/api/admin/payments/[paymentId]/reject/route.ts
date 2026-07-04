/**
 * POST /api/admin/payments/[paymentId]/reject
 * Body: { rejectionReason: string }
 *
 * On rejection of FIRST_PAYMENT:
 *  - Reset favorites back to PAYMENT_LOCKED so user can re-pay
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel, FavoriteModel, NotificationModel, SettingsModel } from "@/lib/models";

export async function POST(
  req: Request,
  { params }: { params: { paymentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { rejectionReason } = await req.json();
    if (!rejectionReason?.trim()) {
      return Response.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    await connectToDatabase();

    const payment = await PaymentModel.findById(params.paymentId).lean() as any;
    if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });
    if (payment.approvalStatus !== "PENDING_ADMIN_REVIEW") {
      return Response.json({ error: "Payment already reviewed" }, { status: 400 });
    }

    const now = new Date();
    await PaymentModel.findByIdAndUpdate(params.paymentId, {
      $set: {
        approvalStatus:  "REJECTED",
        status:          "FAILED",
        rejectionReason: rejectionReason.trim(),
        reviewedAt:      now,
        approvedBy:      session.user.id,
      },
    });

    // Reset favorites so user can re-submit payment
    const receiverIds = payment.receiverIds?.length
      ? payment.receiverIds
      : payment.receiverId
      ? [payment.receiverId]
      : [];

    // Fresh re-submit window — admin-configurable (Settings → paymentLockDays)
    const lockSettings = await SettingsModel.findOne().select("paymentLockDays").lean() as any;
    const lockDays = lockSettings?.paymentLockDays ?? 3;
    const freshLockExpiry = new Date(now.getTime() + lockDays * 24 * 3600 * 1000);

    if (payment.tier === "FIRST_PAYMENT" && receiverIds.length) {
      // Reset so groom can re-submit with a fresh 3-day window
      await FavoriteModel.updateMany(
        {
          userId:         payment.userId,
          favoriteUserId: { $in: receiverIds },
          firstPaymentId: payment._id,
        },
        {
          $set: {
            firstPaidAt:          null,
            firstPaymentId:       null,
            // Keep movedToPayment = true — user already committed, just re-submit
            paymentLockExpiresAt: freshLockExpiry,
            status:               "PAYMENT_LOCKED",
          },
        },
      );
    }

    if (payment.tier === "SECOND_PAYMENT" && receiverIds.length) {
      // Reset so groom can re-submit 2nd payment for this bride
      await FavoriteModel.updateMany(
        {
          userId:          payment.userId,
          favoriteUserId:  { $in: receiverIds },
          secondPaymentId: payment._id,
        },
        {
          $set: {
            secondPaidAt:             null,
            secondPaymentId:          null,
            movedToSecondPayment:     false,
            movedToSecondPaymentAt:   null,
            // No lock needed for 2nd payment re-submit — groom can retry immediately
          },
        },
      );
    }

    // ── Notify the user ───────────────────────────────────────────────────
    try {
      await NotificationModel.create({
        userId:  payment.userId,
        type:    "PAYMENT_REJECTED",
        message: `Your payment was rejected. Reason: ${rejectionReason.trim()}. Please re-submit with a valid transaction ID.`,
        link:    "/payment/history",
      });
    } catch { /* non-critical */ }

    return Response.json({ ok: true, message: "Payment rejected" });
  } catch (error) {
    console.error("Payment reject error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
