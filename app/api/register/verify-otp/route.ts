/**
 * POST /api/register/verify-otp
 *
 * Step 2 of the registration email-verification flow.
 * Verifies the 6-digit OTP the user entered.
 * On success:
 *   1. Deletes the PendingRegistration record
 *   2. Creates the UserModel (profileId + autoPassword generated)
 *   3. Emails the credentials to the verified address
 *   4. Returns { ok: true, user: { profileId, autoPassword } }
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, PendingRegistrationModel } from "@/lib/models";
// UserModel imported for create only; no uniqueness guard on email (multiple accounts per email allowed)
import { verifyOtpSchema } from "@/lib/validators";
import { generateProfileId, generatePassword } from "@/lib/profileIdGenerator";

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

    // Create user — autoPassword is NOT stored; it is returned once here and emailed.
    // Multiple accounts per email are allowed (email is a non-unique index).
    // profileId is unique; on the rare atomic-counter collision, retry with a fresh id.
    let user: any = null;
    let profileId = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      profileId = await generateProfileId(
        pending.profileType === "BRIDE" ? "FEMALE" : "MALE",
        pending.religion ?? "OTHER",
        pending.familyClass,
      );
      try {
        user = await UserModel.create({
          name:        pending.name,
          email:       pending.email,
          phone:       pending.phone,
          passwordHash,
          profileId,
          profileType: pending.profileType,
          familyClass: pending.familyClass,
        });
        break; // success
      } catch (createErr: any) {
        // Duplicate profileId → get a new sequence and retry
        if (createErr?.code === 11000 && createErr?.keyPattern?.profileId) {
          console.warn(`[verify-otp] profileId collision (${profileId}), retrying…`);
          continue;
        }
        throw createErr; // any other error bubbles to the outer handler
      }
    }

    if (!user) {
      return Response.json(
        { message: "Could not generate a unique profile ID. Please try again." },
        { status: 409 },
      );
    }

    // Remove the pending record (fire-and-forget; TTL will also clean up)
    PendingRegistrationModel.deleteOne({ email }).catch(() => {});

    // Email credentials
    try {
      await sendCredentialsEmail(email, pending.name, profileId, autoPassword);
    } catch (err) {
      console.error("[Credentials Email] Failed to send:", err);
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

// ── Credentials email helper ────────────────────────────────────────────────
async function sendCredentialsEmail(
  email: string,
  name: string,
  profileId: string,
  autoPassword: string,
) {
  if (!process.env.SMTP_USER) {
    console.log(`[Credentials Email] Gmail not configured — skipping email to ${email}`);
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const firstName  = name.split(" ")[0];
  const loginUrl   = `${process.env.NEXTAUTH_URL ?? "https://luramatrimony.com"}/login`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? "Lura Matrimony <no-reply@luramatrimony.com>",
    to:      email,
    subject: "Welcome to Lura Matrimony — Your Login Credentials",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">LURA</span>
          </div>
          <p style="margin-top:8px;color:#7a1f2b;font-size:14px;font-weight:600;">Matrimony Services</p>
        </div>

        <h2 style="color:#1a1a1a;font-size:22px;margin-bottom:4px;">Welcome, ${firstName}! 🎉</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Your account has been created successfully. Keep these credentials safe —
          you'll need them every time you sign in.
        </p>

        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;">
          <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Profile ID</p>
          <p style="margin:0;font-family:monospace;font-size:20px;font-weight:bold;color:#1a1a1a;letter-spacing:2px;">${profileId}</p>
        </div>

        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Auto-Generated Password</p>
          <p style="margin:0;font-family:monospace;font-size:28px;font-weight:bold;color:#1a1a1a;letter-spacing:6px;">${autoPassword}</p>
        </div>

        <div style="background:#fff8e1;border:1px solid #f9c74f;border-radius:10px;padding:14px;margin-bottom:24px;">
          <p style="margin:0;color:#7a6000;font-size:13px;">
            ⚠️ <strong>Please save these credentials securely.</strong>
            This password cannot be recovered — keep a copy somewhere safe.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}" style="display:inline-block;background:#7a1f2b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:bold;">
            Sign In to Your Account
          </a>
        </div>

        <p style="color:#888;font-size:12px;line-height:1.6;">
          After signing in, complete your profile to appear in search results.
          Our admin team will review and approve your profile before it goes live.
        </p>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Lura Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Welcome to Lura Matrimony, ${firstName}!\n\nYour login credentials:\n\nProfile ID: ${profileId}\nPassword:   ${autoPassword}\n\nPlease save these securely. This password cannot be recovered.\n\nSign in at: ${loginUrl}\n\n© ${new Date().getFullYear()} Lura Matrimony`,
  });
}
