"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard, CheckCircle, Clock, XCircle,
  AlertCircle, RefreshCw, Receipt,
} from "lucide-react";

type Payment = {
  _id: string;
  amount: number;
  tier: "FIRST_PAYMENT" | "SECOND_PAYMENT" | string;
  status: string;
  approvalStatus: "PENDING_ADMIN_REVIEW" | "APPROVED" | "REJECTED" | string;
  transactionId: string;
  paymentMethod: string;
  paymentDate: string;
  createdAt: string;
  receiverIds?: string[];
};

const TIER_LABEL: Record<string, string> = {
  FIRST_PAYMENT:  "1st Payment – Inbox Unlock",
  SECOND_PAYMENT: "2nd Payment – Contact Details",
};

const APPROVAL_CONFIG = {
  PENDING_ADMIN_REVIEW: {
    label: "Under Review",
    icon:  Clock,
    color: "text-amber-700",
    bg:    "bg-amber-50 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    icon:  CheckCircle,
    color: "text-green-700",
    bg:    "bg-green-50 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    icon:  XCircle,
    color: "text-red-600",
    bg:    "bg-red-50 border-red-200",
  },
};

const METHOD_LABEL: Record<string, string> = {
  gpay: "Google Pay",
  upi:  "UPI / PhonePe",
  bank: "Bank Transfer",
};

export default function PaymentHistoryPage() {
  const { status } = useSession();
  const router     = useRouter();

  const [payments, setPayments]   = useState<Payment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<"ALL" | "PENDING_ADMIN_REVIEW" | "APPROVED" | "REJECTED">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/payments");
      const data = await res.json();
      setPayments(data.payments ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") load();
  }, [status, load, router]);

  const filtered = filter === "ALL"
    ? payments
    : payments.filter((p) => p.approvalStatus === filter);

  const totals = {
    paid:    payments.filter((p) => p.approvalStatus === "APPROVED").reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.approvalStatus === "PENDING_ADMIN_REVIEW").length,
    count:   payments.length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#7a1f2b]">
            <Receipt size={22} />
            Payment History
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {totals.count} payment{totals.count !== 1 ? "s" : ""} submitted
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Total Paid</p>
          <p className="mt-1 text-xl font-extrabold text-[#7a1f2b]">₹{totals.paid.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Pending Review</p>
          <p className="mt-1 text-xl font-extrabold text-amber-700">{totals.pending}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Total Payments</p>
          <p className="mt-1 text-xl font-extrabold text-neutral-800">{totals.count}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL",                  label: "All" },
          { key: "PENDING_ADMIN_REVIEW", label: "Under Review" },
          { key: "APPROVED",             label: "Approved" },
          { key: "REJECTED",             label: "Rejected" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filter === f.key
                ? "bg-[#7a1f2b] text-white"
                : "border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 text-neutral-600 dark:text-neutral-700 hover:border-[#7a1f2b]/30"
            }`}
          >
            {f.label} ({f.key === "ALL" ? payments.length : payments.filter((p) => p.approvalStatus === f.key).length})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CreditCard size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-neutral-600">No Payments Found</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {filter === "ALL"
              ? "You haven't submitted any payments yet."
              : "No payments match this filter."}
          </p>
          {filter === "ALL" && (
            <Link
              href="/favorites"
              className="mt-5 rounded-lg bg-[#7a1f2b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
            >
              Go to Favourites
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => {
            const cfg  = APPROVAL_CONFIG[payment.approvalStatus as keyof typeof APPROVAL_CONFIG]
              ?? APPROVAL_CONFIG.PENDING_ADMIN_REVIEW;
            const Icon = cfg.icon;

            return (
              <div
                key={payment._id}
                className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-200 bg-white dark:bg-neutral-100 shadow-sm"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7a1f2b]/10">
                    <CreditCard size={18} className="text-[#7a1f2b]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-900">
                          {TIER_LABEL[payment.tier] ?? payment.tier}
                        </p>
                        <p className="text-xs text-neutral-500">
                          via {METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-extrabold text-[#7a1f2b]">
                          ₹{payment.amount.toLocaleString("en-IN")}
                        </p>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                          <Icon size={9} /> {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
                      <span>
                        Txn ID: <span className="font-mono font-semibold text-neutral-600">{payment.transactionId}</span>
                      </span>
                      <span>
                        {new Date(payment.paymentDate ?? payment.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>

                    {payment.approvalStatus === "REJECTED" && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertCircle size={12} />
                        Payment was rejected. Please contact support if this is an error.
                      </div>
                    )}

                    {payment.approvalStatus === "PENDING_ADMIN_REVIEW" && (
                      <p className="mt-1.5 text-[11px] text-amber-600">
                        Under review — typically approved within 24 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
