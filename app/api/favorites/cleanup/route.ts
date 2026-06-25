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

    // Find and delete expired, unpaid favorites
    const result = await FavoriteModel.deleteMany({
      expiresAt: { $lt: new Date() },
      isPaid: { $ne: true },
    });

    return Response.json({
      ok: true,
      message: `Deleted ${result.deletedCount} expired favorites`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("POST /api/favorites/cleanup error:", error);
    return Response.json({ error: "Failed to cleanup favorites" }, { status: 500 });
  }
}
