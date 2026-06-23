"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, CheckCircle, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";

type Step = "form" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep]         = useState<Step>("form");
  const [profileId, setProfileId] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const id = profileId.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ profileId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
      } else {
        setStep("done");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#7a1f2b]">Credentials Sent!</h1>
          <p className="mt-2 text-sm text-neutral-500">
            If the Profile ID is registered, your login credentials have been sent to the associated email address.
          </p>

          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-xs text-blue-700">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-0.5">Open the email from Regin Matrimony to find your Profile ID and password.</p>
          </div>

          <Link
            href="/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-semibold text-white hover:bg-[#6b1823] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a1f2b] shadow-lg">
            <Heart size={32} className="fill-white text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#7a1f2b]">Resend Credentials</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your Profile ID and we&apos;ll send your login details to your registered email.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-md ring-1 ring-neutral-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Profile ID
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value.toUpperCase())}
                  placeholder="e.g. M0626H00042MC"
                  required
                  autoComplete="username"
                  className="w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-3 text-sm font-mono tracking-wider outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !profileId.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-semibold text-white hover:bg-[#6b1823] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending…
                </>
              ) : (
                "Resend My Credentials"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-[#7a1f2b]"
            >
              <ArrowLeft size={12} />
              Back to Login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center font-serif text-xs italic text-neutral-400">
          &ldquo;குடும்பம் பேசும் திருமண மேடை&rdquo;
        </p>
      </div>
    </div>
  );
}
