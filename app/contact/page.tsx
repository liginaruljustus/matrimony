import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MessageCircle, ShieldAlert } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { getPublicSiteInfo, whatsappLink } from "@/lib/siteInfo";

export const metadata: Metadata = { title: "Contact — Lura Tamil Matrimony" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const { supportPhone } = await getPublicSiteInfo();
  const tel = `tel:+91${supportPhone.replace(/\D/g, "").slice(-10)}`;
  return (
    <LegalPage
      title="Contact Us"
      intro="Questions about registering, a payment, or your profile? Our team is happy to help."
      supportPhone={supportPhone}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={tel}
          className="flex items-center gap-4 rounded-3xl border border-[#7a1f2b]/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-neutral-100"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7a1f2b]/10">
            <Phone size={22} className="text-[#7a1f2b]" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">Call us</span>
            <span className="block text-lg font-bold text-[#7a1f2b]">{supportPhone}</span>
          </span>
        </a>
        <a
          href={whatsappLink(supportPhone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <MessageCircle size={22} className="text-emerald-700" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-widest text-emerald-700/70">WhatsApp</span>
            <span className="block text-lg font-bold text-emerald-800">{supportPhone}</span>
          </span>
        </a>
      </div>

      <LegalSection title="When you contact us about a payment">
        <p>Please have these ready so we can help quickly:</p>
        <ul>
          <li>your Profile ID;</li>
          <li>the transaction reference, date and amount;</li>
          <li>a screenshot of the payment, if you have one.</li>
        </ul>
      </LegalSection>

      <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-amber-900">
          <ShieldAlert size={20} /> Report a concern
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-amber-900">
          <p>
            If a profile looks false, or someone asks you for money, behaves abusively or makes you
            uncomfortable, tell us straight away by phone or WhatsApp, with the Profile ID. Our team
            reviews every report and can suspend the account.
          </p>
          <p className="font-semibold">
            Lura staff will never ask for your password, UPI PIN or OTP. Never send money to another member.
          </p>
        </div>
      </section>

      <p className="text-sm text-neutral-500">
        See also our <Link href="/privacy-policy" className="font-semibold text-[#7a1f2b] underline">Privacy Policy</Link>,{" "}
        <Link href="/terms-of-use" className="font-semibold text-[#7a1f2b] underline">Terms of Use</Link> and{" "}
        <Link href="/refund-policy" className="font-semibold text-[#7a1f2b] underline">Refund Policy</Link>.
      </p>
    </LegalPage>
  );
}
