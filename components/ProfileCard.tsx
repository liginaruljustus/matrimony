import Link from "next/link";
import { FavoriteButton } from "./FavoriteButton";
import { User } from "lucide-react";

type ProfileCardProps = {
  id: string;
  name: string;
  age: number;
  religion: string;
  caste: string;
  location: string;
  education: string;
  income: number;
  bio?: string | null;
  photos?: string[];
  matchScore?: number;
};

export function ProfileCard(props: ProfileCardProps) {
  const mainPhoto = props.photos?.[0] ?? null;

  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-2xl)] bg-white transition-fast hover:shadow-lg hover:-translate-y-1">
      {/* Gradient border effect using design tokens */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-primary/20 rounded-[var(--radius-2xl)] pointer-events-none" />

      {/* Photo with overlay */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 h-52">
        <Link href={`/profiles/${props.id}`} className="block w-full h-full">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={props.name}
              className="h-full w-full object-cover transition-base group-hover:scale-125"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-100">
              <User size={64} className="text-neutral-400" strokeWidth={1} />
            </div>
          )}
        </Link>

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Favorite button */}
        <div className="absolute top-4 left-4 z-10">
          <FavoriteButton targetUserId={props.id} size="md" />
        </div>

        {/* Match score badge - modern design with tokens */}
        {props.matchScore !== undefined && (
          <div className="absolute top-4 right-4 flex flex-col items-center rounded-2xl bg-white/95 backdrop-blur-sm px-3.5 py-2.5 shadow-xl ring-1 ring-white/50">
            <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-500">
              {props.matchScore}%
            </p>
            <p className="text-[10px] font-bold text-primary tracking-wide">MATCH</p>
          </div>
        )}

        {/* Quick info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-display text-2xl font-bold text-white leading-tight">
            {props.name}
          </p>
          <p className="text-sm text-white/90 mt-1">
            {props.age} yrs • {props.location}
          </p>
        </div>
      </div>

      {/* Content section */}
      <div className="p-[var(--card-padding-md)] space-y-3">
        {/* Details tags using Badge-like styling */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20">
            {props.education}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/20">
            {props.religion}
          </span>
        </div>

        {/* Bio */}
        {props.bio && (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {props.bio}
          </p>
        )}

        {/* Income info */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-text-tertiary">Annual Income</p>
          <p className="text-sm font-bold text-primary">
            ₹{(props.income / 100000).toFixed(1)}L
          </p>
        </div>

        {/* Action buttons */}
        <div className="pt-1">
          <Link
            href={`/profiles/${props.id}`}
            className="block rounded-lg bg-neutral-100 px-3 py-2.5 text-center text-xs font-semibold text-primary transition-fast hover:bg-neutral-200 active:scale-95"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
