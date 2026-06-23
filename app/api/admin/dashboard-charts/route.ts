export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, PaymentModel } from "@/lib/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo  = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [userGrowth, profileStatus, genderRatio, religionBreakdown, monthlyPayments] =
    await Promise.all([
      // Daily registrations for last 30 days
      UserModel.aggregate([
        { $match: { role: "USER", createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" },
                },
              },
            },
            count: 1,
          },
        },
      ]),

      // Profile status distribution
      ProfileModel.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$profileStatus", "DRAFT"] },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),

      // Gender ratio (profileType BRIDE / GROOM from Profile)
      ProfileModel.aggregate([
        { $match: { profileType: { $in: ["BRIDE", "GROOM"] } } },
        { $group: { _id: "$profileType", count: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", count: 1 } },
      ]),

      // Religion breakdown from Profile
      ProfileModel.aggregate([
        { $match: { religion: { $ne: null } } },
        { $group: { _id: "$religion", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, religion: "$_id", count: 1 } },
      ]),

      // Monthly payments (approved + pending) for last 6 months
      PaymentModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year:  { $year:  "$createdAt" },
              month: { $month: "$createdAt" },
              status: "$approvalStatus",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

  // Normalise monthlyPayments into [{ month: "Jan", approved: N, pending: N }]
  const monthMap: Record<string, { month: string; approved: number; pending: number }> = {};
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (const row of monthlyPayments as any[]) {
    const key  = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const name = monthNames[row._id.month - 1];
    if (!monthMap[key]) monthMap[key] = { month: name, approved: 0, pending: 0 };
    if (row._id.status === "APPROVED")             monthMap[key].approved += row.count;
    if (row._id.status === "PENDING_ADMIN_REVIEW") monthMap[key].pending  += row.count;
  }
  const paymentsChart = Object.values(monthMap);

  return Response.json({
    userGrowth,
    profileStatus,
    genderRatio,
    religionBreakdown,
    paymentsChart,
  });
}
