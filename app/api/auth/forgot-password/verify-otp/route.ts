/**
 * POST /api/auth/forgot-password/verify-otp
 *
 * Step 2 of the forgot-password flow.
 * Verifies the OTP and emails the user their existing autoPassword from the DB.
 *
 * Body: { email: string, otp: string }
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, PasswordOtpModel } from "@/lib/models";
import { generatePassword } from "@/lib/profileIdGenerator";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body  = await request.json().catch(() => ({}));
    const email = (body.email ?? "").trim().toLowerCase();
    const otp   = (body.otp   ?? "").trim();

    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return Response.json({ message: "Valid email and 6-digit code are required." }, { status: 400 });
    }

    await connectToDatabase();

    // Find the OTP record
    const record = await PasswordOtpModel.findOne({ email }) as any;
    if (!record) {
      return Response.json(
        { message: "Code expired or not found. Please request a new one." },
        { status: 404 },
      );
    }

    // Too many wrong guesses — delete record, force restart
    if (record.attempts >= MAX_ATTEMPTS) {
      await PasswordOtpModel.deleteOne({ email });
      return Response.json(
        { message: "Too many incorrect attempts. Please request a new code." },
        { status: 429 },
      );
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      await PasswordOtpModel.findOneAndUpdate({ email }, { $inc: { attempts: 1 } });
      return Response.json(
        { message: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
        { status: 400 },
      );
    }

    // ── OTP correct ──────────────────────────────────────────────────────────

    // Fetch the user
    const user = await UserModel.findOne({ email })
      .select("name autoPassword profileId phone createdAt")
      .lean() as any;

    if (!user) {
      await PasswordOtpModel.deleteOne({ email });
      return Response.json({ message: "Account not found." }, { status: 404 });
    }

    // Always generate a FRESH temporary password and reset passwordHash so the
    // sent password is guaranteed to work — even if the user had changed their password
    // previously (which clears autoPassword).
    let passwordToSend: string;
    try {
      const firstName = (user.name ?? "").split(" ")[0] || "User";
      // Prefer re-using the stored autoPassword if it still exists;
      // otherwise generate a new one based on the registration formula.
      const candidate = user.autoPassword
        ?? generatePassword(user.phone ?? email, new Date(user.createdAt ?? Date.now()), firstName);

      // Update both passwordHash and autoPassword so this password works for login
      const newHash = await bcrypt.hash(candidate, 10);
      await UserModel.findByIdAndUpdate(user._id, {
        $set: { autoPassword: candidate, passwordHash: newHash },
      });
      passwordToSend = candidate;
    } catch {
      return Response.json(
        { message: "Password could not be recovered. Please contact support." },
        { status: 422 },
      );
    }

    // Clean up the OTP record
    PasswordOtpModel.deleteOne({ email }).catch(() => {});

    // Email the resolved password (fire-and-forget)
    sendPasswordEmail(email, user.name, user.profileId, passwordToSend).catch((err) => {
      console.error("[Forgot PW] Failed to send password email:", err);
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("forgot-password/verify-otp error:", error);
    return Response.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}

// ── Email helper ─────────────────────────────────────────────────────────────
async function sendPasswordEmail(
  email: string,
  name: string,
  profileId: string,
  autoPassword: string,
) {
  if (!process.env.SMTP_USER) {
    console.log(`[Forgot PW] Gmail not configured. Password for ${email}: ${autoPassword}`);
    return;
  }

  const nodemailer  = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const firstName = (name ?? "there").split(" ")[0];
  const loginUrl  = `${process.env.NEXTAUTH_URL ?? "https://reginmatrimony.com"}/login`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? `Regin Matrimony <${process.env.SMTP_USER}>`,
    to:      email,
    subject: "Regin Matrimony — Your login credentials",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">REGIN</span>
          </div>
        </div>

        <h2 style="color:#1a1a1a;font-size:22px;margin-bottom:4px;">Hi ${firstName},</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Here are your login credentials as requested.
        </p>

        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;">
          <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Profile ID</p>
          <p style="margin:0;font-family:monospace;font-size:20px;font-weight:bold;color:#1a1a1a;letter-spacing:2px;">${profileId}</p>
        </div>

        <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Password</p>
          <p style="margin:0;font-family:monospace;font-size:32px;font-weight:bold;color:#1a1a1a;letter-spacing:8px;">${autoPassword}</p>
        </div>

        <div style="background:#fff8e1;border:1px solid #f9c74f;border-radius:10px;padding:14px;margin-bottom:24px;">
          <p style="margin:0;color:#7a6000;font-size:13px;">
            ⚠️ <strong>Keep this safe.</strong> Do not share your password with anyone.
          </p>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}" style="display:inline-block;background:#7a1f2b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:bold;">
            Sign In Now
          </a>
        </div>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Regin Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Hi ${firstName},\n\nYour login credentials:\n\nProfile ID: ${profileId}\nPassword:   ${autoPassword}\n\nSign in at: ${loginUrl}\n\nDo not share your password with anyone.`,
  });
}
