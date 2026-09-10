"use client";

import { useState, useMemo, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  className?: string;
};

export function SearchDropdown({ value, onChange, options, placeholder, className }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  // Tracks whether the user has typed/selected locally — once they have, we
  // stop following external `value` changes so we don't clobber their input.
  const userEditedRef = useRef(false);

  // Sync displayed text when the external value changes after mount (e.g.
  // async-loaded defaultValues while editing an existing profile) — without
  // this, the field can show blank even though a real value is set.
  useEffect(() => {
    if (!userEditedRef.current && (value ?? "") !== query) {
      setQuery(value ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 40);
  }, [query, options]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userEditedRef.current = true;
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (opt: string) => {
    userEditedRef.current = true;
    setQuery(opt);
    onChange(opt);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? "Type to search…"}
        autoComplete="off"
        className={className ?? "input-field"}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={() => handleSelect(opt)}
              className="cursor-pointer px-3 py-2 text-sm text-neutral-700 dark:text-neutral-800 hover:bg-[#7a1f2b]/10 first:rounded-t-xl last:rounded-b-xl"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
