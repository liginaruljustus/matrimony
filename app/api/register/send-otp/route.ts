/**
 * POST /api/register/send-otp
 *
 * Step 1 of the registration email-verification flow.
 * Validates form data, enforces a resend cooldown, generates a 6-digit OTP,
 * stores it (bcrypt-hashed) in PendingRegistration, then emails it to the user.
 * Note: multiple accounts per email are allowed, so no duplicate-email check here.
 *
 * Rate limit: if a pending record was created < 5 min ago → 429 (resend cooldown).
 */
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { PendingRegistrationModel, UserModel } from "@/lib/models";
import { sendOtpSchema } from "@/lib/validators";

// Must match RESEND_COOLDOWN on the client (app/register/page.tsx)
const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const OTP_TTL_MS         = 10 * 60 * 1000; // OTP stays valid for 10 minutes

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

    // Resend cooldown: if a pending record was created < 5 min ago, don't spam
    const existingPending = await PendingRegistrationModel.findOne({ email }).lean() as any;
    if (existingPending) {
      const ageMs = Date.now() - new Date(existingPending.createdAt).getTime();
      if (ageMs < RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - ageMs) / 1000);
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        return Response.json(
          { message: `Please wait ${timeStr} before requesting a new OTP.` },
          { status: 429 },
        );
      }
    }

    // Generate 6-digit OTP
    const otp      = String(randomInt(100_000, 1_000_000));
    const otpHash  = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS); // OTP valid for 10 minutes

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
    from:    process.env.SMTP_FROM ?? "Lura Matrimony <no-reply@luramatrimony.com>",
    to:      email,
    subject: "Your Lura Matrimony verification code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">LURA</span>
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
          © ${new Date().getFullYear()} Lura Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Hi ${firstName},\n\nYour Lura Matrimony verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  });
}
