/**
 * POST /api/payment/razorpay/order
 *   { tier: "FIRST", favoriteIds: string[] }   Initial Payment for the profiles in Initial Payment
 *   { tier: "SECOND", favoriteId: string }      Final Payment for one accepted bride
 * Returns what the Razorpay Checkout needs. The amount is calculated on the server.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { razorpayConfigured } from "@/lib/razorpay";
import { prepareFirstPayment, prepareSecondPayment, startOnlinePayment } from "@/lib/onlinePayment";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!razorpayConfigured()) {
    return Response.json({ error: "Online payment is being set up. Please try again shortly." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  try {
    await connectToDatabase();
    const prepared = body?.tier === "SECOND"
      ? await prepareSecondPayment(session.user.id, String(body?.favoriteId ?? ""))
      : await prepareFirstPayment(session.user.id, Array.isArray(body?.favoriteIds) ? body.favoriteIds.map(String) : []);
    if (!prepared.ok) return Response.json({ error: prepared.error }, { status: prepared.status });
    return Response.json(await startOnlinePayment(session.user.id, prepared));
  } catch (error) {
    console.error("POST /api/payment/razorpay/order error:", error);
    return Response.json({ error: "Could not start the payment. Please try again." }, { status: 500 });
  }
}
