/**
 * Share proofs — confirming a member really shared our poster/video.
 *
 * WhatsApp gives no way to check a status, so a share counts once it is
 * confirmed by either:
 *   - AUTO: someone opens the member's personal link (/r/<profileId>) that was
 *     shared with the poster, or
 *   - ADMIN: an admin checks the uploaded status screenshot (Admin → Shares).
 * Only a confirmed share completes the go-live step or resets the share clock.
 */
import { ProfileModel, ShareProofModel, UserModel, NotificationModel } from "@/lib/models";
import { computeLiveAt, getActivationSettings } from "@/lib/activation";

/** Days after a share during which a link click still confirms it. */
export const CLICK_CONFIRM_DAYS = 7;

/** Apply a confirmed share: go-live step / share clock, and tell the member. */
export async function confirmShareProof(proofId: string, how: "AUTO_CONFIRMED" | "APPROVED", reviewerId?: string) {
  const now = new Date();
  // Atomic: only a still-pending proof can be confirmed (no double effects)
  const proof = await ShareProofModel.findOneAndUpdate(
    { _id: proofId, status: "PENDING" },
    { $set: { status: how, confirmedAt: now, ...(reviewerId ? { reviewedBy: reviewerId } : {}) } },
    { new: true },
  ).lean() as any;
  if (!proof) return false;

  await UserModel.updateOne({ _id: proof.userId }, { $set: { lastSharedAt: now, shareClockFrom: now } });

  // Go-live step 3 — and bring the live date forward if the profile is still waiting
  const profile = await ProfileModel.findOne({ userId: proof.userId })
    .select("liveAt lockedAt approvalDate activation").lean() as any;
  if (profile) {
    const set: Record<string, unknown> = {};
    if (!profile.activation?.sharedAt) set["activation.sharedAt"] = now;
    if (profile.liveAt && new Date(profile.liveAt) > now) {
      const settings = await getActivationSettings();
      const activation = { ...(profile.activation ?? {}), sharedAt: profile.activation?.sharedAt ?? now };
      const submittedAt = new Date(profile.lockedAt ?? profile.approvalDate ?? now);
      set.liveAt = computeLiveAt(submittedAt, activation, settings, new Date(profile.liveAt), now);
    }
    if (Object.keys(set).length) await ProfileModel.updateOne({ _id: profile._id }, { $set: set });
  }

  try {
    await NotificationModel.create({
      userId:  proof.userId,
      type:    "SHARE_CONFIRMED",
      message: "Thank you! Your share of our post has been confirmed.",
      link:    "/dashboard",
    });
  } catch { /* non-critical */ }
  return true;
}

export async function rejectShareProof(proofId: string, reason: string, reviewerId: string) {
  const proof = await ShareProofModel.findOneAndUpdate(
    { _id: proofId, status: "PENDING" },
    { $set: { status: "REJECTED", rejectReason: reason, reviewedBy: reviewerId } },
    { new: true },
  ).lean() as any;
  if (!proof) return false;
  try {
    await NotificationModel.create({
      userId:  proof.userId,
      type:    "SHARE_REJECTED",
      message: `Your share could not be confirmed${reason ? `: ${reason}` : ""}. Please share the post again and upload a new screenshot.`,
      link:    "/dashboard",
    });
  } catch { /* non-critical */ }
  return true;
}

/** The member's most recent share proof (for the Dashboard). */
export async function latestShareProof(userId: string) {
  return await ShareProofModel.findOne({ userId }).sort({ createdAt: -1 })
    .select("status rejectReason createdAt clicks confirmedAt").lean() as any;
}
