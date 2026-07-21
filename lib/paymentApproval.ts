/**
 * Shared payment-approval logic — used by both:
 *  1. Manual admin approval (POST /api/admin/payments/[paymentId]/approve)
 *  2. Auto-approval safety net (see autoApproveDuePayments below)
 *
 * Keeping this in one place guarantees identical side-effects regardless of
 * which path approved the payment (no drift between manual/auto approval).
 */
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel, FavoriteModel, NotificationModel, SettingsModel } from "@/lib/models";
import { addDays } from "@/lib/cardGenerator";

/**
 * Runs the post-approval side effects for an already-approved payment doc
 * (the payment's approvalStatus must already be set to APPROVED by the caller
 * via an atomic findOneAndUpdate — this function does not re-check that).
 */
export async function runApprovalSideEffects(payment: any) {
  const now = new Date();

  if (payment.tier === "FIRST_PAYMENT") {
    const receiverIds = payment.receiverIds?.length
      ? payment.receiverIds
      : payment.receiverId
      ? [payment.receiverId]
      : [];

    if (receiverIds.length) {
      const settings = await SettingsModel.findOne().select("inboxFreezeDays").lean() as any;
      const freezeDays = settings?.inboxFreezeDays ?? 30;
      const inboxFrozenUntil = addDays(now, freezeDays);
      await FavoriteModel.updateMany(
        {
          userId:         payment.userId,
          favoriteUserId: { $in: receiverIds },
          firstPaymentId: payment._id,
        },
        { $set: { inboxFrozenUntil, status: "PAID" } },
      );
    }
  }
  // SECOND_PAYMENT: no favorite mutation needed — contact-details API reads approvalStatus directly

  // ── Notify the groom ────────────────────────────────────────────────────
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

  // ── Notify each bride of the new proposal (1st payment only) ──────────
  if (payment.tier === "FIRST_PAYMENT") {
    const brideIds = payment.receiverIds?.length
      ? payment.receiverIds
      : payment.receiverId
      ? [payment.receiverId]
      : [];
    for (const brideId of brideIds) {
      try {
        await NotificationModel.create({
          userId:  brideId,
          type:    "NEW_PROPOSAL",
          message: "A groom family has expressed interest in your profile. Open your inbox to accept or decline.",
          link:    "/bride-inbox",
        });
      } catch { /* non-critical */ }
    }
  }
}

/**
 * Auto-approval safety net — approves any PENDING_ADMIN_REVIEW payment of the
 * given tier that has sat unreviewed for longer than the admin-configured
 * threshold (Settings → firstPaymentAutoApproveDays / secondPaymentAutoApproveDays).
 *
 * This does NOT replace admin review — it's an SLA fallback so a slow manual
 * review never blocks the groom/bride relationship indefinitely. Admin can
 * still approve/reject manually any time before the threshold passes.
 *
 * Called lazily from the read routes that display approval-gated data
 * (bride inbox, groom inbox, contact details) — same pattern as the other
 * lazy-cleanup jobs in this codebase, no cron required.
 */
export async function autoApproveDuePayments(tier: "FIRST_PAYMENT" | "SECOND_PAYMENT") {
  await connectToDatabase();

  const settingKey = tier === "FIRST_PAYMENT" ? "firstPaymentAutoApproveDays" : "secondPaymentAutoApproveDays";
  const settings = await SettingsModel.findOne().select(settingKey).lean() as any;
  const days = settings?.[settingKey] ?? (tier === "FIRST_PAYMENT" ? 7 : 30);

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const due = await PaymentModel.find({
    tier,
    approvalStatus: "PENDING_ADMIN_REVIEW",
    paymentDate: { $lte: cutoff },
  }).lean() as any[];

  if (!due.length) return;

  const now = new Date();
  for (const p of due) {
    // Atomic guard — if an admin approves/rejects at the same instant, only
    // one of the two paths wins; the other simply no-ops.
    const claimed = await PaymentModel.findOneAndUpdate(
      { _id: p._id, approvalStatus: "PENDING_ADMIN_REVIEW" },
      {
        $set: {
          approvalStatus: "APPROVED",
          status:         "COMPLETED",
          approvedAt:     now,
          reviewedAt:     now,
          autoApproved:   true,
        },
      },
      { new: false },
    ) as any;

    if (claimed) {
      await runApprovalSideEffects(claimed);
    }
  }
}
