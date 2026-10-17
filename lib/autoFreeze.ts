/**
 * Auto-freeze: hide profiles whose owners have been inactive too long.
 *
 *  - GROOM inactive for more than Settings.groomFreezeDays (default 90)
 *  - BRIDE inactive for more than Settings.brideFreezeDays (default 60)
 *
 * "Inactive" = no lastActivity in that many days (lastActivity is stamped on
 * login and while the user is using the site). Someone who has never been
 * active counts from the day they registered.
 *
 * It runs from the daily cron (/api/cron/auto-freeze) and also, at most once a
 * day, from normal site traffic — so it keeps working even if the scheduler
 * isn't configured.
 */
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, SettingsModel } from "@/lib/models";

const DAY_MS = 24 * 3600 * 1000;

function inactiveSince(cutoff: Date) {
  return {
    $or: [
      { lastActivity: { $lt: cutoff } },
      { lastActivity: null, createdAt: { $lt: cutoff } },
    ],
  };
}

export async function runAutoFreeze({ dryRun = false } = {}) {
  await connectToDatabase();

  const settings  = await SettingsModel.findOne().select("groomFreezeDays brideFreezeDays").lean() as any;
  const groomDays = settings?.groomFreezeDays ?? 90;
  const brideDays = settings?.brideFreezeDays ?? 60;
  const now       = new Date();

  // Only ACTIVE, not-yet-frozen accounts — leave SUSPENDED / BANNED / INACTIVE alone
  const base = { status: "ACTIVE", isFrozen: { $ne: true }, isAutoFrozen: { $ne: true } };
  const [grooms, brides] = await Promise.all([
    UserModel.find({ ...base, profileType: "GROOM", ...inactiveSince(new Date(now.getTime() - groomDays * DAY_MS)) })
      .select("_id profileId").lean() as Promise<any[]>,
    UserModel.find({ ...base, profileType: "BRIDE", ...inactiveSince(new Date(now.getTime() - brideDays * DAY_MS)) })
      .select("_id profileId").lean() as Promise<any[]>,
  ]);

  const ids = [...grooms, ...brides].map((u) => u._id);
  const result = {
    groomDays,
    brideDays,
    groomsFrozen: grooms.map((u) => u.profileId as string),
    bridesFrozen: brides.map((u) => u.profileId as string),
    dryRun,
    ranAt: now.toISOString(),
  };
  if (dryRun || !ids.length) return result;

  // isAutoFrozen is separate from a manual freeze
  await UserModel.updateMany({ _id: { $in: ids } }, { $set: { isAutoFrozen: true, autoFrozenAt: now } });
  await ProfileModel.updateMany({ userId: { $in: ids } }, { $set: { isAutoFrozen: true, autoFrozenAt: now } });

  console.log(`[auto-freeze] Froze ${grooms.length} grooms (>${groomDays}d) and ${brides.length} brides (>${brideDays}d)`);
  return result;
}

/** Run the auto-freeze if it hasn't run in the last 24 hours. Never throws. */
export async function runAutoFreezeIfDue() {
  try {
    await connectToDatabase();
    const now = new Date();
    // Claim today's run atomically, so concurrent requests don't all run it
    const claimed = await SettingsModel.findOneAndUpdate(
      {
        $or: [
          { lastAutoFreezeRunAt: { $lt: new Date(now.getTime() - DAY_MS) } },
          { lastAutoFreezeRunAt: null },
        ],
      },
      { $set: { lastAutoFreezeRunAt: now } },
    ).select("_id").lean();
    if (claimed) await runAutoFreeze();
  } catch (error) {
    console.error("[auto-freeze] Error:", error);
  }
}
