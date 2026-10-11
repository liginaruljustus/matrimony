import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { getPublicSiteInfo, whatsappLink } from "@/lib/siteInfo";

export const metadata: Metadata = { title: "Privacy Policy — Lura Tamil Matrimony" };
export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  const { supportPhone } = await getPublicSiteInfo();
  return (
    <LegalPage
      title="Privacy Policy"
      updated="11 October 2026"
      intro="This policy explains what personal information Lura Tamil Matrimony collects, why we collect it, and who can see it. A matrimony profile contains sensitive family information, so we show as little as possible until both families choose to move forward."
      supportPhone={supportPhone}
    >
      <LegalSection title="1. Information we collect">
        <ul>
          <li><strong>When you register:</strong> name, email address, phone number, whether the profile is for a bride or groom, religion and family class.</li>
          <li><strong>In your profile:</strong> personal details (such as date of birth, education, occupation, income, height, caste and mother tongue), horoscope details if you choose to give them, family details, your address, a contact person&apos;s name and numbers, your expectations and your photo.</li>
          <li><strong>When a groom pays:</strong> the transaction reference, date, amount and payment method you enter. We do not collect card numbers, UPI PINs or bank passwords.</li>
          <li><strong>When you use the site:</strong> a sign-in cookie that keeps you logged in, and the dates of your last login and activity.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How we use it">
        <ul>
          <li>To create your account and email you your Profile ID and password.</li>
          <li>To show your profile to prospective matches, in the stages described below.</li>
          <li>To verify payments and unlock details for the right people.</li>
          <li>To send notifications about proposals, acceptances and payments.</li>
          <li>To keep the service safe, including suspending accounts that break our terms.</li>
        </ul>
        <p>We do not sell your personal information, and we do not use it for advertising.</p>
      </LegalSection>

      <LegalSection title="3. Who can see your information, and when">
        <ul>
          <li><strong>While browsing:</strong> other members see your Profile ID and a short summary (such as age, religion, caste, district and education). Your name, photo, address and contact details are not shown.</li>
          <li><strong>After a proposal:</strong> when a groom&apos;s Initial Payment is verified, the bride&apos;s family receives his proposal with his additional details and photo. When the bride&apos;s family accepts, and after any waiting period, the groom can see her additional details and photo. Names and parents&apos; names are still withheld.</li>
          <li><strong>After the Final Payment is verified:</strong> names, parents&apos; names and contact details (contact person, phone, WhatsApp and email) are shared with both families.</li>
          <li><strong>Our team:</strong> authorised staff can see profiles and payment details in order to run the service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Service providers">
        <p>We use trusted providers to run the service. They process information only on our behalf:</p>
        <ul>
          <li>website hosting;</li>
          <li>a cloud database, where account and profile information is stored;</li>
          <li>an image hosting service, where profile photos are stored;</li>
          <li>an email service, used to send your login details and notifications.</li>
        </ul>
        <p>We may also disclose information if the law requires it.</p>
      </LegalSection>

      <LegalSection title="5. How long we keep it">
        <p>
          We keep your information while your account is open. Payment records may be kept longer where
          needed for accounts or legal reasons. You can ask us to delete your account at any time.
        </p>
      </LegalSection>

      <LegalSection title="6. Your choices">
        <ul>
          <li><strong>Correct your profile:</strong> send an edit request from your dashboard.</li>
          <li><strong>Hide your profile:</strong> freeze it from Settings; you can unfreeze it later.</li>
          <li><strong>Access, correct or delete your data, or withdraw consent:</strong> contact us using the details below. We may need to confirm your identity first.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          Passwords are stored in encrypted (hashed) form, and access to member information is limited
          to authorised staff. No online service can promise complete security, so please keep your
          password private and tell us if you suspect misuse.
        </p>
      </LegalSection>

      <LegalSection title="8. Age">
        <p>The service is only for adults: brides aged 18 or over and grooms aged 21 or over.</p>
      </LegalSection>

      <LegalSection title="9. Questions and complaints">
        <p>
          For any privacy question, request or complaint, call us on{" "}
          <a href={`tel:+91${supportPhone.replace(/\D/g, "").slice(-10)}`}>{supportPhone}</a> or{" "}
          <a href={whatsappLink(supportPhone)} target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.
          See also our <Link href="/contact">Contact</Link> page.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>If we change this policy we will update the date at the top of this page.</p>
      </LegalSection>
    </LegalPage>
  );
}
