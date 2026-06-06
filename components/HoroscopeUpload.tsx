"use client";

import { useState } from "react";
import { Star, FileText } from "lucide-react";

export function HoroscopeUpload() {
  const [fileName, setFileName] = useState("");

  return (
    <section className="rounded-[var(--radius-2xl)] bg-white p-4 shadow-base border border-neutral-100">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent/10">
          <Star size={16} className="text-accent" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-primary">Horoscope</h2>
          <p className="text-xs text-text-secondary">Upload your horoscope for family matching.</p>
        </div>
      </div>

      <label className="block cursor-pointer rounded-[var(--radius-lg)] border-2 border-dashed border-accent/40 bg-accent/5 px-4 py-6 text-center transition-fast hover:border-accent/70 hover:bg-accent/10">
        <FileText size={32} className="mx-auto text-accent/60 mb-2" strokeWidth={1.5} />
        <span className="mt-2 block text-sm font-medium text-primary">
          {fileName ? fileName : "Tap to upload horoscope"}
        </span>
        <span className="mt-1 block text-xs text-text-tertiary">JPG, PNG or PDF accepted</span>
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
        />
      </label>

      <button className="mt-3 w-full rounded-[var(--radius-lg)] bg-accent px-4 py-3 text-sm font-bold text-white shadow-base transition-fast hover:shadow-md hover:scale-105 active:scale-95">
        Save Horoscope
      </button>
    </section>
  );
}
