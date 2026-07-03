/**
 * GET /api/bride/inbox
 *
 * For BRIDE users only.
 * Returns grooms who have:
 *  - Favourited this bride
 *  - Had their 1st payment admin-approved (firstPaidAt set + payment APPROVED)
 *
 * Returns the groom's AD card (MD + additional details: family, income, horoscope,
 * photos, expectations) — the groom's 1st payment is admin-approved, so the bride
 * family gets the fuller picture to evaluate the proposal. Contact details stay hidden.
 * Sorted: accepted first, then by firstPaidAt DESC (most recent first)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { buildMDCard, buildADCard } from "@/lib/cardGenerator";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Must be a bride
    const brideUser = await UserModel.findById(session.user.id).lean() as any;
    if (!brideUser || brideUser.profileType !== "BRIDE") {
      return Response.json({ error: "Only bride profiles can access this" }, { status: 403 });
    }

    // Favorites where THIS bride is the target and 1st payment was submitted
    const favs = await FavoriteModel.find({
      favoriteUserId: session.user.id,
      firstPaidAt:    { $exists: true, $ne: null },
    }).sort({ isAccepted: -1, firstPaidAt: -1 }).lean() as any[];

    if (!favs.length) return Response.json({ inbox: [], pendingApproval: 0 });

    // Filter to only admin-approved 1st payments
    const paymentIds = favs.map((f: any) => f.firstPaymentId).filter(Boolean);
    const approvedPayments = await PaymentModel.find({
      _id: { $in: paymentIds },
      approvalStatus: "APPROVED",
    }).lean() as any[];
    const approvedSet = new Set(approvedPayments.map((p: any) => String(p._id)));

    const approvedFavs = favs.filter((f: any) =>
      f.firstPaymentId && approvedSet.has(String(f.firstPaymentId)),
    );
    const pendingApproval = favs.length - approvedFavs.length;

    if (!approvedFavs.length) return Response.json({ inbox: [], pendingApproval });

    // Fetch groom users + profiles
    const groomUserIds = approvedFavs.map((f: any) => f.userId);
    const [groomUsers, groomProfiles] = await Promise.all([
      UserModel.find({ _id: { $in: groomUserIds } }).lean() as Promise<any[]>,
      ProfileModel.find({ userId: { $in: groomUserIds } }).lean() as Promise<any[]>,
    ]);
    const userMap    = Object.fromEntries(groomUsers.map((u: any) => [String(u._id), u]));
    const profileMap = Object.fromEntries(groomProfiles.map((p: any) => [String(p.userId), p]));

    const inbox = approvedFavs.map((fav: any) => {
      const uid = String(fav.userId);
      const u   = userMap[uid];
      const p   = profileMap[uid];
      // Merge MD (public) + AD (additional) — never CD (contact) fields
      const card = u && p ? { ...buildMDCard(u, p), ...buildADCard(u, p) } : null;
      return {
        favoriteId:     String(fav._id),
        groomUserId:    uid,
        firstPaidAt:    fav.firstPaidAt,
        isAccepted:     fav.isAccepted ?? false,
        acceptedAt:     fav.acceptedAt  ?? null,
        declinedAt:     fav.declinedAt  ?? null,
        mdCard:         card,
      };
    });

    return Response.json({ inbox, pendingApproval });
  } catch (error) {
    console.error("GET /api/bride/inbox error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
