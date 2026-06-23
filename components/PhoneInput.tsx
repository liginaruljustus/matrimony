"use client";

import { useState, useEffect } from "react";

const COUNTRY_CODES = [
  { code: "+91",  label: "🇮🇳 +91  India" },
  { code: "+1",   label: "🇺🇸 +1   USA / Canada" },
  { code: "+44",  label: "🇬🇧 +44  UK" },
  { code: "+971", label: "🇦🇪 +971 UAE" },
  { code: "+65",  label: "🇸🇬 +65  Singapore" },
  { code: "+60",  label: "🇲🇾 +60  Malaysia" },
  { code: "+61",  label: "🇦🇺 +61  Australia" },
  { code: "+966", label: "🇸🇦 +966 Saudi Arabia" },
  { code: "+968", label: "🇴🇲 +968 Oman" },
  { code: "+974", label: "🇶🇦 +974 Qatar" },
  { code: "+973", label: "🇧🇭 +973 Bahrain" },
  { code: "+965", label: "🇰🇼 +965 Kuwait" },
  { code: "+49",  label: "🇩🇪 +49  Germany" },
  { code: "+33",  label: "🇫🇷 +33  France" },
  { code: "+81",  label: "🇯🇵 +81  Japan" },
  { code: "+82",  label: "🇰🇷 +82  South Korea" },
  { code: "+64",  label: "🇳🇿 +64  New Zealand" },
  { code: "+94",  label: "🇱🇰 +94  Sri Lanka" },
];

// Number of digits expected per country code
const DIGIT_LENGTHS: Record<string, number> = {
  "+91": 10,
  "+1":  10,
  "+44": 10,
};
const DEFAULT_MAX = 12;

type Props = {
  value: string;       // stored as "+91XXXXXXXXXX" or ""
  onChange: (v: string) => void;
  placeholder?: string;
};

function parseValue(value: string): { dialCode: string; number: string } {
  if (!value) return { dialCode: "+91", number: "" };
  const match = COUNTRY_CODES.find((c) => value.startsWith(c.code));
  if (match) return { dialCode: match.code, number: value.slice(match.code.length) };
  return { dialCode: "+91", number: value };
}

export function PhoneInput({ value, onChange, placeholder }: Props) {
  const parsed          = parseValue(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [number, setNumber]     = useState(parsed.number);

  // Sync when defaultValues load
  useEffect(() => {
    const p = parseValue(value);
    setDialCode(p.dialCode);
    setNumber(p.number);
  }, [value]);

  const maxDigits = DIGIT_LENGTHS[dialCode] ?? DEFAULT_MAX;

  const handleCode = (code: string) => {
    setDialCode(code);
    emit(code, number);
  };

  const handleNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, maxDigits);
    setNumber(digits);
    emit(dialCode, digits);
  };

  const emit = (code: string, num: string) => {
    onChange(num ? `${code}${num}` : "");
  };

  const expectedLen = DIGIT_LENGTHS[dialCode] ?? null;
  const isValid     = number.length === 0 || number.length === (expectedLen ?? number.length);

  return (
    <div className="flex gap-2">
      {/* Country code */}
      <select
        value={dialCode}
        onChange={(e) => handleCode(e.target.value)}
        className="input-field w-40 shrink-0 text-sm"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>

      {/* Number */}
      <div className="relative flex-1">
        <input
          type="tel"
          inputMode="numeric"
          value={number}
          onChange={(e) => handleNumber(e.target.value)}
          placeholder={placeholder ?? (expectedLen ? `${expectedLen}-digit number` : "Phone number")}
          maxLength={maxDigits}
          className={`input-field w-full font-mono tracking-wider ${
            number.length > 0 && !isValid ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
          }`}
        />
        {number.length > 0 && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${
            isValid ? "text-green-500" : "text-red-400"
          }`}>
            {number.length}{expectedLen ? `/${expectedLen}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
