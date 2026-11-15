import { CounterModel } from "./models";
import { religionCode } from "@/lib/religions";

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"]; // Sun, Mon, Tue, ...
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Largest 6-digit serial; the next registration starts a new series. */
export const SERIAL_MAX = 999_999;

/**
 * Profile ID:  G SS YY R NNNNNN CC   e.g. M 01 27 H 000001 MC
 *   G  gender (M / F)
 *   SS series: 01 for the first 9,99,999 registrations of the year, 02 for the
 *      next 9,99,999, and so on (replaces the month, so the ID never runs out)
 *   YY year (India time) — a new year starts again at series 01, serial 000001
 *   R  religion letter (H, M, C, S, B, J, O)
 *   NNNNNN serial 000001–999999 within the series
 *   CC family class (MC / UC / EC)
 * IDs issued before this change kept the month in the SS place and are unchanged.
 */
export async function generateProfileId(
  gender: "MALE" | "FEMALE",
  religion: string,
  familyClass: "MC" | "UC" | "EC"
): Promise<string> {
  const genderCode = gender === "MALE" ? "M" : "F";
  // Year in India time, so the yearly reset happens at midnight IST
  const yy = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "2-digit" }).format(new Date());
  // First letter of the religion (Hindu H, Muslim M, Christian C, Sikh S, Buddhism B, Jainism J, Others O)
  const religionLetter = religionCode(religion);

  // One counter per year. Atomic increment — no duplicate numbers under concurrent registrations.
  const counter = await CounterModel.findOneAndUpdate(
    { _id: `profileId-series-${yy}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  ).lean() as any;
  const n = Number(counter.seq);
  const series = String(Math.floor((n - 1) / SERIAL_MAX) + 1).padStart(2, "0");
  const serial = String(((n - 1) % SERIAL_MAX) + 1).padStart(6, "0");

  return `${genderCode}${series}${yy}${religionLetter}${serial}${familyClass}`;
}

export function generatePassword(
  phoneNumber: string,
  submissionDate: Date,
  firstName: string
): string {
  // Extract digits only from phone (last 10 digits)
  const digits = (phoneNumber || "").replace(/\D/g, "");
  const phone = digits.slice(-10).padStart(10, "0");
  const lastDigit = phone[9];
  const secondLastDigit = phone[8];
  const thirdLastDigit = phone[7];

  // Get day and month initials safely
  const date = submissionDate instanceof Date && !isNaN(submissionDate.getTime()) ? submissionDate : new Date();
  const dayOfWeek = date.getDay();
  const dayInitial = DAY_INITIALS[dayOfWeek];

  const monthIndex = date.getMonth();
  const monthInitial = MONTH_INITIALS[monthIndex];

  // Get first letter of name safely
  const nameInitial = ((firstName || "U").trim().charAt(0) || "U").toUpperCase();

  // Format: lastDigit + dayInitial + secondLastDigit + monthInitial + thirdLastDigit + nameInitial
  return `${lastDigit}${dayInitial}${secondLastDigit}${monthInitial}${thirdLastDigit}${nameInitial}`;
}
