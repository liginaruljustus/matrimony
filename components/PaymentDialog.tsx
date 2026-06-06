"use client";

import { useState } from "react";
import { Check, X, Loader, CreditCard } from "lucide-react";

type PaymentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  amount: number;
  profileId: string;
  onPaymentSubmitted?: () => void;
};

export function PaymentDialog({
  isOpen,
  onClose,
  receiverId,
  amount,
  profileId,
  onPaymentSubmitted,
}: PaymentDialogProps) {
  const [transactionId, setTransactionId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"form" | "processing" | "success" | "error">(
    "form"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      setErrorMessage("Please enter a transaction ID");
      return;
    }

    setIsProcessing(true);
    setStatus("processing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          tier: "CONTACT_DETAILS",
          transactionId: transactionId.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Payment submission failed");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        onPaymentSubmitted?.();
      }, 2500);
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred"
      );
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[var(--radius-2xl)] shadow-lg max-w-md w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Unlock Contact Details</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-neutral-400 hover:text-neutral-600 transition-fast disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {status === "form" && (
          <>
            {/* Amount */}
            <div className="text-center mb-8">
              <p className="text-sm text-text-secondary mb-2">Amount to Pay</p>
              <p className="text-5xl font-bold text-accent">₹{amount}</p>
            </div>

            {/* Transaction ID input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
                Transaction ID / Reference Number
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="e.g., TXNID123456789"
                className="w-full px-4 py-3 border border-neutral-200 rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-fast bg-white text-text-primary"
              />
              <p className="text-xs text-text-tertiary mt-2">
                Enter your bank's transaction or reference number from your payment confirmation
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-6 p-3 bg-error/10 border border-error/30 rounded-[var(--radius-lg)]">
                <p className="text-xs text-error">{errorMessage}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !transactionId.trim()}
              className="w-full rounded-[var(--radius-lg)] bg-gradient-to-r from-accent to-amber-500 px-6 py-3 font-bold text-white shadow-base transition-fast hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard size={16} />
              {isProcessing ? "Submitting..." : `Submit for Review ₹${amount}`}
            </button>

            <p className="text-center text-xs text-text-tertiary mt-4">
              Your payment will be reviewed by our admin team within 24 hours
            </p>
          </>
        )}

        {status === "processing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size={56} className="text-accent mb-4 animate-spin" strokeWidth={1.5} />
            <p className="text-text-secondary font-semibold">Submitting Payment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <Check size={40} className="text-success" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-2">Submitted!</h3>
            <p className="text-text-secondary text-center">
              Thank you! Your payment has been submitted for admin review. We'll notify you
              within 24 hours.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
              <X size={40} className="text-error" strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold text-error mb-2">Submission Failed</h3>
            <p className="text-text-secondary text-center mb-6">{errorMessage}</p>
            <button
              onClick={() => {
                setStatus("form");
                setTransactionId("");
                setErrorMessage("");
              }}
              className="rounded-[var(--radius-lg)] bg-primary px-6 py-2 font-semibold text-white transition-fast hover:shadow-md hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
