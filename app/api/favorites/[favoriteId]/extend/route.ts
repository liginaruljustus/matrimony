/**
 * POST /api/favorites/[favoriteId]/extend
 *
 * Called after payment approval to mark a favorite as paid.
 * Removes expiry date so the favorite stays indefinitely.
 *
 * Request body:
 * {
 *   paymentId: string  // Payment record ID that was approved
 * }
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { FavoriteModel, PaymentModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function POST(
  req: Request,
  { params }: { params: { favoriteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await req.json();
    if (!paymentId) {
      return Response.json({ error: "paymentId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify payment is approved
    const payment = await PaymentModel.findById(paymentId).lean() as any;
    if (!payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.approvalStatus !== "APPROVED") {
      return Response.json(
        { error: "Payment not approved yet" },
        { status: 400 }
      );
    }
    if (String(payment.userId) !== session.user.id) {
      return Response.json({ error: "Payment does not belong to you" }, { status: 403 });
    }

    // Find and update favorite
    const favoriteId_ = toObjectId(params.favoriteId);
    const favorite = await FavoriteModel.findOneAndUpdate(
      {
        _id: favoriteId_,
        userId: session.user.id,
      },
      {
        $set: {
          isPaid: true,
          expiresAt: null, // Remove expiry date
        },
      },
      { new: true }
    ).lean() as any;

    if (!favorite) {
      return Response.json({ error: "Favorite not found" }, { status: 404 });
    }

    return Response.json({
      ok: true,
      message: "Favorite extended indefinitely. You can now keep this favorite forever!",
      favorite: {
        id: String(favorite._id),
        isPaid: true,
        expiresAt: null,
      },
    });
  } catch (error) {
    console.error("POST /api/favorites/[favoriteId]/extend error:", error);
    return Response.json({ error: "Failed to extend favorite" }, { status: 500 });
  }
}
