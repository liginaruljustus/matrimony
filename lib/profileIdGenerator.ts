import { CounterModel, UserModel } from "./models";

const RELIGION_MAP: Record<string, string> = {
  "HINDU": "H",
  "MUSLIM": "M",
  "CHRISTIAN": "C",
  "OTHER": "O",
};

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"]; // Sun, Mon, Tue, ...
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export async function generateProfileId(
  gender: "MALE" | "FEMALE",
  religion: string,
  familyClass: "MC" | "UC" | "EC"
): Promise<string> {
  const genderCode = gender === "MALE" ? "M" : "F";
  // Month/year in India time, so the monthly reset happens at midnight IST
  // regardless of the server's timezone.
  const [mm, yy] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", month: "2-digit", year: "2-digit",
  }).format(new Date()).split("/");
  const monthYear = `${mm}${yy}`;
  const religionCode = RELIGION_MAP[religion] || "O";

  // The serial number restarts every month: one counter per month, so the first
  // registration of a month gets 000001.
  const counterId = `profileId-${monthYear}`;

  // First use of a month's counter: start it from the highest serial already issued
  // for that month (0 for a new month). This only matters for the month in which the
  // per-month counter was introduced — it keeps that month's numbers from repeating.
  if (!(await CounterModel.exists({ _id: counterId }))) {
    const issued = await UserModel.find({ profileId: new RegExp(`^[MF]${monthYear}`) })
      .select("profileId").lean() as any[];
    const highest = issued.reduce(
      (max, u) => Math.max(max, Number(String(u.profileId).slice(6, 12)) || 0), 0,
    );
    await CounterModel.updateOne(
      { _id: counterId },
      { $setOnInsert: { seq: highest } },
      { upsert: true },
    );
  }

  // Atomic increment — prevents duplicate sequence numbers under concurrent registrations.
  const counter = await CounterModel.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  ).lean() as any;
  const sequence = String(counter.seq).padStart(6, "0");

  return `${genderCode}${monthYear}${religionCode}${sequence}${familyClass}`;
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
