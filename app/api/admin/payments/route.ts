/**
 * GET /api/admin/payments
 *
 * List all payments for admin review.
 * Query: ?tab=pending|approved|rejected&page=1
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { PaymentModel, UserModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const tab   = searchParams.get("tab") ?? "pending";
    const page  = Number(searchParams.get("page") ?? 1);
    const limit = 20;

    const query: Record<string, any> = {};
    if (tab === "pending")  query.approvalStatus = "PENDING_ADMIN_REVIEW";
    if (tab === "approved") query.approvalStatus = "APPROVED";
    if (tab === "rejected") query.approvalStatus = "REJECTED";

    const [payments, total, totalPending, revenueAgg] = await Promise.all([
      PaymentModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean() as Promise<any[]>,
      PaymentModel.countDocuments(query),
      PaymentModel.countDocuments({ approvalStatus: "PENDING_ADMIN_REVIEW" }),
      // All-time approved revenue — independent of which tab/page is being viewed
      PaymentModel.aggregate([
        { $match: { approvalStatus: "APPROVED" } },
        {
          $group: {
            _id: null,
            totalRevenue:   { $sum: "$amount" },
            count:          { $sum: 1 },
            autoApproved:   { $sum: { $cond: ["$autoApproved", 1, 0] } },
            firstPayment:   { $sum: { $cond: [{ $eq: ["$tier", "FIRST_PAYMENT"] },  "$amount", 0] } },
            secondPayment:  { $sum: { $cond: [{ $eq: ["$tier", "SECOND_PAYMENT"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    const revenue = revenueAgg[0] ?? { totalRevenue: 0, count: 0, autoApproved: 0, firstPayment: 0, secondPayment: 0 };

    // Enrich with payer info
    const payerIds    = payments.map((p: any) => p.userId);
    const receiverIds = payments.flatMap((p: any) => p.receiverIds ?? (p.receiverId ? [p.receiverId] : []));
    const allUserIds  = Array.from(new Set([...payerIds, ...receiverIds].map(String)));
    const users       = await UserModel.find({ _id: { $in: allUserIds } })
      .select("name email profileId familyClass")
      .lean() as any[];
    const userMap     = Object.fromEntries(users.map((u: any) => [String(u._id), u]));

    const enriched = payments.map((p: any) => {
      const payer     = userMap[String(p.userId)];
      const receivers = (p.receiverIds ?? (p.receiverId ? [p.receiverId] : [])).map((rid: any) => {
        const u = userMap[String(rid)];
        return u ? { id: String(u._id), name: u.name, profileId: u.profileId, familyClass: u.familyClass } : null;
      }).filter(Boolean);

      return {
        id:              String(p._id),
        amount:          p.amount,
        tier:            p.tier,
        transactionId:   p.transactionId,
        paymentMethod:   p.paymentMethod,
        approvalStatus:  p.approvalStatus,
        status:          p.status,
        createdAt:       p.createdAt,
        approvedAt:      p.approvedAt,
        autoApproved:    p.autoApproved ?? false,
        rejectionReason: p.rejectionReason,
        payer: payer
          ? { id: String(payer._id), name: payer.name, email: payer.email, profileId: payer.profileId }
          : null,
        receivers,
        profileCount: receivers.length,
      };
    });

    return Response.json({
      payments: enriched,
      total,
      totalPending,
      page,
      limit,
      revenue: {
        total:          revenue.totalRevenue,
        count:          revenue.count,
        autoApproved:   revenue.autoApproved,
        manualApproved: revenue.count - revenue.autoApproved,
        firstPayment:   revenue.firstPayment,
        secondPayment:  revenue.secondPayment,
      },
    });
  } catch (error) {
    console.error("Admin payments GET error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
