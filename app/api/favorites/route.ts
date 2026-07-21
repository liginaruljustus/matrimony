/**
 * GET  /api/favorites  — list current user's favorites (enriched with MD card data)
 * POST /api/favorites  — add a profile to favorites
 *
 * Favorites rules:
 *  - Cannot be removed once added — favorites are permanent.
 *  - If the payment lock (paymentLockDays) expires without payment, it simply
 *    reverts to an unpaid/selectable state (see `lockExpired` below) — the
 *    groom can retry "Move to Payment" any time, with no risk of losing it.
 *  - Status: ACTIVE | PAYMENT_LOCKED | PAID
 *  - Unpaid (ACTIVE) favorites shown first, then by createdAt DESC
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { buildMDCard, isPaymentLockExpired } from "@/lib/cardGenerator";
import { autoApproveDuePayments } from "@/lib/paymentApproval";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // SLA fallback — approve any 1st/2nd payments that have sat unreviewed
    // past the admin-configured window, so this page's "awaiting approval"
    // sections stay in sync with the inbox/contact-details pages.
    await Promise.all([
      autoApproveDuePayments("FIRST_PAYMENT"),
      autoApproveDuePayments("SECOND_PAYMENT"),
    ]);

    const favorites = await FavoriteModel.find({ userId: session.user.id })
      .sort({ firstPaidAt: 1, createdAt: -1 }) // unpaid (no firstPaidAt) first
      .lean() as any[];

    if (!favorites.length) return Response.json({ favorites: [] });

    // Fetch all target users + profiles in parallel
    const targetUserIds = favorites.map((f: any) => f.favoriteUserId);
    const [targetUsers, targetProfiles] = await Promise.all([
      UserModel.find({ _id: { $in: targetUserIds } }).lean() as Promise<any[]>,
      ProfileModel.find({ userId: { $in: targetUserIds } }).lean() as Promise<any[]>,
    ]);
    const userMap = Object.fromEntries(targetUsers.map((u: any) => [String(u._id), u]));
    const profileMap = Object.fromEntries(targetProfiles.map((p: any) => [String(p.userId), p]));

    // Batch-fetch payment approval statuses for 1st and 2nd payments
    const firstPaymentIds  = favorites.map((f: any) => f.firstPaymentId).filter(Boolean);
    const secondPaymentIds = favorites.map((f: any) => f.secondPaymentId).filter(Boolean);
    const allPaymentIds    = [...firstPaymentIds, ...secondPaymentIds];
    const approvedPayments = allPaymentIds.length
      ? await PaymentModel.find({ _id: { $in: allPaymentIds }, approvalStatus: "APPROVED" })
          .select("_id").lean() as any[]
      : [];
    const approvedPaymentSet = new Set(approvedPayments.map((p: any) => String(p._id)));

    const enriched = favorites.map((fav: any) => {
      const uid = String(fav.favoriteUserId);
      const u = userMap[uid];
      const p = profileMap[uid];
      const lockExpired = isPaymentLockExpired(fav);

      const isBrideFrozen = !!(u?.isFrozen || u?.isAutoFrozen || p?.isFrozen || p?.isAutoFrozen);
      const isBrideBanned = !u || u.status === "BANNED" || u.status === "INACTIVE";
      // Don't return profile card data for frozen/banned targets — the record still
      // exists in the list so the groom knows they have a favorite there.
      const cardVisible = !isBrideFrozen && !isBrideBanned;

      return {
        id:                    String(fav._id),
        favoriteUserId:        uid,
        status:                fav.status ?? "ACTIVE",
        movedToPayment:        fav.movedToPayment && !lockExpired,
        paymentLockExpiresAt:  fav.paymentLockExpiresAt,
        lockExpired,
        firstPaidAt:           fav.firstPaidAt ?? null,
        firstPaymentApproved:  fav.firstPaymentId
                                 ? approvedPaymentSet.has(String(fav.firstPaymentId))
                                 : false,
        inboxFrozenUntil:      fav.inboxFrozenUntil ?? null,
        secondPaidAt:          fav.secondPaidAt ?? null,
        secondPaymentApproved: fav.secondPaymentId
                                 ? approvedPaymentSet.has(String(fav.secondPaymentId))
                                 : false,
        createdAt:             fav.createdAt,
        mdCard:                cardVisible && u && p ? buildMDCard(u, p) : null,
        isBrideFrozen,
        isBrideBanned,
      };
    });

    return Response.json({ favorites: enriched });
  } catch (error) {
    console.error("GET /api/favorites error:", error);
    return Response.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { favoriteUserId } = await req.json();
    if (!favoriteUserId) {
      return Response.json({ error: "favoriteUserId is required" }, { status: 400 });
    }
    if (favoriteUserId === session.user.id) {
      return Response.json({ error: "Cannot favourite yourself" }, { status: 400 });
    }

    await connectToDatabase();

    // Block suspended / banned accounts
    const [groomUser, targetUser] = await Promise.all([
      UserModel.findById(session.user.id).select("status").lean() as Promise<any>,
      UserModel.findById(favoriteUserId).select("profileType").lean() as Promise<any>,
    ]);
    if (!groomUser || groomUser.status !== "ACTIVE") {
      return Response.json(
        { error: "Your account is not active. Contact support for assistance." },
        { status: 403 },
      );
    }

    // Verify the target is a BRIDE
    if (!targetUser) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }
    if (targetUser.profileType !== "BRIDE") {
      return Response.json({ error: "Can only favourite bride profiles" }, { status: 400 });
    }

    // Upsert — silently succeed if already exists. Favorites are permanent
    // once added (see docstring at the top of this file).
    await FavoriteModel.findOneAndUpdate(
      { userId: session.user.id, favoriteUserId },
      { $setOnInsert: {
        userId: session.user.id,
        favoriteUserId,
        status: "ACTIVE",
      } },
      { upsert: true, new: true },
    );

    return Response.json({ ok: true, message: "Added to favourites" });
  } catch (error: any) {
    if (error?.code === 11000) {
      return Response.json({ ok: true, message: "Already in favourites" });
    }
    console.error("POST /api/favorites error:", error);
    return Response.json({ error: "Failed to add favourite" }, { status: 500 });
  }
}
