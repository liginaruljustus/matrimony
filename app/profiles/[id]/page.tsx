"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  User, Star, MapPin, GraduationCap, Heart,
  CheckCircle, Lock, ArrowLeft,
} from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";

type PublicProfile = {
  profileId: string;
  userId: string;
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
  photos: string[];
  familyClass: string;
  nakshatra?: string;
  rashi?: string;
  bio?: string;
  profileType: string;
  isFrozen: boolean;
  isAutoFrozen: boolean;
};

const CLASS_COLOR: Record<string, string> = {
  MC: "bg-blue-50 text-blue-700",
  UC: "bg-purple-50 text-purple-700",
  EC: "bg-amber-50 text-amber-700",
};

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [profile, setProfile]     = useState<PublicProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Redirect unauthenticated visitors directly to login (not via /profiles)
  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return; // wait for auth to resolve
    const load = async () => {
      const res = await fetch(`/api/profiles/${id}`);
      if (!res.ok) { router.push("/profiles"); return; }
      const data = await res.json();
      // Support both old shape (data.profile) and new shape (data directly)
      const p = data.profile ?? data;
      const resolvedUserId = p.userId ?? id;
      setProfile({
        profileId:    p.userProfileId ?? p.profileId ?? "",
        userId:       resolvedUserId,
        name:         p.userName  ?? p.name ?? "Unknown",
        age:          p.age ?? 0,
        religion:     p.religion ?? "",
        caste:        p.caste ?? "",
        subCaste:     p.subCaste,
        district:     p.nativeDistrict ?? p.location ?? "",
        education:    p.education ?? "",
        currentJob:   p.currentJob,
        height:       p.height,
        complexion:   p.complexion,
        maritalStatus:p.maritalStatus,
        photos:       p.photos ?? [],
        familyClass:  p.familyClass ?? "",
        nakshatra:    p.nakshatra,
        rashi:        p.rashi,
        bio:          p.bio,
        profileType:  p.profileType ?? "",
        isFrozen:     !!(p.isFrozen),
        isAutoFrozen: !!(p.isAutoFrozen),
      });
      setLoading(false);
      // Pre-fetch favorite status so the heart button shows the correct state
      try {
        const favRes = await fetch("/api/favorites");
        if (favRes.ok) {
          const favData = await favRes.json();
          const favIds = new Set((favData.favorites ?? []).map((f: any) => f.favoriteUserId as string));
          setIsFavorited(favIds.has(resolvedUserId));
        }
      } catch { /* keep default false */ }
    };
    void load();
  }, [id, router, authStatus]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  if (!profile) return null;

  const isOwn  = session?.user?.id === profile.userId;
  const frozen = profile.isFrozen || profile.isAutoFrozen;
  const photos = profile.photos;

  return (
    <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      {/* Back */}
      <Link
        href="/profiles"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-[#7a1f2b]"
      >
        <ArrowLeft size={15} />
        Back to Profiles
      </Link>

      {/* Frozen banner */}
      {frozen && !isOwn && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-200 bg-neutral-50 dark:bg-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:text-neutral-700">
          <Lock size={15} />
          This profile is temporarily unavailable.
        </div>
      )}

      {/* Photo gallery */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
        {photos[activePhoto] ? (
          <img
            src={photos[activePhoto]}
            alt={profile.profileId}
            className="h-80 w-full object-cover"
          />
        ) : (
          <div className="flex h-80 items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-4xl font-bold text-[#7a1f2b]">
              {profile.profileId.charAt(0)}
            </div>
          </div>
        )}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {photos.map((src, i) => (
              <button
                key={src}
                onClick={() => setActivePhoto(i)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === activePhoto ? "border-[#7a1f2b]" : "border-transparent opacity-60"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Name + badges + CTA */}
      <div className="flex items-start justify-between rounded-2xl bg-white dark:bg-neutral-100 p-4 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-900">{profile.profileId}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CLASS_COLOR[profile.familyClass] ?? "bg-neutral-100 text-neutral-700"}`}>
              {profile.familyClass}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {profile.age} yrs · {profile.maritalStatus?.replace("_", " ") ?? "Single"}
          </p>
        </div>

        {!isOwn && !frozen && (
          <FavoriteButton
            targetUserId={profile.userId}
            variant="button"
            label="Add Favourite"
            initialIsFavorited={isFavorited}
            onToggle={(v) => setIsFavorited(v)}
          />
        )}
        {isOwn && (
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#7a1f2b]/30 px-4 py-2 text-sm font-semibold text-[#7a1f2b] hover:bg-[#7a1f2b]/5 transition-colors"
          >
            Edit Profile
          </Link>
        )}
      </div>

      {/* Key details grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Religion",   value: `${profile.religion}${profile.caste ? ` · ${profile.caste}` : ""}` },
          { label: "Education",  value: profile.education },
          { label: "District",   value: profile.district },
          profile.currentJob  ? { label: "Occupation", value: profile.currentJob }  : null,
          profile.height      ? { label: "Height",     value: `${profile.height} cm` } : null,
          profile.complexion  ? { label: "Complexion", value: profile.complexion }  : null,
          profile.nakshatra   ? { label: "Nakshatra",  value: profile.nakshatra }   : null,
          profile.rashi       ? { label: "Rashi",      value: profile.rashi }       : null,
          profile.subCaste    ? { label: "Sub-caste",  value: profile.subCaste }    : null,
        ].filter(Boolean).map(({ label, value }: any) => (
          <div key={label} className="rounded-xl bg-white dark:bg-neutral-100 p-3 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-200">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#d4af37]">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-neutral-800 dark:text-neutral-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="rounded-2xl bg-white dark:bg-neutral-100 p-4 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-200">
          <h2 className="mb-2 text-sm font-semibold text-[#7a1f2b]">About</h2>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-700">{profile.bio}</p>
        </div>
      )}

      {/* Payment tier info — non-owner, non-frozen */}
      {!isOwn && !frozen && (
        <div className="rounded-2xl border border-[#d4af37]/30 bg-[#fff9ef] dark:bg-neutral-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-[#7a1f2b]">Unlock More Details</h2>
          <div className="space-y-2">
            <TierRow
              step="1st Payment"
              desc="Unlock family, income, horoscope & more photos"
              color="text-blue-700"
            />
            <TierRow
              step="2nd Payment"
              desc="Unlock phone number, WhatsApp & contact person"
              color="text-green-700"
            />
          </div>
          <div className="mt-4">
            <FavoriteButton
              targetUserId={profile.userId}
              variant="button"
              label="Add to Favourites to Start"
              initialIsFavorited={isFavorited}
              onToggle={(v) => setIsFavorited(v)}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function TierRow({ step, desc, color }: { step: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle size={14} className={`mt-0.5 shrink-0 ${color}`} />
      <div>
        <span className={`text-xs font-bold ${color}`}>{step}: </span>
        <span className="text-xs text-neutral-600 dark:text-neutral-700">{desc}</span>
      </div>
    </div>
  );
}
