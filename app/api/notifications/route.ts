/**
 * GET  /api/notifications        — list user's notifications (newest first, max 50)
 * POST /api/notifications/read   — mark all as read (handled in /read/route.ts)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { NotificationModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = toObjectId(session.user.id);
    const notifications = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<any[]>();

    const unreadCount = await NotificationModel.countDocuments({ userId, isRead: false });

    return Response.json({
      notifications: notifications.map((n) => ({
        id:        String(n._id),
        type:      n.type,
        message:   n.message,
        link:      n.link ?? null,
        isRead:    n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
