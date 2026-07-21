/**
 * GET /api/inbox
 *
 * Groom's inbox — AD cards of brides for which 1st payment was approved
 * (manually by admin, or automatically via the SLA fallback — see
 * lib/paymentApproval.ts).
 *
 * Rules:
 *  - Only favorites where firstPaidAt is set AND payment approvalStatus=APPROVED
 *  - Shows AD card (additional details)
 *  - 30-day inbox freeze period (inboxFrozenUntil) — after that groom can pay 2nd
 *  - The bride's accept/decline response is likewise held back until the
 *    freeze period ends (or 2nd payment is made): a decline surfaces early
 *    (no reason to keep bad news waiting), but an accept is revealed only
 *    once the AD card itself unlocks.
 *  - Recently paid first (firstPaidAt DESC)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { buildADCard } from "@/lib/cardGenerator";
import { autoApproveDuePayments } from "@/lib/paymentApproval";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // SLA fallback — approve any 1st/2nd payments that have sat unreviewed
    // past the admin-configured window.
    await Promise.all([
      autoApproveDuePayments("FIRST_PAYMENT"),
      autoApproveDuePayments("SECOND_PAYMENT"),
    ]);

    // Get approved 1st-payment favorites
    const favs = await FavoriteModel.find({
      userId:      session.user.id,
      firstPaidAt: { $exists: true, $ne: null },
    }).sort({ firstPaidAt: -1 }).lean() as any[];

    if (!favs.length) return Response.json({ inbox: [] });

    // Only show those whose payment is admin-approved
    const paymentIds = favs.map((f: any) => f.firstPaymentId).filter(Boolean);
    const payments   = await PaymentModel.find({
      _id: { $in: paymentIds },
      approvalStatus: "APPROVED",
    }).lean() as any[];
    const approvedPaymentIds = new Set(payments.map((p: any) => String(p._id)));

    const approvedFavs = favs.filter((f: any) =>
      f.firstPaymentId && approvedPaymentIds.has(String(f.firstPaymentId)),
    );

    if (!approvedFavs.length) return Response.json({ inbox: [], pendingApproval: favs.length });

    // Fetch target users + profiles
    const targetUserIds = approvedFavs.map((f: any) => f.favoriteUserId);
    const [targetUsers, targetProfiles] = await Promise.all([
      UserModel.find({ _id: { $in: targetUserIds } }).lean() as Promise<any[]>,
      ProfileModel.find({ userId: { $in: targetUserIds } }).lean() as Promise<any[]>,
    ]);
    const userMap    = Object.fromEntries(targetUsers.map((u: any) => [String(u._id), u]));
    const profileMap = Object.fromEntries(targetProfiles.map((p: any) => [String(p.userId), p]));

    const now = new Date();
    const inbox = approvedFavs.map((fav: any) => {
      const uid = String(fav.favoriteUserId);
      const u   = userMap[uid];
      const p   = profileMap[uid];
      const inboxFrozen = fav.inboxFrozenUntil && new Date(fav.inboxFrozenUntil) > now;

      const isBrideFrozen = !!(u?.isFrozen || u?.isAutoFrozen || p?.isFrozen || p?.isAutoFrozen);

      // AD details are LOCKED during the 30-day waiting window — only the
      // bride's Profile ID is shown. After the window ends (or once the
      // 2nd payment is made) the AD card becomes visible.
      const adLocked = !!inboxFrozen && !fav.secondPaidAt;

      return {
        favoriteId:       String(fav._id),
        favoriteUserId:   uid,
        firstPaidAt:      fav.firstPaidAt,
        inboxFrozenUntil: fav.inboxFrozenUntil ?? null,
        inboxFrozen,
        adLocked,
        brideProfileId:   u?.profileId ?? "",
        brideFamilyClass: u?.familyClass ?? p?.familyClass ?? "MC",
        secondPaidAt:     fav.secondPaidAt ?? null,
        // Bride's ACCEPTANCE is held back until the AD card itself unlocks —
        // matches "accept workflow shows to the boy after 30 days or admin
        // approval". A decline surfaces immediately regardless (no reason to
        // sit on bad news).
        isAccepted:       !adLocked && (fav.isAccepted ?? false),
        acceptedAt:       !adLocked ? (fav.acceptedAt ?? null) : null,
        declinedAt:       fav.declinedAt ?? null,
        // Whether the bride's profile is currently frozen (she may have frozen after groom paid)
        isBrideFrozen,
        // AD card is only served after the 30-day waiting window
        adCard:           u && p && !adLocked ? buildADCard(u, p) : null,
      };
    });

    return Response.json({
      inbox,
      pendingApproval: favs.length - approvedFavs.length,
    });
  } catch (error) {
    console.error("GET /api/inbox error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
