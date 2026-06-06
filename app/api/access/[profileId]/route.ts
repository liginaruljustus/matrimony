import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function GET(
  request: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = toObjectId(session.user.id);
    const receiverId = toObjectId(params.profileId);

    if (!userId || !receiverId) {
      return NextResponse.json({ message: "Invalid user IDs" }, { status: 400 });
    }

    // Check if user has paid AND admin approved the payment
    const payment = await PaymentModel.findOne({
      userId,
      receiverId,
      tier: "CONTACT_DETAILS",
      status: "COMPLETED",
      approvalStatus: "APPROVED",
    }).lean<any>();

    const canViewContact = !!payment;

    return NextResponse.json({
      canViewContact,
      paidAt: payment?.approvedAt || null,
      approvalStatus: payment?.approvalStatus || null,
      reason: payment?.rejectionReason || null,
    });
  } catch (error) {
    console.error("Access check error:", error);
    return NextResponse.json(
      { message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
