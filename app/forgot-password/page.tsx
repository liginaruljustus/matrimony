"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Heart, Mail, ShieldCheck, CheckCircle,
  AlertCircle, RefreshCw, ArrowLeft,
} from "lucide-react";

type Step = "email" | "otp" | "done";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // OTP state
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError]   = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const otpRefs                   = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step, resendSeconds]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to send code. Please try again.");
      } else {
        setPendingEmail(email.trim().toLowerCase());
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setResendSeconds(RESEND_COOLDOWN);
        setStep("otp");
        // Focus first OTP box
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const verifyOtp = async (otpStr: string) => {
    if (otpStr.length < 6) { setOtpError("Enter the full 6-digit code."); return; }
    setOtpError("");
    setVerifying(true);
    try {
      const res  = await fetch("/api/auth/forgot-password/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: pendingEmail, otp: otpStr }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("done");
      } else {
        setOtpError(data.message ?? "Incorrect code. Please try again.");
        // 404 = OTP record expired/not found → restart from email
        // 429 = too many attempts → restart from email
        // 422 = password unrecoverable → stay on OTP screen (show message, no redirect)
        // 400 = wrong OTP → stay and retry
        if (res.status === 404 || res.status === 429) {
          setTimeout(() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }, 2500);
        }
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = () => verifyOtp(otp.join(""));

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendSeconds > 0) return;
    setResending(true);
    setOtpError("");
    try {
      const res  = await fetch("/api/auth/forgot-password/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtp(["", "", "", "", "", ""]);
        setResendSeconds(RESEND_COOLDOWN);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        setOtpError(data.message ?? "Failed to resend.");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── OTP input helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[i]     = digit;
    setOtp(next);
    setOtpError("");
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (digit && i === 5 && next.every(Boolean)) {
      setTimeout(() => verifyOtp(next.join("")), 50);
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      setOtpError("");
      otpRefs.current[5]?.focus();
      setTimeout(() => verifyOtp(pasted), 50);
    }
  };

  // ── Done screen ───────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#7a1f2b]">Credentials Sent!</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your login credentials have been sent to
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-800">{pendingEmail}</p>

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-xs text-blue-700">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-0.5">Open the email from Regin Matrimony to see your Profile ID and login password.</p>
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

  // ── OTP screen ────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a1f2b] shadow-lg">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[#7a1f2b]">Check your email</h1>
            <p className="mt-1 text-sm text-neutral-500">We sent a 6-digit code to</p>
            <p className="text-sm font-semibold text-neutral-800">{pendingEmail}</p>
          </div>

          <div className="rounded-2xl bg-white shadow-md ring-1 ring-neutral-200 p-6 space-y-5">
            {/* OTP boxes */}
            <div>
              <label className="mb-3 block text-center text-xs font-semibold text-neutral-600">
                Enter the 6-digit code
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`h-12 w-10 rounded-xl border-2 text-center text-lg font-bold outline-none transition-colors ${
                      digit
                        ? "border-[#7a1f2b] bg-[#7a1f2b]/5 text-[#7a1f2b]"
                        : "border-neutral-300 text-neutral-900 focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {otpError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerifyOtp}
              disabled={verifying || otp.join("").length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-semibold text-white hover:bg-[#6b1823] disabled:opacity-50 transition-colors"
            >
              {verifying ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying…
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Verify &amp; Recover Credentials
                </>
              )}
            </button>

            {/* Resend */}
            <div className="text-center text-xs text-neutral-500">
              {resendSeconds > 0 ? (
                <span>Resend code in <span className="font-semibold text-neutral-700">{resendSeconds}s</span></span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1 font-semibold text-[#7a1f2b] hover:underline disabled:opacity-50"
                >
                  <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                  {resending ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>

            {/* Back */}
            <button
              onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              ← Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Email entry screen ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a1f2b] shadow-lg">
            <Heart size={32} className="fill-white text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#7a1f2b]">Forgot Password?</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your registered email — we&apos;ll send a verification code.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-md ring-1 ring-neutral-200 p-6">
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-neutral-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
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
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-semibold text-white hover:bg-[#6b1823] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending…
                </>
              ) : (
                "Send Verification Code"
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
