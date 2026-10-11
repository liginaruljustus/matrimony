"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Heart,
  PenTool,
  Search,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Star,
  MapPin,
  GraduationCap,
  Check,
  Sparkles,
  Users,
  Phone,
  MessageCircle,
} from "lucide-react";

// Brand colours used throughout: maroon #7a1f2b, gold #d4af37 (deep gold #9a7400
// for text on light backgrounds, where the bright gold has too little contrast).

// ── Navbar ────────────────────────────────────────────────────────────────────
function HomeNavbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#7a1f2b]/10 bg-[#faf7f2]/80 backdrop-blur-xl dark:bg-neutral-100/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Lura Tamil Matrimony — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Lura Matrimony Tamil"
            className="h-12 w-auto rounded-xl mix-blend-multiply dark:bg-white dark:p-0.5 dark:mix-blend-normal sm:h-14"
          />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#7a1f2b] transition-colors hover:bg-[#7a1f2b]/5"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full bg-[#7a1f2b] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#6b1823] hover:shadow-md"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#7a1f2b] transition-colors hover:bg-[#7a1f2b]/5"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#7a1f2b] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#6b1823] hover:shadow-md"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Hero preview: a mock of the product UI (illustrative sample data) ─────────
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      {/* Soft glow behind the cards */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#d4af37]/25 via-[#7a1f2b]/10 to-transparent blur-2xl" />

      {/* Back card */}
      <div className="absolute inset-x-6 -top-4 h-full rotate-[-5deg] rounded-3xl border border-[#7a1f2b]/10 bg-white/70 shadow-lg dark:bg-neutral-200/70" />

      {/* Front card */}
      <div className="lura-float relative rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-[#7a1f2b]/15 dark:border-neutral-200 dark:bg-neutral-100">
        <div className="flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-[#d4af37]/30">
            <Lock size={24} className="text-[#7a1f2b]" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="font-mono text-base font-bold tracking-wide text-neutral-900">F1026H000012MC</p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">MC</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">24 yrs · Single</p>

        <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
          <p className="flex items-center gap-2"><Star size={12} className="text-[#d4af37]" /> Hindu · Nadar</p>
          <p className="flex items-center gap-2"><MapPin size={12} className="text-[#7a1f2b]" /> Madurai</p>
          <p className="flex items-center gap-2"><GraduationCap size={12} className="text-[#7a1f2b]" /> B.E. Computer Science</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-full bg-[#7a1f2b] py-2 text-center text-xs font-bold text-white">View Profile</div>
          <div className="flex items-center justify-center gap-1.5 rounded-full border border-[#7a1f2b]/30 py-2 text-xs font-bold text-[#7a1f2b]">
            <Heart size={12} /> Favourite
          </div>
        </div>
      </div>

      {/* Floating status chips */}
      <div className="lura-float-slow absolute -right-3 -top-5 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-xl dark:border-neutral-200 dark:bg-neutral-100 sm:-right-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
          <Check size={14} className="text-emerald-700" />
        </span>
        <div>
          <p className="text-[11px] font-bold leading-tight text-neutral-900">Proposal accepted</p>
          <p className="text-[10px] leading-tight text-neutral-500">by the bride&apos;s family</p>
        </div>
      </div>

      <div className="lura-float-slow absolute -bottom-6 left-4 flex items-center gap-2 rounded-2xl border border-[#d4af37]/30 bg-white px-3 py-2 shadow-xl dark:border-neutral-200 dark:bg-neutral-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37]/20">
          <ShieldCheck size={14} className="text-[#7a1f2b]" />
        </span>
        <div>
          <p className="text-[11px] font-bold leading-tight text-neutral-900">Privacy protected</p>
          <p className="text-[10px] leading-tight text-neutral-500">Profile ID only</p>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const steps = [
  { step: "01", icon: PenTool,        label: "Register Free",   desc: "Create your profile in minutes with your family details." },
  { step: "02", icon: Search,         label: "Browse Profiles", desc: "District, Age and Caste based search." },
  { step: "03", icon: HeartHandshake, label: "Connect",         desc: "Send your proposal — when the family accepts, you can connect with them." },
];

const highlights = [
  "District, Age & Caste search",
  "Family-first matrimony",
  "Privacy protected",
  "For Tamil families across India",
];

// Fees are set in Admin Settings and loaded from /api/public/site-info.
type SiteInfo = {
  supportPhone: string;
  firstPaymentAmounts: Record<string, number>;
  secondPaymentAmounts: Record<string, number>;
};

const FAMILY_CLASSES = [
  { code: "MC", label: "Middle Class" },
  { code: "UC", label: "Upper Class" },
  { code: "EC", label: "Elite Class" },
];

const rupees = (n: number | undefined) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9a7400] dark:text-[#d4af37]">
        <span className="h-px w-6 bg-[#d4af37]" />
        {eyebrow}
        <span className="h-px w-6 bg-[#d4af37]" />
      </p>
      <h2 className="mt-3 text-3xl font-bold text-[#7a1f2b] md:text-4xl">{title}</h2>
      <p className="mt-3 text-neutral-500">{sub}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [info, setInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    fetch("/api/public/site-info")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInfo(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-neutral-50">
      <HomeNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:pb-24 md:pt-20">
        {/* Background: soft colour washes + a fine dot grid */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#d4af37]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[26rem] w-[26rem] rounded-full bg-[#7a1f2b]/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          style={{ backgroundImage: "radial-gradient(#7a1f2b33 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Copy */}
          <div className="lura-fade-up text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#7a1f2b]/15 bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur dark:bg-neutral-100/70">
              <Heart size={13} className="shrink-0 fill-[#7a1f2b] text-[#7a1f2b]" />
              <span className="break-words text-[11px] font-semibold text-[#7a1f2b] sm:text-xs">
                இந்தியாவைச் சார்ந்த  தமிழர்களுக்கான திருமண தகவல் மையம்
              </span>
            </div>

            <h1 className="mt-6 text-[1.6rem] font-extrabold leading-[1.4] text-[#7a1f2b] sm:text-4xl sm:leading-[1.3] xl:text-[2.6rem] xl:leading-[1.3]">
              Lura-வின் துணையுடன்{" "}
              <span className="mt-1 block text-[#9a7400] dark:text-[#d4af37]">உங்கள் வாழ்க்கைத் துணை.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base text-neutral-600 sm:text-lg lg:mx-0">
              District, Age and Caste based search, and a family-first matrimony
              experience for Tamil families across India.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7a1f2b] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#7a1f2b]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6b1823] hover:shadow-xl sm:w-auto"
              >
                Register Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/profiles"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#7a1f2b]/25 bg-white/70 px-8 py-4 text-base font-bold text-[#7a1f2b] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7a1f2b]/50 hover:bg-white dark:bg-neutral-100/70 sm:w-auto"
              >
                Browse Profiles
                <Users size={18} />
              </Link>
            </div>

            {/* Free-for-brides badge */}
            <div className="mt-7 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#e6c65c] px-4 py-2.5 shadow-md shadow-[#d4af37]/30">
              <Sparkles size={16} className="text-[#7a1f2b]" />
              <span className="text-sm font-extrabold text-[#7a1f2b]">100% Free for Brides</span>
            </div>
          </div>

          {/* Product preview */}
          <div className="lura-fade-up px-4 [animation-delay:120ms] sm:px-10 lg:px-0">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ── Highlights strip ── */}
      <section className="border-y border-[#7a1f2b]/10 bg-white dark:bg-neutral-100">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-4 py-5 md:grid-cols-4">
          {highlights.map((item) => (
            <li key={item} className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-neutral-700 sm:text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7a1f2b]/10">
                <Check size={12} className="text-[#7a1f2b]" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── How it Works ── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Simple & Easy" title="How It Works" sub="Find your life partner in 3 simple steps" />

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Connector line behind the step icons (desktop) */}
            <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-[3.25rem] hidden border-t-2 border-dashed border-[#d4af37]/50 md:block" />

            {steps.map(({ step, icon: Icon, label, desc }) => (
              <div
                key={step}
                className="group relative rounded-3xl border border-[#7a1f2b]/10 bg-white p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7a1f2b]/10 dark:bg-neutral-100"
              >
                <span className="pointer-events-none absolute right-5 top-3 font-serif text-5xl font-bold text-[#7a1f2b]/[0.07]">
                  {step}
                </span>
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7a1f2b] to-[#9b2535] shadow-lg shadow-[#7a1f2b]/25 ring-4 ring-[#faf7f2] transition-transform duration-300 group-hover:scale-110 dark:ring-neutral-100">
                  <Icon size={24} className="text-white" />
                </div>
                <p className="mt-5 text-[11px] font-bold tracking-[0.2em] text-[#9a7400] dark:text-[#d4af37]">STEP {step}</p>
                <h3 className="mt-1.5 text-lg font-bold text-[#7a1f2b]">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-[#7a1f2b] px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#6b1823] hover:shadow-lg"
            >
              Start Your Journey
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust & Verification (bento grid) ── */}
      <section className="bg-white px-4 py-16 dark:bg-neutral-100 md:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Safe & Secure" title="Trust & Safety" sub="Your safety and privacy are our top priority" />

          <div className="grid gap-4 md:grid-cols-3">
            {/* Large feature card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7a1f2b] to-[#4e1018] p-8 text-white md:col-span-2 md:row-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#d4af37]/20 blur-3xl" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <Lock size={22} className="text-[#d4af37]" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">Privacy First</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
                  Profiles are shown by Profile ID. Names, photos and contact details stay
                  private and are shared only as both families move forward.
                </p>

                {/* Mini illustration of a privacy-protected profile row */}
                <div className="mt-7 space-y-2.5">
                  {["F1026H000012MC", "M1026H000007UC"].map((id) => (
                    <div key={id} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                        <Lock size={14} className="text-[#d4af37]" />
                      </span>
                      <span className="font-mono text-sm font-bold tracking-wide text-white">{id}</span>
                      <span className="ml-auto h-2 w-16 rounded-full bg-white/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#7a1f2b]/10 bg-[#faf7f2] p-7 transition-shadow hover:shadow-lg dark:bg-neutral-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a1f2b]/10">
                <ShieldAlert size={22} className="text-[#7a1f2b]" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#7a1f2b]">Report a Concern</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                Seen a false profile, or been asked for money? Tell our team — we review every report and can suspend the account.
              </p>
            </div>

            <div className="rounded-3xl border border-[#7a1f2b]/10 bg-[#faf7f2] p-7 transition-shadow hover:shadow-lg dark:bg-neutral-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a1f2b]/10">
                <ShieldCheck size={22} className="text-[#7a1f2b]" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#7a1f2b]">Family Safe</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">Proposals are shared between families, with payments verified by our team.</p>
            </div>

            {/* Wide gold card */}
            <div className="flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-r from-[#d4af37] to-[#e6c65c] p-7 sm:flex-row sm:items-center sm:justify-between md:col-span-3">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/40">
                  <Sparkles size={22} className="text-[#7a1f2b]" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-[#7a1f2b]">100% Free for Brides</h3>
                  <p className="text-sm font-medium text-[#7a1f2b]/80">Register, receive proposals and connect — at no cost.</p>
                </div>
              </div>
              <Link
                href="/register"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#7a1f2b] px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6b1823] hover:shadow-lg"
              >
                Register Free
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fees ── */}
      <section id="fees" className="scroll-mt-20 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading eyebrow="Clear & Upfront" title="Fees" sub="Know what you pay before you register" />

          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            {/* Brides */}
            <div className="flex flex-col rounded-3xl bg-gradient-to-br from-[#d4af37] to-[#e6c65c] p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7a1f2b]/70">For Brides</p>
              <p className="mt-3 text-5xl font-extrabold text-[#7a1f2b]">Free</p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#7a1f2b]/85">
                100% Free for Brides. Register, receive proposals and connect — at no cost.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#7a1f2b] px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6b1823] hover:shadow-lg"
              >
                Register Free
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Grooms */}
            <div className="rounded-3xl border border-[#7a1f2b]/10 bg-white p-8 shadow-sm dark:bg-neutral-100">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7400] dark:text-[#d4af37]">For Grooms</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Registration and browsing are free. You pay per bride profile, in two steps, based on
                the bride&apos;s family class.
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-[#7a1f2b]/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf7f2] text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Bride&apos;s family class</th>
                      <th className="px-4 py-3 text-right font-semibold">Initial Payment</th>
                      <th className="px-4 py-3 text-right font-semibold">Final Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#7a1f2b]/10">
                    {FAMILY_CLASSES.map(({ code, label }) => (
                      <tr key={code}>
                        <td className="px-4 py-3 font-medium text-neutral-800">{label}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#7a1f2b]">{rupees(info?.firstPaymentAmounts?.[code])}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#7a1f2b]">{rupees(info?.secondPaymentAmounts?.[code])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-neutral-600">
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#7a1f2b]" /><span><strong className="text-neutral-800">Initial Payment</strong> sends your proposal to the bride&apos;s family.</span></li>
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#7a1f2b]" /><span><strong className="text-neutral-800">Final Payment</strong>, after she accepts, shares names and contact details with both families.</span></li>
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#7a1f2b]" /><span>Pay by UPI, Google Pay, PayTm or bank transfer, then enter your transaction ID. Our team verifies every payment.</span></li>
              </ul>

              <p className="mt-5 rounded-2xl bg-[#faf7f2] px-4 py-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-200">
                Payments are non-refundable once approved. See our{" "}
                <Link href="/refund-policy" className="font-semibold text-[#7a1f2b] underline">Refund Policy</Link>.
                We never ask for your card number, UPI PIN or OTP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA panel ── */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7a1f2b] via-[#6b1823] to-[#4e1018] px-6 py-14 text-center shadow-2xl shadow-[#7a1f2b]/30 md:px-12 md:py-20">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d4af37]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Heart size={26} className="fill-[#d4af37] text-[#d4af37]" />
            </span>
            <h2 className="mt-6 text-3xl font-extrabold text-white md:text-4xl">Ready to Find Your Match?</h2>
            <p className="mt-4 text-base text-white/75 md:text-lg">
              Join Tamil families on Lura. Register free today and start your journey.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d4af37] px-8 py-4 text-base font-bold text-[#7a1f2b] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e0bd4a] hover:shadow-xl sm:w-auto"
              >
                Register Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Already a Member? Login
              </Link>
            </div>
            {info?.supportPhone && (
              <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/75">
                <span>Need help?</span>
                <a href={`tel:+91${info.supportPhone.replace(/\D/g, "").slice(-10)}`} className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline">
                  <Phone size={14} /> {info.supportPhone}
                </a>
                <a href={waLink(info.supportPhone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      <SiteFooter supportPhone={info?.supportPhone} />
    </div>
  );
}
