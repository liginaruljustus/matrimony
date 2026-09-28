"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Inbox, MapPin, GraduationCap, Star, Clock,
  CheckCircle, CreditCard, Users, Briefcase,
  Home, ChevronDown, ChevronUp, AlertCircle, XCircle, Lock,
} from "lucide-react";
import { FAMILY_CLASS_COLORS, FAMILY_CLASS_FALLBACK } from "@/lib/familyClass";
const DEFAULT_PAYMENT_AMOUNTS: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

type InboxItem = {
  favoriteId: string;
  favoriteUserId: string;
  firstPaidAt: string;
  inboxFrozenUntil: string | null;
  inboxFrozen: boolean;
  adLocked: boolean;
  brideProfileId: string;
  brideFamilyClass: string;
  secondPaidAt: string | null;
  isAccepted: boolean;
  acceptedAt: string | null;
  declinedAt: string | null;
  isBrideFrozen: boolean;
  adCard: {
    profileId: string;
    name: string;
    age: number;
    religion: string;
    caste: string;
    district: string;
    education: string;
    familyClass: string;
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
    nakshatra?: string;
    rashi?: string;
    photos?: string[];
    expectations?: string;
  } | null;
};

const CLASS_COLOR = FAMILY_CLASS_COLORS;

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

/** "today" / "tomorrow" / "in N days" — counted in calendar days, not 24-hour blocks. */
function unlockWhen(iso: string): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export default function InboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [inbox, setInbox]           = useState<InboxItem[]>([]);
  const [pending, setPending]       = useState(0);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>(DEFAULT_PAYMENT_AMOUNTS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/inbox");
      const data = await res.json();
      setInbox(data.inbox ?? []);
      setPending(data.pendingApproval ?? 0);
      setPaymentAmounts(data.secondPaymentAmounts ?? DEFAULT_PAYMENT_AMOUNTS);
    } catch {
      setInbox([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      if ((session?.user as any)?.profileType !== "GROOM") {
        router.push("/dashboard");
        return;
      }
      load();
    }
  }, [status, session, load, router]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#7a1f2b]">
            <Inbox size={22} />
            My Inbox
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Additional details of brides you&apos;ve unlocked
          </p>
        </div>
        <Link
          href="/contact-details"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
        >
          <CreditCard size={14} />
          Contact Details
        </Link>
      </div>

      {/* Pending approval notice */}
      {pending > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pending} payment{pending > 1 ? "s" : ""} pending admin approval
            </p>
            <p className="text-xs text-amber-700">
              Profiles will appear here once your payment is verified.
            </p>
          </div>
        </div>
      )}

      {inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-neutral-600">Inbox is Empty</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Complete payment for your favourite profiles to unlock their additional details.
          </p>
          <Link
            href="/favorites"
            className="mt-5 rounded-lg bg-[#7a1f2b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
          >
            Go to Favourites
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inbox.map((item) => {
            const card = item.adCard;

            // ── Waiting period: AD locked, only Profile ID shows ──
            if (!card && item.adLocked) {
              const unlockDate = item.inboxFrozenUntil
                ? new Date(item.inboxFrozenUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : null;
              return (
                <div
                  key={item.favoriteId}
                  className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 shadow-sm p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-200">
                      <Lock size={22} className="text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono font-bold text-neutral-900 dark:text-neutral-900">
                        {item.brideProfileId || "Profile"}
                      </h3>
                      {item.isAccepted && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                          <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                          <div>
                            <p className="text-sm font-bold text-green-700">The bride has accepted your proposal!</p>
                            {item.acceptedAt && (
                              <p className="text-[11px] text-green-700/80">
                                Accepted on {new Date(item.acceptedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-neutral-500">
                        Waiting period — her additional details will be shown
                        {unlockDate ? <> on <strong>{unlockDate}</strong> ({unlockWhen(item.inboxFrozenUntil!)})</> : " soon"}.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {!item.isAccepted && item.declinedAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600">
                            <XCircle size={10} />
                            Bride declined
                          </span>
                        )}
                        {item.isBrideFrozen && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
                            <AlertCircle size={10} />
                            Profile currently inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (!card) return null;
            const isExpanded   = expanded.has(item.favoriteId);
            // Profiles stay in the Inbox permanently — the Final Payment is allowed any time
            // after the waiting period, even if the bride is currently inactive.
            const canPay2nd    = !item.inboxFrozen && !item.secondPaidAt;
            const days         = item.inboxFrozenUntil ? daysLeft(item.inboxFrozenUntil) : 0;

            return (
              <div
                key={item.favoriteId}
                className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-200 bg-white dark:bg-neutral-100 shadow-sm"
              >
                {/* Card header */}
                <div className="flex items-start gap-4 p-5">
                  {/* Photo placeholder — photos are never shown here, only in the PDF */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
                    <Lock size={20} className="text-[#7a1f2b]/60" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-mono font-bold tracking-wide text-neutral-900 dark:text-neutral-900">{card.profileId}</h3>
                        <p className="text-xs text-neutral-500">{card.age} yrs · {card.district}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          CLASS_COLOR[card.familyClass] ?? FAMILY_CLASS_FALLBACK
                        }`}
                      >
                        {card.familyClass}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Star size={10} className="text-[#d4af37]" />
                        {card.religion} · {card.caste}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <GraduationCap size={10} className="text-[#7a1f2b]" />
                        {card.education}
                      </span>
                    </div>

                    {/* Inbox freeze + bride response status */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.isBrideFrozen && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
                          <AlertCircle size={10} />
                          Profile currently inactive
                        </span>
                      )}
                      {item.secondPaidAt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                          <CheckCircle size={10} />
                          Contact details requested
                        </span>
                      ) : item.inboxFrozen ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                          <Clock size={10} />
                          Inbox active · {days} day{days !== 1 ? "s" : ""} left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                          <CheckCircle size={10} />
                          Ready for Final Payment
                        </span>
                      )}
                      {item.isAccepted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                          <CheckCircle size={10} />
                          Bride accepted
                        </span>
                      )}
                      {!item.isAccepted && item.declinedAt && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600">
                          <XCircle size={10} />
                          Bride declined
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand / collapse additional details */}
                <button
                  onClick={() => toggleExpand(item.favoriteId)}
                  className="flex w-full items-center justify-center gap-1 border-t border-neutral-100 dark:border-neutral-200 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
                >
                  {isExpanded ? (
                    <><ChevronUp size={13} /> Hide Details</>
                  ) : (
                    <><ChevronDown size={13} /> View Additional Details</>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-100 dark:border-neutral-200 bg-neutral-50/50 dark:bg-neutral-200/50 p-5">
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                      <Detail label="Profile ID"    value={card.profileId} />
                      {card.monthlyIncome && (
                        <Detail label="Monthly Income" value={`₹${card.monthlyIncome.toLocaleString("en-IN")}`} />
                      )}
                      {card.placeOfBirth && <Detail label="Place of Birth" value={card.placeOfBirth} />}
                      {card.timeOfBirth  && <Detail label="Time of Birth"  value={card.timeOfBirth} />}
                      {card.nakshatra    && <Detail label="Nakshatra"      value={card.nakshatra} />}
                      {card.rashi        && <Detail label="Rashi"          value={card.rashi} />}
                      {card.lagnam       && <Detail label="Lagnam"         value={card.lagnam} />}
                      {card.houseDetails && <Detail label="House"          value={card.houseDetails} />}
                      {card.familyStatus && <Detail label="Family Status"  value={card.familyStatus} />}
                      {card.fatherName && (
                        <Detail label="Father" value={`${card.fatherName}${card.fatherOccupation ? ` (${card.fatherOccupation})` : ""}`} />
                      )}
                      {card.motherName && (
                        <Detail label="Mother" value={`${card.motherName}${card.motherOccupation ? ` (${card.motherOccupation})` : ""}`} />
                      )}
                      {card.totalBrothers !== undefined && (
                        <Detail label="Brothers" value={`${card.totalBrothers} total, ${card.marriedBrothers ?? 0} married`} />
                      )}
                      {card.totalSisters !== undefined && (
                        <Detail label="Sisters" value={`${card.totalSisters} total, ${card.marriedSisters ?? 0} married`} />
                      )}
                    </div>

                    {card.expectations && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Expectations</p>
                        <p className="mt-1 text-sm text-neutral-700">{card.expectations}</p>
                      </div>
                    )}


                    {/* Final Payment CTA — opens the full payment page, which shows every
                        admin-configured method (UPI + QR code, phone, PayTm, bank). */}
                    {canPay2nd && (
                      <Link
                        href={`/payment/second?id=${item.favoriteId}`}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
                      >
                        <CreditCard size={15} />
                        Pay for Contact Details — ₹{(paymentAmounts[card.familyClass] ?? 500).toLocaleString("en-IN")}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-neutral-800">{value}</p>
    </div>
  );
}
