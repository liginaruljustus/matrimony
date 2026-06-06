/**
 * GET /api/cron/auto-freeze
 *
 * Called by a scheduler (e.g. Vercel Cron, GitHub Actions) — NOT by users.
 * Protected by CRON_SECRET env var.
 *
 * Auto-freeze rules:
 *  - GROOM profiles inactive for > 90 days → isAutoFrozen = true
 *  - BRIDE profiles inactive for > 60 days  → isAutoFrozen = true
 *
 * "Inactive" = lastActivity not updated in N days.
 * lastActivity is updated on login (via AuthSync) or any profile action.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/auto-freeze", "schedule": "0 2 * * *" }]
 * }
 */
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, SettingsModel } from "@/lib/models";

export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    // Read configurable freeze thresholds from admin settings (fall back to defaults)
    const settings     = await SettingsModel.findOne().select("groomFreezeDays brideFreezeDays").lean() as any;
    const groomDays    = settings?.groomFreezeDays ?? 90;
    const brideDays    = settings?.brideFreezeDays ?? 60;

    const now         = new Date();
    const groomCutoff = new Date(now.getTime() - groomDays * 24 * 3600 * 1000);
    const brideCutoff = new Date(now.getTime() - brideDays * 24 * 3600 * 1000);

    // Find inactive grooms (lastActivity older than 90 days OR never set)
    // Only target ACTIVE accounts — leave SUSPENDED / BANNED / INACTIVE alone
    const groomUsers = await UserModel.find({
      profileType:  "GROOM",
      status:       "ACTIVE",
      isFrozen:     { $ne: true },
      isAutoFrozen: { $ne: true },
      $or: [
        { lastActivity: { $lt: groomCutoff } },
        { lastActivity: { $exists: false } },
      ],
    }).select("_id").lean() as any[];

    // Find inactive brides
    const brideUsers = await UserModel.find({
      profileType:  "BRIDE",
      status:       "ACTIVE",
      isFrozen:     { $ne: true },
      isAutoFrozen: { $ne: true },
      $or: [
        { lastActivity: { $lt: brideCutoff } },
        { lastActivity: { $exists: false } },
      ],
    }).select("_id").lean() as any[];

    const groomIds = groomUsers.map((u: any) => u._id);
    const brideIds = brideUsers.map((u: any) => u._id);
    const allIds   = [...groomIds, ...brideIds];

    if (!allIds.length) {
      return Response.json({ ok: true, frozenCount: 0, message: "No profiles to freeze" });
    }

    // Freeze users
    const userResult = await UserModel.updateMany(
      { _id: { $in: allIds } },
      {
        $set: {
          isAutoFrozen: true,
          autoFrozenAt: now,
          isFrozen:     false, // isAutoFrozen is separate from manual freeze
        },
      },
    );

    // Freeze corresponding profiles
    await ProfileModel.updateMany(
      { userId: { $in: allIds } },
      { $set: { isAutoFrozen: true, autoFrozenAt: now } },
    );

    const frozenCount = userResult.modifiedCount;

    console.log(`[auto-freeze] Froze ${frozenCount} profiles (${groomIds.length} grooms >${groomDays}d, ${brideIds.length} brides >${brideDays}d)`);

    return Response.json({
      ok: true,
      frozenCount,
      groomsFrozen: groomIds.length,
      bridesFrozen: brideIds.length,
      ranAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[auto-freeze] Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
