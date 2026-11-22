"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { RazorpayPayButton } from "@/components/RazorpayPayButton";
import { CheckCircle, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { ProfileIdBadge } from "@/components/ProfileIdBadge";

type LockedFav = {
  id: string;
  name: string;
  profileId: string;
  familyClass: string;
  amount: number;
  paymentLockExpiresAt: string | null;
};

const DEFAULT_PAYMENT_AMT: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

function PaymentContent() {
  const router    = useRouter();
  const { status } = useSession();


  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");
  const [paymentAmt, setPaymentAmt] = useState<Record<string, number>>(DEFAULT_PAYMENT_AMT);
  const [lockedFavs, setLockedFavs] = useState<LockedFav[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) setPaymentAmt(d.firstPaymentAmounts ?? DEFAULT_PAYMENT_AMT);
      })
      .catch(() => {}); // keep defaults on error
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load the user's payment-locked favorites from the server —
  // works even when the page is opened without ?ids= in the URL.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.favorites) return;
        // Every profile the groom has moved to Initial Payment is listed here and
        // paid for together — not just the ones from his latest selection.
        const locked = (data.favorites as any[]).filter(
          (f) => f.movedToPayment && !f.firstPaidAt && !f.lockExpired && !f.isBrideFrozen,
        );
        setLockedFavs(locked.map((f) => {
          const fc = f.mdCard?.familyClass ?? "MC";
          return {
            id:                   f.id,
            name:                 f.mdCard?.name ?? "Profile",
            profileId:            f.mdCard?.profileId ?? "—",
            familyClass:          fc,
            amount:               paymentAmt[fc] ?? 500,
            paymentLockExpiresAt: f.paymentLockExpiresAt ?? null,
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingFavs(false));
  }, [status, paymentAmt]);

  const favoriteIds = lockedFavs.map((f) => f.id);

  // Take one profile back out of this payment (it returns to Favourites)
  const [removingId, setRemovingId] = useState<string | null>(null);
  const removeFromPayment = async (id: string) => {
    setRemovingId(id);
    setError("");
    try {
      const res = await fetch("/api/favorites/move-to-payment", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ favoriteId: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not remove the profile");
        return;
      }
      setLockedFavs((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("Network error — please try again");
    } finally {
      setRemovingId(null);
    }
  };
  const totalAmount = lockedFavs.reduce((acc, f) => acc + f.amount, 0);

  if (status === "loading" || loadingFavs) return <Loader />;

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={40} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800">Payment Successful!</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Thank you — your payment is confirmed and your proposal has been sent to the selected brides.
        </p>
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-800">
          <p className="font-semibold">What happens next?</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            <li>Each bride sees your proposal and can accept it</li>
            <li>You are notified as soon as a bride accepts</li>
            <li>The brides are added to your Inbox permanently — no expiry</li>
            <li>Their additional details are shown after the waiting period</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/favorites" className="rounded-lg bg-[#7a1f2b] py-3 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors text-center">
            View in Favourites
          </Link>
          <Link href="/profiles" className="rounded-lg border border-neutral-200 dark:border-neutral-200 py-3 text-sm font-semibold text-neutral-700 dark:text-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors text-center">
            Browse More Brides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back */}
      <Link
        href="/favorites"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft size={15} />
        Back to Favourites
      </Link>

      <h1 className="text-2xl font-bold text-[#7a1f2b]">Initial Payment</h1>
      <p className="mt-1 text-sm text-neutral-500">
        To send your profile details to prospective brides.
      </p>

      {/* Empty state — nothing awaiting payment */}
      {lockedFavs.length === 0 && (
        <div className="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-neutral-300" />
          <p className="mt-3 font-semibold text-neutral-700 dark:text-neutral-800">
            No profiles awaiting payment
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Move favourites to payment first, or the payment lock may have expired.
          </p>
          <Link
            href="/favorites"
            className="mt-5 inline-block rounded-lg bg-[#7a1f2b] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
          >
            Go to My Favourites
          </Link>
        </div>
      )}

      {lockedFavs.length > 0 && (
      <>
      {/* Profiles being paid for */}
      <div className="mt-6 rounded-xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Profiles in this payment
        </p>
        <p className="-mt-2 mb-3 text-[11px] text-neutral-400">
          All profiles you moved to Initial Payment are paid together.{" "}
          <Link href="/favorites" className="font-semibold text-[#7a1f2b] underline">Add more from Favourites</Link>
        </p>
        <div className="space-y-2.5">
          {lockedFavs.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg bg-neutral-50 dark:bg-neutral-200 px-3 py-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <Lock size={11} className="text-[#7a1f2b]" />
                  <p><ProfileIdBadge id={f.profileId} size="sm" /></p>
                </div>
                {f.paymentLockExpiresAt && (
                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    The deadline for payment is {new Date(f.paymentLockExpiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}; if you do not make the payment within the specified time, the selected profiles will automatically revert to the &apos;Favourites&apos; section.
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="rounded-full bg-[#7a1f2b]/10 px-2 py-0.5 text-[10px] font-bold text-[#7a1f2b]">{f.familyClass}</span>
                <p className="mt-1 text-sm font-bold text-[#7a1f2b]">₹{f.amount.toLocaleString("en-IN")}</p>
                <button
                  type="button"
                  onClick={() => removeFromPayment(f.id)}
                  disabled={removingId !== null}
                  className="mt-1 text-[11px] font-semibold text-neutral-500 underline hover:text-red-600 disabled:opacity-50"
                >
                  {removingId === f.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amount due */}
      <div className="mt-6 rounded-xl border-2 border-[#7a1f2b]/20 bg-[#faf7f2] dark:bg-neutral-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Due</p>
        <p className="mt-1 text-4xl font-extrabold text-[#7a1f2b]">
          ₹{totalAmount.toLocaleString("en-IN")}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {favoriteIds.length} profile{favoriteIds.length !== 1 ? "s" : ""} × respective family-class fee
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
          orderBody={{ tier: "FIRST", favoriteIds }}
          amount={totalAmount}
          label={`Pay ₹${totalAmount.toLocaleString("en-IN")} Securely`}
          disabled={favoriteIds.length === 0}
          onPaid={() => setSubmitted(true)}
        />
      </div>
      </>
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

export default function FirstPaymentPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PaymentContent />
    </Suspense>
  );
}
