"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clipboard } from "lucide-react";
import { TERMS_SECTIONS } from "@/components/legal/TermsContent";

export default function TermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    const res = await fetch("/api/terms/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("Failed to accept terms. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] bg-gradient-to-br from-[#fff9ef] to-[#fef6e4] dark:from-neutral-100 dark:to-neutral-100 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-card-md mb-4">
            <Clipboard size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Terms & Conditions</h1>
          <p className="mt-2 text-slate-600 dark:text-neutral-700">Please review and accept to continue</p>
        </div>

        {/* Content Card */}
        <div className="card p-8 space-y-6">
          {/* Terms Content */}
          <div className="max-h-96 overflow-y-auto space-y-6 pr-4">
            {TERMS_SECTIONS.map(({ title, body }) => (
              <section key={title}>
                <h2 className="text-lg font-bold text-primary mb-3">{title}</h2>
                <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-neutral-800 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
                  {body}
                </div>
              </section>
            ))}
          </div>

          {/* Acceptance Section */}
          <div className="border-t pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 h-5 w-5 rounded accent-primary cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-neutral-800">
                I have read and agree to the Terms & Conditions. I understand that I am responsible for the accuracy of the information provided and will comply with all rules of conduct.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!accepted || loading}
              className="w-full mt-6 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "I Agree & Continue"}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-neutral-700 mt-4">
              By accepting these terms, you agree to join our matrimony community and follow our code of conduct.
            </p>
            <p className="text-center text-xs text-slate-500 dark:text-neutral-700 mt-2">
              See also our{" "}
              <Link href="/privacy-policy" target="_blank" className="font-semibold text-primary underline">Privacy Policy</Link>
              {" "}and{" "}
              <Link href="/refund-policy" target="_blank" className="font-semibold text-primary underline">Refund Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
