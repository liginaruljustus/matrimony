import bcrypt from "bcryptjs";
import { generatePassword } from "@/lib/profileIdGenerator";

/**
 * The system-generated password is never stored — it is derived from the
 * phone number, registration date and first name. Rebuild it and return it
 * only if it still opens the account (it won't if the user's name or phone has
 * changed since registration, or a different password was set).
 */
export async function recoverAutoPassword(user: {
  passwordHash?: string; phone?: string; createdAt?: Date | string; name?: string;
} | null | undefined): Promise<string | null> {
  if (!user?.passwordHash || !user.createdAt) return null;
  const firstName = String(user.name ?? "").split(" ")[0];
  const candidate = generatePassword(user.phone ?? "", new Date(user.createdAt), firstName);
  try {
    return (await bcrypt.compare(candidate, user.passwordHash)) ? candidate : null;
  } catch {
    return null;
  }
}
