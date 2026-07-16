/**
 * POST /api/auth/forgot-password/send-otp
 *
 * Resend credentials flow (replaces OTP-based forgot-password).
 * User submits their Profile ID → system looks up the account,
 * recomputes the deterministic password, resets the hash, and
 * emails the credentials to the registered email address.
 *
 * Always returns { ok: true } to avoid leaking whether a Profile ID exists.
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import { generatePassword } from "@/lib/profileIdGenerator";

export async function POST(request: Request) {
  try {
    const body      = await request.json().catch(() => ({}));
    const profileId = (body.profileId ?? "").trim().toUpperCase();

    if (!profileId) {
      return Response.json({ message: "Enter your Profile ID." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ profileId }).lean() as any;
    if (!user) {
      // Don't reveal whether the Profile ID exists.
      return Response.json({ ok: true });
    }

    // Recompute the deterministic password and reset the hash.
    const firstName    = (user.name as string).split(" ")[0];
    const autoPassword = generatePassword(user.phone, new Date(user.createdAt), firstName);
    const passwordHash = await bcrypt.hash(autoPassword, 10);

    await UserModel.findByIdAndUpdate(user._id, { $set: { passwordHash } });

    // Fire-and-forget — don't block the response on email delivery.
    sendCredentialsEmail(user.email, user.name, user.profileId, autoPassword).catch((err) => {
      console.error("[Resend Credentials] Email failed:", err);
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("forgot-password/send-otp error:", error);
    return Response.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}

async function sendCredentialsEmail(
  email: string,
  name: string,
  profileId: string,
  autoPassword: string,
) {
  if (!process.env.SMTP_USER) {
    console.log(`[Resend Credentials] Gmail not configured — would send to ${email}: ${profileId} / ${autoPassword}`);
    return;
  }

  const nodemailer  = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const firstName = name.split(" ")[0];
  const loginUrl  = `${process.env.NEXTAUTH_URL ?? "https://luramatrimony.com"}/login`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? "Lura Matrimony <no-reply@luramatrimony.com>",
    to:      email,
    subject: "Lura Matrimony — Your Login Credentials",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">LURA</span>
          </div>
          <p style="margin-top:8px;color:#7a1f2b;font-size:14px;font-weight:600;">Matrimony Services</p>
        </div>

        <h2 style="color:#1a1a1a;font-size:22px;margin-bottom:4px;">Hi ${firstName},</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Your login credentials have been resent as requested. Use these to sign in.
        </p>

        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;">
          <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Profile ID</p>
          <p style="margin:0;font-family:monospace;font-size:20px;font-weight:bold;color:#1a1a1a;letter-spacing:2px;">${profileId}</p>
        </div>

        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Password</p>
          <p style="margin:0;font-family:monospace;font-size:28px;font-weight:bold;color:#1a1a1a;letter-spacing:6px;">${autoPassword}</p>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}" style="display:inline-block;background:#7a1f2b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:bold;">
            Sign In to Your Account
          </a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Lura Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Hi ${firstName},\n\nYour login credentials:\n\nProfile ID: ${profileId}\nPassword:   ${autoPassword}\n\nSign in at: ${loginUrl}\n\n© ${new Date().getFullYear()} Lura Matrimony`,
  });
}
