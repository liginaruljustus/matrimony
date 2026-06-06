/**
 * GET  /api/profiles/[id]  — public profile detail (MD-level only, no contact data)
 * DELETE /api/profiles/[id] — owner deletes their own profile
 *
 * Security rules:
 *  - Only APPROVED profiles visible (not DRAFT / REJECTED / FLAGGED / PENDING)
 *  - Frozen / auto-frozen profiles return 404 (same as not found — no leak)
 *  - Contact fields (phone, whatsApp, contactPerson) are NEVER returned here;
 *    those are behind the 2nd-payment gate at /api/contact-details
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const userId = toObjectId(params.id);
  if (!userId) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

  const profile = await ProfileModel.findOne({ userId })
    .populate("userId", "name image familyClass profileId profileType isFrozen isAutoFrozen status")
    .lean<any>();

  if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

  // ── Business-rule gates ────────────────────────────────────────────────────

  // Only show APPROVED profiles (unless the owner is viewing their own)
  const isOwn = session.user.id === String(profile.userId?._id ?? profile.userId);
  if (!isOwn && profile.profileStatus !== "APPROVED") {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  // Hide frozen profiles from non-owners
  const userFrozen    = !!(profile.userId?.isFrozen || profile.userId?.isAutoFrozen);
  const profileFrozen = !!(profile.isFrozen || profile.isAutoFrozen);
  if (!isOwn && (userFrozen || profileFrozen)) {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  // Block access if the user's account is not active
  if (!isOwn && profile.userId?.status && profile.userId.status !== "ACTIVE") {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  // ── Response — MD-level fields only, NO contact details ───────────────────
  return NextResponse.json({
    profile: {
      id:           String(profile._id),
      userId:       String(profile.userId?._id ?? profile.userId),
      profileId:    profile.userId?.profileId ?? null,
      profileType:  profile.profileType ?? profile.userId?.profileType ?? null,
      profileStatus:profile.profileStatus,
      familyClass:  profile.familyClass ?? profile.userId?.familyClass ?? "MC",
      // Personal
      age:          profile.age,
      religion:     profile.religion,
      caste:        profile.caste,
      subCaste:     profile.subCaste ?? null,
      maritalStatus:profile.maritalStatus ?? null,
      height:       profile.height ?? null,
      complexion:   profile.complexion ?? null,
      // Location
      location:     profile.location ?? null,
      nativeDistrict: profile.nativeDistrict ?? null,
      // Astrology
      nakshatra:    profile.nakshatra ?? null,
      rashi:        profile.rashi ?? null,
      // Education & career
      education:    profile.education,
      currentJob:   profile.currentJob ?? null,
      // Content
      bio:          profile.bio ?? null,
      photos:       profile.photos ?? [],
      // Freeze indicator for the detail page banner
      isFrozen:     userFrozen || profileFrozen,
      isAutoFrozen: !!(profile.userId?.isAutoFrozen || profile.isAutoFrozen),
      // User info
      user: {
        id:          String(profile.userId?._id ?? profile.userId),
        name:        String(profile.userId?.name ?? "Unknown"),
        image:       profile.userId?.image ?? null,
        familyClass: profile.userId?.familyClass ?? "MC",
      },
      // ── INTENTIONALLY OMITTED — gated behind 2nd payment: ──────────────────
      // contactPersonName, contactNumber, whatsappNo
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Only the profile owner can delete it
  if (session.user.id !== params.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const userId = toObjectId(params.id);
  if (!userId) return NextResponse.json({ message: "Invalid ID" }, { status: 400 });

  const deleted = await ProfileModel.findOneAndDelete({ userId });
  if (!deleted) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

  return NextResponse.json({ message: "Profile deleted" });
}
