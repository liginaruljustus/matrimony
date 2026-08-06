/** Age computed live from a date of birth — never goes stale, unlike a value stored at profile-save time. */
export function calculateAge(dateOfBirth: unknown): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth as string | number | Date);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) years--;

  return years >= 0 ? years : null;
}
