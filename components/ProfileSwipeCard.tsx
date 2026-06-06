"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type SwipeProfile = {
  id: string;
  name: string;
  age: number;
  district: string;
  education: string;
  image: string;
  matchScore?: number;
};

const sampleProfiles: SwipeProfile[] = [
  {
    id: "1",
    name: "Nivetha",
    age: 26,
    district: "Madurai",
    education: "M.Tech",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
    matchScore: 94,
  },
  {
    id: "2",
    name: "Karthik",
    age: 29,
    district: "Coimbatore",
    education: "MBA",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    matchScore: 87,
  },
  {
    id: "3",
    name: "Harini",
    age: 27,
    district: "Chennai",
    education: "B.E",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600",
    matchScore: 91,
  },
];

export function ProfileSwipeCard() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const profile = useMemo(() => sampleProfiles[index], [index]);

  const handleNext = () => {
    setDirection("next");
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % sampleProfiles.length);
      setDirection(null);
    }, 300);
  };

  const handlePrev = () => {
    setDirection("prev");
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + sampleProfiles.length) % sampleProfiles.length);
      setDirection(null);
    }, 300);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-white/50 transition-all hover:shadow-2xl">
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-[#7a1f2b]/10 rounded-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-gradient-to-r from-slate-100 to-transparent">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#7a1f2b]">Perfect Matches</h2>
          <p className="text-sm text-slate-500 mt-1">✨ AI-powered recommendations for you</p>
        </div>
        <div className="flex items-center gap-2.5">
          {sampleProfiles.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`transition-all duration-300 rounded-full ${
                i === index ? "w-8 h-3 bg-gradient-to-r from-[#d4af37] to-[#f59e0b]" : "w-3 h-3 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to profile ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Photo carousel */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        <div
          className={`transition-all duration-300 ${
            direction === "next" ? "translate-x-full opacity-0" : direction === "prev" ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
          }`}
        >
          <img
            src={profile.image}
            alt={profile.name}
            className="h-72 w-full object-cover"
          />
        </div>

        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Profile info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <p className="font-serif text-4xl font-bold leading-tight">
                {profile.name}
              </p>
              <p className="text-lg text-white/90 mt-2">
                {profile.age} yrs • 📍 {profile.district}
              </p>
              <p className="text-sm text-white/80 mt-1">🎓 {profile.education}</p>
            </div>

            {/* Premium match score badge */}
            {profile.matchScore && (
              <div className="ml-4 flex flex-col items-center rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-2xl ring-2 ring-[#d4af37]/50">
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f59e0b]">
                  {profile.matchScore}%
                </p>
                <p className="text-xs font-bold text-[#7a1f2b] tracking-widest mt-0.5">MATCH</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative grid grid-cols-3 gap-3 p-6">
        <button
          onClick={handlePrev}
          className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 py-3 text-sm font-bold text-[#7a1f2b] transition hover:from-slate-200 hover:to-slate-100 active:scale-95 shadow-md"
          aria-label="Previous profile"
        >
          <span className="group-hover:-translate-x-1 transition">←</span> Prev
        </button>
        <Link
          href="/matches"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] py-3 text-sm font-bold text-[#502514] shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95"
        >
          💘 See All
        </Link>
        <button
          onClick={handleNext}
          className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 py-3 text-sm font-bold text-[#7a1f2b] transition hover:from-slate-200 hover:to-slate-100 active:scale-95 shadow-md"
          aria-label="Next profile"
        >
          Next <span className="group-hover:translate-x-1 transition">→</span>
        </button>
      </div>
    </section>
  );
}
