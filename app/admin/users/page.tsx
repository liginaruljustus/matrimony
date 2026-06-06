"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, CheckCircle, X, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DataTable, Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

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

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  name: string;
  email: string;
  profileId: string;
  profileType: string;
  status: string;
  verificationStatus: string;
  lastLogin: string;
  createdAt: string;
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BANNED", label: "Banned" },
  { value: "INACTIVE", label: "Inactive" },
];

const fmt = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);

  const [activeStatus, setActiveStatus] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search input → search state (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(activeStatus && { status: activeStatus }),
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, activeStatus, typeFilter, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleReset = () => {
    setActiveStatus("");
    setTypeFilter("");
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const isFiltered = !!(activeStatus || typeFilter || searchInput);

  const columns: Column<User>[] = [
    {
      key: "name",
      label: "User",
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "profileId",
      label: "Profile ID",
      render: (value) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "profileType",
      label: "Type",
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            value === "BRIDE"
              ? "bg-pink-100 text-pink-700"
              : value === "GROOM"
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {value === "BRIDE" ? "Bride" : value === "GROOM" ? "Groom" : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} type="user" />,
    },
    {
      key: "verificationStatus",
      label: "Verification",
      render: (value) => <StatusBadge status={value} type="verification" />,
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (value) => (
        <span className={value ? "text-slate-700" : "text-slate-400 italic"}>
          {value ? fmt(value) : "Never"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value) => fmt(value),
    },
  ];

  return (
    <AdminLayout>
      {/* Toasts */}
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
              : <XCircle size={16} className="text-red-600 shrink-0" />}
            {t.message}
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <AdminHeader title="User Management" description="Manage and monitor user accounts" />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Status pills */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveStatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                activeStatus === tab.value
                  ? "bg-[#7a1f2b] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
        >
          <option value="">All Types</option>
          <option value="BRIDE">Bride</option>
          <option value="GROOM">Groom</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Name, email, or profile ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
        </div>

        {/* Reset */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      <DataTable<User>
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        actions={[
          {
            label: "View",
            onClick: (row) => router.push(`/admin/users/${row.id}`),
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
        emptyState="No users found"
      />
    </AdminLayout>
  );
}
