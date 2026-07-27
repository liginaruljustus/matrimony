/**
 * GET /api/bride/inbox
 *
 * For BRIDE users only.
 * Returns grooms who have:
 *  - Favourited this bride
 *  - Had their 1st payment approved — either by admin manually, or
 *    automatically once firstPaymentAutoApproveDays has passed since payment
 *    (SLA fallback, see lib/paymentApproval.ts) so a slow manual review never
 *    stalls the proposal indefinitely.
 *
 * Returns the groom's AD card (MD + additional details: family, income, horoscope,
 * photos, expectations) — the groom's 1st payment is approved, so the bride
 * family gets the fuller picture to evaluate the proposal.
 *
 * If the groom's 2nd payment is also admin-approved, the groom's CD card
 * (phone, WhatsApp, contact person) is included too — payment unlocks details
 * on both sides, mirroring what the groom sees of the bride.
 * Sorted: accepted first, then by firstPaidAt DESC (most recent first)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { buildMDCard, buildADCard, buildCDCard } from "@/lib/cardGenerator";
import { autoApproveDuePayments } from "@/lib/paymentApproval";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // SLA fallback — approve any 1st/2nd payments that have sat unreviewed past
    // the admin-configured window, so proposals don't stall on admin.
    await Promise.all([
      autoApproveDuePayments("FIRST_PAYMENT"),
      autoApproveDuePayments("SECOND_PAYMENT"),
    ]);

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

    // Which of these grooms also have an admin-approved 2nd payment — their
    // contact details (CD) unlock for the bride too, same as the groom's own
    // 2nd payment unlocks the bride's contact details for him.
    const secondPaymentIds = approvedFavs.map((f: any) => f.secondPaymentId).filter(Boolean);
    const approvedSecondPayments = secondPaymentIds.length
      ? await PaymentModel.find({
          _id: { $in: secondPaymentIds },
          approvalStatus: "APPROVED",
        }).lean() as any[]
      : [];
    const approvedSecondSet = new Set(approvedSecondPayments.map((p: any) => String(p._id)));

    const inbox = approvedFavs.map((fav: any) => {
      const uid = String(fav.userId);
      const u   = userMap[uid];
      const p   = profileMap[uid];
      // Merge MD (public) + AD (additional) — CD (contact) only once 2nd payment is approved
      const card = u && p ? { ...buildMDCard(u, p), ...buildADCard(u, p) } : null;
      const secondPaymentApproved = !!(fav.secondPaymentId && approvedSecondSet.has(String(fav.secondPaymentId)));
      const cdCard = secondPaymentApproved && u && p ? buildCDCard(u, p) : null;
      return {
        favoriteId:     String(fav._id),
        groomUserId:    uid,
        firstPaidAt:    fav.firstPaidAt,
        secondPaidAt:   fav.secondPaidAt ?? null,
        isAccepted:     fav.isAccepted ?? false,
        acceptedAt:     fav.acceptedAt  ?? null,
        declinedAt:     fav.declinedAt  ?? null,
        mdCard:         card,
        cdCard,
      };
    });

    return Response.json({ inbox, pendingApproval });
  } catch (error) {
    console.error("GET /api/bride/inbox error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
