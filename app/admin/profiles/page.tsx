"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Users, CheckCircle, AlertCircle, X } from "lucide-react";

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

type Profile = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userProfileId: string;
  profileType: string;
  profileStatus: string;
  contentScore: number;
  createdAt: string;
  flaggedReason?: string;
};

export default function AdminProfilesPage() {
  const router = useRouter();
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);

  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
      });

      const res = await fetch(`/api/admin/profiles?${params}`);
      if (!res.ok) throw new Error("Failed to fetch profiles");
      const data = await res.json();
      setProfiles(data.profiles);
      setTotal(data.total);
    } catch (err) {
      console.error("Error loading profiles:", err);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const columns: Column<Profile>[] = [
    {
      key: "userName",
      label: "Profile",
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.userName}</p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
          {row.flaggedReason && (
            <p className="mt-0.5 text-xs text-red-500 font-medium">⚑ {row.flaggedReason}</p>
          )}
        </div>
      ),
    },
    {
      key: "profileType",
      label: "Type",
      render: (value) => (
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Users size={16} />
          {value === "BRIDE" ? "Bride" : value === "GROOM" ? "Groom" : "—"}
        </div>
      ),
    },
    {
      key: "profileStatus",
      label: "Status",
      render: (value) => <StatusBadge status={value} type="profile" />,
    },
    {
      key: "contentScore",
      label: "Content Score",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition ${
                value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs font-semibold">{value}/100</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    },
  ];

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
              ? <CheckCircle size={16} className="text-green-600 shrink-0" />
              : <AlertCircle size={16} className="text-red-600 shrink-0" />}
            {t.message}
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <AdminHeader title="Profile Management" description="Review and approve user profiles" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
            <h3 className="font-bold text-slate-900">Filters</h3>

            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Name or email"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Profile Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Profile Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="BRIDE">Bride</option>
                <option value="GROOM">Groom</option>
              </select>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setFilters({ status: "", type: "", search: "" });
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-200 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="md:col-span-3">
          <DataTable<Profile>
            columns={columns}
            data={profiles}
            loading={loading}
            onRowClick={(row) => router.push(`/admin/profiles/${row.id}`)}
            actions={[
              {
                label: "Review",
                onClick: (row) => router.push(`/admin/profiles/${row.id}`),
                variant: "secondary",
              },
            ]}
            pagination={{
              page,
              total,
              perPage: limit,
              onPageChange: setPage,
              onPerPageChange: setLimit,
            }}
            emptyState="No profiles found"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
