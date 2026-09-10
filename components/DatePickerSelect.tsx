"use client";

import { useState, useEffect } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number, year: number): number {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

type Props = {
  value: string;          // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  className?: string;
};

export function DatePickerSelect({ value, onChange, className }: Props) {
  const currentYear = new Date().getFullYear();

  // Day/month/year live together in one state object so a batch of rapid
  // changes (e.g. quick keyboard selection across all three <select>s) is
  // always resolved from the freshest merged state, not per-field closures
  // that can go stale when React batches several updates into one render.
  const [parts, setParts] = useState<{ day: string; month: string; year: string }>({
    day: "", month: "", year: "",
  });
  const { day, month, year } = parts;

  // Sync selects when external value changes (e.g. defaultValues on mount)
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setParts({ year: y, month: String(parseInt(m, 10)), day: String(parseInt(d, 10)) });
    }
  }, [value]);

  // Emit YYYY-MM-DD whenever the merged day/month/year state settles.
  useEffect(() => {
    if (day && month && year) {
      onChange(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    } else {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month, year]);

  const handleDay = (v: string) => {
    setParts((p) => ({ ...p, day: v }));
  };
  const handleMonth = (v: string) => {
    setParts((p) => {
      const maxDay = daysInMonth(Number(v), Number(p.year));
      return { ...p, month: v, day: Number(p.day) > maxDay ? "" : p.day };
    });
  };
  const handleYear = (v: string) => {
    setParts((p) => {
      const maxDay = daysInMonth(Number(p.month), Number(v));
      return { ...p, year: v, day: Number(p.day) > maxDay ? "" : p.day };
    });
  };

  const maxDay = daysInMonth(Number(month), Number(year));
  const days   = Array.from({ length: maxDay }, (_, i) => i + 1);
  const years  = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);

  const sel = `${className ?? "input-field"} text-sm`;

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Day */}
      <select
        value={day}
        onChange={(e) => handleDay(e.target.value)}
        className={sel}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={month}
        onChange={(e) => handleMonth(e.target.value)}
        className={sel}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={year}
        onChange={(e) => handleYear(e.target.value)}
        className={sel}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
