import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, PaymentModel, ReportModel, ProfileEditRequestModel } from "@/lib/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newUsers, pendingProfiles, pendingVerification, openReports, pendingPayments, pendingEditRequests] =
    await Promise.all([
      UserModel.countDocuments({ role: "USER", createdAt: { $gte: sevenDaysAgo } }),
      ProfileModel.countDocuments({ profileStatus: "PENDING_APPROVAL" }),
      UserModel.countDocuments({ role: "USER", verificationStatus: "UNVERIFIED" }),
      ReportModel.countDocuments({ status: { $in: ["OPEN", "INVESTIGATING"] } }),
      PaymentModel.countDocuments({ approvalStatus: "PENDING_ADMIN_REVIEW" }),
      ProfileEditRequestModel.countDocuments({ status: "PENDING" }),
    ]);

  return Response.json({ newUsers, pendingProfiles, pendingVerification, openReports, pendingPayments, pendingEditRequests });
}
