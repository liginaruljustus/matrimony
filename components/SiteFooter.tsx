import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";

/** wa.me link for an Indian mobile number (kept local so this file has no server imports). */
function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

const LINKS = [
  { href: "/about",          label: "About" },
  { href: "/contact",        label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-use",   label: "Terms" },
  { href: "/refund-policy",  label: "Refund Policy" },
];

/** Shared public footer: policy links and the support number. */
export function SiteFooter({ supportPhone }: { supportPhone?: string }) {
  return (
    <footer className="bg-[#1a0a0d] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3 md:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Lura Matrimony Tamil" className="h-14 w-auto rounded-xl bg-white p-0.5" />
            {supportPhone && (
              <div className="flex flex-col items-center gap-1.5 text-sm md:items-start">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Support</p>
                <a href={`tel:+91${supportPhone.replace(/\D/g, "").slice(-10)}`} className="flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                  <Phone size={14} /> {supportPhone}
                </a>
                <a href={waLink(supportPhone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/80 transition-colors hover:text-white">
                  <MessageCircle size={14} /> WhatsApp us
                </a>
              </div>
            )}
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" aria-label="Footer">
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-white/60 transition-colors hover:text-white">{label}</Link>
            ))}
            <Link href="/register" className="text-white/60 transition-colors hover:text-white">Register</Link>
            <Link href="/login" className="text-white/60 transition-colors hover:text-white">Login</Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 md:flex-row">
          <p className="font-serif text-sm italic text-white/40">
            &ldquo;Lura-வின் துணையுடன் உங்கள் வாழ்க்கைத் துணை.&rdquo;
          </p>
          <p className="text-xs text-white/40">© 2026 Lura Tamil Matrimony. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
