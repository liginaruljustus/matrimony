import { sendMailWithRetry } from "./mailer";
import { recoverAutoPassword } from "./loginPassword";

/**
 * Emails a user's full profile details (FD card) once their profile is approved/live,
 * together with their login details (Profile ID + password). Pass the user record
 * as `account` so the password can be included.
 */
export async function sendFDCardEmail(
  email: string,
  name: string,
  fdCard: any,
  account?: { passwordHash?: string; phone?: string; createdAt?: Date | string; name?: string } | null,
) {
  const password = await recoverAutoPassword(account);
  const loginUrl = `${process.env.NEXTAUTH_URL ?? "https://matrimony-two-drab.vercel.app"}/login`;
  const loginBox = `
        <div style="background:#fff;border:2px solid #d4af37;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:bold;color:#7a1f2b;text-transform:uppercase;letter-spacing:1px;">Your Login Details</p>
          <table style="border-collapse:collapse;">
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">Profile ID</td><td style="padding:4px 0;font-family:monospace;font-size:16px;font-weight:bold;color:#1a1a1a;">${fdCard.profileId ?? ""}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">Password</td><td style="padding:4px 0;font-family:monospace;font-size:16px;font-weight:bold;color:#1a1a1a;">${
              password ?? `<span style="font-family:Arial,sans-serif;font-size:13px;font-weight:normal;color:#374151;">The password from your registration email. Forgotten it? Use &ldquo;Forgot password&rdquo; on the login page.</span>`
            }</td></tr>
          </table>
          <p style="margin:12px 0 0;"><a href="${loginUrl}" style="display:inline-block;background:#7a1f2b;color:#fff;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:bold;">Sign in</a></p>
        </div>`;
  const fieldRow = (label: string, value: any) =>
    value ? `<tr><td style="padding:4px 12px;color:#6b7280;font-size:13px;">${label}</td><td style="padding:4px 12px;font-weight:600;font-size:13px;">${value}</td></tr>` : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;">
      <div style="background:#7a1f2b;padding:24px;text-align:center;">
        <h1 style="color:#d4af37;margin:0;font-size:22px;">Lura Tamil Matrimony</h1>
        <p style="color:#fff;margin:8px 0 0;font-size:14px;">Your Full Profile Details</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#374151;">Dear <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Your profile is now live. Below are your login details and your complete profile details for your records.</p>
        ${loginBox}
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;margin:16px 0;">
          ${fieldRow("Profile ID",       fdCard.profileId)}
          ${fieldRow("Name",             fdCard.name)}
          ${fieldRow("Age",              fdCard.age ? `${fdCard.age} years` : null)}
          ${fieldRow("Religion",         fdCard.religion)}
          ${fieldRow("Caste",            fdCard.caste)}
          ${fieldRow("District",         fdCard.district)}
          ${fieldRow("Education",        fdCard.education)}
          ${fieldRow("Nakshatra",        fdCard.nakshatra)}
          ${fieldRow("Rashi",            fdCard.rashi)}
          ${fieldRow("Monthly Income",   fdCard.monthlyIncome ? `₹${fdCard.monthlyIncome}` : null)}
          ${fieldRow("Father Name",      fdCard.fatherName)}
          ${fieldRow("Mother Name",      fdCard.motherName)}
          ${fieldRow("Contact Person",   fdCard.contactPersonName)}
          ${fieldRow("Contact Number",   fdCard.contactNumber)}
          ${fieldRow("WhatsApp",         fdCard.whatsappNo)}
        </table>
        <p style="color:#6b7280;font-size:12px;">Please keep this email safe. Do not share your Profile ID and password with anyone.</p>
      </div>
      <div style="background:#7a1f2b;padding:12px;text-align:center;">
        <p style="color:#d4af37;margin:0;font-size:12px;">© ${new Date().getFullYear()} Lura Tamil Matrimony</p>
      </div>
    </div>
  `;

  await sendMailWithRetry({
    from:    process.env.SMTP_FROM ?? `"Lura Tamil Matrimony" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: "Your Lura Tamil Matrimony Profile Is Live — Full Details",
    html,
    text: [
      `Dear ${name},`,
      "",
      "Your Lura Tamil Matrimony profile is now live.",
      "",
      `Profile ID: ${fdCard.profileId ?? ""}`,
      `Password:   ${password ?? "the password from your registration email (use \"Forgot password\" on the login page if needed)"}`,
      "",
      `Sign in at: ${loginUrl}`,
      "",
      "Please keep this email safe. Do not share your Profile ID and password with anyone.",
    ].join("\n"),
  }, "FD Card Email");
}
