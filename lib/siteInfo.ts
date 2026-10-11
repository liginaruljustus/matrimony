import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel } from "@/lib/models";
import { DEFAULT_FIRST_PAYMENT_AMOUNTS, DEFAULT_SECOND_PAYMENT_AMOUNTS } from "@/lib/paymentSettings";

/**
 * Public site information — safe to show to visitors who are not logged in.
 * Only the support number and the fee amounts; nothing else from Settings.
 */

/** Used if Settings has no admin phone saved. */
export const FALLBACK_SUPPORT_PHONE = "8903551916";

export const SITE_NAME = "Lura Tamil Matrimony";

export type PublicSiteInfo = {
  supportPhone: string;
  firstPaymentAmounts: Record<string, number>;
  secondPaymentAmounts: Record<string, number>;
};

export async function getPublicSiteInfo(): Promise<PublicSiteInfo> {
  try {
    await connectToDatabase();
    const s = await SettingsModel.findOne()
      .select("adminPhone firstPaymentAmounts secondPaymentAmounts")
      .lean<any>();
    return {
      supportPhone: (s?.adminPhone || "").trim() || FALLBACK_SUPPORT_PHONE,
      firstPaymentAmounts: s?.firstPaymentAmounts ?? DEFAULT_FIRST_PAYMENT_AMOUNTS,
      secondPaymentAmounts: s?.secondPaymentAmounts ?? DEFAULT_SECOND_PAYMENT_AMOUNTS,
    };
  } catch {
    // Never break a public page because the database is unreachable
    return {
      supportPhone: FALLBACK_SUPPORT_PHONE,
      firstPaymentAmounts: DEFAULT_FIRST_PAYMENT_AMOUNTS,
      secondPaymentAmounts: DEFAULT_SECOND_PAYMENT_AMOUNTS,
    };
  }
}

/** wa.me link for an Indian mobile number. */
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}
