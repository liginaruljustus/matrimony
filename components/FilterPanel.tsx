"use client";

import { ChangeEvent } from "react";
import { Search } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";

export function FilterPanel() {
  const ageRange = useFilterStore((s) => s.ageRange);
  const religion = useFilterStore((s) => s.religion);
  const caste = useFilterStore((s) => s.caste);
  const location = useFilterStore((s) => s.location);
  const education = useFilterStore((s) => s.education);
  const income = useFilterStore((s) => s.income);
  const setFilters = useFilterStore((s) => s.setFilters);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "minAge") setFilters({ ageRange: [Number(value), ageRange[1]] });
    else if (name === "maxAge") setFilters({ ageRange: [ageRange[0], Number(value)] });
    else if (name === "income") setFilters({ income: Number(value) });
    else setFilters({ [name]: value } as never);
  };

  const filters = [
    { name: "religion", label: "Religion", placeholder: "e.g. Hindu" },
    { name: "caste", label: "Caste / Community", placeholder: "e.g. Mudaliar" },
    { name: "location", label: "Location / District", placeholder: "e.g. Chennai" },
    { name: "education", label: "Education", placeholder: "e.g. B.E, MBA" },
  ];

  const values: Record<string, string> = { religion, caste, location, education };

  return (
    <aside className="card h-fit p-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] bg-primary/10">
            <Search size={16} className="text-primary" strokeWidth={2} />
          </span>
          <h2 className="font-serif text-base font-bold text-primary">Filters</h2>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs font-semibold text-text-secondary hover:text-primary transition-fast"
        >
          Reset all
        </button>
      </div>

      <div className="space-y-4">
        {/* Text filters */}
        {filters.map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="label">{label}</label>
            <input
              name={name}
              value={values[name]}
              onChange={onInput}
              placeholder={placeholder}
              className="input-field"
            />
          </div>
        ))}

        {/* Age range */}
        <div>
          <label className="label">Age Range</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                name="minAge"
                type="number"
                value={ageRange[0]}
                onChange={onInput}
                placeholder="Min"
                min={21}
                max={59}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">yr</span>
            </div>
            <div className="relative">
              <input
                name="maxAge"
                type="number"
                value={ageRange[1]}
                onChange={onInput}
                placeholder="Max"
                min={22}
                max={60}
                className="input-field pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">yr</span>
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-text-tertiary">
            <span>{ageRange[0]} years</span>
            <span>{ageRange[1]} years</span>
          </div>
        </div>

        {/* Min income */}
        <div>
          <label className="label">Minimum Annual Income</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-tertiary">₹</span>
            <input
              name="income"
              type="number"
              value={income || ""}
              onChange={onInput}
              placeholder="e.g. 500000"
              className="input-field pl-7"
            />
          </div>
          {income > 0 && (
            <p className="mt-1 text-[10px] text-text-secondary">
              Min ₹{income.toLocaleString("en-IN")} / year
            </p>
          )}
        </div>

        {/* Reset button */}
        <button
          onClick={resetFilters}
          className="btn-secondary w-full"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}
