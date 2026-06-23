"use client";

import { useState } from "react";
import { Lock, Clock, X, CreditCard } from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";

type ContactDetailsGateProps = {
  profileId: string;
  receiverId: string;
  familyClass: string;
  canViewContact: boolean;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
  children: React.ReactNode;
  onPaymentUpdated?: () => void;
};

export function ContactDetailsGate({
  profileId,
  receiverId,
  familyClass,
  canViewContact,
  approvalStatus,
  rejectionReason,
  children,
  onPaymentUpdated,
}: ContactDetailsGateProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentRefreshed, setPaymentRefreshed] = useState(false);

  // If approved and can view, show content
  if (canViewContact && approvalStatus === "APPROVED") {
    return <>{children}</>;
  }

  const amounts: Record<string, number> = {
    MC: 500,
    UC: 2500,
    EC: 5000,
  };

  const amount = amounts[familyClass] || 500;

  // STATE 1: Not paid - show lock icon
  if (!approvalStatus) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
          <div className="bg-white dark:bg-neutral-100 rounded-xl p-6 shadow-xl max-w-sm mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Lock size={48} className="text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">Unlock Contact Details</h3>
            <p className="text-sm text-text-secondary mb-6">
              Get in touch with this profile to know more.
            </p>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="w-full btn-gold py-3 font-bold transition-fast hover:shadow-md"
            >
              <CreditCard size={16} className="mr-2 inline" />
              Unlock for ₹{amount}
            </button>
          </div>
        </div>
        {isPaymentOpen && (
          <PaymentDialog
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            receiverId={receiverId}
            amount={amount}
            profileId={profileId}
            onPaymentSubmitted={() => {
              setPaymentRefreshed(true);
              onPaymentUpdated?.();
            }}
          />
        )}
      </div>
    );
  }

  // STATE 2: Pending admin review - show hourglass
  if (approvalStatus === "PENDING_ADMIN_REVIEW") {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
          <div className="bg-white dark:bg-neutral-100 rounded-xl p-6 shadow-xl max-w-sm mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Clock size={48} className="text-warning animate-spin" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-warning mb-2">Pending Approval</h3>
            <p className="text-sm text-text-secondary">
              Your payment is under admin review. We&apos;ll notify you within 24 hours.
            </p>
            <button
              disabled
              className="w-full mt-6 rounded-lg bg-neutral-200 px-6 py-3 text-sm font-bold text-neutral-600 cursor-not-allowed opacity-60"
            >
              <Clock size={16} className="mr-2 inline" />
              Pending Approval
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATE 3: Rejected - show X icon and reason
  if (approvalStatus === "REJECTED") {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
          <div className="bg-white dark:bg-neutral-100 rounded-xl p-6 shadow-xl max-w-sm mx-auto text-center">
            <div className="flex justify-center mb-4">
              <X size={48} className="text-error" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-bold text-error mb-2">Payment Rejected</h3>
            <p className="text-sm text-text-secondary mb-6">
              {rejectionReason || "Your payment could not be verified."}
            </p>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="w-full btn-gold py-3 font-bold transition-fast hover:shadow-md"
            >
              <CreditCard size={16} className="mr-2 inline" />
              Try Again
            </button>
          </div>
        </div>
        {isPaymentOpen && (
          <PaymentDialog
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            receiverId={receiverId}
            amount={amount}
            profileId={profileId}
            onPaymentSubmitted={() => {
              setPaymentRefreshed(true);
              onPaymentUpdated?.();
            }}
          />
        )}
      </div>
    );
  }

  // Default: Not paid
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
        <div className="bg-white dark:bg-neutral-100 rounded-xl p-6 shadow-xl max-w-sm mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Lock size={48} className="text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">Unlock Contact Details</h3>
          <p className="text-sm text-text-secondary mb-6">
            Get in touch with this profile to know more.
          </p>
          <button
            onClick={() => setIsPaymentOpen(true)}
            className="w-full btn-gold py-3 font-bold transition-fast hover:shadow-md"
          >
            <CreditCard size={16} className="mr-2 inline" />
            Unlock for ₹{amount}
          </button>
        </div>
      </div>
      {isPaymentOpen && (
        <PaymentDialog
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          receiverId={receiverId}
          amount={amount}
          profileId={profileId}
          onPaymentSubmitted={() => {
            setPaymentRefreshed(true);
            onPaymentUpdated?.();
          }}
        />
      )}
    </div>
  );
}
