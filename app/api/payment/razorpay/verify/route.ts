/**
 * POST /api/payment/razorpay/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }  (from Razorpay Checkout)
 * Checks the signature, confirms the payment with Razorpay, and completes it.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel } from "@/lib/models";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { completeOnlinePayment } from "@/lib/onlinePayment";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    await req.json().catch(() => ({}));
  if (!orderId || !paymentId || !signature) return Response.json({ error: "Missing payment details" }, { status: 400 });
  if (!verifyCheckoutSignature(String(orderId), String(paymentId), String(signature))) {
    return Response.json({ error: "Payment could not be verified" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const own = await PaymentModel.exists({ razorpayOrderId: orderId, userId: session.user.id });
    if (!own) return Response.json({ error: "Payment not found" }, { status: 404 });
    const id = await completeOnlinePayment(String(orderId), String(paymentId));
    return Response.json({ ok: true, paymentId: id });
  } catch (error) {
    console.error("POST /api/payment/razorpay/verify error:", error);
    return Response.json(
      { error: "We received your payment but could not confirm it yet. It will be confirmed automatically in a few minutes — please don't pay again." },
      { status: 502 },
    );
  }
}
