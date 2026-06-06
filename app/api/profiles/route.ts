/**
 * GET /api/profiles — legacy search endpoint (kept for backward compat).
 *
 * ⚠️  Prefer /api/profiles/search — it is the authoritative groom-facing search.
 *
 * Business rules enforced (mirrors /api/profiles/search):
 *  - APPROVED profiles only
 *  - No frozen / auto-frozen profiles
 *  - User account must be ACTIVE
 *  - No contact details returned
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const minAge   = Number(searchParams.get("minAge")  || 18);
  const maxAge   = Number(searchParams.get("maxAge")  || 60);
  const religion = searchParams.get("religion")  || undefined;
  const caste    = searchParams.get("caste")     || undefined;
  const location = searchParams.get("location")  || undefined;
  const education= searchParams.get("education") || undefined;
  const income   = Number(searchParams.get("income") || 0);

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  await connectToDatabase();

  // Build profile query with mandatory business-rule gates
  const query: Record<string, unknown> = {
    userId:        { $ne: userId },
    profileStatus: "APPROVED",          // approved only
    isFrozen:      { $ne: true },       // not manually frozen
    isAutoFrozen:  { $ne: true },       // not auto-frozen
    age: { $gte: minAge, $lte: maxAge },
  };
  if (religion)  query.religion  = { $regex: religion,  $options: "i" };
  if (caste)     query.caste     = { $regex: caste,     $options: "i" };
  if (location)  query.location  = { $regex: location,  $options: "i" };
  if (education) query.education = { $regex: education, $options: "i" };
  if (income > 0) query.income   = { $gte: income };

  const profiles = await ProfileModel.find(query)
    .sort({ createdAt: -1 })
    .populate("userId", "name image familyClass profileId status isFrozen isAutoFrozen")
    .lean<any[]>();

  // Post-filter: drop profiles whose user account is not ACTIVE or is frozen
  const result = profiles
    .filter((p) => {
      const u = p.userId;
      return (
        u &&
        (!u.status || u.status === "ACTIVE") &&
        !u.isFrozen &&
        !u.isAutoFrozen
      );
    })
    .map((p) => ({
      userId:    String(p.userId?._id || p.userId),
      age:       p.age,
      religion:  p.religion,
      caste:     p.caste,
      location:  p.location,
      education: p.education,
      // income intentionally included here (not a contact detail)
      income:    p.income,
      bio:       p.bio,
      photos:    p.photos ?? [],
      user: {
        id:   String(p.userId?._id || p.userId),
        name: String(p.userId?.name || "Unknown"),
        image:p.userId?.image || null,
      },
      // contact fields intentionally excluded
    }));

  return NextResponse.json({ profiles: result });
}
