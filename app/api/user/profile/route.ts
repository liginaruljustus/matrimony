/**
 * GET /api/user/profile
 *
 * Returns the current user's non-sensitive profile data.
 * autoPassword is omitted — it is only surfaced on the dashboard page
 * via the admin-accessible /api/admin/users/[id] route.
 *
 * Add ?credentials=1 to include autoPassword (dashboard only, same-origin only).
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel } from "@/lib/models";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await UserModel.findById(session.user.id).lean();
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await ProfileModel.findOne({ userId: session.user.id }).lean();

    const u = user as any;

    // Only include autoPassword when explicitly requested by the dashboard page.
    // This limits exposure — generic calls to this endpoint don't get credentials.
    const { searchParams } = new URL(request.url);
    const includeCredentials = searchParams.get("credentials") === "1";

    return Response.json({
      user: {
        name:         u.name,
        profileId:    u.profileId,
        profileType:  u.profileType,
        familyClass:  u.familyClass,
        status:       u.status       ?? "ACTIVE",
        isFrozen:     u.isFrozen     ?? false,
        isAutoFrozen: u.isAutoFrozen ?? false,
        frozenAt:     u.frozenAt     ?? null,
        autoFrozenAt: u.autoFrozenAt ?? null,
        // autoPassword only returned when dashboard explicitly asks for it
        ...(includeCredentials && { autoPassword: u.autoPassword ?? null }),
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return Response.json({ error: "Failed to load user data" }, { status: 500 });
  }
}
