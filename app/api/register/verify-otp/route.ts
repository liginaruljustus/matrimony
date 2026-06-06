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

    // Guard against race condition: email may have been registered while OTP was pending
    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      await PendingRegistrationModel.deleteOne({ email });
      return Response.json(
        { message: "Email already registered. Please sign in." },
        { status: 409 },
      );
    }

    // Generate credentials
    const submissionDate = new Date();
    const firstName      = (pending.name as string).split(" ")[0];
    const autoPassword   = generatePassword(pending.phone, submissionDate, firstName);
    const passwordHash   = await bcrypt.hash(autoPassword, 10);
    const profileId      = await generateProfileId(
      pending.profileType === "BRIDE" ? "FEMALE" : "MALE",
      pending.religion ?? "OTHER",
      pending.familyClass,
    );

    // Create user
    const user = await UserModel.create({
      name:        pending.name,
      email:       pending.email,
      phone:       pending.phone,
      passwordHash,
      profileId,
      autoPassword,
      profileType: pending.profileType,
      familyClass: pending.familyClass,
    });

    // Remove the pending record (fire-and-forget; TTL will also clean up)
    PendingRegistrationModel.deleteOne({ email }).catch(() => {});

    // Email credentials (fire-and-forget)
    sendCredentialsEmail(email, pending.name, profileId, autoPassword).catch((err) => {
      console.error("[Credentials Email] Failed to send:", err);
    });

    return Response.json({
      ok: true,
      user: {
        id:           String(user._id),
        name:         user.name,
        email:        user.email,
        profileId:    user.profileId,
        autoPassword: user.autoPassword,
      },
      message: "Registration successful! Save your credentials.",
    });
  } catch (error) {
    console.error("POST /api/register/verify-otp error:", error);
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
  const loginUrl   = `${process.env.NEXTAUTH_URL ?? "https://reginmatrimony.com"}/login`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? "Regin Matrimony <no-reply@reginmatrimony.com>",
    to:      email,
    subject: "Welcome to Regin Matrimony — Your Login Credentials",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">REGIN</span>
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
          <p style="margin:8px 0 0;color:#888;font-size:12px;">Generated from your phone number, registration date &amp; name.</p>
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
          © ${new Date().getFullYear()} Regin Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Welcome to Regin Matrimony, ${firstName}!\n\nYour login credentials:\n\nProfile ID: ${profileId}\nPassword:   ${autoPassword}\n\nPlease save these securely. This password cannot be recovered.\n\nSign in at: ${loginUrl}\n\n© ${new Date().getFullYear()} Regin Matrimony`,
  });
}
