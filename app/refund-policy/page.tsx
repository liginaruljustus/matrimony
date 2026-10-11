import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { getPublicSiteInfo, whatsappLink } from "@/lib/siteInfo";

export const metadata: Metadata = { title: "Refund Policy — Lura Tamil Matrimony" };
export const dynamic = "force-dynamic";

export default async function RefundPolicyPage() {
  const { supportPhone } = await getPublicSiteInfo();
  return (
    <LegalPage
      title="Refund Policy"
      updated="11 October 2026"
      intro="Lura is free for brides. This policy covers the Initial Payment and Final Payment made by grooms."
      supportPhone={supportPhone}
    >
      <LegalSection title="1. Payments are non-refundable once approved">
        <p>
          After you pay, our team checks your transaction and approves it. Once a payment has been
          approved, it is non-refundable. This applies to both the Initial Payment and the Final Payment,
          including where:
        </p>
        <ul>
          <li>the bride&apos;s family does not accept, or has not yet responded to, your proposal;</li>
          <li>you change your mind after paying;</li>
          <li>a profile later becomes inactive.</li>
        </ul>
        <p>Please check the profile and the amount carefully before you pay.</p>
      </LegalSection>

      <LegalSection title="2. If your payment is rejected">
        <p>
          A payment is rejected when we cannot match the transaction reference you entered to a payment
          we received (for example, a wrong or mistyped reference). A rejected payment is not counted,
          and you can submit it again with the correct details.
        </p>
        <p>
          If you did transfer the money and your payment was rejected, contact us with your payment
          proof so we can trace it.
        </p>
      </LegalSection>

      <LegalSection title="3. Paid twice or paid the wrong amount?">
        <p>
          If you paid twice for the same profile, or sent a different amount by mistake, contact us with
          the details and your payment proof. We will review it and tell you how it will be resolved.
        </p>
      </LegalSection>

      <LegalSection title="4. How to contact us about a payment">
        <p>
          Call us on{" "}
          <a href={`tel:+91${supportPhone.replace(/\D/g, "").slice(-10)}`}>{supportPhone}</a> or{" "}
          <a href={whatsappLink(supportPhone)} target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.
          Please include your Profile ID, the transaction reference, the date and the amount.
        </p>
        <p>
          See also our <Link href="/terms-of-use">Terms of Use</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
