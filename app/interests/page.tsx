"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, CheckCircle, XCircle, Clock,
  User, MapPin, Star, GraduationCap,
  RefreshCw, Trash2, AlertCircle,
} from "lucide-react";

type Interest = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    age: number | null;
    religion: string | null;
    caste: string | null;
    location: string | null;
    photos: string[];
  };
};

const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  icon: Clock,       color: "text-amber-600",  bg: "bg-amber-50  border-amber-200"  },
  ACCEPTED: { label: "Accepted", icon: CheckCircle, color: "text-green-700",  bg: "bg-green-50  border-green-200"  },
  DECLINED: { label: "Declined", icon: XCircle,     color: "text-red-600",    bg: "bg-red-50    border-red-200"    },
};

export default function InterestsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [interests, setInterests]   = useState<Interest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"ALL" | "PENDING" | "ACCEPTED" | "DECLINED">("ALL");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interests?type=sent");
      const data = await res.json();
      setInterests(data.interests ?? []);
    } catch {
      setInterests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") load();
  }, [status, load, router]);

  const handleWithdraw = async (interestId: string) => {
    const confirmed = window.confirm("Withdraw this interest? The bride will no longer see it.");
    if (!confirmed) return;
    setWithdrawing(interestId);
    setWithdrawError("");
    try {
      // Sending interest to same person with PENDING upserts — use DELETE-like workaround:
      // We'll re-send but with a status override via the interests API
      // Actually we need a DELETE endpoint — for now show a note
      // If no DELETE exists, we'll handle gracefully
      const res = await fetch(`/api/interests/${interestId}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 200) {
        setInterests((prev) => prev.filter((i) => i.id !== interestId));
      } else if (res.status === 404 || res.status === 405) {
        setWithdrawError("Withdrawal not available yet. Please contact support.");
      } else {
        const data = await res.json().catch(() => ({}));
        setWithdrawError(data.message ?? "Failed to withdraw");
      }
    } catch {
      setWithdrawError("Network error. Please try again.");
    } finally {
      setWithdrawing(null);
    }
  };

  const filtered = filter === "ALL"
    ? interests
    : interests.filter((i) => i.status === filter);

  const counts = {
    ALL:      interests.length,
    PENDING:  interests.filter((i) => i.status === "PENDING").length,
    ACCEPTED: interests.filter((i) => i.status === "ACCEPTED").length,
    DECLINED: interests.filter((i) => i.status === "DECLINED").length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#7a1f2b]">
            <Heart size={22} />
            Sent Interests
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {counts.ALL} interest{counts.ALL !== 1 ? "s" : ""} sent
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {(["PENDING", "ACCEPTED", "DECLINED"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className={`rounded-xl border p-3 ${cfg.bg}`}>
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                <Icon size={13} /> {cfg.label}
              </div>
              <p className={`mt-1 text-2xl font-extrabold ${cfg.color}`}>{counts[s]}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {(["ALL", "PENDING", "ACCEPTED", "DECLINED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filter === f
                ? "bg-[#7a1f2b] text-white"
                : "border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 text-neutral-600 dark:text-neutral-700 hover:border-[#7a1f2b]/30"
            }`}
          >
            {f === "ALL" ? "All" : STATUS_CONFIG[f].label} ({counts[f]})
          </button>
        ))}
      </div>

      {withdrawError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} />
          {withdrawError}
          <button onClick={() => setWithdrawError("")} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-neutral-600">
            {filter === "ALL" ? "No Interests Sent" : `No ${STATUS_CONFIG[filter].label} Interests`}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {filter === "ALL"
              ? "Browse profiles and send interests to get started."
              : "Try changing the filter above."}
          </p>
          {filter === "ALL" && (
            <Link
              href="/profiles"
              className="mt-5 rounded-lg bg-[#7a1f2b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
            >
              Browse Profiles
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((interest) => {
            const cfg  = STATUS_CONFIG[interest.status];
            const Icon = cfg.icon;
            const user = interest.otherUser;

            return (
              <div
                key={interest.id}
                className="flex items-start gap-4 overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-4 shadow-sm"
              >
                {/* Photo */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
                  {user.photos[0] ? (
                    <img src={user.photos[0]} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#7a1f2b]">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-neutral-900">{user.name}</h3>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {user.age && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <User size={10} /> {user.age} yrs
                          </span>
                        )}
                        {user.religion && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <Star size={10} className="text-[#d4af37]" />
                            {user.religion}{user.caste ? ` · ${user.caste}` : ""}
                          </span>
                        )}
                        {user.location && (
                          <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                            <MapPin size={10} className="text-[#7a1f2b]" /> {user.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                      <Icon size={10} /> {cfg.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-neutral-400">
                      Sent {new Date(interest.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profiles/${user.id}`}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
                      >
                        View Profile
                      </Link>
                      {interest.status === "PENDING" && (
                        <button
                          onClick={() => handleWithdraw(interest.id)}
                          disabled={withdrawing === interest.id}
                          className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={10} />
                          {withdrawing === interest.id ? "…" : "Withdraw"}
                        </button>
                      )}
                      {interest.status === "ACCEPTED" && (
                        <Link
                          href="/inbox"
                          className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
                        >
                          Go to Inbox
                        </Link>
                      )}
                    </div>
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
