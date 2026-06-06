/**
 * GET /api/profiles/search
 * Groom search — returns MD cards of BRIDE profiles only.
 *
 * Rules enforced:
 *  - Only BRIDE profiles (profileType = BRIDE)
 *  - Only APPROVED profiles (profileStatus = APPROVED)
 *  - Frozen / auto-frozen profiles hidden
 *  - Newly uploaded first (createdAt DESC)
 *  - Filters: profileId, minAge, maxAge, caste, district, familyClass, religion
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel } from "@/lib/models";
import { buildMDCard } from "@/lib/cardGenerator";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Block suspended / banned accounts from browsing
    const groomUser = await UserModel.findById(session.user.id).select("status").lean() as any;
    if (!groomUser || groomUser.status !== "ACTIVE") {
      return Response.json(
        { error: "Your account is not active. Contact support for assistance." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const familyClass     = searchParams.get("familyClass") ?? "";
    const profileIdFilter = searchParams.get("profileId")   ?? "";
    const minAge          = Number(searchParams.get("minAge") ?? 0);
    const maxAge          = Number(searchParams.get("maxAge") ?? 100);
    const caste           = searchParams.get("caste")         ?? "";
    const district        = searchParams.get("district")      ?? "";
    const nakshatra       = searchParams.get("nakshatra")     ?? "";
    const maritalStatus   = searchParams.get("maritalStatus") ?? "";
    const minHeight       = Number(searchParams.get("minHeight") ?? 0);
    const maxHeight       = Number(searchParams.get("maxHeight") ?? 0);
    const complexion      = searchParams.get("complexion")    ?? "";
    const page            = Number(searchParams.get("page") ?? 1);
    const limit           = 20;

    // Build profile query
    const profileQuery: any = {
      profileType:  "BRIDE",
      profileStatus:"APPROVED",
      isFrozen:     { $ne: true },
      isAutoFrozen: { $ne: true },
    };

    if (minAge || maxAge) {
      profileQuery.age = {};
      if (minAge) profileQuery.age.$gte = minAge;
      if (maxAge && maxAge < 100) profileQuery.age.$lte = maxAge;
    }
    if (caste)    profileQuery.caste = new RegExp(caste, "i");
    if (district) profileQuery.$or = [
      { nativeDistrict: new RegExp(district, "i") },
      { location:       new RegExp(district, "i") },
    ];
    // Religion is an explicit filter only — no auto-restrict by groom's religion
    const religionFilter = searchParams.get("religion") ?? "";
    if (religionFilter)  profileQuery.religion      = new RegExp(religionFilter, "i");
    if (familyClass)     profileQuery.familyClass   = familyClass;
    if (nakshatra)       profileQuery.nakshatra     = new RegExp(nakshatra, "i");
    if (maritalStatus)   profileQuery.maritalStatus = maritalStatus;
    if (complexion)      profileQuery.complexion    = new RegExp(complexion, "i");
    if (minHeight || maxHeight) {
      profileQuery.height = {};
      if (minHeight) profileQuery.height.$gte = minHeight;
      if (maxHeight) profileQuery.height.$lte = maxHeight;
    }

    // If searching by profile ID — find the user first
    if (profileIdFilter) {
      const matchedUser = await UserModel.findOne({ profileId: new RegExp(profileIdFilter, "i") }).lean() as any;
      if (matchedUser) {
        profileQuery.userId = matchedUser._id;
      } else {
        return Response.json({ profiles: [], total: 0 });
      }
    }

    const [profiles, total] = await Promise.all([
      ProfileModel.find(profileQuery)
        .sort({ createdAt: -1 }) // newest first
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProfileModel.countDocuments(profileQuery),
    ]);

    // Build MD cards
    const userIds = profiles.map((p: any) => p.userId);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean() as any[];
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

    // Filter out frozen users (double-check at user level)
    const mdCards = profiles
      .filter((p: any) => {
        const u = userMap[String(p.userId)];
        return u && !u.isFrozen && !u.isAutoFrozen;
      })
      .map((p: any) => {
        const u = userMap[String(p.userId)];
        return {
          _id:       String(p._id),
          userId:    String(p.userId),
          createdAt: p.createdAt,
          ...buildMDCard(u, p),
        };
      });

    return Response.json({ profiles: mdCards, total, page, limit });
  } catch (error) {
    console.error("Profile search error:", error);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
