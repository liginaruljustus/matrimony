import { SettingsModel } from "@/lib/models";

export const DEFAULT_FIRST_PAYMENT_AMOUNTS: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };
export const DEFAULT_SECOND_PAYMENT_AMOUNTS: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

/** Admin-configurable amounts for a payment tier, keyed by family class (MC/UC/EC). */
export async function getPaymentAmounts(tier: "FIRST_PAYMENT" | "SECOND_PAYMENT"): Promise<Record<string, number>> {
  const settings = await SettingsModel.findOne()
    .select("firstPaymentAmounts secondPaymentAmounts")
    .lean<any>();

  if (tier === "FIRST_PAYMENT") return settings?.firstPaymentAmounts ?? DEFAULT_FIRST_PAYMENT_AMOUNTS;
  return settings?.secondPaymentAmounts ?? DEFAULT_SECOND_PAYMENT_AMOUNTS;
}
