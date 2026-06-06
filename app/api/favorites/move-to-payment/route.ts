/**
 * POST /api/favorites/move-to-payment
 *
 * Body: { favoriteIds: string[] }  — array of favorite document IDs to move
 *
 * Rules:
 *  - Each favorite must belong to the current user
 *  - Profile (bride) must NOT be frozen / auto-frozen
 *  - If paymentLock already active & not expired → 409
 *  - Sets movedToPayment=true, paymentLockExpiresAt = now + 3 days, status = PAYMENT_LOCKED
 *  - Returns total amount due (based on familyClass of each bride)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, FavoriteModel } from "@/lib/models";
import { PAYMENT_AMOUNTS, addDays } from "@/lib/cardGenerator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { favoriteIds } = await req.json() as { favoriteIds: string[] };
    if (!Array.isArray(favoriteIds) || !favoriteIds.length) {
      return Response.json({ error: "favoriteIds array is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Block suspended / banned accounts
    const groomUser = await UserModel.findById(session.user.id).select("status").lean() as any;
    if (!groomUser || groomUser.status !== "ACTIVE") {
      return Response.json(
        { error: "Your account is not active. Contact support for assistance." },
        { status: 403 },
      );
    }

    // Load favorites owned by this user
    const favs = await FavoriteModel.find({
      _id: { $in: favoriteIds },
      userId: session.user.id,
    }).lean() as any[];

    if (!favs.length) {
      return Response.json({ error: "No matching favorites found" }, { status: 404 });
    }

    const errors: string[] = [];
    const toProcess: any[] = [];
    const now = new Date();

    // Load target users + profiles for validation
    const targetUserIds = favs.map((f: any) => f.favoriteUserId);
    const [targetUsers, targetProfiles] = await Promise.all([
      UserModel.find({ _id: { $in: targetUserIds } }).lean() as Promise<any[]>,
      ProfileModel.find({ userId: { $in: targetUserIds } }).lean() as Promise<any[]>,
    ]);
    const userMap = Object.fromEntries(targetUsers.map((u: any) => [String(u._id), u]));
    const profileMap = Object.fromEntries(targetProfiles.map((p: any) => [String(p.userId), p]));

    for (const fav of favs) {
      const uid = String(fav.favoriteUserId);
      const u = userMap[uid];
      const p = profileMap[uid];

      if (!u || !p) { errors.push(`Profile ${uid} not found`); continue; }
      if (u.isFrozen || u.isAutoFrozen || p.isFrozen || p.isAutoFrozen) {
        errors.push(`${u.name ?? uid} profile is frozen`);
        continue;
      }
      if (fav.firstPaidAt) {
        errors.push(`${u.name ?? uid} already paid`);
        continue;
      }
      // If lock still active — skip
      if (fav.movedToPayment && fav.paymentLockExpiresAt && new Date(fav.paymentLockExpiresAt) > now) {
        errors.push(`${u.name ?? uid} already in payment lock`);
        continue;
      }
      toProcess.push({ fav, familyClass: u.familyClass ?? p.familyClass ?? "MC" });
    }

    if (!toProcess.length) {
      return Response.json({ error: "No profiles can be moved", details: errors }, { status: 400 });
    }

    const expiresAt = addDays(now, 3);
    const ids = toProcess.map((x) => x.fav._id);

    await FavoriteModel.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          movedToPayment:       true,
          movedToPaymentAt:     now,
          paymentLockExpiresAt: expiresAt,
          status:               "PAYMENT_LOCKED",
        },
      },
    );

    // Calculate total due
    let totalAmount = 0;
    const breakdown: { profileId: string; name: string; familyClass: string; amount: number }[] = [];
    for (const { fav, familyClass } of toProcess) {
      const uid = String(fav.favoriteUserId);
      const u = userMap[uid];
      const amount = PAYMENT_AMOUNTS[familyClass as keyof typeof PAYMENT_AMOUNTS] ?? 500;
      totalAmount += amount;
      breakdown.push({
        profileId: u?.profileId ?? uid,
        name:      u?.name ?? "Unknown",
        familyClass,
        amount,
      });
    }

    return Response.json({
      ok: true,
      movedCount:   toProcess.length,
      totalAmount,
      breakdown,
      expiresAt,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/favorites/move-to-payment error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
