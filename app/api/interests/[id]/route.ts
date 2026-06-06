import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { InterestModel } from "@/lib/models";
import { toObjectId } from "@/lib/mongoUtils";

/** DELETE /api/interests/[id] — withdraw a pending interest (sender only) */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const interestId      = toObjectId(params.id);
  const senderObjectId  = toObjectId(session.user.id);
  if (!interestId || !senderObjectId) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  await connectToDatabase();

  const deleted = await InterestModel.findOneAndDelete({
    _id:      interestId,
    senderId: senderObjectId,
    status:   "PENDING", // can only withdraw pending interests
  }).lean();

  if (!deleted) {
    return NextResponse.json(
      { message: "Interest not found, not yours, or already actioned" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { action } = (await req.json()) as { action?: string };
  if (action !== "ACCEPT" && action !== "DECLINE") {
    return NextResponse.json({ message: "action must be ACCEPT or DECLINE" }, { status: 400 });
  }

  const interestId = toObjectId(params.id);
  const receiverObjectId = toObjectId(session.user.id);
  if (!interestId || !receiverObjectId) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }

  await connectToDatabase();

  const updated = await InterestModel.findOneAndUpdate(
    { _id: interestId, receiverId: receiverObjectId, status: "PENDING" },
    { $set: { status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED" } },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { message: "Interest not found, already actioned, or not yours to action" },
      { status: 404 },
    );
  }

  return NextResponse.json({ interest: updated });
}
