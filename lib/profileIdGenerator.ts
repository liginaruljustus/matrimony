import { UserModel } from "./models";

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
  const now = new Date();
  const monthYear = String(now.getMonth() + 1).padStart(2, "0") + String(now.getFullYear()).slice(-2);

  const religionCode = RELIGION_MAP[religion] || "O";

  // Get next sequence number
  const lastProfile = await UserModel.findOne({ profileId: { $exists: true } })
    .sort({ createdAt: -1 })
    .lean() as any;

  let sequenceNumber = 1;
  if (lastProfile?.profileId) {
    const match = (lastProfile.profileId as string).match(/\d{5}/);
    if (match) {
      sequenceNumber = parseInt(match[0]) + 1;
    }
  }

  const sequence = String(sequenceNumber).padStart(5, "0");

  return `${genderCode}${monthYear}${religionCode}${sequence}${familyClass}`;
}

export function generatePassword(
  phoneNumber: string,
  submissionDate: Date,
  firstName: string
): string {
  // Extract digits from phone (last 10 digits)
  const phone = phoneNumber.slice(-10);
  const lastDigit = phone[9];
  const secondLastDigit = phone[8];
  const thirdLastDigit = phone[7];

  // Get day and month initials
  const dayOfWeek = submissionDate.getDay();
  const dayInitial = DAY_INITIALS[dayOfWeek];

  const monthIndex = submissionDate.getMonth();
  const monthInitial = MONTH_INITIALS[monthIndex];

  // Get first letter of name
  const nameInitial = firstName.charAt(0).toUpperCase();

  // Format: lastDigit + dayInitial + secondLastDigit + monthInitial + thirdLastDigit + nameInitial
  return `${lastDigit}${dayInitial}${secondLastDigit}${monthInitial}${thirdLastDigit}${nameInitial}`;
}
