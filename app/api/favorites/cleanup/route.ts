/**
 * POST /api/favorites/cleanup
 *
 * Removes expired favorites where:
 * - expiresAt < now
 * - isPaid = false
 *
 * Admin-only operation (can also run via cron).
 * Returns count of deleted favorites.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { FavoriteModel } from "@/lib/models";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      // Also allow cron trigger via secret header
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    await connectToDatabase();

    const now = new Date();

    // 1. Trial expiry: free-trial window ended without payment.
    //    Favorites moved to payment are excluded — they are governed by the
    //    payment-lock rule below, not the trial rule.
    const trialResult = await FavoriteModel.deleteMany({
      expiresAt: { $lt: now },
      isPaid: { $ne: true },
      firstPaidAt: null,
      movedToPayment: { $ne: true },
    });

    // 2. Payment-lock expiry: moved to payment but not paid within paymentLockDays
    const lockResult = await FavoriteModel.deleteMany({
      movedToPayment: true,
      paymentLockExpiresAt: { $lt: now },
      firstPaidAt: null,
      isPaid: { $ne: true },
    });

    const deletedCount = trialResult.deletedCount + lockResult.deletedCount;

    return Response.json({
      ok: true,
      message: `Deleted ${deletedCount} expired favorites (${trialResult.deletedCount} trial-expired, ${lockResult.deletedCount} payment-lock-expired)`,
      deletedCount,
      trialExpired: trialResult.deletedCount,
      paymentLockExpired: lockResult.deletedCount,
    });
  } catch (error) {
    console.error("POST /api/favorites/cleanup error:", error);
    return Response.json({ error: "Failed to cleanup favorites" }, { status: 500 });
  }
}
