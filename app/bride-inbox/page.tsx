"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Inbox, Star, MapPin, GraduationCap, CheckCircle,
  XCircle, Clock, AlertCircle, Heart, Users,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { FAMILY_CLASS_COLORS as CLASS_COLOR, FAMILY_CLASS_FALLBACK } from "@/lib/familyClass";
type InboxItem = {
  favoriteId: string;
  groomUserId: string;
  firstPaidAt: string;
  isAccepted: boolean;
  acceptedAt: string | null;
  declinedAt: string | null;
  mdCard: {
    profileId: string;
    name: string;
    age: number;
    religion: string;
    caste: string;
    subCaste?: string;
    district: string;
    education: string;
    currentJob?: string;
    height?: number;
    complexion?: string;
    maritalStatus?: string;
    photo?: string;
    familyClass: string;
    nakshatra?: string;
    rashi?: string;
    // AD-level details (1st payment admin-approved)
    fatherName?: string;
    fatherOccupation?: string;
    motherName?: string;
    motherOccupation?: string;
    totalBrothers?: number;
    marriedBrothers?: number;
    totalSisters?: number;
    marriedSisters?: number;
    houseDetails?: string;
    familyStatus?: string;
    monthlyIncome?: number;
    placeOfBirth?: string;
    timeOfBirth?: string;
    lagnam?: string;
    photos?: string[];
    expectations?: string;
  } | null;
};


export default function BrideInboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [inbox, setInbox]         = useState<InboxItem[]>([]);
  const [pending, setPending]     = useState(0);
  const [loading, setLoading]     = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [respondError, setRespondError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/bride/inbox");
      if (res.status === 403) { router.push("/dashboard"); return; }
      const data = await res.json();
      setInbox(data.inbox ?? []);
      setPending(data.pendingApproval ?? 0);
    } catch {
      setInbox([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      if ((session?.user as any)?.profileType !== "BRIDE") {
        router.push("/dashboard");
        return;
      }
      load();
    }
  }, [status, session, load, router]);

  const respond = async (favoriteId: string, action: "accept" | "decline") => {
    if (action === "accept") {
      const confirmed = window.confirm(
        "Accept this proposal? The groom family will be notified and your inbox will remain connected.",
      );
      if (!confirmed) return;
    }
    setRespondError("");
    setResponding(favoriteId);
    try {
      const res = await fetch("/api/bride/respond", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ favoriteId, action }),
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setRespondError(data.error ?? "Failed to respond. Please try again.");
      }
    } catch {
      setRespondError("Network error. Please try again.");
    } finally {
      setResponding(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  const accepted  = inbox.filter((i) => i.isAccepted);
  const declined  = inbox.filter((i) => !i.isAccepted && !!i.declinedAt);
  const pending2  = inbox.filter((i) => !i.isAccepted && !i.declinedAt);

  return (
    <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#7a1f2b]">
          <Inbox size={22} />
          My Inbox
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Grooms who have expressed interest in your profile
        </p>
      </div>

      {/* Stats summary */}
      {inbox.length > 0 && (
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: "Total",    value: inbox.length,    color: "text-[#7a1f2b]",  bg: "bg-white dark:bg-neutral-100 border-neutral-200 dark:border-neutral-200" },
            { label: "Pending",  value: pending2.length, color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
            { label: "Accepted", value: accepted.length, color: "text-green-700",  bg: "bg-green-50 border-green-200" },
            { label: "Declined", value: declined.length, color: "text-red-600",    bg: "bg-red-50 border-red-200" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${color} opacity-70`}>{label}</p>
              <p className={`mt-0.5 text-2xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {respondError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {respondError}
          <button onClick={() => setRespondError("")} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Pending payment approvals */}
      {pending > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{pending} more groom{pending > 1 ? "s" : ""}</span> interested — pending admin payment verification.
          </p>
        </div>
      )}

      {inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-neutral-600">No Proposals Yet</h2>
          <p className="mt-1 text-sm text-neutral-400">
            When grooms express interest and complete payment, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Pending response ─────────────────────────── */}
          {pending2.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#7a1f2b]">
                New Proposals
                <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                  {pending2.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pending2.map((item) => (
                  <GroomCard
                    key={item.favoriteId}
                    item={item}
                    onAccept={() => respond(item.favoriteId, "accept")}
                    onDecline={() => respond(item.favoriteId, "decline")}
                    responding={responding === item.favoriteId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Accepted ─────────────────────────────────── */}
          {accepted.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-green-700">
                Accepted
                <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                  {accepted.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {accepted.map((item) => (
                  <GroomCard
                    key={item.favoriteId}
                    item={item}
                    responding={false}
                    accepted
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Declined ─────────────────────────────────── */}
          {declined.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-400">
                Declined
                <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                  {declined.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {declined.map((item) => (
                  <GroomCard
                    key={item.favoriteId}
                    item={item}
                    responding={false}
                    declined
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

// ── Groom Card ──────────────────────────────────────────────────────────────
function GroomCard({
  item, onAccept, onDecline, responding, accepted = false, declined = false,
}: {
  item: InboxItem;
  onAccept?: () => void;
  onDecline?: () => void;
  responding: boolean;
  accepted?: boolean;
  declined?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const card = item.mdCard;
  if (!card) return null;

  const fmtVal = (v: any) => (v !== null && v !== undefined && v !== "" ? String(v) : "—");
  const familyStatusLabel =
    card.familyStatus === "MC" ? "Middle Class"
    : card.familyStatus === "UC" ? "Upper Class"
    : card.familyStatus === "EC" ? "Elite Class"
    : fmtVal(card.familyStatus);

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white dark:bg-neutral-100 shadow-sm transition-all ${
      accepted ? "border-green-200" : declined ? "border-neutral-200 dark:border-neutral-200 opacity-60" : "border-neutral-100 dark:border-neutral-200 hover:shadow-md"
    }`}>
      {/* Photo */}
      <div className="relative h-44 bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
        {card.photo ? (
          <img src={card.photo} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-2xl font-bold text-[#7a1f2b]">
              {card.name.charAt(0)}
            </div>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          CLASS_COLOR[card.familyClass] ?? FAMILY_CLASS_FALLBACK
        }`}>
          {card.familyClass}
        </span>
        {accepted && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
            <CheckCircle size={10} />
            Accepted
          </div>
        )}
        {declined && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-neutral-400 px-2 py-0.5 text-[10px] font-bold text-white">
            <XCircle size={10} />
            Declined
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-neutral-900 dark:text-neutral-900">{card.name}</h3>
          <span className="font-mono text-[10px] text-neutral-400">{card.profileId}</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          {card.age} yrs · {card.maritalStatus?.replace("_", " ") ?? "Single"}
        </p>

        <div className="mt-2 space-y-1">
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Star size={10} className="text-[#d4af37]" />
            {card.religion} · {card.caste}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <MapPin size={10} className="text-[#7a1f2b]" />
            {card.district}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <GraduationCap size={10} className="text-[#7a1f2b]" />
            {card.education}
          </p>
          {card.currentJob && (
            <p className="text-[11px] text-neutral-400">💼 {card.currentJob}</p>
          )}
          {card.nakshatra && (
            <p className="text-[11px] text-neutral-400">★ {card.nakshatra} · {card.rashi}</p>
          )}
        </div>

        {/* ── Additional Details (AD) — unlocked by admin-approved 1st payment ── */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 flex w-full items-center justify-between rounded-lg bg-[#7a1f2b]/5 px-3 py-2 text-[11px] font-bold text-[#7a1f2b] hover:bg-[#7a1f2b]/10 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            Family &amp; Additional Details
          </span>
          {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showDetails && (
          <div className="mt-2 rounded-lg border border-neutral-100 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-200 p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <DetailField label="Father" value={fmtVal(card.fatherName)} />
              <DetailField label="Father's Occupation" value={fmtVal(card.fatherOccupation)} />
              <DetailField label="Mother" value={fmtVal(card.motherName)} />
              <DetailField label="Mother's Occupation" value={fmtVal(card.motherOccupation)} />
              <DetailField
                label="Brothers"
                value={card.totalBrothers != null ? `${card.totalBrothers} (${card.marriedBrothers ?? 0} married)` : "—"}
              />
              <DetailField
                label="Sisters"
                value={card.totalSisters != null ? `${card.totalSisters} (${card.marriedSisters ?? 0} married)` : "—"}
              />
              <DetailField label="Family Status" value={familyStatusLabel} />
              <DetailField
                label="Monthly Income"
                value={card.monthlyIncome != null ? `₹${Number(card.monthlyIncome).toLocaleString("en-IN")}` : "—"}
              />
              <DetailField label="House Details" value={fmtVal(card.houseDetails)} />
              <DetailField label="Place of Birth" value={fmtVal(card.placeOfBirth)} />
              <DetailField label="Time of Birth" value={fmtVal(card.timeOfBirth)} />
              <DetailField label="Lagnam" value={fmtVal(card.lagnam)} />
            </div>

            {card.expectations && (
              <div className="mt-3 border-t border-neutral-200 pt-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">Partner Expectations</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600">{card.expectations}</p>
              </div>
            )}

            {/* Extra photos */}
            {card.photos && card.photos.length > 1 && (
              <div className="mt-3 border-t border-neutral-200 pt-2">
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-neutral-400">More Photos</p>
                <div className="flex gap-2 overflow-x-auto">
                  {card.photos.slice(1).map((photo, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={photo}
                      alt={`${card.name} photo ${i + 2}`}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover border border-neutral-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-2 text-[10px] text-neutral-400">
          Interested on {new Date(item.firstPaidAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </p>

        {/* Action buttons — only for unanswered proposals */}
        {!accepted && !declined && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={onAccept}
              disabled={responding}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={13} />
              Accept
            </button>
            <button
              onClick={onDecline}
              disabled={responding}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-200 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              <XCircle size={13} />
              Decline
            </button>
          </div>
        )}

        {accepted && item.acceptedAt && (
          <p className="mt-3 flex items-center gap-1 text-[10px] text-green-700 font-semibold">
            <CheckCircle size={10} />
            Accepted on {new Date(item.acceptedAt).toLocaleDateString("en-IN")}
          </p>
        )}
        {declined && item.declinedAt && (
          <p className="mt-3 flex items-center gap-1 text-[10px] text-neutral-400 font-semibold">
            <XCircle size={10} />
            Declined on {new Date(item.declinedAt).toLocaleDateString("en-IN")}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Detail field (label + value) ─────────────────────────────────────────────
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-neutral-700">{value}</p>
    </div>
  );
}
