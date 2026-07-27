import { UserModel, NotificationModel } from "@/lib/models";

/** Create a notification for every admin account — non-critical, never throws. */
export async function notifyAdmins(type: string, message: string, link?: string) {
  try {
    const admins = await UserModel.find({ role: "ADMIN" }).select("_id").lean<{ _id: unknown }[]>();
    if (!admins.length) return;
    await NotificationModel.insertMany(
      admins.map((a) => ({ userId: a._id, type, message, link })),
    );
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}
