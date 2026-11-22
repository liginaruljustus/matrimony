/**
 * POST /api/payment/razorpay/webhook — Razorpay calls this when a payment is captured,
 * so a payment completes even if the member closed the page before returning.
 * Set it up in Razorpay Dashboard → Webhooks:
 *   URL: https://<site>/api/payment/razorpay/webhook
 *   Events: payment.captured, order.paid
 *   Secret: the same value as RAZORPAY_WEBHOOK_SECRET
 */
import { connectToDatabase } from "@/lib/mongodb";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { completeOnlinePayment } from "@/lib/onlinePayment";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(raw);
    if (event?.event === "payment.captured" || event?.event === "order.paid") {
      const p = event?.payload?.payment?.entity;
      if (p?.order_id && p?.id) {
        await connectToDatabase();
        await completeOnlinePayment(p.order_id, p.id);
      }
    }
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    // 500 makes Razorpay retry later
    return Response.json({ error: "Webhook handling failed" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
