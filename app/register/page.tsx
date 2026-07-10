"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendOtpSchema } from "@/lib/validators";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import {
  CheckCircle, FileText, Key, AlertCircle, Heart,
  Copy, Phone, Mail, RefreshCw, ShieldCheck,
} from "lucide-react";

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  profileType: "BRIDE" | "GROOM";
  familyClass: "MC" | "UC" | "EC";
  religion: "HINDU" | "MUSLIM" | "CHRISTIAN" | "OTHER";
};

type Step = "form" | "otp" | "success";

const RESEND_COOLDOWN = 300; // seconds (5 minutes)

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep]             = useState<Step>("form");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]       = useState(false);

  // OTP step state
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError]     = useState("");
  const [verifying, setVerifying]   = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN);
  const [resending, setResending]   = useState(false);
  const otpRefs                     = useRef<(HTMLInputElement | null)[]>([]);

  // Credentials step state
  const [credentials, setCredentials] = useState<{ profileId: string; autoPassword: string } | null>(null);
  const [copied, setCopied]         = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);

  // Persisted form data for the resend flow
  const formDataRef = useRef<RegisterForm | null>(null);

  // Duplicate-email confirmation ("You already have N profiles with this email")
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ count: number } | null>(null);

  // ── Countdown timer for resend cooldown ──────────────────────────────────
  useEffect(() => {
    if (step !== "otp") return;
    if (resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step, resendSeconds]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(sendOtpSchema) });

  // ── Step 1: Submit form → send OTP ───────────────────────────────────────
  const sendOtp = async (values: RegisterForm, confirmDuplicate: boolean) => {
    setServerError("");
    setLoading(true);
    formDataRef.current = values;
    try {
      const res  = await fetch("/api/register/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...values, confirmDuplicate }),
      });
      const data = await res.json();
      if (res.ok) {
        setDuplicatePrompt(null);
        setPendingEmail(values.email);
        setResendSeconds(RESEND_COOLDOWN);
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setStep("otp");
      } else if (res.status === 409 && data.requiresConfirmation) {
        // Email already has account(s) — ask the user to confirm intentionally
        setDuplicatePrompt({ count: data.existingCount ?? 1 });
      } else {
        setServerError(data.message ?? "Failed to send OTP. Please try again.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values: RegisterForm) => sendOtp(values, false);

  // ── Step 2: Verify OTP → create account ──────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }
    setOtpError("");
    setVerifying(true);
    try {
      const res  = await fetch("/api/register/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: pendingEmail, otp: otpStr }),
      });
      const data = await res.json();
      if (res.ok && data.user?.profileId && data.user?.autoPassword) {
        setCredentials({ profileId: data.user.profileId, autoPassword: data.user.autoPassword });
        setStep("success");
      } else {
        setOtpError(data.message ?? "Incorrect OTP. Please try again.");
        // If too many attempts or expired, go back to form
        if (res.status === 404 || res.status === 429) {
          setTimeout(() => setStep("form"), 2000);
        }
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!formDataRef.current || resendSeconds > 0) return;
    setResending(true);
    setOtpError("");
    try {
      // confirmDuplicate: true — the user already confirmed before reaching the OTP step
      const res  = await fetch("/api/register/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...formDataRef.current, confirmDuplicate: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtp(["", "", "", "", "", ""]);
        setResendSeconds(RESEND_COOLDOWN);
        otpRefs.current[0]?.focus();
      } else {
        setOtpError(data.message ?? "Failed to resend OTP.");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── OTP input handlers ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError("");
    // Auto-advance
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (digit && index === 5 && next.every(Boolean)) {
      // Small delay so state settles
      setTimeout(() => handleVerifyOtpWithValues(next.join("")), 50);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      setOtpError("");
      otpRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOtpWithValues(pasted), 50);
    }
  };

  const handleVerifyOtpWithValues = async (otpStr: string) => {
    setOtpError("");
    setVerifying(true);
    try {
      const res  = await fetch("/api/register/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: pendingEmail, otp: otpStr }),
      });
      const data = await res.json();
      if (res.ok && data.user?.profileId && data.user?.autoPassword) {
        setCredentials({ profileId: data.user.profileId, autoPassword: data.user.autoPassword });
        setStep("success");
      } else {
        setOtpError(data.message ?? "Incorrect OTP. Please try again.");
        if (res.status === 404 || res.status === 429) {
          setTimeout(() => setStep("form"), 2000);
        }
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = async () => {
    if (!credentials) { router.push("/login"); return; }
    setAutoLoggingIn(true);
    try {
      const res = await signIn("credentials", {
        profileId: credentials.profileId,
        password: credentials.autoPassword,
        redirect: false,
      });
      if (!res?.error) {
        router.push("/dashboard");
      } else {
        // Fallback: manual login if auto-sign-in fails
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  };

  const handleCopy = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(
      `Profile ID: ${credentials.profileId}\nPassword: ${credentials.autoPassword}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fieldError =
    errors.name?.message ??
    errors.email?.message ??
    errors.phone?.message ??
    errors.profileType?.message ??
    errors.familyClass?.message ??
    errors.religion?.message;

  // ── Success / Credentials Screen ─────────────────────────────────────────
  if (step === "success" && credentials) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Success icon */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-[#7a1f2b]">Account Created!</h1>
            <p className="mt-1 text-sm text-neutral-500">Your credentials have been generated</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-100 shadow-md ring-1 ring-neutral-200 dark:ring-neutral-200 p-6 space-y-4">
            {/* Email sent notice */}
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 ring-1 ring-green-200">
              <Mail size={15} className="shrink-0 text-green-600" />
              <p className="text-xs font-medium text-green-700">
                Credentials also sent to <span className="font-bold">{pendingEmail}</span>
              </p>
            </div>

            {/* Profile ID */}
            <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={15} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-600">Your Profile ID</p>
              </div>
              <p className="font-mono text-lg font-bold text-blue-900 tracking-wider">
                {credentials.profileId}
              </p>
            </div>

            {/* Auto Password */}
            <div className="rounded-xl bg-purple-50 p-4 ring-1 ring-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Key size={15} className="text-purple-600" />
                <p className="text-xs font-semibold text-purple-600">Your Auto-Generated Password</p>
              </div>
              <p className="font-mono text-2xl font-bold text-purple-900 tracking-[0.3em]">
                {credentials.autoPassword}
              </p>
              <p className="mt-2 text-xs text-purple-500">
                Generated from your phone number, registration date &amp; name
              </p>
            </div>

            {/* Warning */}
            <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">
                  Save these credentials now. You&apos;ll need them to log in.
                  This password cannot be recovered.
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3 text-sm font-semibold text-white hover:bg-[#6b1823] transition-colors"
            >
              <Copy size={16} />
              {copied ? "Copied!" : "Copy Credentials"}
            </button>

            <button
              onClick={handleContinue}
              disabled={autoLoggingIn}
              className="w-full rounded-xl border-2 border-[#7a1f2b] py-2.5 text-sm font-semibold text-[#7a1f2b] hover:bg-[#7a1f2b]/5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {autoLoggingIn ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7a1f2b] border-t-transparent" />
                  Signing you in…
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── OTP Verification Screen ───────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a1f2b] shadow-lg">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[#7a1f2b]">Verify your email</h1>
            <p className="mt-1 text-sm text-neutral-500">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-neutral-800">{pendingEmail}</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-100 shadow-md ring-1 ring-neutral-200 dark:ring-neutral-200 p-6 space-y-5">
            {/* 6-box OTP input */}
            <div>
              <label className="mb-3 block text-center text-xs font-semibold text-neutral-600 dark:text-neutral-800">
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
                  Verify &amp; Create Account
                </>
              )}
            </button>

            {/* Resend */}
            <div className="text-center text-xs text-neutral-500">
              {resendSeconds > 0 ? (
                <span>Resend code in <span className="font-semibold text-neutral-700">{resendSeconds >= 60 ? `${Math.floor(resendSeconds / 60)}m ${resendSeconds % 60}s` : `${resendSeconds}s`}</span></span>
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
              onClick={() => { setStep("form"); setServerError(""); }}
              className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
            >
              ← Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-10">
      {/* Duplicate-email confirmation dialog */}
      {duplicatePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-100 p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-neutral-900">Email Already Registered</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              You already have{" "}
              <strong>
                {duplicatePrompt.count} profile{duplicatePrompt.count > 1 ? "s" : ""}
              </strong>{" "}
              registered with this email. You can create another profile (for example, for a
              family member) — each profile gets its own Profile ID and password.
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-800">
              Do you want to continue?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => formDataRef.current && sendOtp(formDataRef.current, true)}
                disabled={loading}
                className="flex-1 rounded-lg bg-[#7a1f2b] py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Yes, Continue"}
              </button>
              <button
                type="button"
                onClick={() => setDuplicatePrompt(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a1f2b] shadow-lg">
            <Heart size={32} className="fill-white text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-[#7a1f2b]">Create Account</h1>
          <p className="mt-1 text-sm text-neutral-500">Join thousands of Tamil families on Regin</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white dark:bg-neutral-100 shadow-md ring-1 ring-neutral-200 dark:ring-neutral-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-800">Full Name</label>
              <input
                {...register("name")}
                placeholder="e.g. Karthik Murugan"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-800">Email Address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
              />
              <p className="mt-1 text-[10px] text-neutral-400">
                A verification code will be sent to this address
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-800">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  {...register("phone")}
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
                />
              </div>
            </div>

            {/* Profile Type */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-800">Gender</label>
              <select
                {...register("profileType")}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
              >
                <option value="">Select...</option>
                <option value="GROOM">Male</option>
                <option value="BRIDE">Female</option>
              </select>
            </div>

            {/* Family Class */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-800">Family Class</label>
              <select
                {...register("familyClass")}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
              >
                <option value="">Select...</option>
                <option value="MC">Middle Class</option>
                <option value="UC">Upper Class</option>
                <option value="EC">Elite Class</option>
              </select>
            </div>

            {/* Religion */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-neutral-700 dark:text-neutral-800">Religion</label>
              <select
                {...register("religion")}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#7a1f2b] focus:ring-2 focus:ring-[#7a1f2b]/20"
              >
                <option value="">Select...</option>
                <option value="HINDU">Hindu</option>
                <option value="MUSLIM">Muslim</option>
                <option value="CHRISTIAN">Christian</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Error */}
            {(fieldError ?? serverError) && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
                <AlertCircle size={16} className="shrink-0" />
                <span>{fieldError ?? serverError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#7a1f2b] py-3 text-sm font-semibold text-white hover:bg-[#6b1823] disabled:opacity-60 transition-colors"
            >
              {loading ? "Sending code…" : "Send Verification Code"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#7a1f2b] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center font-serif text-xs italic text-neutral-400">
          &ldquo;குடும்பம் பேசும் திருமண மேடை&rdquo;
        </p>
      </div>
    </div>
  );
}
