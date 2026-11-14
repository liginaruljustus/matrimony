"use client";

/**
 * Dashboard panel for go-live activation and the regular share (lib/activation.ts):
 *  - profile submitted but not live → the 3 steps (join Lura NCS, follow, share)
 *  - live and a share is due        → "share our post" reminder, which can be skipped
 */
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, ExternalLink, Rocket, Share2, Megaphone, X } from "lucide-react";

type Promo = { category: string; title: string; mediaUrl: string; shareText?: string; nextChangeAt: string };
type Activation = {
  submitted: boolean;
  live: boolean;
  liveAt: string | null;
  pendingActivation: boolean;
  tasks: { ncs: boolean; follow: boolean; share: boolean };
  ncsUserId: string | null;
  followed: string[];
  shareDue: boolean;
  promo: Promo | null;
  ncsSiteUrl: string;
  socialLinks: { name: string; url: string }[];
  days: { activation: number; ncs: number; allDone: number; shareReminder: number; shareFreeze: number };
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

/** The poster / video and buttons to share it. */
function PromoShare({ promo, onShared, busy }: { promo: Promo | null; onShared: () => void; busy: boolean }) {
  const [opened, setOpened] = useState(false);
  if (!promo) {
    return <p className="text-xs text-slate-500">The admin hasn&apos;t added a poster or video to share yet.</p>;
  }
  const text = [promo.shareText || promo.title, promo.mediaUrl].filter(Boolean).join("\n");

  // Share the actual image/video where the phone allows it (e.g. to a WhatsApp status);
  // otherwise open WhatsApp with the message and link.
  const share = async () => {
    setOpened(true);
    try {
      if (promo.mediaUrl && typeof navigator !== "undefined" && "canShare" in navigator) {
        const blob = await fetch(promo.mediaUrl).then((r) => (r.ok ? r.blob() : null));
        if (blob) {
          const ext = blob.type.split("/")[1] || "jpg";
          const file = new File([blob], `lura-${promo.category || "post"}.${ext}`, { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text: promo.shareText || promo.title });
            return;
          }
        }
      }
    } catch { /* fall back to the WhatsApp link */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {promo.mediaUrl && (isVideo(promo.mediaUrl) ? (
          <video src={promo.mediaUrl} controls className="max-h-64 w-full bg-black object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.mediaUrl} alt={promo.title} className="max-h-64 w-full object-contain" />
        ))}
        <div className="px-3 py-2">
          {promo.category && <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a1f2b]">{promo.category}</span>}
          <p className="text-sm font-semibold text-slate-800">{promo.title}</p>
          <p className="text-[11px] text-slate-400">Changes on {fmtDate(promo.nextChangeAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700"
        >
          <Share2 size={13} /> Share on WhatsApp
        </button>
        <button
          onClick={onShared}
          disabled={busy || !opened}
          title={opened ? "" : "Share it first"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <CheckCircle size={13} /> {busy ? "Saving…" : "I have shared it"}
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Share it to your WhatsApp groups and put it as your WhatsApp status, then tap &ldquo;I have shared it&rdquo;.
      </p>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 ${done ? "border-green-200 bg-green-50/60" : "border-slate-200 bg-white"}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-green-600 text-white" : "bg-[#7a1f2b]/10 text-[#7a1f2b]"}`}>
          {done ? <CheckCircle size={14} /> : n}
        </span>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        {done && <span className="ml-auto text-[11px] font-bold text-green-700">Done</span>}
      </div>
      {!done && children}
    </div>
  );
}

export function ActivationPanel() {
  const [data, setData] = useState<Activation | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ncsId, setNcsId] = useState("");
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [skipped, setSkipped] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/activation");
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  // "Skip for now" hides the share reminder for the rest of the day (this browser only)
  useEffect(() => {
    try { setSkipped(localStorage.getItem("lura-share-skip") === new Date().toDateString()); } catch { /* ignore */ }
  }, []);

  const submit = async (task: string, extra: Record<string, unknown> = {}) => {
    setBusy(task);
    setError("");
    try {
      const res = await fetch("/api/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong"); return; }
      setData(json);
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(null);
    }
  };

  if (!data || !data.submitted) return null;

  // ── Waiting to go live: the 3 steps ──
  if (data.pendingActivation) {
    const doneCount = [data.tasks.ncs, data.tasks.follow, data.tasks.share].filter(Boolean).length;
    const links = data.socialLinks ?? [];
    return (
      <div className="overflow-hidden rounded-2xl border-2 border-[#d4af37]/60 bg-white">
        <div className="flex flex-wrap items-start gap-3 bg-gradient-to-r from-[#7a1f2b] to-[#5a1820] px-5 py-4 text-white">
          <Rocket size={20} className="mt-0.5 shrink-0 text-[#d4af37]" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Make your profile live — {doneCount} of 3 steps done</p>
            <p className="text-sm text-white/80">
              Your profile goes live on <strong>{data.liveAt ? fmtDate(data.liveAt) : "—"}</strong>.
              Joining Lura NCS brings it to {data.days.ncs} days; all 3 steps make it live
              {data.days.allDone === 0 ? " straight away" : ` in ${data.days.allDone} days`}.
              Browsing and proposals open once your profile is live.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <Step n={1} title="Join Lura NCS" done={data.tasks.ncs}>
            <p className="mb-2 text-xs text-slate-600">
              Become a member on Lura NCS (it also gives you Lura Jobs and Lura Ads), then enter your Lura NCS user ID here.
            </p>
            <a href={data.ncsSiteUrl} target="_blank" rel="noopener noreferrer" className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-[#7a1f2b] underline">
              Open Lura NCS <ExternalLink size={11} />
            </a>
            <div className="flex gap-2">
              <input
                value={ncsId}
                onChange={(e) => setNcsId(e.target.value)}
                placeholder="Your Lura NCS user ID"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-[#7a1f2b] focus:outline-none"
              />
              <button
                onClick={() => submit("ncs", { ncsUserId: ncsId })}
                disabled={busy !== null || ncsId.trim().length < 3}
                className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {busy === "ncs" ? "Saving…" : "Submit"}
              </button>
            </div>
          </Step>

          <Step n={2} title="Follow our channels" done={data.tasks.follow}>
            {links.length === 0 ? (
              <button
                onClick={() => submit("follow", { followed: [] })}
                disabled={busy !== null}
                className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {busy === "follow" ? "Saving…" : "Mark as done"}
              </button>
            ) : (
              <>
                <p className="mb-2 text-xs text-slate-600">Open each one, follow or subscribe, then tick it.</p>
                <ul className="mb-3 space-y-2">
                  {links.map((l) => (
                    <li key={l.name} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`follow-${l.name}`}
                        checked={!!ticked[l.name]}
                        onChange={(e) => setTicked({ ...ticked, [l.name]: e.target.checked })}
                        className="h-4 w-4 accent-[#7a1f2b]"
                      />
                      <label htmlFor={`follow-${l.name}`} className="flex-1 text-sm text-slate-700">{l.name}</label>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#7a1f2b] underline">
                        Open <ExternalLink size={11} />
                      </a>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => submit("follow", { followed: links.filter((l) => ticked[l.name]).map((l) => l.name) })}
                  disabled={busy !== null || !links.every((l) => ticked[l.name])}
                  className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy === "follow" ? "Saving…" : "I followed all of them"}
                </button>
              </>
            )}
          </Step>

          <Step n={3} title="Share our post" done={data.tasks.share}>
            <PromoShare promo={data.promo} onShared={() => submit("share")} busy={busy === "share"} />
          </Step>
        </div>
      </div>
    );
  }

  // ── Live: regular share reminder (can be skipped) ──
  if (data.live && data.shareDue && !skipped) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-white p-5">
        <div className="mb-3 flex items-start gap-3">
          <Megaphone size={20} className="mt-0.5 shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">Please share our post</p>
            <p className="text-sm text-slate-600">
              Help other families find Lura — share this on WhatsApp. If no share is made for {data.days.shareFreeze} days,
              your profile is paused automatically.
            </p>
          </div>
          <button
            onClick={() => {
              setSkipped(true);
              try { localStorage.setItem("lura-share-skip", new Date().toDateString()); } catch { /* ignore */ }
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            title="Skip for now"
          >
            <X size={13} /> Skip
          </button>
        </div>
        {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <PromoShare promo={data.promo} onShared={() => submit("share")} busy={busy === "share"} />
      </div>
    );
  }

  return null;
}

/** Small status line used by the Dashboard status card. */
export function GoLiveNote({ liveAt }: { liveAt?: string | null }) {
  if (!liveAt || new Date(liveAt) <= new Date()) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
      <Clock size={12} /> Goes live on {fmtDate(liveAt)}
    </p>
  );
}

