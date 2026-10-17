/**
 * A user's Profile ID, highlighted the same way everywhere it appears.
 *
 *   <ProfileIdBadge id={card.profileId} />            small, inline
 *   <ProfileIdBadge id={card.profileId} size="lg" />  card / page titles
 *   <ProfileIdBadge id={id} tone="light" />           on a dark or photo background
 */
const SIZES = {
  xs: "px-1.5 py-0.5 text-[10px] rounded",
  sm: "px-2 py-0.5 text-xs rounded-md",
  md: "px-2.5 py-1 text-sm rounded-md",
  lg: "px-3 py-1 text-base rounded-lg",
  xl: "px-3.5 py-1.5 text-2xl rounded-lg",
} as const;

const TONES = {
  default: "bg-[#7a1f2b]/10 text-[#7a1f2b] ring-1 ring-[#7a1f2b]/25",
  light:   "bg-white/95 text-[#7a1f2b] ring-1 ring-white/60 shadow-sm",
} as const;

export function ProfileIdBadge({
  id,
  size = "sm",
  tone = "default",
  className = "",
}: {
  id?: string | null;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  if (!id) return <span className="text-neutral-400">—</span>;
  return (
    <span
      className={`inline-flex max-w-full items-center font-mono font-bold tracking-wide break-all ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {id}
    </span>
  );
}
