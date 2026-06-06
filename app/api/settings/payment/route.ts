/**
 * GET /api/settings/payment
 *
 * Returns payment details (UPI ID, bank) for any authenticated user.
 * This is a non-admin endpoint — only exposes payment contact info, never admin-only fields.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel } from "@/lib/models";

const DEFAULTS = {
  upiId:             "reginmatrimony@upi",
  bankName:          "State Bank of India",
  bankAccountNo:     "",
  bankIfsc:          "",
  bankAccountHolder: "Regin Matrimony Services",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const settings = await SettingsModel.findOne()
      .select("upiId bankName bankAccountNo bankIfsc bankAccountHolder")
      .lean<any>();

    return Response.json({
      upiId:             settings?.upiId             ?? DEFAULTS.upiId,
      bankName:          settings?.bankName          ?? DEFAULTS.bankName,
      bankAccountNo:     settings?.bankAccountNo     ?? DEFAULTS.bankAccountNo,
      bankIfsc:          settings?.bankIfsc          ?? DEFAULTS.bankIfsc,
      bankAccountHolder: settings?.bankAccountHolder ?? DEFAULTS.bankAccountHolder,
    });
  } catch (err) {
    console.error("GET /api/settings/payment error:", err);
    return Response.json(DEFAULTS); // fallback — never crash the payment page
  }
}
