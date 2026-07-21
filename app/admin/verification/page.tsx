"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  CheckCircle,
  X,
  Search,
  RotateCcw,
  ExternalLink,
  FileText,
  AlertCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationUser = {
  id: string;
  name: string;
  email: string;
  profileId: string;
  verificationStatus: string;
  documentCount: number;
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: string;
    rejectionReason?: string;
  }>;
  notes: string;
  createdAt: string;
};

type DocModal = { user: VerificationUser; documents: VerificationUser["documents"] };

// ─── Constants ────────────────────────────────────────────────────────────────

// value must match the User schema's verificationStatus enum (UNVERIFIED | VERIFIED | REJECTED)
const STATUS_TABS = [
  { value: "UNVERIFIED", label: "Pending",  Icon: Clock },
  { value: "VERIFIED",   label: "Verified", Icon: CheckCircle2 },
  { value: "REJECTED",   label: "Rejected", Icon: XCircle },
] as const;

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; type: "success" | "error"; message: string };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const add = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, []);
  return { toasts, dismiss, success: (m: string) => add("success", m), error: (m: string) => add("error", m) };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminVerificationPage() {
  const [users,         setUsers]         = useState<VerificationUser[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [total,         setTotal]         = useState(0);
  const [limit,         setLimit]         = useState(25);
  const [status,        setStatus]        = useState("UNVERIFIED");
  const [search,        setSearch]        = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [docModal,      setDocModal]      = useState<DocModal | null>(null);
  const [modalAction,   setModalAction]   = useState<"verify" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const toast = useToast();

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/verification?${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Single action ─────────────────────────────────────────────────────────
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/verification", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, status: newStatus, notes: rejectionReason }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(newStatus === "VERIFIED" ? "User verified successfully" : "Verification rejected");
      setRejectionReason("");
      setModalAction(null);
      setDocModal(null);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update verification");
    }
  };

  // ── Bulk action ───────────────────────────────────────────────────────────
  const handleBulkAction = async (bulkAction: "verify" | "reject") => {
    if (selectedUsers.length === 0) {
      toast.error("Select at least one user first");
      return;
    }
    try {
      const res = await fetch("/api/admin/verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: bulkAction, userIds: selectedUsers, rejectionReason }),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      toast.success(`${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""} ${bulkAction === "verify" ? "verified" : "rejected"}`);
      setRejectionReason("");
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to perform bulk action");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const changeStatus = (s: string) => { setStatus(s); setPage(1); setSelectedUsers([]); };

  const openModal = (row: VerificationUser) =>
    setDocModal({ user: row, documents: row.documents ?? [] });

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<VerificationUser>[] = [
    {
      key: "name",
      label: "User",
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
          <p className="text-xs text-slate-400 font-mono">{row.profileId}</p>
        </div>
      ),
    },
    {
      key: "documentCount",
      label: "Documents",
      render: (count) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <FileText size={11} />
          {count} doc{count !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "verificationStatus",
      label: "Status",
      render: (value) => <StatusBadge status={value} type="verification" />,
    },
    {
      key: "createdAt",
      label: "Submitted",
      render: (value) =>
        new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              t.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {t.type === "success"
              ? <CheckCircle  size={16} className="text-green-600 shrink-0" />
              : <AlertCircle  size={16} className="text-red-600 shrink-0" />}
            {t.message}
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <AdminHeader title="User Verification" description="Review and verify user documents" />

      {/* ── Filter row ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {STATUS_TABS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => changeStatus(value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                status === value
                  ? "bg-[#7a1f2b] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, or ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] bg-white"
          />
        </div>

        {/* Reset */}
        <button
          onClick={() => { setStatus("UNVERIFIED"); setSearch(""); setPage(1); setSelectedUsers([]); }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white transition"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      {selectedUsers.length > 0 && status === "UNVERIFIED" && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-amber-800">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => {
                  if (window.confirm(`Approve verification for ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}? Ensure you have reviewed their documents.`)) {
                    handleBulkAction("verify");
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
              >
                <CheckCircle size={14} />
                Approve All
              </button>
              <button
                onClick={() => setModalAction(modalAction === "reject" ? null : "reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
              >
                <X size={14} />
                {modalAction === "reject" ? "Cancel Reject" : "Reject All"}
              </button>
            </div>
          </div>
          {modalAction === "reject" && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Rejection reason (optional)…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] bg-white"
              />
              <button
                onClick={() => handleBulkAction("reject")}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition"
              >
                Confirm Reject
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <DataTable<VerificationUser>
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={openModal}
        selectable={status === "UNVERIFIED"}
        selectedRows={selectedUsers}
        onSelectedRowsChange={setSelectedUsers}
        actions={[
          ...(status === "UNVERIFIED"
            ? [
                {
                  label: "Review & Verify",
                  onClick: openModal,
                  variant: "success" as const,
                },
              ]
            : [
                {
                  label: "View",
                  onClick: openModal,
                  variant: "secondary" as const,
                },
              ]),
        ]}
        pagination={{
          page,
          total,
          perPage: limit,
          onPageChange: setPage,
          onPerPageChange: setLimit,
        }}
        emptyState={`No ${status.toLowerCase()} verifications found`}
      />

      {/* ── Document Preview Modal ───────────────────────────────────────── */}
      {docModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between rounded-t-xl">
              <div>
                <h3 className="font-bold text-slate-900">{docModal.user.name}</h3>
                <p className="text-sm text-slate-500">{docModal.user.email}</p>
                <p className="text-xs text-slate-400 font-mono">{docModal.user.profileId}</p>
              </div>
              <button
                onClick={() => { setDocModal(null); setModalAction(null); setRejectionReason(""); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">

              {/* Status */}
              <div className="flex items-center gap-3">
                <StatusBadge status={docModal.user.verificationStatus} type="verification" />
                <span className="text-xs text-slate-500">
                  Submitted {new Date(docModal.user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Documents ({docModal.documents.length})
                </p>
                {docModal.documents.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
                ) : (
                  <div className="space-y-3">
                    {docModal.documents.map((doc, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm text-slate-900 capitalize">
                            {doc.type || `Document ${idx + 1}`}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        {doc.rejectionReason && (
                          <div className="mb-3 rounded bg-red-50 border border-red-200 px-3 py-2">
                            <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                            <p className="text-xs text-red-600 mt-0.5">{doc.rejectionReason}</p>
                          </div>
                        )}
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                          >
                            <ExternalLink size={12} />
                            View Document
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin notes */}
              {docModal.user.notes && (
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Admin Notes</p>
                  <p className="text-sm text-slate-700">{docModal.user.notes}</p>
                </div>
              )}

              {/* Actions — only for unverified (pending review) */}
              {docModal.user.verificationStatus === "UNVERIFIED" && (
                <div className="border-t border-slate-200 pt-5 space-y-3">
                  {modalAction === "reject" && (
                    <>
                      <textarea
                        placeholder="Why are you rejecting this verification? (optional)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      />
                      {!rejectionReason.trim() && (
                        <p className="text-xs text-amber-600">
                          💡 Adding a reason helps the user know what to fix and resubmit.
                        </p>
                      )}
                    </>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatusChange(docModal.user.id, "VERIFIED")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7a1f2b] text-white text-sm font-bold rounded-lg hover:bg-[#6b1823] transition"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    {modalAction === "reject" ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(docModal.user.id, "REJECTED")}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition"
                        >
                          <X size={16} />
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => { setModalAction(null); setRejectionReason(""); }}
                          className="px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setModalAction("reject")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
