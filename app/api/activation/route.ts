/**
 * GET  /api/activation — the member's go-live status, their three tasks, the
 *                        links to follow and the poster/video to share now.
 * POST /api/activation — complete a task:
 *        { task: "ncs",    ncsUserId }      joined Lura NCS
 *        { task: "follow", followed: [...] } followed every listed channel/page
 *      Sharing the poster/video is confirmed separately (POST /api/share-proof,
 *      then a click on the member's personal link or an admin review).
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel } from "@/lib/models";
import {
  getActivationSettings, computeLiveAt, currentPromo, isLive, shareDue, tasksDone,
} from "@/lib/activation";
import { latestShareProof } from "@/lib/shareProof";

async function load(userId: string) {
  const [profile, user, settings, proof] = await Promise.all([
    ProfileModel.findOne({ userId }).select("profileStatus isLocked lockedAt approvalDate liveAt activation").lean() as Promise<any>,
    UserModel.findById(userId).select("profileId shareClockFrom lastSharedAt").lean() as Promise<any>,
    getActivationSettings(),
    latestShareProof(userId),
  ]);
  return { profile, user, settings, proof };
}

function view({ profile, user, settings, proof }: Awaited<ReturnType<typeof load>>) {
  const now = new Date();
  const submitted = !!profile?.isLocked || profile?.profileStatus === "APPROVED" || profile?.profileStatus === "PENDING_APPROVAL";
  const live = isLive(profile, now);
  return {
    submitted,
    live,
    liveAt: profile?.liveAt ?? null,
    pendingActivation: submitted && !live && !!profile?.liveAt,
    tasks: tasksDone(profile?.activation),
    ncsUserId: profile?.activation?.ncsUserId ?? null,
    followed: profile?.activation?.followed ?? [],
    lastSharedAt: user?.lastSharedAt ?? null,
    shareDue: live && shareDue(user?.shareClockFrom ?? profile?.liveAt ?? profile?.approvalDate, settings, now),
    profileId: user?.profileId ?? null,
    shareProof: proof
      ? { status: proof.status, rejectReason: proof.rejectReason ?? null, createdAt: proof.createdAt, clicks: proof.clicks ?? 0 }
      : null,
    promo: currentPromo(settings, now),
    ncsSiteUrl: settings.ncsSiteUrl,
    socialLinks: settings.socialLinks,
    days: {
      activation: settings.activationDays,
      ncs: settings.activationNcsDays,
      allDone: settings.activationAllDoneDays,
      shareReminder: settings.shareReminderDays,
      shareFreeze: settings.shareFreezeDays,
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  return Response.json(view(await load(session.user.id)));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const task = String(body?.task ?? "");
  if (!["ncs", "follow"].includes(task)) {
    return Response.json({ error: "task must be ncs or follow (shares are confirmed via /api/share-proof)" }, { status: 400 });
  }

  await connectToDatabase();
  const state = await load(session.user.id);
  const { profile, settings } = state;
  if (!profile) return Response.json({ error: "Complete your profile first" }, { status: 400 });

  const now = new Date();
  const set: Record<string, unknown> = {};

  if (task === "ncs") {
    const ncsUserId = String(body?.ncsUserId ?? "").trim().toUpperCase();
    if (ncsUserId.length < 3 || ncsUserId.length > 40) {
      return Response.json({ error: "Enter your Lura NCS user ID" }, { status: 400 });
    }
    set["activation.ncsUserId"] = ncsUserId;
    set["activation.ncsAt"] = now;
  } else if (task === "follow") {
    const names = settings.socialLinks.map((l) => l.name);
    const followed = Array.isArray(body?.followed) ? body.followed.map(String) : [];
    const missing = names.filter((n) => !followed.includes(n));
    if (missing.length) {
      return Response.json({ error: `Please follow every channel first: ${missing.join(", ")}` }, { status: 400 });
    }
    set["activation.followed"] = names;
    set["activation.followedAt"] = now;
  }

  // Bring the go-live date forward for a profile still waiting to go live
  if (profile.liveAt && new Date(profile.liveAt) > now) {
    const activation = { ...(profile.activation ?? {}) };
    for (const [k, v] of Object.entries(set)) activation[k.replace("activation.", "")] = v;
    const submittedAt = new Date(profile.lockedAt ?? profile.approvalDate ?? now);
    const liveAt = computeLiveAt(submittedAt, activation, settings, new Date(profile.liveAt), now);
    set.liveAt = liveAt;
    // Going live starts the regular share clock
    if (liveAt <= now) {
      await UserModel.updateOne({ _id: session.user.id }, { $set: { shareClockFrom: now } });
    }
  }

  await ProfileModel.updateOne({ _id: profile._id }, { $set: set });
  return Response.json({ ok: true, ...view(await load(session.user.id)) });
}
