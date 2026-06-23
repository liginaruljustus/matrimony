"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { ProfileCard } from "@/components/ProfileCard";

type Match = {
  userId: string;
  age: number;
  religion: string;
  caste: string;
  location: string;
  education: string;
  income: number;
  bio?: string;
  photos: string[];
  matchScore: number;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(50);
  const [interestSentFor, setInterestSentFor] = useState<string | null>(null);

  // Auth guard + bride guard
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const profileType = (session?.user as any)?.profileType;
      if (profileType === "BRIDE") router.replace("/bride-inbox");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const loadMatches = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/matches");
        if (!res.ok) throw new Error("Failed to load matches");
        const data = await res.json();
        setMatches(data.matches ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matches");
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
  }, [status]);

  const filteredMatches = matches.filter((m) => m.matchScore >= minScore);

  const sendInterest = async (receiverId: string) => {
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    });
    if (res.ok) {
      setInterestSentFor(receiverId);
      setTimeout(() => setInterestSentFor(null), 3000);
    }
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "from-green-400 to-emerald-500 text-white";
    if (score >= 80) return "from-blue-400 to-cyan-500 text-white";
    if (score >= 70) return "from-purple-400 to-pink-500 text-white";
    if (score >= 60) return "from-amber-400 to-orange-500 text-white";
    return "from-slate-400 to-slate-500 text-white";
  };

  if (status === "loading") {
    return (
      <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      {/* Interest sent toast */}
      {interestSentFor && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <CheckCircle size={16} />
          Interest sent!
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="space-y-8">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7a1f2b] via-[#8e2332] to-[#5e1720] p-8 md:p-12 text-white shadow-2xl">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#d4af37]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-5xl">💘</span>
                <h1 className="text-4xl md:text-5xl font-serif font-bold">Perfect Matches</h1>
              </div>
              <p className="text-lg text-white/90 mt-3 max-w-2xl">
                Discover profiles intelligently ranked by AI compatibility scoring. Find your perfect match today.
              </p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="rounded-3xl bg-white dark:bg-neutral-100 p-6 shadow-lg ring-1 ring-white/50 dark:ring-neutral-200/50">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="flex-1">
                <p className="text-sm font-bold text-[#7a1f2b] mb-3">Minimum Compatibility Score</p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="flex-1 h-2.5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-neutral-300 dark:to-neutral-300 rounded-full appearance-none cursor-pointer accent-[#d4af37]"
                  />
                  <div className={`min-w-fit px-4 py-2.5 rounded-xl bg-gradient-to-r ${getScoreBg(minScore)} font-bold text-center`}>
                    {minScore}%+
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-100 dark:to-neutral-200 shadow-md">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#7a1f2b] border-t-[#d4af37]" />
                <p className="mt-4 text-slate-600 dark:text-neutral-700 font-semibold">Finding your perfect matches...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center rounded-3xl bg-red-50 shadow-md ring-1 ring-red-200">
              <div className="text-center">
                <p className="text-2xl mb-2">⚠️</p>
                <p className="text-red-700 font-bold">{error}</p>
                <p className="text-sm text-red-600 mt-2">Please try again later</p>
              </div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-3xl bg-slate-50 dark:bg-neutral-100 shadow-md ring-1 ring-slate-200 dark:ring-neutral-200">
              <div className="text-center">
                <p className="text-3xl mb-3">😊</p>
                <p className="text-slate-600 dark:text-neutral-700 font-bold">No matches at this score</p>
                <p className="text-sm text-slate-500 dark:text-neutral-700 mt-2">Try lowering the minimum score threshold</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-[#7a1f2b] to-[#5e1720] p-6 text-white shadow-lg ring-1 ring-white/20">
                  <p className="text-4xl font-bold font-serif">{filteredMatches.length}</p>
                  <p className="text-sm text-white/80 mt-2">Compatible Matches</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#f59e0b] p-6 text-white shadow-lg ring-1 ring-white/20">
                  <p className="text-4xl font-bold font-serif">
                    {(
                      filteredMatches.reduce((sum, m) => sum + m.matchScore, 0) /
                      filteredMatches.length
                    ).toFixed(0)}
                    %
                  </p>
                  <p className="text-sm text-white/90 mt-2">Average Score</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 text-white shadow-lg ring-1 ring-white/20">
                  <p className="text-4xl font-bold font-serif">{matches[0]?.matchScore || 0}%</p>
                  <p className="text-sm text-white/90 mt-2">Best Match</p>
                </div>
              </div>

              {/* Profile Grid */}
              <div>
                <p className="text-sm font-bold text-slate-600 dark:text-neutral-700 mb-4">Showing {filteredMatches.length} results</p>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMatches.map((match) => (
                    <div key={match.userId}>
                      <ProfileCard
                        id={match.user.id}
                        name={match.user.name}
                        age={match.age}
                        religion={match.religion}
                        caste={match.caste}
                        location={match.location}
                        education={match.education}
                        income={match.income}
                        bio={match.bio}
                        photos={match.photos}
                        matchScore={match.matchScore}
                        onSendInterest={sendInterest}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CTA Footer */}
          <div className="text-center py-8">
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-neutral-200 dark:to-neutral-100 px-8 py-4 font-bold text-[#7a1f2b] transition hover:from-slate-200 hover:to-slate-100 dark:hover:from-neutral-300 dark:hover:to-neutral-200 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md"
            >
              ← View All Profiles
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
