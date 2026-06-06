/**
 * GET  /api/payments  — user's payment history (read-only, still valid)
 * POST /api/payments  — DEPRECATED (410 Gone)
 *
 * The POST handler was replaced by two purpose-built endpoints:
 *   /api/payment/first  — 1st payment (unlocks AD card / inbox)
 *   /api/payment/second — 2nd payment (unlocks contact details)
 *
 * The old POST created orphan PaymentModel documents with no favoriteId linkage,
 * used wrong tier names (PROFILE_VIEW / CONTACT_DETAILS), and based the amount
 * on the groom's familyClass instead of the bride's. Do not restore it.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

/** List the current user's payment submissions (most-recent first). */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = toObjectId(session.user.id);
    if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");

    const query: any = { userId };
    if (receiverId) {
      const targetId = toObjectId(receiverId);
      if (targetId) query.receiverId = targetId;
    }

    const payments = await PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .lean<any[]>();

    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * POST /api/payments — removed.
 *
 * Use /api/payment/first or /api/payment/second instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      message:
        "This endpoint has been removed. Use /api/payment/first for the first payment " +
        "or /api/payment/second for the contact-details payment.",
      firstPayment:  "/api/payment/first",
      secondPayment: "/api/payment/second",
    },
    { status: 410 }, // 410 Gone
  );
}
