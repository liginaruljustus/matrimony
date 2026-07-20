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
