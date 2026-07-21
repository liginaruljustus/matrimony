/**
 * POST /api/admin/payments/[paymentId]/approve
 *
 * Admin manually approves a payment. If admin never reviews it, the same
 * approval eventually happens automatically via the SLA fallback in
 * lib/paymentApproval.ts (autoApproveDuePayments) — both paths share the
 * same post-approval side effects (see runApprovalSideEffects).
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel } from "@/lib/models";
import { runApprovalSideEffects } from "@/lib/paymentApproval";

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

    // ── Post-approval side effects (shared with the auto-approval fallback) ──
    await runApprovalSideEffects(payment);

    return Response.json({ ok: true, message: "Payment approved successfully" });
  } catch (error) {
    console.error("Payment approve error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
