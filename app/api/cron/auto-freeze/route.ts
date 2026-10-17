/**
 * GET /api/cron/auto-freeze
 *
 * Called by a scheduler (e.g. Vercel Cron, GitHub Actions) — NOT by users.
 * Protected by CRON_SECRET env var.
 *
 * Auto-freeze rules:
 *  - GROOM profiles inactive for > 90 days → isAutoFrozen = true
 *  - BRIDE profiles inactive for > 60 days  → isAutoFrozen = true
 *
 * "Inactive" = lastActivity not updated in N days (see lib/autoFreeze.ts).
 * The same check also runs once a day from normal site traffic, so this
 * scheduler is a backup rather than the only trigger.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/auto-freeze", "schedule": "0 2 * * *" }]
 * }
 */
import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel } from "@/lib/models";
import { runAutoFreeze } from "@/lib/autoFreeze";

export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  // Block if secret not configured OR if the header doesn't match.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const result = await runAutoFreeze();
    await SettingsModel.updateOne({}, { $set: { lastAutoFreezeRunAt: new Date() } });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[auto-freeze] Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
