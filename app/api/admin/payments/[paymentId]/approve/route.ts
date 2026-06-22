/**
 * POST /api/admin/payments/[paymentId]/approve
 *
 * Admin approves a payment.
 *
 * Post-approval actions:
 *  FIRST_PAYMENT  → set inboxFrozenUntil = now + 30 days on all matching favorites
 *  SECOND_PAYMENT → no extra action; GET /api/contact-details already filters by approvalStatus
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel, FavoriteModel, NotificationModel } from "@/lib/models";
import { addDays } from "@/lib/cardGenerator";

export async function POST(
  _req: Request,
  { params }: { params: { paymentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const now = new Date();

    // Atomic check-and-update: only succeeds if status is still PENDING_ADMIN_REVIEW.
    // This prevents two admins from approving the same payment simultaneously.
    const payment = await PaymentModel.findOneAndUpdate(
      { _id: params.paymentId, approvalStatus: "PENDING_ADMIN_REVIEW" },
      {
        $set: {
          approvalStatus: "APPROVED",
          status:         "COMPLETED",
          approvedBy:     session.user.id,
          approvedAt:     now,
          reviewedAt:     now,
        },
      },
      { new: false }, // return the pre-update doc so we can read tier/userId/receiverIds
    ) as any;

    if (!payment) {
      // Either not found or already reviewed — distinguish for a better error.
      const exists = await PaymentModel.exists({ _id: params.paymentId });
      if (!exists) return Response.json({ error: "Payment not found" }, { status: 404 });
      return Response.json({ error: "Payment already reviewed" }, { status: 400 });
    }

    // ── Post-approval side effects ────────────────────────────────────────
    if (payment.tier === "FIRST_PAYMENT") {
      // Set 30-day inbox freeze on all favorites linked to this payment
      const receiverIds = payment.receiverIds?.length
        ? payment.receiverIds
        : payment.receiverId
        ? [payment.receiverId]
        : [];

      if (receiverIds.length) {
        const inboxFrozenUntil = addDays(now, 30);
        await FavoriteModel.updateMany(
          {
            userId:         payment.userId,
            favoriteUserId: { $in: receiverIds },
            firstPaymentId: payment._id,
          },
          {
            $set: {
              inboxFrozenUntil,
              status: "PAID",
            },
          },
        );
      }
    }
    // SECOND_PAYMENT: no side-effects needed — contact-details API reads approvalStatus directly

    // ── Notify the user ───────────────────────────────────────────────────
    try {
      const isSecond = payment.tier === "SECOND_PAYMENT";
      await NotificationModel.create({
        userId:  payment.userId,
        type:    "PAYMENT_APPROVED",
        message: isSecond
          ? "Your 2nd payment has been approved! Contact details are now unlocked."
          : "Your payment has been approved! Open your Inbox to view bride details.",
        link:    isSecond ? "/contact-details" : "/inbox",
      });
    } catch { /* non-critical */ }

    return Response.json({ ok: true, message: "Payment approved successfully" });
  } catch (error) {
    console.error("Payment approve error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
