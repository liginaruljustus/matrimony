/**
 * Shared, cached Gmail SMTP transporter — reused across all outbound emails
 * instead of opening a fresh connection per send. Opening many short-lived
 * SMTP connections back-to-back from a serverless function (e.g. Vercel) is
 * what was silently dropping some emails: Gmail can reject/timeout the first
 * of two near-simultaneous connection attempts from a shared cloud IP while
 * the second succeeds, and that failure was only ever logged server-side.
 */
let cachedTransporter: any = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const nodemailer = await import("nodemailer");
  const createTransport = nodemailer.createTransport || (nodemailer as any).default?.createTransport;
  cachedTransporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 1,
  });
  return cachedTransporter;
}

/** Sends via the shared transporter, retrying once on failure (fresh connection). */
export async function sendMailWithRetry(mailOptions: Record<string, any>, label: string) {
  if (!process.env.SMTP_USER) {
    console.log(`[${label}] Gmail not configured — skipping email to ${mailOptions.to}`);
    return;
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`[${label}] Sent to ${mailOptions.to} (attempt ${attempt}): ${info.response}`);
      return;
    } catch (err) {
      console.error(`[${label}] Attempt ${attempt} failed for ${mailOptions.to}:`, err);
      cachedTransporter = null; // force a fresh connection on retry
      if (attempt === 2) throw err;
    }
  }
}

/** Checks the mail login without sending anything. Used by the admin email check. */
export async function checkMailHealth(): Promise<{ configured: boolean; sender: string | null; ok: boolean; error: string | null }> {
  const sender = process.env.SMTP_USER ?? null;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { configured: false, sender, ok: false, error: "SMTP_USER / SMTP_PASS are not set on the server" };
  }
  try {
    cachedTransporter = null; // test a fresh login, not a cached connection
    const transporter = await getTransporter();
    await transporter.verify();
    return { configured: true, sender, ok: true, error: null };
  } catch (err: any) {
    cachedTransporter = null;
    return { configured: true, sender, ok: false, error: String(err?.response || err?.message || err).slice(0, 300) };
  }
}
