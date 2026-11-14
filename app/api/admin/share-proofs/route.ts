/**
 * GET  /api/admin/share-proofs?status=PENDING|AUTO_CONFIRMED|APPROVED|REJECTED|ALL
 * POST /api/admin/share-proofs  { id, action: "approve" | "reject", reason? }
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ShareProofModel } from "@/lib/models";
import { confirmShareProof, rejectShareProof } from "@/lib/shareProof";

async function admin() {
  const session = await getServerSession(authOptions);
  return session?.user && (session.user as any).role === "ADMIN" ? session : null;
}

export async function GET(req: Request) {
  if (!(await admin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") ?? "PENDING";
  await connectToDatabase();
  const filter = status === "ALL" ? {} : { status };
  const proofs = await ShareProofModel.find(filter).sort({ createdAt: -1 }).limit(200).lean() as any[];
  const counts = Object.fromEntries(
    (await ShareProofModel.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])).map((c: any) => [c._id, c.n]),
  );
  return Response.json({
    counts,
    proofs: proofs.map((p) => ({
      id:            String(p._id),
      profileId:     p.profileId,
      purpose:       p.purpose,
      promo:         p.promo ?? null,
      screenshotUrl: p.screenshotUrl,
      status:        p.status,
      clicks:        p.clicks ?? 0,
      rejectReason:  p.rejectReason ?? null,
      createdAt:     p.createdAt,
      confirmedAt:   p.confirmedAt ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await admin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, reason } = await req.json().catch(() => ({}));
  if (!id || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "id and action (approve | reject) are required" }, { status: 400 });
  }
  await connectToDatabase();
  const ok = action === "approve"
    ? await confirmShareProof(String(id), "APPROVED", session.user.id)
    : await rejectShareProof(String(id), String(reason ?? "").slice(0, 200), session.user.id);
  if (!ok) return Response.json({ error: "This share was already reviewed" }, { status: 409 });
  return Response.json({ ok: true });
}
