"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Heart, Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { profileId, password, redirect: false });
    if (res?.error) {
      // NextAuth wraps thrown errors in res.error as "CredentialsSignin"
      // but the original message is passed through in some versions.
      // We check the raw error string for our sentinel codes.
      const raw = res.error ?? "";
      if (raw.includes("ACCOUNT_SUSPENDED")) {
        setError("Your account has been suspended. Please contact support.");
      } else if (raw.includes("ACCOUNT_BANNED")) {
        setError("Your account has been permanently banned. Please contact support.");
      } else if (raw.includes("ACCOUNT_INACTIVE")) {
        setError("Your account is inactive. Please contact support.");
      } else {
        setError("Invalid Profile ID or password. Please try again.");
      }
      setLoading(false);
      return;
    }
    // Redirect to callbackUrl if provided and it's a relative path (prevent open redirect)
    const callbackUrl = searchParams.get("callbackUrl");
    const destination = callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard";
    router.push(destination);
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-8 px-4 bg-gradient-to-br from-[#faf7f2] to-[#f5f0e8]">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-card-md">
            <Heart size={32} className="text-white fill-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-primary">Welcome Back</h1>
          <p className="mt-1.5 text-sm text-[#7c6b5e]">Sign in to your Regin Matrimony account</p>
        </div>

        {/* Form card */}
        <div className="card p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Profile ID</label>
              <input
                type="text"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value.toUpperCase())}
                placeholder="e.g. M0626H00042MC"
                required
                autoComplete="username"
                className="input-field font-mono tracking-wider"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label !mb-0">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-field pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c6b5e] hover:text-primary"
                  title={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Bottom links */}
        <div className="mt-5 text-center">
          <p className="text-sm text-[#7c6b5e]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register free
            </Link>
          </p>
        </div>

        {/* Decorative tagline */}
        <p className="mt-6 text-center font-serif text-xs italic text-[#b09880]">
          &ldquo;குடும்பம் பேசும் திருமண மேடை&rdquo;
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#faf7f2] to-[#f5f0e8]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
