import Link from "next/link";
import { ArrowDown } from "lucide-react";

export function MobileHeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-12 flex flex-col items-center justify-center">
      {/* Decorative blobs - larger and more visible */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-32 right-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />

      {/* Content wrapper */}
      <div className="relative z-10 max-w-2xl text-center space-y-6">
        <p className="text-sm md:text-base font-semibold uppercase tracking-widest text-accent animate-pulse">
          இந்தியாவைச் சார்ந்த  தமிழர்களுக்கான திருமண தகவல் மையம்
        </p>

        <p className="inline-block rounded-full bg-accent px-5 py-1.5 text-sm font-extrabold text-primary">100% Free for Brides</p>

        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
          Lura-வின் துணையுடன்
          <span className="block text-accent mt-2">உங்கள் வாழ்க்கைத் துணை.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-xl mx-auto">
          Verified profiles, District, Age and Caste based search, and a family-first experience.
        </p>

        {/* CTA Buttons */}
        <div className="relative pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm mx-auto">
          <Link
            href="/register"
            className="rounded-[var(--radius-2xl)] bg-accent hover:shadow-lg text-white px-8 py-4 text-center text-base md:text-lg font-bold shadow-lg transition-fast active:scale-95 hover:scale-105"
          >
            Register Free
          </Link>
          <Link
            href="/profiles"
            className="rounded-[var(--radius-2xl)] border-2 border-white/40 bg-white/10 hover:bg-white/20 px-8 py-4 text-center text-base md:text-lg font-bold text-white backdrop-blur-sm transition-fast active:scale-95 hover:scale-105"
          >
            View Profiles
          </Link>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown size={24} className="text-white/50" strokeWidth={1.5} />
      </div>
    </section>
  );
}
