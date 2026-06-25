/**
 * POST /api/favorites/pay
 *
 * User pays to extend favorite indefinitely.
 * Links to existing payment system.
 *
 * Request body:
 * {
 *   favoriteUserId: string  // The bride profile to keep favorited
 * }
 *
 * Response:
 * {
 *   ok: boolean
 *   paymentId?: string      // Payment record ID
 *   redirectUrl?: string    // Payment gateway redirect (if needed)
 *   message?: string
 * }
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { FavoriteModel, PaymentModel, UserModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

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

    await connectToDatabase();

    // Find the favorite record
    const favorite = await FavoriteModel.findOne({
      userId: session.user.id,
      favoriteUserId,
    }) as any;

    if (!favorite) {
      return Response.json({ error: "Favorite not found" }, { status: 404 });
    }

    // If already paid, return success
    if (favorite.isPaid) {
      return Response.json({
        ok: true,
        message: "Already paid for this favorite",
      });
    }

    // Create payment record (linking to existing payment system)
    const groomUser = await UserModel.findById(session.user.id).select("familyClass").lean() as any;
    const brideUser = await UserModel.findById(favoriteUserId).select("familyClass").lean() as any;

    if (!groomUser || !brideUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Payment amount based on groom's family class
    const amounts: Record<string, number> = {
      MC: 99,
      UC: 199,
      EC: 499,
    };
    const paymentAmount = amounts[groomUser.familyClass] || 99;

    // Create payment record
    const payment = await PaymentModel.create({
      userId: session.user.id,
      type: "FAVORITE_EXTENSION",
      favoriteUserId,
      amount: paymentAmount,
      currency: "INR",
      approvalStatus: "PENDING",
      createdAt: new Date(),
    });

    // Return payment ID for frontend to initiate payment
    return Response.json({
      ok: true,
      paymentId: String(payment._id),
      amount: paymentAmount,
      message: "Payment initiated. Complete payment to keep your favorite.",
    });
  } catch (error) {
    console.error("POST /api/favorites/pay error:", error);
    return Response.json({ error: "Failed to process payment" }, { status: 500 });
  }
}
