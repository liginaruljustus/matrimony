/**
 * Religions offered across the app (source: religion.docx), with the letter each
 * one puts in the Profile ID — e.g. M1126**S**000001MC for a Sikh groom.
 */
export const RELIGIONS = [
  { value: "HINDU",     label: "Hindu",     code: "H" },
  { value: "MUSLIM",    label: "Muslim",    code: "M" },
  { value: "CHRISTIAN", label: "Christian", code: "C" },
  { value: "SIKH",      label: "Sikh",      code: "S" },
  { value: "BUDDHIST",  label: "Buddhism",  code: "B" },
  { value: "JAIN",      label: "Jainism",   code: "J" },
  { value: "OTHER",     label: "Others",    code: "O" },
] as const;

export type Religion = (typeof RELIGIONS)[number]["value"];

export const RELIGION_VALUES = RELIGIONS.map((r) => r.value) as [Religion, ...Religion[]];

/** "SIKH" → "Sikh"; unknown values are shown as they are. */
export function religionLabel(value?: string | null): string {
  if (!value) return "";
  return RELIGIONS.find((r) => r.value === value)?.label ?? value;
}

/** Letter used in the Profile ID ("O" when unknown). */
export function religionCode(value?: string | null): string {
  return RELIGIONS.find((r) => r.value === value)?.code ?? "O";
}
