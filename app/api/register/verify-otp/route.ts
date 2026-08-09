/**
 * POST /api/register/verify-otp
 *
 * Step 2 of the registration email-verification flow.
 * Verifies the 6-digit OTP the user entered.
 * On success:
 *   1. Deletes the PendingRegistration record
 *   2. Creates the UserModel — WITHOUT a Profile ID yet (autoPassword generated)
 *   3. Returns { ok: true, user: { email, autoPassword } } — the user logs in
 *      with their EMAIL until they finish their profile.
 *
 * The sequential Profile ID (and the credentials EMAIL) are only generated
 * once the user actually completes and saves their matrimony profile — see
 * updateMatrimonyProfileAction. Until then, `profileId` stays unset (the
 * field is a sparse unique index, so this is safe for multiple accounts).
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, PendingRegistrationModel } from "@/lib/models";
// UserModel imported for create only; no uniqueness guard on email (multiple accounts per email allowed)
import { verifyOtpSchema } from "@/lib/validators";
import { generatePassword } from "@/lib/profileIdGenerator";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email, otp } = parsed.data;

    await connectToDatabase();

    // Find the pending record
    const pending = await PendingRegistrationModel.findOne({ email }) as any;
    if (!pending) {
      return Response.json(
        { message: "OTP expired or not found. Please start registration again." },
        { status: 404 },
      );
    }

    // Check attempt limit
    if (pending.attempts >= MAX_ATTEMPTS) {
      // Delete the record so user must restart
      await PendingRegistrationModel.deleteOne({ email });
      return Response.json(
        { message: "Too many incorrect attempts. Please start registration again." },
        { status: 429 },
      );
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, pending.otpHash);
    if (!isValid) {
      const remaining = MAX_ATTEMPTS - (pending.attempts + 1);
      await PendingRegistrationModel.findOneAndUpdate(
        { email },
        { $inc: { attempts: 1 } },
      );
      return Response.json(
        { message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
        { status: 400 },
      );
    }

    // ── OTP correct — create the user account ────────────────────────────────

    // Generate credentials
    const submissionDate = new Date();
    const firstName      = (pending.name as string).split(" ")[0];
    const autoPassword   = generatePassword(pending.phone, submissionDate, firstName);
    const passwordHash   = await bcrypt.hash(autoPassword, 10);

    // Create user — no profileId yet (assigned once the profile is finalized).
    // autoPassword is NOT stored; it is returned once here and derivable again later.
    // Multiple accounts per email are allowed (email is a non-unique index).
    const user = await UserModel.create({
      name:        pending.name,
      email:       pending.email,
      phone:       pending.phone,
      passwordHash,
      profileType: pending.profileType,
      familyClass: pending.familyClass,
      religion:    pending.religion,
    });

    // Remove the pending record (fire-and-forget; TTL will also clean up)
    PendingRegistrationModel.deleteOne({ email }).catch(() => {});

    return Response.json({
      ok: true,
      user: {
        id:           String(user._id),
        name:         user.name,
        email:        user.email,
        autoPassword, // derived value, never stored in DB
      },
      message: "Registration successful! Save your credentials.",
    });
  } catch (error: any) {
    console.error("POST /api/register/verify-otp error:", error);
    // Surface duplicate-key issues clearly instead of a generic 500
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
