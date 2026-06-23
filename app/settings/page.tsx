"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Lock, Unlock, AlertCircle, CheckCircle,
  Eye, EyeOff, Shield, Clock,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isFrozen, setIsFrozen]     = useState(false);
  const [isAutoFrozen, setIsAutoFrozen] = useState(false);
  const [frozenAt, setFrozenAt]     = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [action, setAction]         = useState<"freeze" | "unfreeze">("freeze");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ ok: boolean; message: string } | null>(null);


  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
  }, [status, router]);

  // Load current freeze status from session/API
  useEffect(() => {
    if (status !== "authenticated") return;
    const load = async () => {
      try {
        const res  = await fetch("/api/user/profile");
        const data = await res.json();
        const u    = data.user ?? data;
        setIsFrozen(!!u.isFrozen);
        setIsAutoFrozen(!!u.isAutoFrozen);
        setFrozenAt(u.frozenAt ?? u.autoFrozenAt ?? null);
        setAction(u.isFrozen || u.isAutoFrozen ? "unfreeze" : "freeze");
      } catch {
        // ignore
      } finally {
        setLoadingStatus(false);
      }
    };
    void load();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res  = await fetch("/api/profile/freeze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: data.message });
        setIsFrozen(action === "freeze");
        setIsAutoFrozen(false);
        setAction(action === "freeze" ? "unfreeze" : "freeze");
        setPassword("");
      } else {
        setResult({ ok: false, message: data.error ?? "Failed" });
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingStatus) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  const frozen = isFrozen || isAutoFrozen;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[#7a1f2b]">Profile Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">Manage your profile visibility and account security.</p>

      {/* Current status card */}
      <div className={`mt-6 rounded-2xl border p-5 ${
        frozen
          ? "border-amber-200 bg-amber-50"
          : "border-green-200 bg-green-50"
      }`}>
        <div className="flex items-center gap-3">
          {frozen ? (
            <Lock size={22} className="text-amber-700" />
          ) : (
            <Shield size={22} className="text-green-700" />
          )}
          <div>
            <p className={`font-bold ${frozen ? "text-amber-800" : "text-green-800"}`}>
              {isFrozen
                ? "Your profile is frozen"
                : isAutoFrozen
                ? "Your profile was auto-frozen (inactivity)"
                : "Your profile is active"}
            </p>
            {frozen && frozenAt && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                <Clock size={11} />
                Since {new Date(frozenAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {isAutoFrozen && (
          <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800">
            <strong>Auto-frozen due to inactivity.</strong> You can unfreeze within 90 days of the freeze date.
            After 90 days, please contact support.
          </div>
        )}
      </div>

      {/* Freeze / Unfreeze form */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-neutral-800">
          {frozen ? "Unfreeze Profile" : "Freeze Profile"}
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          {frozen
            ? "Enter your password to make your profile visible again to other users."
            : "Freezing hides your profile from search results. No one can view or favourite you while frozen."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
              Your Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 pr-10 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-2 focus:ring-[#7a1f2b]/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Result message */}
          {result && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              result.ok
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}>
              {result.ok
                ? <CheckCircle size={15} />
                : <AlertCircle size={15} />}
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              frozen
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#7a1f2b] hover:bg-[#6b1823]"
            }`}
          >
            {frozen ? <Unlock size={15} /> : <Lock size={15} />}
            {submitting
              ? "Processing…"
              : frozen
              ? "Unfreeze My Profile"
              : "Freeze My Profile"}
          </button>
        </form>
      </div>

      {/* Info box */}
      {!frozen && (
        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
          <p className="font-semibold text-neutral-600">Auto-freeze policy</p>
          <p className="mt-0.5">
            {(session?.user as any)?.profileType === "GROOM"
              ? "Your profile will be auto-frozen if you are inactive for 90 days."
              : (session?.user as any)?.profileType === "BRIDE"
              ? "Your profile will be auto-frozen if you are inactive for 60 days."
              : "Your profile will be auto-frozen after a period of inactivity."}
          </p>
        </div>
      )}
    </div>
  );
}
