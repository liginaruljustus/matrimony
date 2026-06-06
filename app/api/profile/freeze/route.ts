/**
 * POST /api/profile/freeze   — freeze own profile (password required)
 * POST /api/profile/unfreeze — unfreeze own profile (password required)
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, password } = await req.json();
    if (!["freeze", "unfreeze"].includes(action)) {
      return Response.json({ error: "action must be freeze or unfreeze" }, { status: 400 });
    }
    if (!password) {
      return Response.json({ error: "Password is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findById(session.user.id) as any;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Incorrect password" }, { status: 403 });
    }

    if (action === "freeze") {
      if (user.isFrozen) {
        return Response.json({ error: "Profile is already frozen" }, { status: 400 });
      }
      await UserModel.findByIdAndUpdate(session.user.id, {
        $set: {
          isFrozen:    true,
          frozenAt:    new Date(),
          frozenReason: "User requested freeze",
          frozenBy:    session.user.id,
          isAutoFrozen: false,
        },
      });
      await ProfileModel.findOneAndUpdate({ userId: session.user.id }, {
        $set: { isFrozen: true, frozenAt: new Date() },
      });
      return Response.json({ ok: true, message: "Profile frozen successfully" });
    }

    // Unfreeze
    if (!user.isFrozen && !user.isAutoFrozen) {
      return Response.json({ error: "Profile is not frozen" }, { status: 400 });
    }

    // Auto-frozen profiles can only be unfrozen within 90 days
    if (user.isAutoFrozen && user.autoFrozenAt) {
      const daysSinceFrozen = Math.floor(
        (Date.now() - new Date(user.autoFrozenAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceFrozen > 90) {
        return Response.json({
          error: "Auto-frozen account can only be unfrozen within 90 days of freezing",
        }, { status: 400 });
      }
    }

    await UserModel.findByIdAndUpdate(session.user.id, {
      $set: {
        isFrozen:     false,
        isAutoFrozen: false,
        frozenAt:     null,
        autoFrozenAt: null,
        frozenReason: null,
        frozenBy:     null,
        lastActivity: new Date(),
      },
    });
    await ProfileModel.findOneAndUpdate({ userId: session.user.id }, {
      $set: { isFrozen: false, frozenAt: null, isAutoFrozen: false },
    });

    return Response.json({ ok: true, message: "Profile unfrozen successfully" });
  } catch (error) {
    console.error("Freeze error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
