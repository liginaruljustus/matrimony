import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { TERMS_SECTIONS } from "@/components/legal/TermsContent";
import { getPublicSiteInfo } from "@/lib/siteInfo";

export const metadata: Metadata = { title: "Terms of Use — Lura Tamil Matrimony" };
export const dynamic = "force-dynamic";

export default async function TermsOfUsePage() {
  const { supportPhone } = await getPublicSiteInfo();
  return (
    <LegalPage
      title="Terms of Use"
      updated="11 October 2026"
      intro="Please read these terms before registering. They explain how Lura works, what we expect from members, and how fees and payments are handled."
      supportPhone={supportPhone}
    >
      {TERMS_SECTIONS.map(({ title, body }) => (
        <LegalSection key={title} title={title}>{body}</LegalSection>
      ))}
    </LegalPage>
  );
}
