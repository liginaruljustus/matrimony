import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

// Calculate compatibility score between two profiles
function calculateMatchScore(userProfile: any, candidateProfile: any): number {
  let score = 0;

  // Religion match (20 points)
  if (userProfile.religion === candidateProfile.religion) {
    score += 20;
  } else {
    score += 5; // Small bonus for openness
  }

  // Caste/Community match (15 points)
  if (userProfile.caste === candidateProfile.caste) {
    score += 15;
  } else if (userProfile.religion === candidateProfile.religion) {
    score += 7; // Partial match if same religion
  }

  // Age compatibility (15 points) - both sides matter
  const ageDiff = Math.abs(userProfile.age - candidateProfile.age);
  if (ageDiff <= 2) {
    score += 15;
  } else if (ageDiff <= 5) {
    score += 10;
  } else if (ageDiff <= 8) {
    score += 5;
  }

  // Education level match (15 points)
  const educationLevels = ["High School", "Bachelor", "Master", "PhD"];
  const userEduIndex = educationLevels.indexOf(userProfile.education) || 1;
  const candEduIndex = educationLevels.indexOf(candidateProfile.education) || 1;
  const eduDiff = Math.abs(userEduIndex - candEduIndex);
  if (eduDiff === 0) {
    score += 15;
  } else if (eduDiff === 1) {
    score += 10;
  } else if (eduDiff === 2) {
    score += 5;
  }

  // Income compatibility (15 points)
  const incomeDiff = Math.abs(userProfile.income - candidateProfile.income);
  const avgIncome = (userProfile.income + candidateProfile.income) / 2;
  const incomeDiffPercent = (incomeDiff / avgIncome) * 100;

  if (incomeDiffPercent <= 20) {
    score += 15;
  } else if (incomeDiffPercent <= 50) {
    score += 10;
  } else if (incomeDiffPercent <= 100) {
    score += 5;
  }

  // Location proximity (20 points)
  if (userProfile.location.toLowerCase() === candidateProfile.location.toLowerCase()) {
    score += 20; // Same district
  } else {
    // Same state gets 10 points (simplified - assumes location is district)
    score += 8;
  }

  return Math.min(100, Math.max(0, score));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  await connectToDatabase();
  const userProfile = await ProfileModel.findOne({ userId }).lean<any>();

  if (!userProfile) {
    return NextResponse.json({ matches: [] });
  }

  // Get all other profiles
  const allProfiles = await ProfileModel.find({
    userId: { $ne: userId },
  })
    .populate("userId", "name image")
    .lean<any[]>();

  // Calculate scores and sort
  const matchedProfiles = allProfiles
    .map((profile) => {
      const matchScore = calculateMatchScore(userProfile, profile);
      return {
        matchScore,
        userId: String(profile.userId?._id || profile.userId),
        age: profile.age,
        religion: profile.religion,
        caste: profile.caste,
        location: profile.location,
        education: profile.education,
        income: profile.income,
        bio: profile.bio,
        photos: profile.photos ?? [],
        user: {
          id: String(profile.userId?._id || profile.userId),
          name: String(profile.userId?.name || "Unknown"),
          image: profile.userId?.image || null,
        },
      };
    })
    .filter((p) => p.matchScore >= 50) // Only show 50%+ matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20); // Limit to top 20

  return NextResponse.json({ matches: matchedProfiles });
}
