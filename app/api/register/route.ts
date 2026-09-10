/**
 * POST /api/register
 *
 * Creates the account immediately — no OTP/email-verification step.
 * Assigns a real sequential Profile ID and a deterministic password right
 * away, emails both to the registered address, and returns them so the
 * client can auto-sign-in. Login is by Profile ID + password from here on
 * (email + password sign-in is reserved for admins).
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import { sendOtpSchema } from "@/lib/validators";
import { generateProfileId, generatePassword } from "@/lib/profileIdGenerator";
import { sendCredentialsEmail } from "@/lib/sendCredentialsEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, phone, profileType, familyClass, religion } = parsed.data;
    // Unknown keys are stripped by Zod — read the confirmation flag from the raw body
    const confirmDuplicate = body?.confirmDuplicate === true;

    await connectToDatabase();

    // Multiple accounts per email are allowed, but it must be an intentional
    // choice — if the email already has account(s) and the user hasn't
    // confirmed, ask the frontend to show a confirmation prompt first.
    if (!confirmDuplicate) {
      const existingCount = await UserModel.countDocuments({ email });
      if (existingCount > 0) {
        return Response.json(
          {
            requiresConfirmation: true,
            existingCount,
            message: `You already have ${existingCount} profile${existingCount > 1 ? "s" : ""} registered with this email.`,
          },
          { status: 409 },
        );
      }
    }

    const submissionDate = new Date();
    const firstName      = name.split(" ")[0];
    const autoPassword   = generatePassword(phone, submissionDate, firstName);
    const passwordHash   = await bcrypt.hash(autoPassword, 10);
    const genderForId    = profileType === "BRIDE" ? "FEMALE" : "MALE";

    // Assign the sequential Profile ID — retry on the rare atomic-counter
    // collision (two concurrent registrations landing on the same sequence).
    let user: any = null;
    let profileId = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      profileId = await generateProfileId(genderForId, religion, familyClass);
      try {
        user = await UserModel.create({
          name, email, phone,
          passwordHash, profileId, profileType, familyClass, religion,
        });
        break;
      } catch (createErr: any) {
        if (createErr?.code === 11000 && createErr?.keyPattern?.profileId) {
          console.warn(`[register] profileId collision (${profileId}), retrying…`);
          continue;
        }
        throw createErr;
      }
    }

    if (!user) {
      return Response.json(
        { message: "Could not generate a unique profile ID. Please try again." },
        { status: 409 },
      );
    }

    // Awaited (not fire-and-forget) — a detached promise can be killed
    // before it completes once this serverless function's response is sent.
    try {
      await sendCredentialsEmail(user.email, user.name, user.profileId, autoPassword);
    } catch (err) {
      console.error("[register] Credentials email failed:", err);
    }

    return Response.json({
      ok: true,
      user: {
        id:           String(user._id),
        name:         user.name,
        email:        user.email,
        profileId:    user.profileId,
        autoPassword, // derived value, never stored in DB
      },
      message: "Registration successful! Save your credentials.",
    });
  } catch (error: any) {
    console.error("POST /api/register error:", error);
    if (error?.code === 11000) {
      const field = Object.keys(error?.keyPattern ?? {})[0] ?? "value";
      return Response.json(
        { message: `Registration failed — duplicate ${field}. Please try again or contact support.` },
        { status: 409 },
      );
    }
    return Response.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}
