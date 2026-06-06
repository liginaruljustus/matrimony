import Link from "next/link";
import { Heart, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf7f2] px-4 text-center">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <Heart size={28} className="fill-[#7a1f2b] text-[#7a1f2b]" />
        <span className="text-xl font-bold text-[#7a1f2b]">Regin Matrimony</span>
      </div>

      {/* 404 */}
      <div className="mb-2 font-serif text-8xl font-extrabold text-[#7a1f2b]/20 md:text-9xl">
        404
      </div>

      <h1 className="mt-2 text-2xl font-bold text-neutral-800 md:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7a1f2b] px-6 py-3 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
        >
          <Home size={15} />
          Back to Home
        </Link>
        <Link
          href="/profiles"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Search size={15} />
          Browse Profiles
        </Link>
      </div>

      {/* Decorative */}
      <p className="mt-16 font-serif text-sm italic text-neutral-300">
        &ldquo;குடும்பம் பேசும் திருமண மேடை&rdquo;
      </p>
    </div>
  );
}
