/**
 * POST /api/register/send-otp
 *
 * Step 1 of the registration email-verification flow.
 * Validates form data, checks for duplicate email, generates a 6-digit OTP,
 * stores it (bcrypt-hashed) in PendingRegistration, then emails it to the user.
 *
 * Rate limit: if a pending record was created < 60 s ago → 429 (resend cooldown).
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, PendingRegistrationModel } from "@/lib/models";
import { sendOtpSchema } from "@/lib/validators";

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

    await connectToDatabase();

    // Check if email already registered
    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      return Response.json({ message: "Email already registered. Please sign in." }, { status: 409 });
    }

    // Resend cooldown: if a pending record was created < 60 s ago, don't spam
    const existingPending = await PendingRegistrationModel.findOne({ email }).lean() as any;
    if (existingPending) {
      const ageMs = Date.now() - new Date(existingPending.createdAt).getTime();
      if (ageMs < 60_000) {
        const secondsLeft = Math.ceil((60_000 - ageMs) / 1000);
        return Response.json(
          { message: `Please wait ${secondsLeft}s before requesting a new OTP.` },
          { status: 429 },
        );
      }
    }

    // Generate 6-digit OTP
    const otp      = String(Math.floor(100_000 + Math.random() * 900_000));
    const otpHash  = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert PendingRegistration (replace any previous record for this email)
    await PendingRegistrationModel.findOneAndUpdate(
      { email },
      {
        name, phone, profileType, familyClass, religion,
        otpHash,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Send OTP email
    await sendOtpEmail(email, name, otp);

    return Response.json({ ok: true, email });
  } catch (error) {
    console.error("POST /api/register/send-otp error:", error);
    return Response.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}

// ── Email helper ────────────────────────────────────────────────────────────
async function sendOtpEmail(email: string, name: string, otp: string) {
  if (!process.env.SMTP_USER) {
    // Dev fallback: log OTP to server console
    console.log(`[OTP Email] Gmail not configured. OTP for ${email}: ${otp}`);
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

  const firstName = name.split(" ")[0];

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? "Regin Matrimony <no-reply@reginmatrimony.com>",
    to:      email,
    subject: "Your Regin Matrimony verification code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">REGIN</span>
          </div>
          <p style="margin-top:8px;color:#7a1f2b;font-size:14px;font-weight:600;">Matrimony Services</p>
        </div>

        <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:8px;">Hi ${firstName},</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Use the verification code below to confirm your email address and complete your registration.
        </p>

        <div style="background:#fff;border:2px solid #d4af37;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:#7a1f2b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your OTP</p>
          <p style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1a1a1a;margin:0;font-family:monospace;">
            ${otp}
          </p>
          <p style="color:#999;font-size:12px;margin:12px 0 0;">Valid for 10 minutes</p>
        </div>

        <p style="color:#888;font-size:12px;line-height:1.6;">
          If you did not request this code, you can safely ignore this email.
          Do not share this code with anyone.
        </p>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Regin Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Hi ${firstName},\n\nYour Regin Matrimony verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  });
}
