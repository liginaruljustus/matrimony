/**
 * POST /api/notifications/read
 * Marks all (or specific) notifications as read for the current user.
 * Body: { ids?: string[] }  — omit to mark all as read
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { NotificationModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;

    await connectToDatabase();

    const userId = toObjectId(session.user.id);
    const query: any = { userId, isRead: false };
    if (ids?.length) {
      query._id = { $in: ids.map(toObjectId).filter(Boolean) };
    }

    await NotificationModel.updateMany(query, { $set: { isRead: true } });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/notifications/read error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
