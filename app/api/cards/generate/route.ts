/**
 * POST /api/cards/generate
 * Called by admin when approving a profile.
 * Marks all 4 card types as generated on the profile.
 * Body: { profileId: string }   (the profile's _id in MongoDB)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProfileModel, UserModel } from "@/lib/models";
import { buildMDCard, buildADCard, buildCDCard, buildFDCard } from "@/lib/cardGenerator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return Response.json({ error: "profileId required" }, { status: 400 });
    }

    await connectToDatabase();

    const profile = await ProfileModel.findById(profileId).lean() as any;
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const user = await UserModel.findById(profile.userId).lean() as any;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Build all 4 cards
    const cards = {
      MD: buildMDCard(user, profile),
      AD: buildADCard(user, profile),
      CD: buildCDCard(user, profile),
      FD: buildFDCard(user, profile),
    };

    // Mark cards as generated on profile
    await ProfileModel.findByIdAndUpdate(profileId, {
      $set: {
        "generatedCards.MD": true,
        "generatedCards.AD": true,
        "generatedCards.CD": true,
        "generatedCards.FD": true,
        cardsGeneratedAt: new Date(),
        profileStatus: "APPROVED",
      },
    });

    return Response.json({
      ok: true,
      message: "All 4 cards generated successfully",
      cards,
    });
  } catch (error) {
    console.error("Card generation error:", error);
    return Response.json({ error: "Failed to generate cards" }, { status: 500 });
  }
}
