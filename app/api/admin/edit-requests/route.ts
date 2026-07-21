/**
 * GET /api/admin/edit-requests
 *
 * Admin queue of profile-unlock requests from users with a locked profile.
 * Query: ?status=PENDING|RESOLVED (default PENDING)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileEditRequestModel, UserModel, ProfileModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "PENDING";

    const requests = await ProfileEditRequestModel.find({ status })
      .sort({ createdAt: -1 })
      .lean() as any[];

    if (!requests.length) return Response.json({ requests: [] });

    const userIds = requests.map((r: any) => r.userId);
    const [users, profiles] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } }).select("name email profileId profileType").lean() as Promise<any[]>,
      ProfileModel.find({ userId: { $in: userIds } }).select("userId isLocked").lean() as Promise<any[]>,
    ]);
    const userMap    = Object.fromEntries(users.map((u: any) => [String(u._id), u]));
    const profileMap = Object.fromEntries(profiles.map((p: any) => [String(p.userId), p]));

    const enriched = requests.map((r: any) => {
      const u = userMap[String(r.userId)];
      const p = profileMap[String(r.userId)];
      return {
        id:         String(r._id),
        message:    r.message,
        status:     r.status,
        createdAt:  r.createdAt,
        resolvedAt: r.resolvedAt ?? null,
        isLocked:   p?.isLocked ?? false,
        user: u ? {
          id:        String(u._id),
          name:      u.name,
          email:     u.email,
          profileId: u.profileId,
          profileType: u.profileType,
        } : null,
      };
    });

    return Response.json({ requests: enriched });
  } catch (error) {
    console.error("GET /api/admin/edit-requests error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
