/**
 * POST /api/payment/first
 *
 * Submit a batch 1st payment (manual transaction ID, pending admin approval).
 *
 * Body: {
 *   favoriteIds: string[],      // FavoriteModel _id list
 *   transactionId: string,      // UPI/bank transaction ref
 *   paymentMethod: string,      // "gpay" | "upi" | "bank"
 *   totalAmount: number,
 * }
 *
 * Flow:
 *  1. Validate all favorites belong to user, are PAYMENT_LOCKED, lock not expired
 *  2. Create a PaymentModel (PENDING_ADMIN_REVIEW)
 *  3. Store payment in favorites (firstPaymentId)
 *  4. Admin approves → separate route unlocks AD cards + 30d inbox freeze
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel, PaymentModel } from "@/lib/models";
import { PAYMENT_AMOUNTS } from "@/lib/cardGenerator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { favoriteIds, transactionId, paymentMethod, totalAmount } = await req.json();
    if (!Array.isArray(favoriteIds) || !favoriteIds.length) {
      return Response.json({ error: "favoriteIds required" }, { status: 400 });
    }
    if (!transactionId?.trim()) {
      return Response.json({ error: "transactionId required" }, { status: 400 });
    }

    await connectToDatabase();

    const now = new Date();

    // Validate favorites
    const favs = await FavoriteModel.find({
      _id: { $in: favoriteIds },
      userId: session.user.id,
      movedToPayment: true,
      firstPaidAt: { $exists: false },
    }).lean() as any[];

    if (!favs.length) {
      return Response.json({ error: "No valid favorites found for payment" }, { status: 400 });
    }

    // Drop any with expired lock
    const activeFavs = favs.filter((f: any) =>
      !f.paymentLockExpiresAt || new Date(f.paymentLockExpiresAt) > now,
    );
    if (!activeFavs.length) {
      return Response.json({ error: "Payment lock expired on all selected profiles" }, { status: 400 });
    }

    // Fetch target users to calculate correct amount
    const targetUserIds = activeFavs.map((f: any) => f.favoriteUserId);
    const [targetUsers, groomUser] = await Promise.all([
      UserModel.find({ _id: { $in: targetUserIds } }).lean() as Promise<any[]>,
      UserModel.findById(session.user.id).lean() as Promise<any>,
    ]);
    const userMap = Object.fromEntries(targetUsers.map((u: any) => [String(u._id), u]));

    // Block suspended / banned accounts
    if (!groomUser || groomUser.status !== "ACTIVE") {
      return Response.json(
        { error: "Your account is not active. Contact support for assistance." },
        { status: 403 },
      );
    }

    let calculatedTotal = 0;
    for (const fav of activeFavs) {
      const u = userMap[String(fav.favoriteUserId)];
      const fc = u?.familyClass ?? "MC";
      calculatedTotal += PAYMENT_AMOUNTS[fc as keyof typeof PAYMENT_AMOUNTS] ?? 500;
    }

    // Create payment record
    const payment = await PaymentModel.create({
      userId:        session.user.id,
      receiverIds:   targetUserIds,
      amount:        calculatedTotal,
      tier:          "FIRST_PAYMENT",
      status:        "PENDING",
      transactionId: transactionId.trim(),
      paymentMethod: paymentMethod ?? "upi",
      paymentDate:   now,
      approvalStatus:"PENDING_ADMIN_REVIEW",
    });

    // Link payment to each favorite
    await FavoriteModel.updateMany(
      { _id: { $in: activeFavs.map((f: any) => f._id) } },
      { $set: { firstPaymentId: payment._id, firstPaidAt: now } },
    );

    return Response.json({
      ok: true,
      paymentId:    String(payment._id),
      amount:       calculatedTotal,
      profileCount: activeFavs.length,
      message:      "Payment submitted for admin approval. You will be notified once approved.",
    });
  } catch (error) {
    console.error("POST /api/payment/first error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
