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
import { FAMILY_CLASS_COLORS, FAMILY_CLASS_FALLBACK } from "@/lib/familyClass";

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
  const [favoriteData, setFavoriteData] = useState<Record<string, any>>({}); // Full favorite info with expiry

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
          // Store full favorite data keyed by favoriteUserId
          const favDataMap: Record<string, any> = {};
          data.favorites.forEach((f: any) => {
            favDataMap[f.favoriteUserId] = {
              id: f.id,
              expiresAt: f.expiresAt,
              isPaid: f.isPaid,
              daysLeft: f.daysLeft,
              isTrialExpired: f.isTrialExpired,
            };
          });
          setFavoriteData(favDataMap);
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

  const resetFilters = () => {
    setFilters({ profileId: "", minAge: "", maxAge: "", caste: "", district: "" });
    setClassTab("ALL");
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
            <FilterInput label="Caste"        value={filters.caste}       onChange={(v) => setFilters({ ...filters, caste: v })}       placeholder="e.g. Mudaliar" />
            <FilterInput label="District"     value={filters.district}    onChange={(v) => setFilters({ ...filters, district: v })}    placeholder="e.g. Chennai" />
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
              favoriteData={favoriteData[profile.userId] ?? null}
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
  favoriteData,
  onFavorited,
}: {
  profile: MDProfile;
  currentUserId: string;
  isFavorited: boolean;
  favoriteData?: any;
  onFavorited: () => void;
}) {
  const classColors = FAMILY_CLASS_COLORS;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-200 bg-white dark:bg-neutral-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Photo */}
      <div className="relative h-48 bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
        {profile.photo ? (
          <img src={profile.photo} alt={profile.profileId} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-3xl font-bold text-[#7a1f2b]">
              {profile.profileId.charAt(0)}
            </div>
          </div>
        )}
        {/* Family class badge */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${classColors[profile.familyClass] ?? FAMILY_CLASS_FALLBACK}`}>
          {profile.familyClass}
        </span>
        {/* Favorite button — icon */}
        <div className="absolute right-3 top-3">
          <FavoriteButton
            targetUserId={profile.userId}
            initialIsFavorited={isFavorited}
            favoriteData={favoriteData}
            onToggle={(v) => { if (v) onFavorited(); }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1">
          <h3 className="font-bold font-mono text-neutral-900 dark:text-neutral-900 truncate">{profile.profileId}</h3>
        </div>

        <p className="text-sm text-neutral-600">
          {profile.age} yrs • {profile.maritalStatus?.replace("_", " ") ?? "Single"}
        </p>

        <div className="mt-3 space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Star size={12} className="text-[#d4af37]" />
            {profile.religion} • {profile.caste}
            {profile.subCaste ? ` (${profile.subCaste})` : ""}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <MapPin size={12} className="text-[#7a1f2b]" />
            {profile.district}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <GraduationCap size={12} className="text-[#7a1f2b]" />
            {profile.education}
          </p>
          {profile.nakshatra && (
            <p className="text-xs text-neutral-400">
              ★ {profile.nakshatra} • {profile.rashi}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/profiles/${profile.userId}`}
            className="flex-1 rounded-lg bg-[#7a1f2b] py-2 text-center text-xs font-semibold text-white hover:bg-[#6b1823] transition-colors"
          >
            View Profile
          </Link>
          <FavoriteButton
            targetUserId={profile.userId}
            variant="button"
            label="Add Favourite"
            initialIsFavorited={isFavorited}
            favoriteData={favoriteData}
            onToggle={(v) => { if (v) onFavorited(); }}
          />
        </div>
      </div>
    </div>
  );
}
