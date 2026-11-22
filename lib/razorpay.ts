/**
 * Razorpay — online payments (UPI, cards, net banking, wallets).
 *
 * Keys come from the environment (Razorpay Dashboard → Account & Settings → API Keys):
 *   RAZORPAY_KEY_ID          rzp_test_… / rzp_live_…   (public — sent to the browser)
 *   RAZORPAY_KEY_SECRET      secret                     (server only)
 *   RAZORPAY_WEBHOOK_SECRET  secret set on the webhook  (server only)
 * Test keys take test payments only; switch to live keys after KYC.
 */
import crypto from "crypto";

const API = "https://api.razorpay.com/v1";

export function razorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Razorpay ${path} failed: ${res.status} ${body?.error?.description ?? JSON.stringify(body)}`);
  }
  return body as T;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string; receipt?: string };
export type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string; method?: string; email?: string; contact?: string };

/** Create an order for `rupees` (whole rupees). */
export function createOrder(rupees: number, receipt: string, notes: Record<string, string>) {
  return call<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: Math.round(rupees * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }),
  });
}

export function fetchPayment(paymentId: string) {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

/** Capture an authorised payment (only needed when auto-capture is off in the dashboard). */
export function capturePayment(paymentId: string, paise: number) {
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    body: JSON.stringify({ amount: paise, currency: "INR" }),
  });
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Checkout success: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, String(signature ?? ""));
}

/** Webhook: signature = HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, String(signature ?? ""));
}
