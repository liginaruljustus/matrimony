"use client";

import { signOut } from "next-auth/react";
import { ShieldAlert, Mail } from "lucide-react";

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2] dark:bg-neutral-100 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100">
          <ShieldAlert size={40} className="text-red-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-neutral-900">Account Suspended</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          Your account has been suspended or is no longer active.
          Please contact our support team to resolve this.
        </p>

        <a
          href="mailto:support@luramatrimony.com"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7a1f2b] px-6 py-3 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
        >
          <Mail size={15} />
          Contact Support
        </a>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 block w-full rounded-xl border border-neutral-200 dark:border-neutral-200 py-3 text-sm font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
