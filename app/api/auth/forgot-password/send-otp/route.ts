/**
 * POST /api/auth/forgot-password/send-otp
 *
 * Step 1 of the forgot-password flow.
 * Looks up the email, generates a 6-digit OTP, stores it hashed,
 * and emails it to the user.
 *
 * Rate limit: 60-second resend cooldown.
 * Security: returns the same response whether email exists or not
 *           (prevents user enumeration).
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, PasswordOtpModel } from "@/lib/models";

export async function POST(request: Request) {
  try {
    const body  = await request.json().catch(() => ({}));
    const email = (body.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ message: "Enter a valid email address." }, { status: 400 });
    }

    await connectToDatabase();

    // Check user exists
    const user = await UserModel.findOne({ email }).select("_id name").lean() as any;
    if (!user) {
      // Don't reveal whether the email is registered
      return Response.json({ ok: true });
    }

    // 60-second resend cooldown
    const existing = await PasswordOtpModel.findOne({ email }).lean() as any;
    if (existing) {
      const ageMs = Date.now() - new Date(existing.createdAt).getTime();
      if (ageMs < 60_000) {
        const wait = Math.ceil((60_000 - ageMs) / 1000);
        return Response.json(
          { message: `Please wait ${wait}s before requesting a new code.` },
          { status: 429 },
        );
      }
    }

    // Generate OTP
    const otp      = String(Math.floor(100_000 + Math.random() * 900_000));
    const otpHash  = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await PasswordOtpModel.findOneAndUpdate(
      { email },
      { otpHash, attempts: 0, expiresAt, createdAt: new Date() },
      { upsert: true, new: true },
    );

    await sendOtpEmail(email, user.name, otp);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("forgot-password/send-otp error:", error);
    return Response.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}

// ── Email helper ─────────────────────────────────────────────────────────────
async function sendOtpEmail(email: string, name: string, otp: string) {
  if (!process.env.SMTP_USER) {
    console.log(`[Forgot PW OTP] Gmail not configured. OTP for ${email}: ${otp}`);
    return;
  }

  const nodemailer  = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const firstName = (name ?? "there").split(" ")[0];

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? `Regin Matrimony <${process.env.SMTP_USER}>`,
    to:      email,
    subject: "Regin Matrimony — Password recovery code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">REGIN</span>
          </div>
        </div>

        <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:8px;">Hi ${firstName},</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
          We received a request to recover your password.
          Use the code below to verify your identity.
        </p>

        <div style="background:#fff;border:2px solid #d4af37;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:#7a1f2b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">
            Verification Code
          </p>
          <p style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1a1a1a;margin:0;font-family:monospace;">
            ${otp}
          </p>
          <p style="color:#999;font-size:12px;margin:12px 0 0;">Valid for 10 minutes</p>
        </div>

        <p style="color:#888;font-size:12px;line-height:1.6;">
          If you did not request this, you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Regin Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Hi ${firstName},\n\nYour password recovery code is: ${otp}\n\nValid for 10 minutes.\n\nIf you did not request this, ignore this email.`,
  });
}
