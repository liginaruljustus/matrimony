"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getServerSession } from "next-auth";
import { Clipboard } from "lucide-react";
import { authOptions } from "@/lib/auth";

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
    <div className="min-h-[calc(100vh-9rem)] bg-gradient-to-br from-[#fff9ef] to-[#fef6e4] py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-card-md mb-4">
            <Clipboard size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Terms & Conditions</h1>
          <p className="mt-2 text-slate-600">Please review and accept to continue</p>
        </div>

        {/* Content Card */}
        <div className="card p-8 space-y-6">
          {/* Terms Content */}
          <div className="max-h-96 overflow-y-auto space-y-6 pr-4">
            <section>
              <h2 className="text-lg font-bold text-primary mb-3">1. Introduction</h2>
              <p className="text-slate-700 leading-relaxed">
                Welcome to Regin Matrimony (hereinafter &ldquo;the Platform&rdquo;). These Terms &amp; Conditions govern your use of our matrimony service. By registering and using our platform, you agree to comply with these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">2. User Eligibility</h2>
              <ul className="space-y-2 text-slate-700">
                <li>• You must be 18 years or older to use this platform</li>
                <li>• You must be a legal resident of the region where the platform operates</li>
                <li>• You agree to provide truthful and accurate information</li>
                <li>• You are responsible for maintaining the confidentiality of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">3. Profile Information</h2>
              <p className="text-slate-700 leading-relaxed">
                You agree to provide accurate, complete, and genuine information in your profile. You are solely responsible for any false or misleading information. The Platform reserves the right to verify information and remove profiles found to be fraudulent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">4. Code of Conduct</h2>
              <p className="text-slate-700 leading-relaxed mb-2">You agree NOT to:</p>
              <ul className="space-y-2 text-slate-700">
                <li>• Engage in any form of harassment, abuse, or discrimination</li>
                <li>• Use the platform for any illegal or unethical purposes</li>
                <li>• Impersonate another person or entity</li>
                <li>• Collect or misuse personal information of other users</li>
                <li>• Spam or send unsolicited messages</li>
                <li>• Share explicit, offensive, or inappropriate content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">5. Payment & Fees</h2>
              <ul className="space-y-2 text-slate-700">
                <li>• Profile creation and basic browsing are free</li>
                <li>• Premium features require payment as per fee structure</li>
                <li>• All payments are non-refundable unless stated otherwise</li>
                <li>• The Platform uses secure payment gateways for transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">6. Privacy & Data Protection</h2>
              <p className="text-slate-700 leading-relaxed">
                We are committed to protecting your personal information. Your data will be used only for matrimony matching purposes and as disclosed in our Privacy Policy. We implement industry-standard security measures to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">7. Limitation of Liability</h2>
              <p className="text-slate-700 leading-relaxed">
                The Platform is provided &ldquo;as is&rdquo; without any warranties. We are not responsible for any direct, indirect, or consequential damages arising from your use of the platform, including decisions made based on profile information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">8. Dispute Resolution</h2>
              <p className="text-slate-700 leading-relaxed">
                Any disputes arising from the use of this platform shall be governed by the laws of the jurisdiction where the platform operates. Users agree to resolve disputes through amicable negotiation or legal proceedings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">9. Termination</h2>
              <p className="text-slate-700 leading-relaxed">
                The Platform reserves the right to terminate or suspend your account if you violate these terms or engage in any prohibited activities.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-3">10. Changes to Terms</h2>
              <p className="text-slate-700 leading-relaxed">
                We may update these Terms & Conditions from time to time. Continued use of the platform constitutes your acceptance of the updated terms.
              </p>
            </section>
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
              <span className="text-sm text-slate-700">
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

            <p className="text-center text-xs text-slate-500 mt-4">
              By accepting these terms, you agree to join our matrimony community and follow our code of conduct.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
