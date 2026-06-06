import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, PaymentModel, InterestModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User Growth Data (last 30 days)
    const userGrowth = await UserModel.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Gender Distribution
    const genderDistribution = await ProfileModel.aggregate([
      {
        $group: {
          _id: "$profileType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: {
            $cond: [{ $eq: ["$_id", "BRIDE"] }, "Bride", "Groom"],
          },
          value: "$count",
          _id: 0,
        },
      },
    ]);

    // Verification Status
    const verificationStatus = await UserModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$verificationStatus", "UNVERIFIED"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { status: 1 } },
    ]);

    // Profile Status Distribution
    const profileStatusDistribution = await ProfileModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$profileStatus", "DRAFT"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { status: 1 } },
    ]);

    // Payment Status
    const paymentStatus = await PaymentModel.aggregate([
      {
        $group: {
          _id: "$approvalStatus",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    // User Status Distribution
    const userStatus = await UserModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$status", "ACTIVE"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { status: 1 } },
    ]);

    // Overall Stats
    const [
      totalUsers,
      activeUsers,
      totalProfiles,
      approvedProfiles,
      pendingProfiles,
      rejectedProfiles,
      totalInterests,
      acceptedInterests,
      pendingPayments,
      approvedPayments,
      brides,
      grooms,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ status: "ACTIVE" }),
      ProfileModel.countDocuments(),
      ProfileModel.countDocuments({ profileStatus: "APPROVED" }),
      ProfileModel.countDocuments({ profileStatus: "PENDING_APPROVAL" }),
      ProfileModel.countDocuments({ profileStatus: "REJECTED" }),
      InterestModel.countDocuments(),
      InterestModel.countDocuments({ status: "ACCEPTED" }),
      PaymentModel.countDocuments({ approvalStatus: "PENDING_ADMIN_REVIEW" }),
      PaymentModel.countDocuments({ approvalStatus: "APPROVED" }),
      ProfileModel.countDocuments({ profileType: "BRIDE" }),
      ProfileModel.countDocuments({ profileType: "GROOM" }),
    ]);

    // Calculate percentages
    const profileApprovalRate = totalProfiles > 0 ? ((approvedProfiles / totalProfiles) * 100).toFixed(1) : "0";
    const interestAcceptanceRate = totalInterests > 0 ? ((acceptedInterests / totalInterests) * 100).toFixed(1) : "0";

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalProfiles,
        approvedProfiles,
        pendingProfiles,
        rejectedProfiles,
        totalInterests,
        acceptedInterests,
        pendingPayments,
        approvedPayments,
        brides,
        grooms,
        profileApprovalRate: parseFloat(profileApprovalRate),
        interestAcceptanceRate: parseFloat(interestAcceptanceRate),
      },
      charts: {
        userGrowth,
        genderDistribution,
        verificationStatus,
        profileStatusDistribution,
        paymentStatus,
        userStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
