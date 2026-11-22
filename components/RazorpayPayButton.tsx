"use client";

/**
 * "Pay ₹X" button — opens Razorpay Checkout (UPI, cards, net banking, wallets).
 * 1. asks our server to create the order (the amount is set on the server),
 * 2. opens the Razorpay window,
 * 3. sends Razorpay's confirmation back to our server to verify and complete it.
 */
import { useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";

declare global {
  interface Window { Razorpay?: any }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_JS}"]`) as HTMLScriptElement | null;
    const s = existing ?? document.createElement("script");
    s.addEventListener("load", () => resolve(!!window.Razorpay));
    s.addEventListener("error", () => resolve(false));
    if (!existing) { s.src = CHECKOUT_JS; s.async = true; document.body.appendChild(s); }
  });
}

export function RazorpayPayButton({
  orderBody, amount, label, disabled, onPaid,
}: {
  /** Body for POST /api/payment/razorpay/order */
  orderBody: Record<string, unknown>;
  /** Amount shown on the button (₹) — the server decides the real amount */
  amount: number;
  label?: string;
  disabled?: boolean;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      if (!(await loadCheckout())) {
        setError("Could not open the payment window. Check your internet connection and try again.");
        return;
      }
      const res = await fetch("/api/payment/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });
      const order = await res.json();
      if (!res.ok) { setError(order.error ?? "Could not start the payment"); return; }

      await new Promise<void>((resolve) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "Lura Matrimony",
          description: order.description,
          prefill: order.prefill,
          theme: { color: "#7a1f2b" },
          modal: { ondismiss: () => resolve() },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              const v = await fetch("/api/payment/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
              const data = await v.json();
              if (v.ok) onPaid();
              else setError(data.error ?? "Payment could not be confirmed");
            } catch {
              setError("We received your payment but could not confirm it yet. It will be confirmed automatically — please don't pay again.");
            } finally {
              resolve();
            }
          },
        });
        rzp.on("payment.failed", (r: any) => {
          setError(r?.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. You can try again.");
        });
        rzp.open();
      });
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <button
        onClick={pay}
        disabled={busy || disabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a1f2b] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#6b1823] disabled:opacity-50"
      >
        <CreditCard size={16} />
        {busy ? "Opening payment…" : label ?? `Pay ₹${amount.toLocaleString("en-IN")}`}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500">
        <ShieldCheck size={13} className="text-green-600" />
        Secure payment by Razorpay — UPI, Google Pay, PhonePe, cards, net banking and wallets
      </p>
    </div>
  );
}
