"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Inbox, MapPin, GraduationCap, Star, Clock,
  CheckCircle, CreditCard, Users, Briefcase,
  Home, ChevronDown, ChevronUp, AlertCircle, XCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const PAYMENT_AMOUNTS: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

type InboxItem = {
  favoriteId: string;
  favoriteUserId: string;
  firstPaidAt: string;
  inboxFrozenUntil: string | null;
  inboxFrozen: boolean;
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

const CLASS_COLOR: Record<string, string> = {
  MC: "bg-blue-50 text-blue-700",
  UC: "bg-purple-50 text-purple-700",
  EC: "bg-amber-50 text-amber-700",
};

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export default function InboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [inbox, setInbox]           = useState<InboxItem[]>([]);
  const [pending, setPending]       = useState(0);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [payingFor, setPayingFor]   = useState<string | null>(null);
  const [txnId, setTxnId]           = useState("");
  const [paying, setPaying]         = useState(false);
  const [payError, setPayError]     = useState("");
  const [upiId, setUpiId]           = useState("reginmatrimony@upi");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/inbox");
      const data = await res.json();
      setInbox(data.inbox ?? []);
      setPending(data.pendingApproval ?? 0);
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
      // Fetch payment settings for UPI ID
      fetch("/api/settings/payment")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.upiId) setUpiId(d.upiId); })
        .catch(() => {});
    }
  }, [status, session, load, router]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSecondPayment = async (favoriteId: string) => {
    if (!txnId.trim()) { setPayError("Enter transaction ID"); return; }
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/payment/second", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteId, transactionId: txnId, paymentMethod: "upi" }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error ?? "Failed"); return; }
      setPayingFor(null);
      setTxnId("");
      load();
    } catch {
      setPayError("Network error");
    } finally {
      setPaying(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      <Navbar />
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
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
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
            if (!card) return null;
            const isExpanded   = expanded.has(item.favoriteId);
            // Cannot pay 2nd if inbox freeze is active, already paid, or bride is frozen
            const canPay2nd    = !item.inboxFrozen && !item.secondPaidAt && !item.isBrideFrozen;
            const isPayingThis = payingFor === item.favoriteId;
            const days         = item.inboxFrozenUntil ? daysLeft(item.inboxFrozenUntil) : 0;

            return (
              <div
                key={item.favoriteId}
                className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
              >
                {/* Card header */}
                <div className="flex items-start gap-4 p-5">
                  {/* Photo */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
                    {card.photos?.[0] ? (
                      <img src={card.photos[0]} alt={card.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#7a1f2b]">
                        {card.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-neutral-900">{card.name}</h3>
                        <p className="text-xs text-neutral-500">{card.age} yrs · {card.district}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          CLASS_COLOR[card.familyClass] ?? "bg-neutral-100 text-neutral-700"
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
                          Profile temporarily unavailable
                        </span>
                      )}
                      {!item.isBrideFrozen && item.secondPaidAt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
                          <CheckCircle size={10} />
                          Contact details requested
                        </span>
                      ) : !item.isBrideFrozen && item.inboxFrozen ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700">
                          <Clock size={10} />
                          Inbox active · {days} day{days !== 1 ? "s" : ""} left
                        </span>
                      ) : !item.isBrideFrozen ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                          <CheckCircle size={10} />
                          Ready for 2nd payment
                        </span>
                      ) : null}
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
                  className="flex w-full items-center justify-center gap-1 border-t border-neutral-100 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 transition-colors"
                >
                  {isExpanded ? (
                    <><ChevronUp size={13} /> Hide Details</>
                  ) : (
                    <><ChevronDown size={13} /> View Additional Details</>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-neutral-50/50 p-5">
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

                    {/* Photos grid */}
                    {(card.photos?.length ?? 0) > 1 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {card.photos!.slice(1).map((url, i) => (
                          <img key={i} src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                        ))}
                      </div>
                    )}

                    {/* 2nd payment CTA */}
                    {canPay2nd && !isPayingThis && (
                      <button
                        onClick={() => { setPayingFor(item.favoriteId); setTxnId(""); setPayError(""); }}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
                      >
                        <CreditCard size={15} />
                        Pay for Contact Details — ₹{(PAYMENT_AMOUNTS[card.familyClass] ?? 500).toLocaleString("en-IN")}
                      </button>
                    )}

                    {/* Inline 2nd payment form */}
                    {isPayingThis && (
                      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
                        <p className="mb-1 text-sm font-semibold text-neutral-800">2nd Payment</p>
                        <div className="mb-3 rounded-lg bg-[#faf7f2] px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Amount Due</p>
                          <p className="text-lg font-extrabold text-[#7a1f2b]">
                            ₹{(PAYMENT_AMOUNTS[card.familyClass] ?? 500).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <p className="mb-3 text-xs text-neutral-500">
                          Send payment to UPI ID: <strong>{upiId}</strong>
                        </p>
                        <input
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          placeholder="Transaction / UPI reference ID"
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
                        />
                        {payError && (
                          <p className="mt-1 text-xs text-red-600">{payError}</p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleSecondPayment(item.favoriteId)}
                            disabled={paying}
                            className="flex-1 rounded-lg bg-[#7a1f2b] py-2 text-xs font-bold text-white hover:bg-[#6b1823] disabled:opacity-60 transition-colors"
                          >
                            {paying ? "Submitting…" : "Submit Payment"}
                          </button>
                          <button
                            onClick={() => setPayingFor(null)}
                            className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
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
