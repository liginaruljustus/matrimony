"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Heart, Users,
  MapPin, GraduationCap, Star, RefreshCw, X,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SearchDropdown } from "@/components/SearchDropdown";
import { CASTE_LIST } from "@/lib/casteData";
import { DISTRICTS } from "@/lib/districts";
import { FAMILY_CLASS_CARD_STYLE, FAMILY_CLASS_CARD_FALLBACK, FAMILY_CLASS_PLACEHOLDER_BG, FAMILY_CLASS_PLACEHOLDER_FALLBACK } from "@/lib/familyClass";

type MDProfile = {
  _id: string;
  userId: string;
  profileId: string;
  name: string;
  age: number;
  religion: string;
  caste: string;
  subCaste?: string;
  district: string;
  education: string;
  currentJob?: string;
  photo?: string;
  familyClass: "MC" | "UC" | "EC";
  maritalStatus?: string;
  nakshatra?: string;
  rashi?: string;
  createdAt: string;
};

const CLASS_TABS = [
  { key: "ALL", label: "All" },
  { key: "MC",  label: "Middle Class" },
  { key: "UC",  label: "Upper Class" },
  { key: "EC",  label: "Elite Class" },
];

function FilterInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
      />
    </div>
  );
}

export default function ProfilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profiles, setProfiles]     = useState<MDProfile[]>([]);
  const [loading, setLoading]        = useState(true);
  const [classTab, setClassTab]      = useState("ALL");
  const [showFilters, setShowFilters]= useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState({
    profileId:     "",
    minAge:        "",
    maxAge:        "",
    caste:         "",
    district:      "",
  });

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classTab !== "ALL") params.set("familyClass", classTab);
      if (filters.profileId)     params.set("profileId",     filters.profileId);
      if (filters.minAge)        params.set("minAge",         filters.minAge);
      if (filters.maxAge)        params.set("maxAge",         filters.maxAge);
      if (filters.caste)         params.set("caste",          filters.caste);
      if (filters.district)      params.set("district",       filters.district);

      const res = await fetch(`/api/profiles/search?${params}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [classTab, filters]);

  // Fetch existing favorites once on mount so hearts show filled correctly
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.favorites) {
          setFavoritedIds(new Set(data.favorites.map((f: any) => f.favoriteUserId)));
        }
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      // Brides don't browse profiles — send them to their own inbox
      const profileType = (session?.user as any)?.profileType;
      if (profileType === "BRIDE") { router.replace("/bride-inbox"); return; }
      loadProfiles();
    }
  }, [status, session, loadProfiles, router]);

  const [filterResetKey, setFilterResetKey] = useState(0);
  const resetFilters = () => {
    setFilters({ profileId: "", minAge: "", maxAge: "", caste: "", district: "" });
    setClassTab("ALL");
    setFilterResetKey((k) => k + 1); // remount SearchDropdowns so their internal text clears too
  };

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#7a1f2b]">Browse Profiles</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {profiles.length} profile{profiles.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0 flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Class Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CLASS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setClassTab(tab.key)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              classTab === tab.key
                ? "bg-[#7a1f2b] text-white shadow-sm"
                : "bg-white dark:bg-neutral-100 border border-neutral-200 dark:border-neutral-200 text-neutral-600 dark:text-neutral-700 hover:border-[#7a1f2b]/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-900">Search Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <X size={18} className="text-neutral-400 hover:text-neutral-700" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <FilterInput label="Profile ID"   value={filters.profileId}   onChange={(v) => setFilters({ ...filters, profileId: v })}   placeholder="e.g. F0326H00001MC" />
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Caste</label>
              <SearchDropdown
                key={`caste-${filterResetKey}`}
                value={filters.caste}
                onChange={(v) => setFilters({ ...filters, caste: v })}
                options={CASTE_LIST}
                placeholder="e.g. Mudaliar"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">District</label>
              <SearchDropdown
                key={`district-${filterResetKey}`}
                value={filters.district}
                onChange={(v) => setFilters({ ...filters, district: v })}
                options={DISTRICTS}
                placeholder="e.g. Chennai"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              />
            </div>
            <FilterInput label="Min Age"      value={filters.minAge}      onChange={(v) => setFilters({ ...filters, minAge: v })}      placeholder="18" type="number" />
            <FilterInput label="Max Age"      value={filters.maxAge}      onChange={(v) => setFilters({ ...filters, maxAge: v })}      placeholder="40" type="number" />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={loadProfiles}
              className="flex items-center gap-2 rounded-lg bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6b1823] transition-colors"
            >
              <Search size={15} /> Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
            >
              <RefreshCw size={15} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={48} className="text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-600">No profiles found</h3>
          <p className="mt-1 text-sm text-neutral-400">Try adjusting your filters</p>
          <button onClick={resetFilters} className="mt-4 text-sm font-semibold text-[#7a1f2b] hover:underline">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {profiles.map((profile) => (
            <MDProfileCard
              key={profile._id}
              profile={profile}
              currentUserId={session?.user?.id ?? ""}
              isFavorited={favoritedIds.has(profile.userId)}
              onFavorited={() => setFavoritedIds((prev) => new Set([...Array.from(prev), profile.userId]))}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

// ── MD Profile Card ────────────────────────────────────────────────────────────
function MDProfileCard({
  profile,
  currentUserId,
  isFavorited,
  onFavorited,
}: {
  profile: MDProfile;
  currentUserId: string;
  isFavorited: boolean;
  onFavorited: () => void;
}) {
  const cardStyle = FAMILY_CLASS_CARD_STYLE[profile.familyClass] ?? FAMILY_CLASS_CARD_FALLBACK;
  const classDot: Record<string, string> = { MC: "bg-green-500", UC: "bg-pink-500", EC: "bg-blue-500" };

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${cardStyle}`}>
      {/* Photo */}
      <div className={`relative h-52 overflow-hidden ${FAMILY_CLASS_PLACEHOLDER_BG[profile.familyClass] ?? FAMILY_CLASS_PLACEHOLDER_FALLBACK}`}>
        {profile.photo ? (
          <img
            src={profile.photo}
            alt={profile.profileId}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/70 dark:bg-neutral-100/70 text-3xl font-bold text-[#7a1f2b] ring-4 ring-[#d4af37]/40 shadow-md">
              {profile.profileId.charAt(0)}
            </div>
          </div>
        )}
        {/* Bottom fade for legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />

        {/* Family class badge — frosted pill */}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 dark:bg-neutral-100/85 px-3 py-1 text-xs font-bold text-neutral-800 backdrop-blur-sm shadow-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${classDot[profile.familyClass] ?? "bg-neutral-400"}`} />
          {profile.familyClass}
        </span>

        {/* Favorite button */}
        <div className="absolute right-3 top-3">
          <FavoriteButton
            targetUserId={profile.userId}
            initialIsFavorited={isFavorited}
            onToggle={(v) => { if (v) onFavorited(); }}
          />
        </div>

        {/* Profile ID overlaid on photo — highlighted */}
        <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
          <div className="inline-block rounded-xl bg-[#7a1f2b]/85 px-3 py-1.5 backdrop-blur-sm shadow-md">
            <h3 className="font-mono text-base font-extrabold text-white truncate">{profile.profileId}</h3>
            <p className="text-xs font-semibold text-[#f5d98a]">
              {profile.age} yrs • {profile.maritalStatus?.replace("_", " ") ?? "Single"}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-700">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/15">
              <Star size={11} className="text-[#d4af37]" />
            </span>
            <span className="pt-0.5">
              {profile.religion} • {profile.caste}
              {profile.subCaste ? ` (${profile.subCaste})` : ""}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-700">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7a1f2b]/10">
              <MapPin size={11} className="text-[#7a1f2b]" />
            </span>
            <span className="pt-0.5">{profile.district}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-700">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7a1f2b]/10">
              <GraduationCap size={11} className="text-[#7a1f2b]" />
            </span>
            <span className="pt-0.5">{profile.education}</span>
          </div>
          {profile.nakshatra && (
            <p className="pl-7 text-[11px] text-neutral-400">
              ★ {profile.nakshatra} • {profile.rashi}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/profiles/${profile.userId}`}
            className="flex-1 rounded-full bg-gradient-to-r from-[#7a1f2b] to-[#8f2635] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:shadow-md hover:from-[#6b1823] hover:to-[#7a1f2b] transition-all"
          >
            View Profile
          </Link>
          <FavoriteButton
            targetUserId={profile.userId}
            variant="button"
            label="Add Favourite"
            initialIsFavorited={isFavorited}
            onToggle={(v) => { if (v) onFavorited(); }}
          />
        </div>
      </div>
    </div>
  );
}
