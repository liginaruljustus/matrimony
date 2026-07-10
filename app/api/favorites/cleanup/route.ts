/**
 * Favorites cleanup — removes expired favorites.
 *
 * Two triggers:
 *  GET  — Vercel Cron (vercel.json), auth: `Authorization: Bearer ${CRON_SECRET}`
 *  POST — Admin (session) or external scheduler via `x-cron-secret` header
 *
 * Deletion rules:
 *  1. Trial expired  (expiresAt < now) and no payment activity
 *  2. Payment lock expired (paymentLockExpiresAt < now) and not paid
 * Paid favorites (isPaid or firstPaidAt) are never touched.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { FavoriteModel } from "@/lib/models";

async function runCleanup() {
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

  return {
    ok: true,
    message: `Deleted ${deletedCount} expired favorites (${trialResult.deletedCount} trial-expired, ${lockResult.deletedCount} payment-lock-expired)`,
    deletedCount,
    trialExpired: trialResult.deletedCount,
    paymentLockExpired: lockResult.deletedCount,
  };
}

// Vercel Cron entry point (GET with Bearer auth)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(await runCleanup());
  } catch (error) {
    console.error("GET /api/favorites/cleanup error:", error);
    return Response.json({ error: "Failed to cleanup favorites" }, { status: 500 });
  }
}

// Admin / external-scheduler entry point
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      // Also allow cron trigger via secret header
      const cronSecret = req.headers.get("x-cron-secret");
      if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    return Response.json(await runCleanup());
  } catch (error) {
    console.error("POST /api/favorites/cleanup error:", error);
    return Response.json({ error: "Failed to cleanup favorites" }, { status: 500 });
  }
}
