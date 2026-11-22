/**
 * POST /api/payment/second — retired. Payments are taken online through Razorpay
 * (POST /api/payment/razorpay/order, then /verify); manual UPI / bank transfer
 * submissions with a transaction ID are no longer accepted.
 */
export async function POST() {
  return Response.json(
    { error: "Manual payments are no longer accepted. Please pay online from the payment page." },
    { status: 410 },
  );
}
