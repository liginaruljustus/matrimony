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
import { Navbar } from "@/components/Navbar";

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
  height?: number;
  complexion?: string;
  maritalStatus?: string;
  photo?: string;
  familyClass: "MC" | "UC" | "EC";
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
    religion:      "",
    caste:         "",
    district:      "",
    nakshatra:     "",
    maritalStatus: "",
    minHeight:     "",
    maxHeight:     "",
    complexion:    "",
  });

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classTab !== "ALL") params.set("familyClass", classTab);
      if (filters.profileId)     params.set("profileId",     filters.profileId);
      if (filters.minAge)        params.set("minAge",         filters.minAge);
      if (filters.maxAge)        params.set("maxAge",         filters.maxAge);
      if (filters.religion)      params.set("religion",       filters.religion);
      if (filters.caste)         params.set("caste",          filters.caste);
      if (filters.district)      params.set("district",       filters.district);
      if (filters.nakshatra)     params.set("nakshatra",      filters.nakshatra);
      if (filters.maritalStatus) params.set("maritalStatus",  filters.maritalStatus);
      if (filters.minHeight)     params.set("minHeight",      filters.minHeight);
      if (filters.maxHeight)     params.set("maxHeight",      filters.maxHeight);
      if (filters.complexion)    params.set("complexion",     filters.complexion);

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

  const resetFilters = () => {
    setFilters({ profileId: "", minAge: "", maxAge: "", religion: "", caste: "", district: "", nakshatra: "", maritalStatus: "", minHeight: "", maxHeight: "", complexion: "" });
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
    <div className="bg-[#faf7f2] min-h-screen">
      <Navbar />
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
          className="shrink-0 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
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
                : "bg-white border border-neutral-200 text-neutral-600 hover:border-[#7a1f2b]/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Search Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <X size={18} className="text-neutral-400 hover:text-neutral-700" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <FilterInput label="Profile ID"   value={filters.profileId}   onChange={(v) => setFilters({ ...filters, profileId: v })}   placeholder="e.g. F0326H00001MC" />
            <FilterInput label="Religion"     value={filters.religion}    onChange={(v) => setFilters({ ...filters, religion: v })}    placeholder="e.g. Hindu" />
            <FilterInput label="Caste"        value={filters.caste}       onChange={(v) => setFilters({ ...filters, caste: v })}       placeholder="e.g. Mudaliar" />
            <FilterInput label="District"     value={filters.district}    onChange={(v) => setFilters({ ...filters, district: v })}    placeholder="e.g. Chennai" />
            <FilterInput label="Min Age"      value={filters.minAge}      onChange={(v) => setFilters({ ...filters, minAge: v })}      placeholder="18" type="number" />
            <FilterInput label="Max Age"      value={filters.maxAge}      onChange={(v) => setFilters({ ...filters, maxAge: v })}      placeholder="40" type="number" />
            <FilterInput label="Min Height (cm)" value={filters.minHeight} onChange={(v) => setFilters({ ...filters, minHeight: v })} placeholder="150" type="number" />
            <FilterInput label="Max Height (cm)" value={filters.maxHeight} onChange={(v) => setFilters({ ...filters, maxHeight: v })} placeholder="175" type="number" />
            <FilterInput label="Nakshatra"    value={filters.nakshatra}   onChange={(v) => setFilters({ ...filters, nakshatra: v })}   placeholder="e.g. Rohini" />
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Marital Status</label>
              <select
                value={filters.maritalStatus}
                onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              >
                <option value="">Any</option>
                <option value="NEVER_MARRIED">Never Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-600">Complexion</label>
              <select
                value={filters.complexion}
                onChange={(e) => setFilters({ ...filters, complexion: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              >
                <option value="">Any</option>
                <option value="Fair">Fair</option>
                <option value="Wheatish">Wheatish</option>
                <option value="Dark">Dark</option>
              </select>
            </div>
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
              className="flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
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
  const classColors: Record<string, string> = {
    MC: "bg-blue-50 text-blue-700",
    UC: "bg-purple-50 text-purple-700",
    EC: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Photo */}
      <div className="relative h-48 bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
        {profile.photo ? (
          <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-3xl font-bold text-[#7a1f2b]">
              {profile.name.charAt(0)}
            </div>
          </div>
        )}
        {/* Family class badge */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${classColors[profile.familyClass] ?? "bg-neutral-100 text-neutral-700"}`}>
          {profile.familyClass}
        </span>
        {/* Favorite button — icon */}
        <div className="absolute right-3 top-3">
          <FavoriteButton
            targetUserId={profile.userId}
            initialIsFavorited={isFavorited}
            onToggle={(v) => { if (v) onFavorited(); }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-neutral-900 truncate">{profile.name}</h3>
          <span className="shrink-0 ml-2 font-mono text-xs text-neutral-400">{profile.profileId}</span>
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
            onToggle={(v) => { if (v) onFavorited(); }}
          />
        </div>
      </div>
    </div>
  );
}
