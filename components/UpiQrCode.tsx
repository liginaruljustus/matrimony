"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Scannable UPI QR code generated from the admin's UPI ID (Admin Settings),
 * with the amount pre-filled — works with Google Pay, PhonePe, PayTm, etc.
 */
export function UpiQrCode({
  upiId,
  amount,
  payeeName,
  note,
}: {
  upiId: string;
  amount: number;
  payeeName?: string;
  note?: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!upiId) { setSrc(""); return; }
    const params = new URLSearchParams({ pa: upiId, cu: "INR" });
    if (payeeName) params.set("pn", payeeName);
    if (amount > 0) params.set("am", amount.toFixed(2));
    if (note) params.set("tn", note);
    QRCode.toDataURL(`upi://pay?${params.toString()}`, { width: 220, margin: 1 })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [upiId, amount, payeeName, note]);

  if (!src) return null;

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`UPI QR code for ${upiId}`} className="h-44 w-44" />
      <p className="text-center text-[11px] text-neutral-500">
        Scan with any UPI app to pay ₹{amount.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
