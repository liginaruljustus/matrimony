import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { messageSchema } from "@/lib/validators";
import { connectToDatabase } from "@/lib/mongodb";
import { ConversationModel, MessageModel, ProfileModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  await connectToDatabase();

  // --- Messages for a specific conversation ---
  if (conversationId) {
    const convObjId = toObjectId(conversationId);
    if (!convObjId) return NextResponse.json({ message: "Invalid conversationId" }, { status: 400 });

    // Verify caller is a participant
    const conv = await ConversationModel.findOne({
      _id: convObjId,
      $or: [{ participantAId: userId }, { participantBId: userId }],
    }).lean();
    if (!conv) return NextResponse.json({ message: "Conversation not found" }, { status: 404 });

    const messages = await MessageModel.find({ conversationId: convObjId })
      .populate("senderId", "name")
      .sort({ createdAt: 1 })
      .lean<any[]>();

    const result = messages.map((m) => ({
      id: String(m._id),
      conversationId: String(m.conversationId),
      senderId: String(m.senderId?._id ?? m.senderId),
      senderName: String(m.senderId?.name ?? "Unknown"),
      body: m.body as string,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ messages: result });
  }

  // --- Conversation list with enriched data ---
  const conversations = await ConversationModel.find({
    $or: [{ participantAId: userId }, { participantBId: userId }],
  })
    .populate("participantAId", "name image")
    .populate("participantBId", "name image")
    .sort({ updatedAt: -1 })
    .lean<any[]>();

  if (conversations.length === 0) return NextResponse.json({ conversations: [] });

  // Last message per conversation — single aggregation query
  const convIds = conversations.map((c) => c._id);
  const lastMsgDocs = await MessageModel.aggregate([
    { $match: { conversationId: { $in: convIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        body: { $first: "$body" },
        createdAt: { $first: "$createdAt" },
        senderId: { $first: "$senderId" },
      },
    },
  ]);
  const lastMsgMap = Object.fromEntries(lastMsgDocs.map((m) => [String(m._id), m]));

  // Profile photos for other users — single batch query
  const otherUserObjIds = conversations
    .map((c) => {
      const aId = String(c.participantAId?._id ?? c.participantAId);
      const bId = String(c.participantBId?._id ?? c.participantBId);
      return toObjectId(aId === session.user.id ? bId : aId);
    })
    .filter(Boolean);

  const profiles = await ProfileModel.find({ userId: { $in: otherUserObjIds } })
    .select("userId photos")
    .lean<any[]>();
  const photoMap = Object.fromEntries(
    profiles.map((p) => [String(p.userId), (p.photos as string[])?.[0] ?? null]),
  );

  const result = conversations.map((c) => {
    const aId = String(c.participantAId?._id ?? c.participantAId);
    const bId = String(c.participantBId?._id ?? c.participantBId);
    const isA = aId === session.user.id;
    const otherId = isA ? bId : aId;
    const otherParticipant = isA ? c.participantBId : c.participantAId;
    const lastMsg = lastMsgMap[String(c._id)];

    return {
      id: String(c._id),
      updatedAt: c.updatedAt,
      otherUser: {
        id: otherId,
        name: String(otherParticipant?.name ?? "Unknown"),
        image: (otherParticipant?.image as string) ?? null,
        photo: photoMap[otherId] ?? null,
      },
      lastMessage: lastMsg
        ? {
            body: String(lastMsg.body),
            createdAt: lastMsg.createdAt,
            isOwn: String(lastMsg.senderId) === session.user.id,
          }
        : null,
    };
  });

  return NextResponse.json({ conversations: result });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid message payload" }, { status: 400 });
  }
  const senderId = toObjectId(session.user.id);
  const conversationId = toObjectId(parsed.data.conversationId);
  if (!senderId || !conversationId) return NextResponse.json({ message: "Invalid IDs" }, { status: 400 });

  await connectToDatabase();
  const message = await MessageModel.create({
    conversationId,
    senderId,
    body: parsed.data.body,
  });

  await ConversationModel.findByIdAndUpdate(conversationId, { $set: { updatedAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
