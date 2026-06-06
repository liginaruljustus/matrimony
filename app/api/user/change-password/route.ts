/**
 * POST /api/user/change-password
 * Allows an authenticated user to change their password by verifying the current one.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Both current and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return Response.json({ error: "New password must be different from the current password" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findById(session.user.id).select("passwordHash").lean() as any;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await UserModel.findByIdAndUpdate(session.user.id, {
      $set: { passwordHash: hashed, autoPassword: null }, // clear auto-password once user sets their own
    });

    return Response.json({ ok: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("POST /api/user/change-password error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
