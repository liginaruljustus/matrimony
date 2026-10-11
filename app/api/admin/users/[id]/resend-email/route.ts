/**
 * POST /api/admin/users/[id]/resend-email
 * Body: { kind: "credentials" | "profileLive" }
 *
 * Admin re-sends one of the two automatic emails to a user and gets the
 * result back (it is also recorded on the user's emailLog).
 */
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel } from "@/lib/models";
import { generatePassword } from "@/lib/profileIdGenerator";
import { sendCredentialsEmail } from "@/lib/sendCredentialsEmail";
import { sendFDCardEmail } from "@/lib/sendFDCardEmail";
import { buildFDCard } from "@/lib/cardGenerator";
import { sendAndRecord } from "@/lib/emailLog";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { kind } = await req.json().catch(() => ({}));
    if (kind !== "credentials" && kind !== "profileLive") {
      return Response.json({ error: "kind must be credentials or profileLive" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await UserModel.findById(params.id).lean<any>();
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });
    if (!user.email) return Response.json({ error: "This user has no email address" }, { status: 400 });

    let sent: boolean;
    if (kind === "credentials") {
      // Same as "resend credentials": recompute the password and reset the hash,
      // so the emailed password is guaranteed to work.
      const firstName    = String(user.name ?? "").split(" ")[0];
      const autoPassword = generatePassword(user.phone, new Date(user.createdAt), firstName);
      await UserModel.updateOne({ _id: user._id }, { $set: { passwordHash: await bcrypt.hash(autoPassword, 10) } });
      sent = await sendAndRecord(user._id, "credentials", user.email, () =>
        sendCredentialsEmail(user.email, user.name, user.profileId, autoPassword),
      );
    } else {
      const profile = await ProfileModel.findOne({ userId: user._id }).lean<any>();
      if (!profile || profile.profileStatus !== "APPROVED") {
        return Response.json({ error: "This user's profile is not live yet" }, { status: 400 });
      }
      sent = await sendAndRecord(user._id, "profileLive", user.email, async () => {
        await sendFDCardEmail(user.email, user.name, buildFDCard(user, profile));
      });
    }

    const fresh = await UserModel.findById(user._id).select("emailLog").lean<any>();
    return Response.json({ ok: sent, emailLog: fresh?.emailLog ?? null });
  } catch (error) {
    console.error("POST resend-email error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
