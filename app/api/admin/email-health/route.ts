/**
 * Admin-only email diagnostics.
 *
 * GET  — checks the mail login (sends nothing) and lists users whose last
 *        automatic email failed.
 * POST — { to } sends a test email and reports the result.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import { checkMailHealth, sendMailWithRetry } from "@/lib/mailer";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user && (session.user as any).role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const health = await checkMailHealth();

  await connectToDatabase();
  const failed = await UserModel.find({
    $or: [{ "emailLog.credentials.status": "FAILED" }, { "emailLog.profileLive.status": "FAILED" }],
  })
    .select("name profileId email emailLog")
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean<any[]>();

  return Response.json({
    ...health,
    from: process.env.SMTP_FROM ?? null,
    failures: failed.map((u) => ({
      profileId: u.profileId,
      name: u.name,
      email: u.email,
      credentials: u.emailLog?.credentials ?? null,
      profileLive: u.emailLog?.profileLive ?? null,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { to } = await req.json().catch(() => ({}));
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) {
    return Response.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return Response.json({ ok: false, error: "SMTP_USER / SMTP_PASS are not set on the server" });
  }

  try {
    await sendMailWithRetry({
      from: process.env.SMTP_FROM ?? `"Lura Tamil Matrimony" <${process.env.SMTP_USER}>`,
      to,
      subject: "Lura Tamil Matrimony — test email",
      text: "This is a test email from Lura Tamil Matrimony. If you received it, email sending is working.",
    }, "Test Email");
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ ok: false, error: String(err?.response || err?.message || err).slice(0, 300) });
  }
}
