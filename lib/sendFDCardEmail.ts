/** Emails a user's full profile details (FD card) once their profile is approved/live. */
export async function sendFDCardEmail(email: string, name: string, fdCard: any) {
  if (!process.env.SMTP_USER) {
    console.log(`[FD Email] Gmail not configured — skipping email to ${email}`);
    return;
  }

  const nodemailer = await import("nodemailer");
  const createTransport = nodemailer.createTransport || (nodemailer as any).default?.createTransport;
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fieldRow = (label: string, value: any) =>
    value ? `<tr><td style="padding:4px 12px;color:#6b7280;font-size:13px;">${label}</td><td style="padding:4px 12px;font-weight:600;font-size:13px;">${value}</td></tr>` : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;">
      <div style="background:#7a1f2b;padding:24px;text-align:center;">
        <h1 style="color:#d4af37;margin:0;font-size:22px;">Lura Matrimony</h1>
        <p style="color:#fff;margin:8px 0 0;font-size:14px;">Your Full Profile Details</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#374151;">Dear <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Your profile is now live. Below are your complete profile details for your records.</p>
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
        <p style="color:#6b7280;font-size:12px;">Please keep this email safe. Do not share your login credentials.</p>
      </div>
      <div style="background:#7a1f2b;padding:12px;text-align:center;">
        <p style="color:#d4af37;margin:0;font-size:12px;">© ${new Date().getFullYear()} Lura Matrimony</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM ?? `"Lura Matrimony" <no-reply@luramatrimony.com>`,
    to:      email,
    subject: "Your Lura Matrimony Profile Is Live — Full Details",
    html,
  });

  console.log(`[FD Email] Sent to ${email}`);
}
