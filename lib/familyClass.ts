/**
 * Family-class badge colors (shared across all profile cards).
 * Matches the Family Status picker in the profile form:
 *   MC → green · UC → pink · EC → blue
 */
export const FAMILY_CLASS_COLORS: Record<string, string> = {
  MC: "bg-green-100 text-green-700",
  UC: "bg-pink-100 text-pink-700",
  EC: "bg-blue-100 text-blue-700",
};

export const FAMILY_CLASS_FALLBACK = "bg-neutral-100 text-neutral-700";

/** Whole-card styling by family class — same MC/UC/EC color scheme as the badge. */
export const FAMILY_CLASS_CARD_STYLE: Record<string, string> = {
  MC: "border-green-200 bg-green-50/40",
  UC: "border-pink-200 bg-pink-50/40",
  EC: "border-blue-200 bg-blue-50/40",
};

export const FAMILY_CLASS_CARD_FALLBACK = "border-neutral-100 dark:border-neutral-200 bg-white dark:bg-neutral-100";

/** Solid family-class fill — used for the photo-placeholder area on browse cards. */
export const FAMILY_CLASS_PLACEHOLDER_BG: Record<string, string> = {
  MC: "bg-gradient-to-br from-green-200 to-green-100",
  UC: "bg-gradient-to-br from-pink-200 to-pink-100",
  EC: "bg-gradient-to-br from-blue-200 to-blue-100",
};

export const FAMILY_CLASS_PLACEHOLDER_FALLBACK = "bg-gradient-to-br from-neutral-200 to-neutral-100";
