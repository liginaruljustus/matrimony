"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star, MapPin, GraduationCap, CheckCircle, Heart, Users,
  ChevronDown, ChevronUp, Inbox,
} from "lucide-react";

type AcceptedItem = {
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

const CLASS_COLOR: Record<string, string> = {
  MC: "bg-blue-50 text-blue-700",
  UC: "bg-purple-50 text-purple-700",
  EC: "bg-amber-50 text-amber-700",
};

export default function AcceptedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [accepted, setAccepted] = useState<AcceptedItem[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bride/inbox");
      if (res.status === 403) { router.push("/dashboard"); return; }
      const data = await res.json();
      setAccepted((data.inbox ?? []).filter((i: AcceptedItem) => i.isAccepted));
    } catch {
      setAccepted([]);
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

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-green-700">
            <CheckCircle size={22} />
            Accepted Proposals
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Grooms whose proposals your family has accepted
          </p>
        </div>

        {accepted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-neutral-600">No Accepted Proposals Yet</h2>
            <p className="mt-1 text-sm text-neutral-400">
              When you accept a proposal in your inbox, it will appear here.
            </p>
            <Link
              href="/bride-inbox"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7a1f2b] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
            >
              <Inbox size={15} />
              Go to Proposals
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {accepted.map((item) => (
              <AcceptedGroomCard key={item.favoriteId} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Accepted Groom Card ───────────────────────────────────────────────────────
function AcceptedGroomCard({ item }: { item: AcceptedItem }) {
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
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white dark:bg-neutral-100 shadow-sm hover:shadow-md transition-all">
      {/* Photo */}
      <div className="relative h-44 bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
        {card.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photo} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-2xl font-bold text-[#7a1f2b]">
              {card.name.charAt(0)}
            </div>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          CLASS_COLOR[card.familyClass] ?? "bg-neutral-100 text-neutral-700"
        }`}>
          {card.familyClass}
        </span>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
          <CheckCircle size={10} />
          Accepted
        </div>
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

        {/* Additional Details (AD) */}
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

        {/* Dates */}
        <div className="mt-3 space-y-0.5">
          {item.acceptedAt && (
            <p className="flex items-center gap-1 text-[10px] font-semibold text-green-700">
              <CheckCircle size={10} />
              Accepted on {new Date(item.acceptedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          )}
          <p className="text-[10px] text-neutral-400">
            Proposal received {new Date(item.firstPaidAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
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
