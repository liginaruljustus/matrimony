import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { getPublicSiteInfo } from "@/lib/siteInfo";

export const metadata: Metadata = { title: "About — Lura Tamil Matrimony" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { supportPhone } = await getPublicSiteInfo();
  return (
    <LegalPage
      title="About Lura"
      intro="Lura Tamil Matrimony is a marriage information service for Tamil families across India. We help families find suitable matches by district, age and caste, with privacy built in at every step."
      supportPhone={supportPhone}
    >
      <LegalSection title="Family first">
        <p>
          In our community a marriage is a decision between two families. Lura is built around that:
          a proposal goes to the bride&apos;s family, and contact details are shared only when both
          families want to take the next step.
        </p>
      </LegalSection>

      <LegalSection title="Privacy at every step">
        <ul>
          <li>Profiles are browsed by Profile ID. Names, photos and contact details are not shown while browsing.</li>
          <li>A bride&apos;s family sees a groom&apos;s details only after he sends a proposal.</li>
          <li>Names and contact details are shared with both families only at the final step.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Free for brides">
        <p>
          Brides register, receive proposals and connect at no cost. Grooms pay a fee for each proposal;
          the amounts are shown on our <Link href="/#fees">home page</Link>.
        </p>
      </LegalSection>

      <LegalSection title="A real team behind it">
        <p>
          Every payment is checked by our team before a proposal moves forward, and you can reach us by
          phone or WhatsApp. See our <Link href="/contact">Contact</Link> page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
