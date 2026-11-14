"use client";

/**
 * Admin → Shares: members' WhatsApp status screenshots of our poster/video.
 * Most shares confirm themselves when someone opens the member's personal link;
 * the rest wait here for the admin to compare the screenshot with the poster.
 */
import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Share2, CheckCircle, XCircle, MousePointerClick } from "lucide-react";
import { ProfileIdBadge } from "@/components/ProfileIdBadge";
import { PhotoLightbox } from "@/components/PhotoLightbox";

type Proof = {
  id: string;
  profileId: string;
  purpose: "ACTIVATION" | "REGULAR";
  promo: { category?: string; title?: string; mediaUrl?: string } | null;
  screenshotUrl: string;
  status: "PENDING" | "AUTO_CONFIRMED" | "APPROVED" | "REJECTED";
  clicks: number;
  rejectReason: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

const TABS = [
  { key: "PENDING",        label: "To review" },
  { key: "AUTO_CONFIRMED", label: "Confirmed by link" },
  { key: "APPROVED",       label: "Approved" },
  { key: "REJECTED",       label: "Rejected" },
] as const;

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const isVideo = (url?: string) => !!url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

export default function AdminSharesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("PENDING");
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch(`/api/admin/share-proofs?status=${tab}`).then((r) => r.json());
      setProofs(data.proofs ?? []);
      setCounts(data.counts ?? {});
    } finally {
      setLoading(false);
    }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Reason (shown to the member):", "The screenshot doesn't show our post in your WhatsApp status") ?? "";
      if (!reason) return;
    }
    setBusy(id);
    setMessage("");
    const res = await fetch("/api/admin/share-proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? (action === "approve" ? "Share approved — the member has been notified." : "Share rejected — the member has been asked to share again.") : data.error ?? "Failed");
    setBusy(null);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Share2 size={22} className="text-[#7a1f2b]" /> Shares
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Members&apos; WhatsApp status screenshots of our poster/video. A share confirms itself when someone opens the
            member&apos;s personal link; check the rest here — the screenshot should show the poster with the member&apos;s Profile ID.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                tab === t.key ? "bg-[#7a1f2b] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label} <span className="ml-1 opacity-70">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {message && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
        ) : proofs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">Nothing here.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proofs.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="grid grid-cols-2 gap-px bg-slate-100">
                  <button onClick={() => setLightbox(p.screenshotUrl)} className="bg-white" title="Open the screenshot">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.screenshotUrl} alt="Status screenshot" className="h-56 w-full bg-slate-50 object-contain" />
                    <span className="block py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Screenshot</span>
                  </button>
                  <div className="bg-white">
                    {p.promo?.mediaUrl && !isVideo(p.promo.mediaUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.promo.mediaUrl} alt="Poster" className="h-56 w-full bg-slate-50 object-contain" />
                    ) : (
                      <div className="flex h-56 items-center justify-center px-3 text-center text-xs text-slate-500">
                        {p.promo?.title ?? "Poster not recorded"}{isVideo(p.promo?.mediaUrl) ? " (video)" : ""}
                      </div>
                    )}
                    <span className="block py-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Expected post</span>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <ProfileIdBadge id={p.profileId} size="sm" />
                    <span className="text-[11px] text-slate-400">{fmt(p.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.purpose === "ACTIVATION" ? "Go-live step" : "Regular share"} · {p.promo?.title ?? "—"}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MousePointerClick size={12} /> {p.clicks} link {p.clicks === 1 ? "visit" : "visits"}
                  </p>
                  {p.rejectReason && <p className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">{p.rejectReason}</p>}
                  {p.status === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => act(p.id, "approve")}
                        disabled={busy === p.id}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        onClick={() => act(p.id, "reject")}
                        disabled={busy === p.id}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {lightbox && <PhotoLightbox photos={[lightbox]} index={0} onIndexChange={() => {}} onClose={() => setLightbox(null)} alt="Status screenshot" />}
    </AdminLayout>
  );
}
