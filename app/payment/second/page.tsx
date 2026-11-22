"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { RazorpayPayButton } from "@/components/RazorpayPayButton";
import { CheckCircle, AlertCircle, ArrowLeft, Phone, ChevronRight } from "lucide-react";
import { ProfileIdBadge } from "@/components/ProfileIdBadge";

type EligibleFav = {
  id: string;
  name: string;
  profileId: string;
  familyClass: string;
  amount: number;
};

const DEFAULT_PAYMENT_AMT: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

function SecondPaymentContent() {
  const router     = useRouter();
  const { status } = useSession();
  const params     = useSearchParams();

  const urlId = params.get("id") ?? "";

  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");
  const [paymentAmt, setPaymentAmt] = useState<Record<string, number>>(DEFAULT_PAYMENT_AMT);

  const [eligible, setEligible]         = useState<EligibleFav[]>([]);
  const [loadingFavs, setLoadingFavs]   = useState(true);
  const [selectedId, setSelectedId]     = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) setPaymentAmt(d.secondPaymentAmounts ?? DEFAULT_PAYMENT_AMT);
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
          (item) => item.adCard && !item.inboxFrozen && !item.secondPaidAt,
        );
        const mapped: EligibleFav[] = ready.map((item) => {
          const fc = item.adCard?.familyClass ?? "MC";
          return {
            id:          item.favoriteId,
            name:        item.adCard?.profileId ?? "Profile",
            profileId:   item.adCard?.profileId ?? "—",
            familyClass: fc,
            amount:      paymentAmt[fc] ?? 500,
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
  }, [status, urlId, paymentAmt]);

  const selected = eligible.find((f) => f.id === selectedId) ?? null;

  if (status === "loading" || loadingFavs) return <Loader />;

  if (submitted && selected) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={40} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800">Payment Successful!</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Thank you — your Final Payment for <strong>{selected.profileId}</strong> is confirmed.
          Her family&apos;s contact details are now unlocked.
        </p>
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-800">
          <p className="font-semibold">What happens next?</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            <li>Phone, WhatsApp &amp; contact person details are unlocked</li>
            <li>Her family also receives your contact details</li>
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

        <h1 className="text-2xl font-bold text-[#7a1f2b]">Final Payment</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Unlock contact details — pay for one profile at a time
        </p>

        {eligible.length === 0 ? (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <AlertCircle size={32} className="mx-auto text-neutral-300" />
            <p className="mt-3 font-semibold text-neutral-700">
              No profiles ready for Final Payment
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              A bride becomes eligible once your Initial Payment is approved and
              her waiting period has ended.
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
                  <p><ProfileIdBadge id={f.profileId} size="sm" /></p>
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
        onClick={() => { setSelectedId(""); setError(""); }}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft size={15} />
        {eligible.length > 1 ? "Choose a different profile" : "Back to Inbox"}
      </button>

      <h1 className="text-2xl font-bold text-[#7a1f2b]">Final Payment</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Unlock contact details for <ProfileIdBadge id={selected.profileId} size="xs" />
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

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="mt-6">
        <RazorpayPayButton
          orderBody={{ tier: "SECOND", favoriteId: selected.id }}
          amount={selected.amount}
          label={`Pay ₹${selected.amount.toLocaleString("en-IN")} Securely`}
          onPaid={() => setSubmitted(true)}
        />
      </div>
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
