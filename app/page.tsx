"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Heart,
  PenTool,
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  BadgeCheck,
  Star,
  MapPin,
  Users,
  Menu,
  X,
} from "lucide-react";

// ── Navbar ────────────────────────────────────────────────────────────────────
function HomeNavbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/profiles",  label: "Profiles" },
    { href: "/matches",   label: "Matches" },
    { href: "/chat",      label: "Chat" },
    ...(session?.user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#7a1f2b]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart size={22} className="fill-[#d4af37] text-[#d4af37]" />
          <span className="text-lg font-bold text-white">Regin Matrimony</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {/* Right side: auth + hamburger */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login"    className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors sm:block">Login</Link>
              <Link href="/register" className="rounded-lg bg-[#d4af37] px-3 py-2 text-sm font-bold text-[#7a1f2b] hover:bg-[#c9a02a] transition-colors">Register</Link>
            </>
          )}
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
            {!session?.user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors sm:hidden"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const stats = [
  { value: "5,000+", label: "Active Profiles" },
  { value: "38",     label: "Districts" },
  { value: "200+",   label: "Marriages" },
  { value: "100%",   label: "Verified" },
];

const steps = [
  { step: "01", icon: PenTool,      label: "Register Free",    desc: "Create your profile in minutes with family details and horoscope." },
  { step: "02", icon: Search,       label: "Browse Profiles",  desc: "Filter by district, community, age, education and more." },
  { step: "03", icon: MessageSquare,label: "Connect",          desc: "Chat directly and securely with families you like." },
];

const trustItems = [
  { icon: Smartphone,  title: "Mobile Verified",     desc: "OTP-based phone authentication for every profile." },
  { icon: BadgeCheck,  title: "ID Checked",          desc: "Government ID verification enabled for safety." },
  { icon: ShieldCheck, title: "Family Safe Chats",   desc: "Secure, reported, and moderated communication." },
];

const testimonials = [
  { name: "Priya & Karthik", district: "Chennai", text: "We found each other through Regin within 3 months. The family-first approach made all the difference.", stars: 5 },
  { name: "Meena & Suresh",  district: "Madurai", text: "Verified profiles and district filters made it easy to find a compatible match close to home.", stars: 5 },
  { name: "Kavya & Rajan",   district: "Coimbatore", text: "The horoscope matching feature impressed our families. Highly recommended!", stars: 5 },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <HomeNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7a1f2b] via-[#6b1823] to-[#4e1018] px-4 py-20 md:py-32">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#d4af37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Tag line */}
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5">
            <Heart size={14} className="shrink-0 fill-[#d4af37] text-[#d4af37]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#d4af37] break-words">
              தமிழ்நாடு குடும்பங்களுக்கான நம்பகமான தேர்வு
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-7xl">
            குடும்பம் பேசும்
            <span className="mt-2 block text-[#d4af37]">திருமண மேடை</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-white/75 sm:text-lg md:text-xl">
            Verified profiles, district-based search, horoscope support, and a
            family-first matrimony experience across Tamil Nadu.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-8 py-4 text-base font-bold text-[#7a1f2b] shadow-lg hover:bg-[#c9a02a] hover:scale-105 transition-all duration-200"
            >
              Register Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all duration-200"
            >
              Browse Profiles
              <Users size={18} />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-[#d4af37] md:text-4xl">{value}</p>
                <p className="mt-1 text-sm text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Simple & Easy</p>
            <h2 className="mt-2 text-3xl font-bold text-[#7a1f2b] md:text-4xl">How It Works</h2>
            <p className="mt-3 text-neutral-500">Find your life partner in 3 simple steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ step, icon: Icon, label, desc }) => (
              <div key={step} className="group relative rounded-2xl border border-neutral-100 bg-[#faf7f2] p-8 text-center hover:shadow-lg hover:border-[#d4af37]/30 transition-all duration-300">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7a1f2b] shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} className="text-white" />
                </div>
                <p className="mt-4 text-xs font-bold tracking-widest text-[#d4af37]">STEP {step}</p>
                <h3 className="mt-2 text-lg font-bold text-[#7a1f2b]">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7a1f2b] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
            >
              Start Your Journey
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust & Verification ── */}
      <section className="bg-gradient-to-br from-[#fff9ef] to-[#fef6e4] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Safe & Secure</p>
            <h2 className="mt-2 text-3xl font-bold text-[#7a1f2b] md:text-4xl">Trust & Verification</h2>
            <p className="mt-3 text-neutral-500">Your safety and privacy are our top priority</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {trustItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#d4af37]/20 hover:shadow-md transition-shadow">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#7a1f2b]/10">
                  <Icon size={26} className="text-[#7a1f2b]" />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#7a1f2b]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Success Stories</p>
            <h2 className="mt-2 text-3xl font-bold text-[#7a1f2b] md:text-4xl">Happy Families</h2>
            <p className="mt-3 text-neutral-500">Real couples who found their match on Regin</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ name, district, text, stars }) => (
              <div key={name} className="rounded-2xl border border-neutral-100 bg-[#faf7f2] p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#d4af37] text-[#d4af37]" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-neutral-600 italic">&ldquo;{text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7a1f2b] text-xs font-bold text-white">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#7a1f2b]">{name}</p>
                    <p className="flex items-center gap-1 text-xs text-neutral-400">
                      <MapPin size={10} /> {district}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-br from-[#7a1f2b] to-[#4e1018] px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-2xl">
          <Heart size={40} className="mx-auto fill-[#d4af37] text-[#d4af37]" />
          <h2 className="mt-4 text-3xl font-extrabold text-white md:text-4xl">
            Ready to Find Your Match?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Join thousands of Tamil families. Register free today and start your journey.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-8 py-4 text-base font-bold text-[#7a1f2b] hover:bg-[#c9a02a] hover:scale-105 transition-all duration-200"
            >
              Register Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white hover:bg-white/10 transition-colors"
            >
              Already a Member? Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1a0a0d] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Heart size={20} className="fill-[#d4af37] text-[#d4af37]" />
              <span className="text-base font-bold text-white">Regin Matrimony</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
              <Link href="/profiles" className="hover:text-white transition-colors">Profiles</Link>
              <Link href="/matches"  className="hover:text-white transition-colors">Matches</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="/login"    className="hover:text-white transition-colors">Login</Link>
            </div>
            <p className="text-xs text-white/30">© 2026 Regin Matrimony. All rights reserved.</p>
          </div>
          <p className="mt-6 text-center font-serif text-sm italic text-white/30">
            &ldquo;குடும்பம் பேசும் திருமண மேடை&rdquo;
          </p>
        </div>
      </footer>
    </div>
  );
}
