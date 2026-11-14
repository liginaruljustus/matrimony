/**
 * Go-live activation and the sharing rule.
 *
 *  - A newly submitted profile is not listed straight away: it goes live after
 *    `activationDays` (default 60).
 *  - Three Dashboard tasks bring that forward:
 *      1. join Lura NCS and enter the Lura NCS user ID  → live after `activationNcsDays` (45)
 *      2. follow our WhatsApp channel / social pages
 *      3. share the current poster or video
 *    All three done → live after `activationAllDoneDays` (0 = straight away).
 *  - Until the profile is live the member can't browse or send proposals.
 *  - Once live, a reminder asks them to share the current poster every
 *    `shareReminderDays` (10); they may skip it, but with no share for
 *    `shareFreezeDays` (60) the profile is auto-frozen (see lib/autoFreeze.ts).
 *
 * Profiles that went live before this rule existed have no `liveAt` and stay live.
 */
import { SettingsModel } from "@/lib/models";

const DAY_MS = 24 * 3600 * 1000;

export type SocialLink = { name: string; url: string };
export type PromoItem  = { category: string; title: string; mediaUrl: string; shareText?: string };

export type ActivationSettings = {
  activationEnabled: boolean;
  activationDays: number;
  activationNcsDays: number;
  activationAllDoneDays: number;
  ncsSiteUrl: string;
  socialLinks: SocialLink[];
  promoItems: PromoItem[];
  promoRotateDays: number;
  shareReminderDays: number;
  shareFreezeDays: number;
};

export const ACTIVATION_DEFAULTS: ActivationSettings = {
  activationEnabled: true,
  activationDays: 60,
  activationNcsDays: 45,
  activationAllDoneDays: 0,
  ncsSiteUrl: "https://loorancsc.in",
  socialLinks: [],
  promoItems: [],
  promoRotateDays: 5,
  shareReminderDays: 10,
  shareFreezeDays: 60,
};

export async function getActivationSettings(): Promise<ActivationSettings> {
  const s = await SettingsModel.findOne()
    .select(Object.keys(ACTIVATION_DEFAULTS).join(" "))
    .lean() as Partial<ActivationSettings> | null;
  const out = { ...ACTIVATION_DEFAULTS };
  for (const k of Object.keys(ACTIVATION_DEFAULTS) as (keyof ActivationSettings)[]) {
    if (s && s[k] !== undefined && s[k] !== null) (out as any)[k] = s[k];
  }
  return out;
}

/** Mongo filter: profiles that are live now (no liveAt, or liveAt has passed). */
export function liveFilter(now = new Date()) {
  return { $or: [{ liveAt: null }, { liveAt: { $lte: now } }] };
}

/** Is this (approved) profile visible to other members yet? */
export function isLive(profile: { profileStatus?: string; liveAt?: Date | string | null } | null | undefined, now = new Date()) {
  if (!profile || profile.profileStatus !== "APPROVED") return false;
  return !profile.liveAt || new Date(profile.liveAt) <= now;
}

export type ActivationState = {
  ncsUserId?: string | null;
  ncsAt?: Date | null;
  followed?: string[];
  followedAt?: Date | null;
  sharedAt?: Date | null;
};

export function tasksDone(a: ActivationState | null | undefined) {
  return {
    ncs:    !!a?.ncsAt,
    follow: !!a?.followedAt,
    share:  !!a?.sharedAt,
  };
}

/**
 * When the profile goes live, given when it was submitted and which tasks are done.
 * Never later than the date already set (completing a task only brings it forward).
 */
export function computeLiveAt(
  submittedAt: Date,
  activation: ActivationState | null | undefined,
  s: ActivationSettings,
  current?: Date | null,
  now = new Date(),
): Date {
  const done = tasksDone(activation);
  let at = new Date(submittedAt.getTime() + s.activationDays * DAY_MS);
  if (done.ncs) at = new Date(Math.min(at.getTime(), submittedAt.getTime() + s.activationNcsDays * DAY_MS));
  if (done.ncs && done.follow && done.share) {
    at = new Date(Math.min(at.getTime(), now.getTime() + s.activationAllDoneDays * DAY_MS));
  }
  if (current) at = new Date(Math.min(at.getTime(), new Date(current).getTime()));
  return at;
}

/** The poster / video to share right now — the list rotates every promoRotateDays. */
export function currentPromo(s: ActivationSettings, now = new Date()): (PromoItem & { index: number; nextChangeAt: Date }) | null {
  const items = (s.promoItems ?? []).filter((p) => p?.mediaUrl || p?.title);
  if (!items.length) return null;
  const period = Math.max(1, s.promoRotateDays) * DAY_MS;
  const slot = Math.floor(now.getTime() / period);
  const index = slot % items.length;
  return { ...items[index], index, nextChangeAt: new Date((slot + 1) * period) };
}

/** Is a share due now (live members, every shareReminderDays)? */
export function shareDue(shareClockFrom: Date | string | null | undefined, s: ActivationSettings, now = new Date()) {
  if (!shareClockFrom) return true;
  return now.getTime() - new Date(shareClockFrom).getTime() >= s.shareReminderDays * DAY_MS;
}
