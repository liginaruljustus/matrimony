/**
 * GET /api/contact-details
 *
 * CD cards of brides for which 2nd payment was admin-approved.
 * Recently paid first (secondPaidAt DESC).
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { buildCDCard } from "@/lib/cardGenerator";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const favs = await FavoriteModel.find({
      userId:       session.user.id,
      secondPaidAt: { $exists: true, $ne: null },
    }).sort({ secondPaidAt: -1 }).lean() as any[];

    if (!favs.length) return Response.json({ contacts: [] });

    // Only admin-approved 2nd payments
    const paymentIds = favs.map((f: any) => f.secondPaymentId).filter(Boolean);
    const payments   = await PaymentModel.find({
      _id: { $in: paymentIds },
      approvalStatus: "APPROVED",
    }).lean() as any[];
    const approvedSet = new Set(payments.map((p: any) => String(p._id)));

    const approvedFavs = favs.filter((f: any) =>
      f.secondPaymentId && approvedSet.has(String(f.secondPaymentId)),
    );

    if (!approvedFavs.length) {
      return Response.json({ contacts: [], pendingApproval: favs.length });
    }

    const targetUserIds = approvedFavs.map((f: any) => f.favoriteUserId);
    const [targetUsers, targetProfiles] = await Promise.all([
      UserModel.find({ _id: { $in: targetUserIds } }).lean() as Promise<any[]>,
      ProfileModel.find({ userId: { $in: targetUserIds } }).lean() as Promise<any[]>,
    ]);
    const userMap    = Object.fromEntries(targetUsers.map((u: any) => [String(u._id), u]));
    const profileMap = Object.fromEntries(targetProfiles.map((p: any) => [String(p.userId), p]));

    const contacts = approvedFavs.map((fav: any) => {
      const uid = String(fav.favoriteUserId);
      const u   = userMap[uid];
      const p   = profileMap[uid];
      return {
        favoriteId:     String(fav._id),
        favoriteUserId: uid,
        secondPaidAt:   fav.secondPaidAt,
        cdCard:         u && p ? buildCDCard(u, p) : null,
        name:           u?.name ?? "Unknown",
        profileId:      u?.profileId ?? uid,
        photo:          p?.photos?.[0] ?? null,
      };
    });

    return Response.json({
      contacts,
      pendingApproval: favs.length - approvedFavs.length,
    });
  } catch (error) {
    console.error("GET /api/contact-details error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
