"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

type FavoriteButtonProps = {
  targetUserId: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "button";
  label?: string;
  initialIsFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
};

export function FavoriteButton({
  targetUserId,
  size = "md",
  variant = "icon",
  label = "Add Favourite",
  initialIsFavorited = false,
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);

  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  const handleAdd = async () => {
    if (isFavorited || loading) return; // favorites cannot be removed once added
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteUserId: targetUserId }),
      });
      if (res.ok) {
        setIsFavorited(true);
        onToggle?.(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleAdd}
        disabled={isFavorited || loading}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
          isFavorited
            ? "bg-red-50 text-red-500 cursor-default"
            : "border border-[#7a1f2b] text-[#7a1f2b] hover:bg-[#7a1f2b]/5"
        } disabled:opacity-60`}
        title={isFavorited ? "Already in favourites" : label}
      >
        <Heart size={iconSize} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
        {isFavorited ? "Favourited" : label}
      </button>
    );
  }

  // Icon variant
  const sizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  return (
    <button
      onClick={handleAdd}
      disabled={isFavorited || loading}
      className={`${sizeClass} flex items-center justify-center rounded-full transition-all active:scale-95 ${
        isFavorited
          ? "bg-red-100 text-red-500 cursor-default"
          : "bg-white/90 dark:bg-neutral-100/90 text-neutral-400 hover:bg-white dark:hover:bg-neutral-100 hover:text-red-400"
      } disabled:opacity-60`}
      title={isFavorited ? "Already in favourites" : "Add to favourites"}
    >
      <Heart size={iconSize} className={isFavorited ? "fill-red-500 text-red-500" : ""} strokeWidth={2} />
    </button>
  );
}
