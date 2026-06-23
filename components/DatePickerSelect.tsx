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

  // Parse initial value
  const [day,   setDay]   = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year,  setYear]  = useState<string>("");

  // Sync selects when external value changes (e.g. defaultValues on mount)
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setYear(y);
      setMonth(String(parseInt(m, 10)));
      setDay(String(parseInt(d, 10)));
    }
  }, [value]);

  // Emit YYYY-MM-DD whenever any part changes
  const emit = (d: string, m: string, y: string) => {
    if (d && m && y) {
      const mm = m.padStart(2, "0");
      const dd = d.padStart(2, "0");
      onChange(`${y}-${mm}-${dd}`);
    } else {
      onChange("");
    }
  };

  const handleDay = (v: string) => {
    setDay(v);
    emit(v, month, year);
  };
  const handleMonth = (v: string) => {
    // If selected day exceeds new month's days, reset day
    const maxDay = daysInMonth(Number(v), Number(year));
    const safeDay = Number(day) > maxDay ? "" : day;
    if (Number(day) > maxDay) setDay("");
    setMonth(v);
    emit(safeDay, v, year);
  };
  const handleYear = (v: string) => {
    const maxDay = daysInMonth(Number(month), Number(v));
    const safeDay = Number(day) > maxDay ? "" : day;
    if (Number(day) > maxDay) setDay("");
    setYear(v);
    emit(safeDay, month, v);
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
