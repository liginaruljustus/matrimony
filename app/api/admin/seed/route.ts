/**
 * POST /api/admin/seed
 *
 * One-time endpoint to create the first admin account.
 * Protected by SEED_SECRET env var — if not set, it is DISABLED.
 *
 * Usage:
 *   curl -X POST https://your-domain.com/api/admin/seed \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"YOUR_SEED_SECRET","email":"admin@test.com","password":"Test@12345","name":"Admin"}'
 *
 * After the first admin is created this endpoint becomes a no-op
 * (returns 409) so it is safe to leave deployed.
 */
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const seedSecret = process.env.SEED_SECRET;
    if (!seedSecret) {
      return Response.json(
        { error: "Seed endpoint is disabled. Set SEED_SECRET env var to enable." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { secret, email, password, name } = body;

    if (secret !== seedSecret) {
      return Response.json({ error: "Invalid secret" }, { status: 401 });
    }
    if (!email || !password || !name) {
      return Response.json(
        { error: "email, password, and name are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Block if an admin already exists
    const existingAdmin = await UserModel.findOne({ role: "ADMIN" }).lean();
    if (existingAdmin) {
      return Response.json(
        { error: "An admin account already exists. Use that account to manage the platform." },
        { status: 409 },
      );
    }

    // Also block if the email is already taken
    const existingEmail = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existingEmail) {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await UserModel.create({
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      passwordHash,
      role:         "ADMIN",
      status:       "ACTIVE",
      autoPassword: password, // store plain-text for dashboard display (admin-only)
    });

    return Response.json({
      ok:      true,
      message: "Admin account created successfully.",
      id:      String(admin._id),
      email:   admin.email,
      role:    admin.role,
    });
  } catch (err) {
    console.error("POST /api/admin/seed error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
