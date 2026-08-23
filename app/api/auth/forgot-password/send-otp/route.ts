/**
 * POST /api/auth/forgot-password/send-otp
 *
 * Resend credentials flow (replaces OTP-based forgot-password).
 * User submits their Profile ID OR their registered email:
 *   - Profile ID → looks up that one account.
 *   - Email      → looks up every account under that email which hasn't
 *                  finished/saved its profile yet (no Profile ID assigned).
 *                  This covers users who registered multiple profiles under
 *                  one email and lost track of the password for one of them
 *                  — completed profiles must still use their Profile ID,
 *                  since that's their permanent identifier once assigned.
 * For each matched account, recomputes the deterministic password, resets
 * the hash, and emails the credentials to the registered email address.
 *
 * Always returns { ok: true } to avoid leaking whether an account exists.
 */
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import { generatePassword } from "@/lib/profileIdGenerator";
import { sendMailWithRetry } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body       = await request.json().catch(() => ({}));
    const identifier = (body.profileId ?? "").trim();

    if (!identifier) {
      return Response.json({ message: "Enter your Profile ID or email." }, { status: 400 });
    }

    await connectToDatabase();

    const isEmail = identifier.includes("@");

    if (isEmail) {
      // Only accounts that haven't finished/saved their profile yet — a
      // completed profile already has its permanent Profile ID and must be
      // recovered with that instead.
      const users = await UserModel.find({
        email: identifier.toLowerCase(),
        profileId: { $exists: false },
      }).lean<any[]>();

      if (users.length > 0) {
        try {
          await sendMultiAccountCredentialsEmail(identifier.toLowerCase(), users);
        } catch (err) {
          console.error("[Resend Credentials] Multi-account email failed:", err);
        }
      }
      return Response.json({ ok: true });
    }

    const user = await UserModel.findOne({ profileId: identifier.toUpperCase() }).lean() as any;
    if (!user) {
      // Don't reveal whether the Profile ID exists.
      return Response.json({ ok: true });
    }

    // Recompute the deterministic password and reset the hash.
    const firstName    = (user.name as string).split(" ")[0];
    const autoPassword = generatePassword(user.phone, new Date(user.createdAt), firstName);
    const passwordHash = await bcrypt.hash(autoPassword, 10);

    await UserModel.findByIdAndUpdate(user._id, { $set: { passwordHash } });

    // Awaited (not fire-and-forget) — a detached promise can be killed before
    // it completes once this serverless function's response is returned.
    try {
      await sendCredentialsEmail(user.email, user.name, user.profileId, autoPassword);
    } catch (err) {
      console.error("[Resend Credentials] Email failed:", err);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("forgot-password/send-otp error:", error);
    return Response.json({ message: "Server error. Please try again." }, { status: 500 });
  }
}

/** Resets & re-sends passwords for every incomplete account under one email, in a single message. */
async function sendMultiAccountCredentialsEmail(email: string, users: any[]) {
  const accounts: { name: string; password: string; createdAt: Date }[] = [];

  for (const user of users) {
    const firstName    = (user.name as string).split(" ")[0];
    const autoPassword = generatePassword(user.phone, new Date(user.createdAt), firstName);
    const passwordHash = await bcrypt.hash(autoPassword, 10);
    await UserModel.findByIdAndUpdate(user._id, { $set: { passwordHash } });
    accounts.push({ name: user.name, password: autoPassword, createdAt: new Date(user.createdAt) });
  }

  // Oldest first — the "first" profile the user registered shows up first.
  accounts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const loginUrl = `${process.env.NEXTAUTH_URL ?? "https://luramatrimony.com"}/login`;
  const rows = accounts.map((a, i) => `
    <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;margin-bottom:12px;">
      <p style="margin:0 0 4px;color:#7a1f2b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
        Profile ${i + 1} — ${a.name} (registered ${a.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
      </p>
      <p style="margin:0;font-family:monospace;font-size:22px;font-weight:bold;color:#1a1a1a;letter-spacing:4px;">${a.password}</p>
    </div>
  `).join("");

  await sendMailWithRetry({
    from:    process.env.SMTP_FROM ?? `"Lura Matrimony" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: `Lura Matrimony — Your Login Password${accounts.length > 1 ? "s" : ""}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#faf7f2;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#7a1f2b;border-radius:12px;padding:16px 24px;">
            <span style="color:#d4af37;font-size:24px;font-weight:bold;letter-spacing:2px;">LURA</span>
          </div>
          <p style="margin-top:8px;color:#7a1f2b;font-size:14px;font-weight:600;">Matrimony Services</p>
        </div>

        <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:8px;">Your login credentials</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:20px;">
          ${accounts.length > 1
            ? `You have ${accounts.length} unfinished profiles registered with this email. Log in with <strong>${email}</strong> and the matching password below for the one you want to continue.`
            : `Log in with <strong>${email}</strong> and the password below to continue your profile.`
          }
        </p>

        ${rows}

        <div style="text-align:center;margin:24px 0;">
          <a href="${loginUrl}" style="display:inline-block;background:#7a1f2b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:bold;">
            Sign In to Your Account
          </a>
        </div>

        <p style="color:#888;font-size:12px;line-height:1.6;">
          Once you complete and save a profile, it gets a permanent Profile ID and this email login stops working for it — use the Profile ID from then on.
        </p>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Lura Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Your login credentials:\n\n${accounts.map((a, i) => `Profile ${i + 1} — ${a.name} (registered ${a.createdAt.toLocaleDateString("en-IN")}): ${a.password}`).join("\n")}\n\nLog in with ${email} and the matching password at: ${loginUrl}`,
  }, "Resend Credentials (multi-account)");
}

async function sendCredentialsEmail(
  email: string,
  name: string,
  profileId: string,
  autoPassword: string,
) {
  const firstName = name.split(" ")[0];
  const loginUrl  = `${process.env.NEXTAUTH_URL ?? "https://luramatrimony.com"}/login`;

  await sendMailWithRetry({
    from:    process.env.SMTP_FROM ?? `"Lura Matrimony" <${process.env.SMTP_USER}>`,
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
  }, "Resend Credentials");
}
