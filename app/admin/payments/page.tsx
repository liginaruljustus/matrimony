"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  CheckCircle, XCircle, Clock, CreditCard,
  Users, TrendingUp, AlertCircle, X,
  Smartphone, Building2, QrCode, ChevronDown, ChevronUp, Zap,
} from "lucide-react";

type Receiver = {
  id: string;
  name: string;
  profileId: string;
  familyClass: string;
};

type Payment = {
  id: string;
  amount: number;
  tier: "FIRST_PAYMENT" | "SECOND_PAYMENT" | string;
  transactionId: string;
  paymentMethod?: string;
  approvalStatus: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  autoApproved?: boolean;
  rejectionReason?: string;
  profileCount: number;
  payer: { id: string; name: string; email: string; profileId: string } | null;
  receivers: Receiver[];
};

// ── Toast ────────────────────────────────────────────────────────────────────
type Toast = { id: number; type: "success" | "error"; message: string };
let toastCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (type: Toast["type"], message: string) => {
    const id = ++toastCounter;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  return { toasts, success: (m: string) => push("success", m), error: (m: string) => push("error", m) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const TIER_LABEL: Record<string, string> = {
  FIRST_PAYMENT:  "1st Payment (MD→AD)",
  SECOND_PAYMENT: "2nd Payment (AD→CD)",
  BASIC:          "Basic",
  PROFILE_VIEW:   "Profile View",
  CONTACT_DETAILS:"Contact Details",
};

const TIER_COLOR: Record<string, string> = {
  FIRST_PAYMENT:  "bg-blue-50 text-blue-700",
  SECOND_PAYMENT: "bg-green-50 text-green-700",
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  gpay: <Smartphone size={12} />,
  upi:  <QrCode     size={12} />,
  bank: <Building2  size={12} />,
};

const CLASS_COLOR: Record<string, string> = {
  MC: "bg-blue-50 text-blue-700",
  UC: "bg-purple-50 text-purple-700",
  EC: "bg-amber-50 text-amber-700",
};

function fmt(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Main page (Suspense-wrapped) ─────────────────────────────────────────────
function PaymentsContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { toasts, success, error } = useToast();

  const [payments, setPayments]   = useState<Payment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [revenue, setRevenue] = useState({
    total: 0, count: 0, autoApproved: 0, manualApproved: 0, firstPayment: 0, secondPayment: 0,
  });
  const [tab, setTab]             = useState(params.get("tab") ?? "pending");
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/payments?tab=${tab}`);
      const data = await res.json();
      setPayments(data.payments ?? []);
      setTotalPending(data.totalPending ?? 0);
      if (data.revenue) setRevenue(data.revenue);
    } catch {
      error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleApprove = async (paymentId: string) => {
    setApprovingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error();
      success("Payment approved — AD cards unlocked");
      setPayments((p) => p.filter((x) => x.id !== paymentId));
      setTotalPending((n) => Math.max(0, n - 1));
    } catch {
      error("Failed to approve payment");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal?.id || !rejectModal.reason.trim()) return;
    setRejectingId(rejectModal.id);
    try {
      const res = await fetch(`/api/admin/payments/${rejectModal.id}/reject`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rejectionReason: rejectModal.reason }),
      });
      if (!res.ok) throw new Error();
      success("Payment rejected — user notified");
      setPayments((p) => p.filter((x) => x.id !== rejectModal.id));
      setTotalPending((n) => Math.max(0, n - 1));
      setRejectModal(null);
    } catch {
      error("Failed to reject payment");
    } finally {
      setRejectingId(null);
    }
  };

  // Stats
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const avgAmount   = payments.length ? Math.round(totalAmount / payments.length) : 0;

  return (
    <AdminLayout>
      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg text-white transition-all ${
              t.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {t.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {t.message}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#7a1f2b]">Payment Approvals</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Verify transaction IDs and approve / reject payment submissions
            </p>
          </div>
          {totalPending > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700">
              <Clock size={14} />
              {totalPending} pending
            </span>
          )}
        </div>

        {/* Revenue Summary — all-time, independent of which tab is selected */}
        <div className="rounded-2xl border border-[#7a1f2b]/15 bg-gradient-to-br from-[#faf7f2] to-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7a1f2b]">
            Total Revenue (All-Time Approved)
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-extrabold text-[#7a1f2b]">{fmt(revenue.total)}</p>
              <p className="text-xs text-neutral-500">{revenue.count} payment{revenue.count !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-800">{fmt(revenue.firstPayment)}</p>
              <p className="text-xs text-neutral-500">1st Payments</p>
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-800">{fmt(revenue.secondPayment)}</p>
              <p className="text-xs text-neutral-500">2nd Payments</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-lg font-bold text-neutral-800">
                {revenue.manualApproved}
                <span className="text-xs font-normal text-neutral-400">manual</span>
                <span className="mx-0.5 text-neutral-300">/</span>
                <Zap size={13} className="text-amber-500" />
                {revenue.autoApproved}
                <span className="text-xs font-normal text-neutral-400">auto</span>
              </p>
              <p className="text-xs text-neutral-500">Approval Source</p>
            </div>
          </div>
        </div>

        {/* Stats (pending tab only) */}
        {tab === "pending" && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<Clock size={20} className="text-amber-600" />}
              label="Pending Review"
              value={totalPending.toString()}
              bg="bg-amber-50"
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-green-600" />}
              label="Total Amount Due"
              value={fmt(totalAmount)}
              bg="bg-green-50"
            />
            <StatCard
              icon={<CreditCard size={20} className="text-blue-600" />}
              label="Avg Payment"
              value={fmt(avgAmount)}
              bg="bg-blue-50"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); router.replace(`/admin/payments?tab=${t}`, { scroll: false }); }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-white text-[#7a1f2b] shadow-sm"
                  : "text-neutral-600 hover:text-neutral-800"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "pending" && totalPending > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {totalPending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center">
            <CreditCard size={40} className="mb-3 text-neutral-200" strokeWidth={1.5} />
            <p className="font-semibold text-neutral-500">
              No {tab} payments
            </p>
            <p className="mt-0.5 text-sm text-neutral-400">
              {tab === "pending" ? "All caught up!" : `No ${tab} records found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const isExpanded  = expanded.has(payment.id);
              const isPending   = tab === "pending";

              return (
                <div
                  key={payment.id}
                  className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Main row */}
                  <div className="flex items-start gap-4 p-5">
                    {/* Left: Payer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-neutral-900">
                          {payment.payer?.name ?? "Unknown"}
                        </span>
                        <span className="font-mono text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                          {payment.payer?.profileId}
                        </span>
                        {/* Tier badge */}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          TIER_COLOR[payment.tier] ?? "bg-neutral-100 text-neutral-600"
                        }`}>
                          {TIER_LABEL[payment.tier] ?? payment.tier}
                        </span>
                        {/* Payment method */}
                        {payment.paymentMethod && (
                          <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 capitalize">
                            {METHOD_ICON[payment.paymentMethod]}
                            {payment.paymentMethod === "gpay" ? "Google Pay" : payment.paymentMethod === "upi" ? "UPI" : "Bank"}
                          </span>
                        )}
                      </div>

                      {/* Key data row */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-[#d4af37] font-bold text-base">{fmt(payment.amount)}</span>
                        <div>
                          <span className="text-xs text-neutral-400">Txn ID: </span>
                          <span className="font-mono text-xs text-neutral-700">{payment.transactionId}</span>
                        </div>
                        <div>
                          <span className="text-xs text-neutral-400">
                            {payment.profileCount} bride{payment.profileCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {fmtDate(payment.createdAt)}
                        </div>
                      </div>

                      {/* Rejection reason */}
                      {payment.rejectionReason && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
                          <span className="font-semibold">Rejection reason:</span> {payment.rejectionReason}
                        </p>
                      )}
                      {payment.approvedAt && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                          ✓ Approved on {fmtDate(payment.approvedAt)}
                          {payment.autoApproved && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              AUTO — never reviewed
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(payment.id)}
                            disabled={approvingId === payment.id}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                          >
                            <CheckCircle size={13} />
                            {approvingId === payment.id ? "Approving…" : "Approve"}
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: payment.id, reason: "" })}
                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </div>
                      )}
                      {/* Expand toggle (to see receivers) */}
                      {payment.receivers.length > 0 && (
                        <button
                          onClick={() => toggleExpand(payment.id)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400 hover:text-neutral-600"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? "Hide" : "Show"} brides
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: receivers list */}
                  {isExpanded && payment.receivers.length > 0 && (
                    <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                        Bride Profiles Included
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {payment.receivers.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1"
                          >
                            <span className="text-xs font-semibold text-neutral-800">{r.name}</span>
                            <span className="font-mono text-[10px] text-neutral-400">{r.profileId}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              CLASS_COLOR[r.familyClass] ?? "bg-neutral-100 text-neutral-600"
                            }`}>
                              {r.familyClass}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#7a1f2b]">Reject Payment</h3>
              <button
                onClick={() => setRejectModal(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-neutral-500">
              The user will be notified and can re-submit their payment with a valid transaction ID.
            </p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Reason for rejection (e.g. Invalid transaction ID, Amount mismatch…)"
              className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-2 focus:ring-[#7a1f2b]/20"
              rows={3}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectingId !== null || !rejectModal.reason.trim()}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {rejectingId ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode; label: string; value: string; bg: string;
}) {
  return (
    <div className={`rounded-xl border border-neutral-100 p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-neutral-800">{value}</p>
    </div>
  );
}

export default function AdminPaymentsPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
          </div>
        </AdminLayout>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
