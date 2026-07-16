"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const steps = [
  { label: "Basic Info", fields: ["Full Name", "Age", "Location"] },
  { label: "Background", fields: ["Religion", "Caste / Community", "Education"] },
  { label: "Partner Prefs", fields: ["Preferred Age", "Preferred Location", "Income Range"] },
];

export function StepForm() {
  const [step, setStep] = useState(0);
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);
  const currentStep = steps[step];

  return (
    <section className="card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">Create Profile</h2>
          <p className="text-xs text-text-secondary">{currentStep.label}</p>
        </div>
        <span className="rounded-[var(--radius-md)] bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          {step + 1} / {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="mb-5 flex justify-between">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-fast ${
                i < step
                  ? "bg-primary text-white"
                  : i === step
                  ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-1"
                  : "bg-neutral-100 text-text-tertiary"
              }`}
            >
              {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
            </div>
            <span className={`text-[9px] font-medium ${i === step ? "text-primary" : "text-text-tertiary"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {currentStep.fields.map((field) => (
          <div key={field}>
            <label className="label">{field}</label>
            <input className="input-field" placeholder={`Enter ${field.toLowerCase()}`} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-40"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="btn-primary"
          >
            Continue
          </button>
        ) : (
          <Link href="/register" className="btn-gold text-center">
            Get Started
          </Link>
        )}
      </div>
    </section>
  );
}
