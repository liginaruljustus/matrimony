"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  PencilLine, Clock, CheckCircle, AlertCircle, User, Lock, Unlock,
} from "lucide-react";

type EditRequest = {
  id: string;
  message: string;
  status: "PENDING" | "RESOLVED";
  createdAt: string;
  resolvedAt: string | null;
  isLocked: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    profileId: string;
    profileType: string;
  } | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function EditRequestsPage() {
  const [tab, setTab]           = useState<"PENDING" | "RESOLVED">("PENDING");
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [message, setMessage]   = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/edit-requests?status=${tab}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const handleUnlock = async (id: string) => {
    setResolvingId(id);
    setMessage(null);
    try {
      const res  = await fetch(`/api/admin/edit-requests/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setMessage({ text: data.error ?? "Failed to unlock", ok: false }); return; }
      setMessage({ text: "Profile unlocked — user notified.", ok: true });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setMessage({ text: "Network error", ok: false });
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#7a1f2b]">
            <PencilLine size={22} />
            Profile Edit Requests
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Users whose profile is locked can ask you to unlock it so they can edit it themselves
          </p>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
            message.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}>
            {message.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(["PENDING", "RESOLVED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-[#7a1f2b] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "PENDING" ? "Pending" : "Resolved"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <PencilLine size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-600">
              {tab === "PENDING" ? "No pending requests" : "No resolved requests yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7a1f2b]/10">
                      <User size={18} className="text-[#7a1f2b]" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{r.user?.name ?? "Unknown"}</p>
                      <p className="font-mono text-xs text-slate-400">{r.user?.profileId}</p>
                      <p className="text-xs text-slate-400">{r.user?.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.isLocked ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}>
                      {r.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                      {r.isLocked ? "Locked" : "Unlocked"}
                    </span>
                    <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                      <Clock size={10} />
                      {fmtDate(r.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    What they want to change
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{r.message}</p>
                </div>

                {r.status === "RESOLVED" ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <CheckCircle size={13} />
                    Unlocked on {r.resolvedAt ? fmtDate(r.resolvedAt) : "—"}
                  </p>
                ) : (
                  <button
                    onClick={() => handleUnlock(r.id)}
                    disabled={resolvingId === r.id || !r.isLocked}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#7a1f2b] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6b1823] disabled:opacity-50"
                  >
                    <Unlock size={14} />
                    {resolvingId === r.id
                      ? "Unlocking…"
                      : !r.isLocked
                        ? "Already unlocked"
                        : "Unlock Profile"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
