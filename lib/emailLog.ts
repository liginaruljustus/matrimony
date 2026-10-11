import { UserModel } from "@/lib/models";

export type EmailKind = "credentials" | "profileLive";

/**
 * Send an email and record the outcome on the user, so a failure is visible to
 * the admin instead of only in the server log. Never throws — a failed email
 * must not fail the registration or profile submission it belongs to.
 */
export async function sendAndRecord(
  userId: unknown,
  kind: EmailKind,
  to: string,
  send: () => Promise<unknown>,
): Promise<boolean> {
  let error: string | null = null;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    error = "Email is not configured on the server (SMTP_USER / SMTP_PASS missing)";
  } else {
    try {
      await send();
    } catch (err: any) {
      error = String(err?.response || err?.message || err).slice(0, 300);
    }
  }

  if (error) console.error(`[email:${kind}] FAILED for ${to}: ${error}`);

  try {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { [`emailLog.${kind}`]: { status: error ? "FAILED" : "SENT", at: new Date(), to, error } } },
    );
  } catch (err) {
    console.error(`[email:${kind}] could not record result:`, err);
  }

  return !error;
}
