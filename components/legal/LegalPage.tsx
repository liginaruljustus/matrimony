import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";

/** Frame for the public information pages (About, Contact, policies). */
export function LegalPage({
  title,
  intro,
  updated,
  supportPhone,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  supportPhone: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f2] dark:bg-neutral-50">
      <header className="border-b border-[#7a1f2b]/10 bg-[#faf7f2]/80 backdrop-blur-xl dark:bg-neutral-100/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
          <Link href="/" aria-label="Lura Tamil Matrimony — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Lura Matrimony Tamil"
              className="h-12 w-auto rounded-xl mix-blend-multiply dark:bg-white dark:p-0.5 dark:mix-blend-normal"
            />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[#7a1f2b] transition-colors hover:bg-[#7a1f2b]/5">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:py-14">
        <h1 className="text-3xl font-bold text-[#7a1f2b] md:text-4xl">{title}</h1>
        {updated && <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Last updated: {updated}</p>}
        {intro && <p className="mt-4 text-base leading-relaxed text-neutral-600">{intro}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </main>

      <SiteFooter supportPhone={supportPhone} />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#7a1f2b]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700 [&_a]:font-semibold [&_a]:text-[#7a1f2b] [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
