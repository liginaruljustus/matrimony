"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendOtpSchema } from "@/lib/validators";
import Link from "next/link";
import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, Heart, Phone } from "lucide-react";

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  profileType: "BRIDE" | "GROOM";
  familyClass: "MC" | "UC" | "EC";
  religion: "HINDU" | "MUSLIM" | "CHRISTIAN" | "OTHER";
};

export default function RegisterPage() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);

  // Persisted form data for the duplicate-email confirmation retry
  const formDataRef = useRef<RegisterForm | null>(null);

  // Duplicate-email confirmation ("You already have N profiles with this email")
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ count: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(sendOtpSchema) });

  // Auto sign-in right after account creation, straight to the dashboard.
  const autoSignInAndRedirect = async (profileId: string, password: string) => {
    try {
      const res = await signIn("credentials", { profileId, password, redirect: false });
      window.location.href = res?.error ? "/login" : "/dashboard";
    } catch {
      window.location.href = "/login";
    }
  };

  const submitRegistration = async (values: RegisterForm, confirmDuplicate: boolean) => {
    setServerError("");
    setLoading(true);
    formDataRef.current = values;
    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...values, confirmDuplicate }),
      });
      const data = await res.json();
      if (res.ok && data.user?.profileId && data.user?.autoPassword) {
        setDuplicatePrompt(null);
        await autoSignInAndRedirect(data.user.profileId, data.user.autoPassword);
        return;
      } else if (res.status === 409 && data.requiresConfirmation) {
        // Email already has account(s) — ask the user to confirm intentionally
        setDuplicatePrompt({ count: data.existingCount ?? 1 });
      } else {
        setServerError(data.message ?? "Failed to register. Please try again.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (values: RegisterForm) => submitRegistration(values, false);

  const fieldError =
    errors.name?.message ??
    errors.email?.message ??
    errors.phone?.message ??
    errors.profileType?.message ??
    errors.familyClass?.message ??
    errors.religion?.message;

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
                onClick={() => formDataRef.current && submitRegistration(formDataRef.current, true)}
                disabled={loading}
                className="flex-1 rounded-lg bg-[#7a1f2b] py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors disabled:opacity-60"
              >
                {loading ? "Creating…" : "Yes, Continue"}
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
          <p className="mt-1 text-sm text-neutral-500">Join thousands of Tamil families on Lura</p>
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
                Your Profile ID and password will be emailed here
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
              {loading ? "Creating account…" : "Create Account"}
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
