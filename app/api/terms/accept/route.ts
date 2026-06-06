import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, TermsModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = toObjectId(session.user.id);
    if (!userId) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const now = new Date();

    // Update user terms accepted date
    await UserModel.findByIdAndUpdate(userId, { termsAcceptedAt: now });

    // Create terms record
    await TermsModel.findOneAndUpdate(
      { userId },
      { userId, version: "1.0", acceptedAt: now },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { message: "Terms accepted successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
