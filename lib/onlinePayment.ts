/**
 * Online payments for the Initial and Final Payment (Razorpay).
 *
 * 1. prepare…()  — the same checks as before (who may pay for what, how much;
 *                  the amount is always calculated here from the fee settings)
 * 2. startOnlinePayment() — a Payment record (AWAITING_PAYMENT) + a Razorpay order
 * 3. completeOnlinePayment() — after Razorpay confirms (checkout or webhook):
 *                  verify with Razorpay, mark APPROVED, link the favourites and run
 *                  the usual approval effects (notifications, waiting period…).
 *    A paid online payment needs no admin review. Safe to call more than once.
 */
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { getPaymentAmounts } from "@/lib/paymentSettings";
import { runApprovalSideEffects } from "@/lib/paymentApproval";
import { notifyAdmins } from "@/lib/adminNotify";
import { capturePayment, createOrder, fetchOrder, fetchPayment, razorpayKeyId } from "@/lib/razorpay";

type Fail = { ok: false; status: number; error: string };
type Prepared = {
  ok: true;
  tier: "FIRST_PAYMENT" | "SECOND_PAYMENT";
  amount: number;
  receiverIds: any[];
  favoriteIds: any[];
  groom: any;
};

const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

async function activeGroom(userId: string) {
  const groom = await UserModel.findById(userId).select("status name profileId email phone").lean() as any;
  return groom && groom.status === "ACTIVE" ? groom : null;
}

/** Initial Payment for one or more favourites moved to payment. */
export async function prepareFirstPayment(userId: string, favoriteIds: string[]): Promise<Prepared | Fail> {
  if (!Array.isArray(favoriteIds) || !favoriteIds.length) return fail(400, "No profiles selected for payment");
  const groom = await activeGroom(userId);
  if (!groom) return fail(403, "Your account is not active. Contact support for assistance.");

  const now = new Date();
  const favs = await FavoriteModel.find({
    _id: { $in: favoriteIds },
    userId,
    movedToPayment: true,
    firstPaidAt: { $exists: false },
  }).lean() as any[];
  const active = favs.filter((f) => !f.paymentLockExpiresAt || new Date(f.paymentLockExpiresAt) > now);
  if (!active.length) return fail(400, "These profiles are no longer awaiting payment — move them to payment again.");

  const targets = await UserModel.find({ _id: { $in: active.map((f) => f.favoriteUserId) } }).select("familyClass").lean() as any[];
  const classOf = Object.fromEntries(targets.map((u) => [String(u._id), u.familyClass ?? "MC"]));
  const fees = await getPaymentAmounts("FIRST_PAYMENT");
  const amount = active.reduce((sum, f) => sum + (fees[classOf[String(f.favoriteUserId)] ?? "MC"] ?? 500), 0);

  return { ok: true, tier: "FIRST_PAYMENT", amount, receiverIds: active.map((f) => f.favoriteUserId), favoriteIds: active.map((f) => f._id), groom };
}

/** Final Payment for one accepted bride, after the waiting period. */
export async function prepareSecondPayment(userId: string, favoriteId: string): Promise<Prepared | Fail> {
  if (!favoriteId) return fail(400, "No profile selected for payment");
  const groom = await activeGroom(userId);
  if (!groom) return fail(403, "Your account is not active. Contact support for assistance.");

  const fav = await FavoriteModel.findOne({ _id: favoriteId, userId }).lean() as any;
  if (!fav) return fail(404, "Profile not found");
  if (!fav.firstPaidAt || !fav.firstPaymentId) return fail(400, "The Initial Payment for this profile is not complete");
  const first = await PaymentModel.findById(fav.firstPaymentId).select("approvalStatus").lean() as any;
  if (first?.approvalStatus !== "APPROVED") return fail(400, "The Initial Payment for this profile is not approved yet");
  if (fav.secondPaidAt) return fail(400, "The Final Payment for this profile is already done");
  if (!fav.isAccepted) return fail(400, "The bride has not accepted your proposal yet");
  if (fav.inboxFrozenUntil && new Date(fav.inboxFrozenUntil) > new Date()) {
    const days = Math.ceil((new Date(fav.inboxFrozenUntil).getTime() - Date.now()) / 86400000);
    return fail(400, `Waiting period — ${days} day${days !== 1 ? "s" : ""} left before the Final Payment`);
  }

  const bride = await UserModel.findById(fav.favoriteUserId).select("familyClass isFrozen isAutoFrozen").lean() as any;
  if (!bride) return fail(404, "Bride profile not found");
  const brideProfile = await ProfileModel.findOne({ userId: bride._id }).select("isFrozen isAutoFrozen").lean() as any;
  if (bride.isFrozen || bride.isAutoFrozen || brideProfile?.isFrozen || brideProfile?.isAutoFrozen) {
    return fail(400, "This profile is currently inactive. The Final Payment will be available when the bride reactivates her profile.");
  }
  const fees = await getPaymentAmounts("SECOND_PAYMENT");
  const amount = fees[bride.familyClass ?? "MC"] ?? 500;

  return { ok: true, tier: "SECOND_PAYMENT", amount, receiverIds: [fav.favoriteUserId], favoriteIds: [fav._id], groom };
}

/** Create the Payment record and the Razorpay order; returns what the checkout needs. */
export async function startOnlinePayment(userId: string, p: Prepared) {
  const payment = await PaymentModel.create({
    userId,
    receiverIds:    p.receiverIds,
    receiverId:     p.tier === "SECOND_PAYMENT" ? p.receiverIds[0] : undefined,
    favoriteIds:    p.favoriteIds,
    amount:         p.amount,
    tier:           p.tier,
    status:         "PENDING",
    paymentMethod:  "razorpay",
    approvalStatus: "AWAITING_PAYMENT",
  });
  const order = await createOrder(p.amount, String(payment._id), {
    paymentId: String(payment._id),
    profileId: p.groom.profileId ?? "",
    tier:      p.tier,
  });
  await PaymentModel.updateOne({ _id: payment._id }, { $set: { razorpayOrderId: order.id } });
  return {
    keyId:     razorpayKeyId(),
    orderId:   order.id,
    amount:    order.amount,           // paise
    currency:  order.currency,
    paymentId: String(payment._id),
    prefill:   { name: p.groom.name ?? "", email: p.groom.email ?? "", contact: p.groom.phone ?? "" },
    description: p.tier === "FIRST_PAYMENT" ? "Initial Payment" : "Final Payment",
  };
}

/**
 * Finish a paid order. Checks the payment with Razorpay itself (amount, order,
 * status), captures it if needed, then approves it. Returns the payment id.
 */
export async function completeOnlinePayment(orderId: string, razorpayPaymentId: string) {
  const payment = await PaymentModel.findOne({ razorpayOrderId: orderId }).lean() as any;
  if (!payment) throw new Error("Unknown order");
  if (payment.approvalStatus === "APPROVED") return String(payment._id);   // already done

  let rp = await fetchPayment(razorpayPaymentId);
  if (rp.order_id !== orderId) throw new Error("Payment does not belong to this order");
  // The order carries our fee exactly; the payment may be higher when Razorpay's
  // convenience fee is passed on to the member (Dashboard → fee bearer: customer).
  const order = await fetchOrder(orderId);
  const due = Math.round(payment.amount * 100);
  if (order.amount !== due || rp.currency !== "INR" || rp.amount < due) throw new Error("Paid amount does not match");
  if (rp.status === "authorized") rp = await capturePayment(rp.id, rp.amount);
  if (rp.status !== "captured") throw new Error(`Payment not completed (${rp.status})`);

  const now = new Date();
  // Atomic: only one caller (checkout or webhook) completes it
  const done = await PaymentModel.findOneAndUpdate(
    { _id: payment._id, approvalStatus: "AWAITING_PAYMENT" },
    {
      $set: {
        approvalStatus:    "APPROVED",
        status:            "COMPLETED",
        transactionId:     rp.id,
        razorpayPaymentId: rp.id,
        paymentMethod:     `razorpay${rp.method ? `-${rp.method}` : ""}`,
        payerPhone:        rp.contact ?? undefined,
        paymentDate:       now,
        approvedAt:        now,
        reviewedAt:        now,
        autoApproved:      true,
      },
    },
    { new: true },
  ).lean() as any;
  if (!done) return String(payment._id);

  // Link the favourites as paid (as the old submission did), then the usual approval effects
  const favIds = done.favoriteIds ?? [];
  if (done.tier === "FIRST_PAYMENT") {
    await FavoriteModel.updateMany(
      { _id: { $in: favIds }, firstPaidAt: { $exists: false } },
      { $set: { firstPaymentId: done._id, firstPaidAt: now } },
    );
  } else {
    await FavoriteModel.updateMany(
      { _id: { $in: favIds }, secondPaidAt: { $exists: false } },
      { $set: { secondPaymentId: done._id, secondPaidAt: now, movedToSecondPayment: true, movedToSecondPaymentAt: now } },
    );
  }
  await runApprovalSideEffects(done);

  const groom = await UserModel.findById(done.userId).select("name profileId").lean() as any;
  void notifyAdmins(
    "PAYMENT_SUBMITTED",
    `${groom?.name ?? "A member"} (${groom?.profileId ?? ""}) paid ₹${done.amount} online (${done.tier === "FIRST_PAYMENT" ? "Initial" : "Final"} Payment).`,
    "/admin/payments",
  );
  return String(done._id);
}
