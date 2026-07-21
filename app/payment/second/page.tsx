"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CreditCard, CheckCircle, Copy, AlertCircle,
  ArrowLeft, Smartphone, Building2, QrCode, Phone, ChevronRight,
} from "lucide-react";

type Method = "gpay" | "upi" | "bank";

type PaymentDetails = {
  upiId: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankAccountHolder: string;
};

type EligibleFav = {
  id: string;
  name: string;
  profileId: string;
  familyClass: string;
  amount: number;
};

const DETAIL_DEFAULTS: PaymentDetails = {
  upiId: "luramatrimony@upi",
  bankName: "State Bank of India",
  bankAccountNo: "",
  bankIfsc: "",
  bankAccountHolder: "Lura Matrimony Services",
};

const PAYMENT_AMT: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

function SecondPaymentContent() {
  const router     = useRouter();
  const { status } = useSession();
  const params     = useSearchParams();

  const urlId = params.get("id") ?? "";

  const [method, setMethod]         = useState<Method>("gpay");
  const [txnId, setTxnId]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState("");
  const [details, setDetails]       = useState<PaymentDetails>(DETAIL_DEFAULTS);

  const [eligible, setEligible]         = useState<EligibleFav[]>([]);
  const [loadingFavs, setLoadingFavs]   = useState(true);
  const [selectedId, setSelectedId]     = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setDetails({
            upiId:             d.upiId             ?? DETAIL_DEFAULTS.upiId,
            bankName:          d.bankName          ?? DETAIL_DEFAULTS.bankName,
            bankAccountNo:     d.bankAccountNo     ?? DETAIL_DEFAULTS.bankAccountNo,
            bankIfsc:          d.bankIfsc          ?? DETAIL_DEFAULTS.bankIfsc,
            bankAccountHolder: d.bankAccountHolder ?? DETAIL_DEFAULTS.bankAccountHolder,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load every bride ready for 2nd payment from the server — works even when
  // the page is opened cold from the nav menu, with no ?id= in the URL.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/inbox")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.inbox) return;
        const ready = (data.inbox as any[]).filter(
          (item) => item.adCard && !item.inboxFrozen && !item.secondPaidAt && !item.isBrideFrozen,
        );
        const mapped: EligibleFav[] = ready.map((item) => {
          const fc = item.adCard?.familyClass ?? "MC";
          return {
            id:          item.favoriteId,
            name:        item.adCard?.name ?? "Profile",
            profileId:   item.adCard?.profileId ?? "—",
            familyClass: fc,
            amount:      PAYMENT_AMT[fc] ?? 500,
          };
        });
        setEligible(mapped);
        // Fresh redirect from Inbox ("Pay for Contact Details") — honour ?id=
        if (urlId && mapped.some((f) => f.id === urlId)) {
          setSelectedId(urlId);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFavs(false));
  }, [status, urlId]);

  const selected = eligible.find((f) => f.id === selectedId) ?? null;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (!txnId.trim()) { setError("Please enter your transaction reference ID"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payment/second", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteId:    selected.id,
          transactionId: txnId.trim(),
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submission failed"); return; }
      setSubmitted(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingFavs) return <Loader />;

  if (submitted && selected) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={40} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800">Payment Submitted!</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Your 2nd payment for <strong>{selected.name}</strong> is under admin review.
          Contact details will be unlocked once approved.
        </p>
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-800">
          <p className="font-semibold">What happens next?</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            <li>Admin verifies your transaction ID</li>
            <li>Phone, WhatsApp &amp; contact person details are unlocked</li>
            <li>View them under Contact Details</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/contact-details" className="rounded-lg bg-[#7a1f2b] py-3 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors text-center flex items-center justify-center gap-2">
            <Phone size={15} /> View Contact Details
          </Link>
          <Link href="/inbox" className="rounded-lg border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-center">
            Back to Inbox
          </Link>
        </div>
      </div>
    );
  }

  // ── No profile selected yet: show the list of brides ready for 2nd payment ──
  if (!selected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/inbox"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft size={15} />
          Back to Inbox
        </Link>

        <h1 className="text-2xl font-bold text-[#7a1f2b]">2nd Payment</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Unlock contact details — pay for one profile at a time
        </p>

        {eligible.length === 0 ? (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <AlertCircle size={32} className="mx-auto text-neutral-300" />
            <p className="mt-3 font-semibold text-neutral-700">
              No profiles ready for 2nd payment
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              A bride becomes eligible once your 1st payment is approved and her
              30-day inbox period has ended.
            </p>
            <Link
              href="/inbox"
              className="mt-5 inline-block rounded-lg bg-[#7a1f2b] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
            >
              Go to My Inbox
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            {eligible.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-[#7a1f2b]/40 hover:bg-[#faf7f2]"
              >
                <div>
                  <p className="text-sm font-bold text-neutral-800">{f.name}</p>
                  <p className="text-xs font-mono text-neutral-400">{f.profileId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="rounded-full bg-[#7a1f2b]/10 px-2 py-0.5 text-[10px] font-bold text-[#7a1f2b]">{f.familyClass}</span>
                    <p className="mt-1 text-sm font-bold text-[#7a1f2b]">₹{f.amount.toLocaleString("en-IN")}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── A profile is selected: show the payment form ──
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back */}
      <button
        onClick={() => { setSelectedId(""); setError(""); setTxnId(""); }}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft size={15} />
        {eligible.length > 1 ? "Choose a different profile" : "Back to Inbox"}
      </button>

      <h1 className="text-2xl font-bold text-[#7a1f2b]">2nd Payment</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Unlock contact details for <strong>{selected.name}</strong> ({selected.profileId})
      </p>

      {/* What you unlock */}
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-xs font-semibold text-green-800 mb-2">You will unlock:</p>
        <ul className="space-y-1 text-xs text-green-700">
          <li className="flex items-center gap-1.5"><CheckCircle size={12} /> Phone number</li>
          <li className="flex items-center gap-1.5"><CheckCircle size={12} /> WhatsApp number</li>
          <li className="flex items-center gap-1.5"><CheckCircle size={12} /> Contact person name</li>
          <li className="flex items-center gap-1.5"><CheckCircle size={12} /> Email address (if provided)</li>
        </ul>
      </div>

      {/* Amount due */}
      <div className="mt-6 rounded-xl border-2 border-[#7a1f2b]/20 bg-[#faf7f2] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Due</p>
        <p className="mt-1 text-4xl font-extrabold text-[#7a1f2b]">
          ₹{selected.amount.toLocaleString("en-IN")}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">
          Based on {selected.familyClass} family-class tier
        </p>
      </div>

      {/* Payment method tabs */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-neutral-700">Choose Payment Method</p>
        <div className="grid grid-cols-3 gap-3">
          {(["gpay", "upi", "bank"] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all ${
                method === m
                  ? "border-[#7a1f2b] bg-[#7a1f2b] text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-[#7a1f2b]/40"
              }`}
            >
              {m === "gpay" && <Smartphone size={18} />}
              {m === "upi"  && <QrCode size={18} />}
              {m === "bank" && <Building2 size={18} />}
              {m === "gpay" ? "Google Pay" : m === "upi" ? "UPI / PhonePe" : "Bank Transfer"}
            </button>
          ))}
        </div>
      </div>

      {/* Payment details */}
      <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5">
        {(method === "gpay" || method === "upi") && (
          <div className="space-y-3">
            <InfoRow label="UPI ID" value={details.upiId} onCopy={() => copy(details.upiId, "upi")} copied={copied === "upi"} />
            <p className="text-xs text-neutral-400">
              Open Google Pay / PhonePe / any UPI app, send ₹{selected.amount.toLocaleString("en-IN")} to the UPI ID above,
              then enter the transaction ID below.
            </p>
          </div>
        )}
        {method === "bank" && (
          <div className="space-y-3">
            <InfoRow label="Account Holder" value={details.bankAccountHolder} />
            <InfoRow label="Bank" value={details.bankName} />
            {details.bankAccountNo && (
              <InfoRow label="Account No." value={details.bankAccountNo} onCopy={() => copy(details.bankAccountNo, "acc")} copied={copied === "acc"} />
            )}
            {details.bankIfsc && (
              <InfoRow label="IFSC" value={details.bankIfsc} onCopy={() => copy(details.bankIfsc, "ifsc")} copied={copied === "ifsc"} />
            )}
          </div>
        )}
      </div>

      {/* Transaction ID input */}
      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
          Transaction Reference ID *
        </label>
        <input
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          placeholder={
            method === "bank"
              ? "e.g. UTR1234567890"
              : "e.g. UPI transaction ID from your app"
          }
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-2 focus:ring-[#7a1f2b]/20"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Copy the transaction ID / UTR number from your payment app after sending.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !txnId.trim()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors disabled:opacity-50"
      >
        <CreditCard size={16} />
        {submitting ? "Submitting…" : "Submit Payment for Approval"}
      </button>

      <p className="mt-4 text-center text-xs text-neutral-400">
        Your payment will be manually verified by our team within 24 hours.
      </p>
    </div>
  );
}

function InfoRow({
  label, value, onCopy, copied,
}: {
  label: string; value: string; onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="text-sm font-bold text-neutral-800">{value}</p>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          {copied ? <CheckCircle size={12} className="text-green-600" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
    </div>
  );
}

export default function SecondPaymentPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SecondPaymentContent />
    </Suspense>
  );
}
