import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, InterestModel, PaymentModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const [users, activeUsers, profiles, interests, acceptedInterests, pendingPayments] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ status: "ACTIVE" }),
      ProfileModel.countDocuments(),
      InterestModel.countDocuments(),
      InterestModel.countDocuments({ status: "ACCEPTED" }),
      PaymentModel.countDocuments({ approvalStatus: "PENDING_ADMIN_REVIEW" }),
    ]);

    return NextResponse.json({
      users,
      activeUsers,
      profiles,
      interests,
      acceptedInterests,
      pendingPayments,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
