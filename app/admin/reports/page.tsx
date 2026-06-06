"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  CheckCircle,
  X,
  RotateCcw,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type Report = {
  id: string;
  reason: string;
  description: string;
  status: string;
  priority: "high" | "medium" | "low";
  reporter: { name: string; email: string; profileId: string };
  reportedUser: { id: string; name: string; email: string; profileId: string; status: string };
  reportedProfile?: { profileType: string; profileStatus: string };
  action?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "OPEN",          label: "Open",          Icon: AlertCircle,  activeClass: "border-red-500 text-red-600",    dotClass: "bg-red-500"    },
  { value: "INVESTIGATING", label: "Investigating",  Icon: Search,       activeClass: "border-amber-500 text-amber-600", dotClass: "bg-amber-500"  },
  { value: "RESOLVED",      label: "Resolved",       Icon: CheckCircle2, activeClass: "border-green-600 text-green-700", dotClass: "bg-green-600"  },
  { value: "DISMISSED",     label: "Dismissed",      Icon: XCircle,      activeClass: "border-slate-400 text-slate-500", dotClass: "bg-slate-400"  },
] as const;

const PRIORITY: Record<string, { label: string; className: string }> = {
  high:   { label: "High",   className: "bg-red-100 text-red-700"     },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  low:    { label: "Low",    className: "bg-blue-100 text-blue-700"   },
};

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

export default function AdminReportsPage() {
  const [reports,         setReports]         = useState<Report[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [page,            setPage]            = useState(1);
  const [total,           setTotal]           = useState(0);
  const [limit,           setLimit]           = useState(25);
  const [status,          setStatus]          = useState("OPEN");
  const [search,          setSearch]          = useState("");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedReport,  setSelectedReport]  = useState<Report | null>(null);
  const [action,          setAction]          = useState<"resolve" | "suspend" | "ban" | null>(null);
  const [notes,           setNotes]           = useState("");
  const toast = useToast();

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data.reports);
      setTotal(data.total);
      setSelectedReports([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Single action ─────────────────────────────────────────────────────────
  const handleReportAction = async (reportId: string, newStatus: string, actionType?: string) => {
    try {
      const res = await fetch("/api/admin/reports", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reportId, status: newStatus, action: actionType, notes }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Report updated successfully");
      setNotes("");
      setAction(null);
      setSelectedReport(null);
      loadReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update report");
    }
  };

  // ── Bulk action ───────────────────────────────────────────────────────────
  const handleBulkAction = async (bulkAction: "resolve" | "dismiss") => {
    if (selectedReports.length === 0) {
      toast.error("Select at least one report first");
      return;
    }
    const verb = bulkAction === "resolve" ? "Resolve" : "Dismiss";
    if (!window.confirm(`${verb} ${selectedReports.length} report${selectedReports.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/reports", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: bulkAction, reportIds: selectedReports }),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      toast.success(`${selectedReports.length} report${selectedReports.length !== 1 ? "s" : ""} ${bulkAction}d`);
      setAction(null);
      setNotes("");
      loadReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to perform bulk action");
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: Column<Report>[] = [
    {
      key: "reason",
      label: "Report",
      render: (reason, row) => (
        <div>
          <p className="font-semibold text-slate-900 capitalize">{reason}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (priority) => {
        const cfg = PRIORITY[priority] ?? PRIORITY.low;
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "reportedUser",
      label: "Reported User",
      render: (user) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{user?.name ?? "—"}</p>
          <p className="text-xs text-slate-500 font-mono">{user?.profileId ?? ""}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} type="profile" />,
    },
    {
      key: "createdAt",
      label: "Reported",
      render: (value) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    },
  ];

  // ── Tab change ────────────────────────────────────────────────────────────
  const changeStatus = (s: string) => {
    setStatus(s);
    setPage(1);
    setSelectedReports([]);
  };

  const resetFilters = () => {
    setStatus("OPEN");
    setSearch("");
    setPage(1);
    setSelectedReports([]);
  };

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

      <AdminHeader title="Reports & Moderation" description="Review user reports and take moderation actions" />

      {/* ── Filters row ─────────────────────────────────────────────────── */}
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
            placeholder="Search reason or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] bg-white"
          />
        </div>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white transition"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      {selectedReports.length > 0 && status === "OPEN" && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm font-semibold text-amber-800">
            {selectedReports.length} report{selectedReports.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction("resolve")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle size={14} />
              Resolve All
            </button>
            <button
              onClick={() => handleBulkAction("dismiss")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              <X size={14} />
              Dismiss All
            </button>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <DataTable<Report>
        columns={columns}
        data={reports}
        loading={loading}
        onRowClick={(row) => setSelectedReport(row)}
        selectable={status === "OPEN"}
        selectedRows={selectedReports}
        onSelectedRowsChange={setSelectedReports}
        actions={[
          ...(status === "OPEN"
            ? [
                {
                  label: "Investigate",
                  onClick: (row: Report) => setSelectedReport(row),
                  variant: "secondary" as const,
                },
                {
                  label: "Resolve",
                  onClick: (row: Report) => { setSelectedReport(row); setAction("resolve"); },
                  variant: "success" as const,
                },
              ]
            : [
                {
                  label: "View",
                  onClick: (row: Report) => setSelectedReport(row),
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
        emptyState={`No ${status.toLowerCase()} reports found`}
      />

      {/* ── Report Detail Modal ──────────────────────────────────────────── */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                {/* Priority dot */}
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${
                    selectedReport.priority === "high"   ? "bg-red-500" :
                    selectedReport.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                >
                  {selectedReport.priority.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 capitalize">{selectedReport.reason}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedReport.id}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedReport(null); setAction(null); setNotes(""); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">

              {/* Status + Priority */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={selectedReport.status} type="profile" />
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY[selectedReport.priority]?.className ?? ""}`}>
                  {PRIORITY[selectedReport.priority]?.label ?? "—"} Priority
                </span>
              </div>

              {/* Description */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-slate-700">{selectedReport.description || "No description provided."}</p>
              </div>

              {/* Reporter / Reported side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Reporter</p>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                    <p className="font-semibold text-sm text-slate-900">{selectedReport.reporter?.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{selectedReport.reporter?.email}</p>
                    <p className="text-xs text-slate-400 font-mono">{selectedReport.reporter?.profileId}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Reported User</p>
                  <Link
                    href={`/admin/users/${selectedReport.reportedUser?.id}`}
                    className="block rounded-lg bg-slate-50 border border-slate-100 p-3 hover:bg-slate-100 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{selectedReport.reportedUser?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500">{selectedReport.reportedUser?.email}</p>
                        <p className="text-xs text-slate-400 font-mono">{selectedReport.reportedUser?.profileId}</p>
                      </div>
                      <StatusBadge status={selectedReport.reportedUser?.status} type="user" />
                    </div>
                  </Link>
                </div>
              </div>

              {/* Resolution info */}
              {selectedReport.resolvedAt && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Resolved</p>
                  <p className="text-sm text-green-700">
                    {new Date(selectedReport.resolvedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {selectedReport.resolvedBy && <> · by {selectedReport.resolvedBy}</>}
                  </p>
                </div>
              )}

              {/* Action taken */}
              {selectedReport.action && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Action Taken</p>
                  <p className="text-sm text-amber-700 capitalize">{selectedReport.action.toLowerCase()}</p>
                </div>
              )}

              {/* Action section — only for OPEN reports */}
              {selectedReport.status === "OPEN" && (
                <div className="border-t border-slate-200 pt-5 space-y-4">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Take Action</p>

                  <select
                    value={action || ""}
                    onChange={(e) => setAction((e.target.value as any) || null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  >
                    <option value="">Select action…</option>
                    <option value="resolve">Resolve report only</option>
                    <option value="suspend">Suspend user</option>
                    <option value="ban">Ban user</option>
                  </select>

                  {(action === "suspend" || action === "ban") && (
                    <textarea
                      placeholder="Notes about this action…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      rows={3}
                    />
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleReportAction(
                          selectedReport.id,
                          action === "resolve" ? "RESOLVED" : "INVESTIGATING",
                          action === "suspend" || action === "ban" ? action.toUpperCase() : undefined,
                        )
                      }
                      disabled={!action}
                      className="flex-1 px-4 py-2 bg-[#7a1f2b] text-white text-sm font-bold rounded-lg hover:bg-[#6b1823] disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {action === "resolve" ? "Resolve Report" :
                       action === "suspend" ? "Suspend User"   :
                       action === "ban"     ? "Ban User"       : "Select Action"}
                    </button>
                    <button
                      onClick={() => handleReportAction(selectedReport.id, "DISMISSED")}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                    >
                      Dismiss
                    </button>
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
