/**
 * Auto-freeze: hide profiles whose owners stopped sharing our poster/video.
 *
 * Every Settings.shareReminderDays (10) a live member is asked on the Dashboard
 * to share the current poster/video; they may skip it. With no share for
 * Settings.shareFreezeDays (60) — counted from their last share, the day they
 * went live, or the day they unfroze — the profile is auto-frozen. As before,
 * an auto-frozen profile can be unfrozen within 90 days, after that it stays off.
 * Profiles still waiting to go live are never frozen.
 *
 * It runs from the daily cron (/api/cron/auto-freeze) and also, at most once a
 * day, from normal site traffic — so it keeps working even if the scheduler
 * isn't configured.
 */
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, SettingsModel } from "@/lib/models";
import { getActivationSettings } from "@/lib/activation";

const DAY_MS = 24 * 3600 * 1000;

export async function runAutoFreeze({ dryRun = false } = {}) {
  await connectToDatabase();

  const s      = await getActivationSettings();
  const days   = s.shareFreezeDays;
  const now    = new Date();
  const cutoff = new Date(now.getTime() - days * DAY_MS);

  // Only ACTIVE, not-yet-frozen accounts — leave SUSPENDED / BANNED / INACTIVE alone
  const candidates = await UserModel.find({
    status: "ACTIVE",
    role: { $ne: "ADMIN" },                       // never the admin account
    profileType: { $in: ["BRIDE", "GROOM"] },      // members only
    isFrozen: { $ne: true },
    isAutoFrozen: { $ne: true },
    $or: [
      { shareClockFrom: { $lt: cutoff } },
      { shareClockFrom: null, createdAt: { $lt: cutoff } },
    ],
  }).select("_id profileId profileType").lean() as any[];

  // Skip profiles that are not live yet — they aren't listed anyway
  const waiting = await ProfileModel.find({
    userId: { $in: candidates.map((u) => u._id) },
    liveAt: { $gt: now },
  }).select("userId").lean() as any[];
  const waitingSet = new Set(waiting.map((p) => String(p.userId)));
  const toFreeze = candidates.filter((u) => !waitingSet.has(String(u._id)));

  const ids = toFreeze.map((u) => u._id);
  const result = {
    shareFreezeDays: days,
    groomsFrozen: toFreeze.filter((u) => u.profileType === "GROOM").map((u) => u.profileId as string),
    bridesFrozen: toFreeze.filter((u) => u.profileType !== "GROOM").map((u) => u.profileId as string),
    dryRun,
    ranAt: now.toISOString(),
  };
  if (dryRun || !ids.length) return result;

  // isAutoFrozen is separate from a manual freeze
  await UserModel.updateMany({ _id: { $in: ids } }, { $set: { isAutoFrozen: true, autoFrozenAt: now } });
  await ProfileModel.updateMany({ userId: { $in: ids } }, { $set: { isAutoFrozen: true, autoFrozenAt: now } });

  console.log(`[auto-freeze] Froze ${ids.length} profiles with no share for over ${days} days`);
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
