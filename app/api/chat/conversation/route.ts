import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ConversationModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const otherUserId = String(body.otherUserId || "");
  if (!otherUserId) {
    return NextResponse.json({ message: "otherUserId is required" }, { status: 400 });
  }

  const selfId = toObjectId(session.user.id);
  const otherId = toObjectId(otherUserId);
  if (!selfId || !otherId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  const [a, b] = [String(selfId), String(otherId)].sort();
  await connectToDatabase();
  const conversation = await ConversationModel.findOneAndUpdate(
    { participantAId: toObjectId(a), participantBId: toObjectId(b) },
    { $setOnInsert: { participantAId: toObjectId(a), participantBId: toObjectId(b) } },
    { upsert: true, new: true },
  ).lean();

  return NextResponse.json({ conversation });
}
