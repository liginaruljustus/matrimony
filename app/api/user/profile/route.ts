/**
 * GET /api/user/profile
 *
 * Returns the current user's non-sensitive profile data.
 * Add ?credentials=1 to include the auto-generated password for dashboard display.
 * The password is derived on-demand from stored fields — never stored in plaintext.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel } from "@/lib/models";
import { generatePassword } from "@/lib/profileIdGenerator";

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

    const { searchParams } = new URL(request.url);
    const includeCredentials = searchParams.get("credentials") === "1";

    // Derive password on-demand from stored fields — never read from a stored plaintext field.
    let autoPassword: string | null = null;
    if (includeCredentials && u.phone && u.createdAt) {
      const firstName = (u.name as string).split(" ")[0];
      autoPassword = generatePassword(u.phone, new Date(u.createdAt), firstName);
    }

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
        ...(includeCredentials && { autoPassword }),
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return Response.json({ error: "Failed to load user data" }, { status: 500 });
  }
}
