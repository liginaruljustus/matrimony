/** Emails a user's login credentials (Profile ID + auto-generated password). */
export async function sendCredentialsEmail(
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
          Your profile has been saved successfully. Keep these credentials safe —
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
          Our admin team will review and approve your profile before it goes live.
        </p>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
        <p style="color:#bbb;font-size:11px;text-align:center;">
          © ${new Date().getFullYear()} Lura Matrimony · குடும்பம் பேசும் திருமண மேடை
        </p>
      </div>
    `,
    text: `Welcome to Lura Matrimony, ${firstName}!\n\nYour profile has been saved. Login credentials:\n\nProfile ID: ${profileId}\nPassword:   ${autoPassword}\n\nPlease save these securely. This password cannot be recovered.\n\nSign in at: ${loginUrl}\n\n© ${new Date().getFullYear()} Lura Matrimony`,
  });
}
