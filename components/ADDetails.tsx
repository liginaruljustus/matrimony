"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/**
 * Additional Details (AD) — every field marked "AD" in the profile spec,
 * unlocked for the other side once the 1st payment is approved.
 */

const fmt = (v: any) => (v !== null && v !== undefined && v !== "" ? String(v) : "—");
const fmtFS = (v: any) =>
  v === "MC" ? "Middle Class" : v === "UC" ? "Upper Class" : v === "EC" ? "Elite Class" : fmt(v);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-800">{value}</p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-neutral-200 pt-2 first:border-t-0 first:pt-0">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#7a1f2b]">{title}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">{children}</div>
    </div>
  );
}

export function ADDetailsGrid({ card }: { card: any }) {
  const gender =
    card.gender === "MALE" ? "Male" : card.gender === "FEMALE" ? "Female" : fmt(card.gender);
  return (
    <div className="space-y-3">
      <Group title="Personal Details">
        <Field label="Native District"  value={fmt(card.district)} />
        <Field label="Marital Status"   value={fmt(card.maritalStatus?.replace("_", " "))} />
        <Field label="Gender"           value={gender} />
        <Field label="Age"              value={card.age ? `${card.age} yrs` : "—"} />
        <Field label="Religion"         value={fmt(card.religion)} />
        <Field label="Caste"            value={fmt(card.caste)} />
        <Field label="Sub Caste"        value={fmt(card.subCaste)} />
        <Field label="Place of Birth"   value={fmt(card.placeOfBirth)} />
        <Field label="Time of Birth"    value={fmt(card.timeOfBirth)} />
        <Field label="Rashi"            value={fmt(card.rashi)} />
        <Field label="Nakshatra"        value={fmt(card.nakshatra)} />
        <Field label="Lagnam"           value={fmt(card.lagnam)} />
        <Field label="Mother Tongue"    value={fmt(card.motherTongue)} />
        <Field label="Height"           value={card.height ? `${card.height} cm` : "—"} />
        <Field label="Weight"           value={card.weight ? `${card.weight} kg` : "—"} />
        <Field label="Education"        value={fmt(card.education)} />
        <Field label="Current Job"      value={fmt(card.currentJob)} />
        <Field
          label="Monthly Income"
          value={card.monthlyIncome != null ? `₹${Number(card.monthlyIncome).toLocaleString("en-IN")}` : "—"}
        />
        <Field label="Complexion"       value={fmt(card.complexion)} />
        <Field
          label="Physically Challenged"
          value={card.physicallyChallenge == null ? "—" : card.physicallyChallenge ? "Yes" : "No"}
        />
      </Group>
      {card.otherDetails && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">Other Details</p>
          <p className="text-[11px] leading-relaxed text-neutral-600">{card.otherDetails}</p>
        </div>
      )}

      <Group title="Family Details">
        <Field label="Father" value={fmt(card.fatherName)} />
        <Field label="Father's Occupation" value={fmt(card.fatherOccupation)} />
        <Field label="Mother" value={fmt(card.motherName)} />
        <Field label="Mother's Occupation" value={fmt(card.motherOccupation)} />
        <Field
          label="Brothers"
          value={card.totalBrothers != null ? `${card.totalBrothers} (${card.marriedBrothers ?? 0} married)` : "—"}
        />
        <Field
          label="Sisters"
          value={card.totalSisters != null ? `${card.totalSisters} (${card.marriedSisters ?? 0} married)` : "—"}
        />
        <Field label="House Details" value={fmt(card.houseDetails)} />
        <Field label="Family Status" value={fmtFS(card.familyStatus)} />
      </Group>
    </div>
  );
}

/** Downloads the AD card (all details above + photos) as a PDF. */
export function DownloadADPdfButton({ card }: { card: any }) {
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setBusy(true);
    setError("");
    try {
      const { downloadADCardPDF } = await import("@/components/ProfilePDF");
      await downloadADCardPDF(card);
    } catch (err) {
      console.error("AD PDF download failed:", err);
      setError("Could not generate PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#7a1f2b]/30 bg-white dark:bg-neutral-100 px-3 py-2 text-[11px] font-bold text-[#7a1f2b] hover:bg-[#7a1f2b]/5 transition-colors disabled:opacity-60"
      >
        <Download size={12} />
        {busy ? "Preparing PDF…" : "Download Details (PDF)"}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
