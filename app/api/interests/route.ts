import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { InterestModel, ProfileModel, NotificationModel, UserModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "received"; // received | sent | accepted

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });

  await connectToDatabase();

  let query: Record<string, unknown>;
  if (type === "sent") {
    query = { senderId: userId };
  } else if (type === "accepted") {
    query = { $or: [{ senderId: userId }, { receiverId: userId }], status: "ACCEPTED" };
  } else {
    query = { receiverId: userId, status: "PENDING" };
  }

  const interests = await InterestModel.find(query)
    .populate("senderId", "name")
    .populate("receiverId", "name")
    .sort({ createdAt: -1 })
    .lean<any[]>();

  // Determine the "other" user ID for each interest
  const otherUserIds = interests.map((interest) => {
    if (type === "sent") return String(interest.receiverId?._id ?? interest.receiverId);
    if (type === "received") return String(interest.senderId?._id ?? interest.senderId);
    // accepted: whichever side isn't me
    const sId = String(interest.senderId?._id ?? interest.senderId);
    return sId === session.user.id
      ? String(interest.receiverId?._id ?? interest.receiverId)
      : sId;
  });

  // Batch-fetch profiles for all other users in one query
  const otherObjectIds = otherUserIds.map(toObjectId).filter(Boolean);
  const profiles = await ProfileModel.find({ userId: { $in: otherObjectIds } })
    .select("userId age religion caste location photos")
    .lean<any[]>();
  const profileMap = Object.fromEntries(profiles.map((p) => [String(p.userId), p]));

  const enriched = interests.map((interest, i) => {
    const otherUserId = otherUserIds[i];

    let otherUserName: string;
    if (type === "sent") {
      otherUserName = String(interest.receiverId?.name ?? "Unknown");
    } else if (type === "received") {
      otherUserName = String(interest.senderId?.name ?? "Unknown");
    } else {
      const sId = String(interest.senderId?._id ?? interest.senderId);
      otherUserName =
        sId === session.user.id
          ? String(interest.receiverId?.name ?? "Unknown")
          : String(interest.senderId?.name ?? "Unknown");
    }

    const profile = profileMap[otherUserId];
    return {
      id: String(interest._id),
      status: interest.status as string,
      createdAt: interest.createdAt,
      otherUser: {
        id: otherUserId,
        name: otherUserName,
        age: (profile?.age as number) ?? null,
        religion: (profile?.religion as string) ?? null,
        caste: (profile?.caste as string) ?? null,
        location: (profile?.location as string) ?? null,
        photos: (profile?.photos as string[]) ?? [],
      },
    };
  });

  return NextResponse.json({ interests: enriched });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const receiverId = String(body.receiverId || "");
  if (!receiverId) {
    return NextResponse.json({ message: "receiverId is required" }, { status: 400 });
  }

  if (receiverId === session.user.id) {
    return NextResponse.json({ message: "Cannot send interest to self" }, { status: 400 });
  }
  const senderObjectId = toObjectId(session.user.id);
  const receiverObjectId = toObjectId(receiverId);
  if (!senderObjectId || !receiverObjectId) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }

  await connectToDatabase();
  const interest = await InterestModel.findOneAndUpdate(
    { senderId: senderObjectId, receiverId: receiverObjectId },
    { $set: { status: "PENDING" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  // Notify the bride (receiver) that a groom has expressed interest
  try {
    const senderUser = await UserModel.findById(session.user.id).select("name").lean() as any;
    await NotificationModel.create({
      userId:  receiverObjectId,
      type:    "INTEREST_RECEIVED",
      message: `${senderUser?.name ?? "A groom family"} has expressed interest in your profile.`,
      link:    "/bride-inbox",
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ interest });
}
