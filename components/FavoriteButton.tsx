"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, AlertCircle } from "lucide-react";

type FavoriteData = {
  id: string;
  expiresAt: string | null;
  isPaid: boolean;
  daysLeft: number | null;
  isTrialExpired: boolean;
};

type FavoriteButtonProps = {
  targetUserId: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "button";
  label?: string;
  initialIsFavorited?: boolean;
  favoriteData?: FavoriteData | null;
  onToggle?: (isFavorited: boolean) => void;
  onPayNeeded?: () => void;
};

export function FavoriteButton({
  targetUserId,
  size = "md",
  variant = "icon",
  label = "Add Favourite",
  initialIsFavorited = false,
  favoriteData,
  onToggle,
  onPayNeeded,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);
  const [showPayPrompt, setShowPayPrompt] = useState(false);
  const [favoriteInfo, setFavoriteInfo] = useState<FavoriteData | null>(favoriteData ?? null);

  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  useEffect(() => {
    if (favoriteData) {
      setFavoriteInfo(favoriteData);
      setIsFavorited(true);
    }
  }, [favoriteData]);

  // Sync when the parent learns the favorite status after mount
  // (e.g. profile detail page fetches /api/favorites after first render)
  useEffect(() => {
    if (initialIsFavorited) setIsFavorited(true);
  }, [initialIsFavorited]);

  const handleAdd = async () => {
    if (loading) return;

    // If expired and not paid, allow re-adding
    if (isFavorited && favoriteInfo?.isPaid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteUserId: targetUserId }),
      });
      if (res.ok) {
        setIsFavorited(true);
        // Re-fetch favorite info after adding
        setTimeout(() => {
          onToggle?.(true);
        }, 100);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = () => {
    setShowPayPrompt(true);
    onPayNeeded?.();
  };

  // Determine button state
  const isTrialExpired = favoriteInfo?.isTrialExpired ?? false;
  const isPaid = favoriteInfo?.isPaid ?? false;
  const daysLeft = favoriteInfo?.daysLeft ?? null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;

  // Status text for icons
  let statusText = "";
  let statusIcon = null;
  let statusColor = "";

  if (!isFavorited) {
    statusText = label;
  } else if (isPaid) {
    statusText = "Unlimited ♾️";
    statusColor = "text-purple-600";
  } else if (isTrialExpired) {
    statusText = "Expired - Pay to restore";
    statusIcon = "expired";
    statusColor = "text-gray-400";
  } else if (isExpiringSoon) {
    statusText = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
    statusIcon = "warning";
    statusColor = "text-orange-600";
  } else if (daysLeft !== null) {
    statusText = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
    statusIcon = "clock";
    statusColor = "text-blue-600";
  }

  if (variant === "button") {
    if (isTrialExpired && !isPaid) {
      return (
        <button
          onClick={handlePayClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
          title="Favorite expired. Click to pay and restore."
        >
          <Heart size={iconSize} />
          Pay to restore
        </button>
      );
    }

    if (isFavorited && isExpiringSoon && !isPaid) {
      return (
        <button
          onClick={handlePayClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors bg-orange-50 text-orange-600 hover:bg-orange-100"
          title="Favorite expiring soon. Click to pay to keep."
        >
          <AlertCircle size={iconSize} />
          Pay to keep ({daysLeft}d)
        </button>
      );
    }

    return (
      <button
        onClick={handleAdd}
        disabled={isFavorited || loading}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
          isFavorited
            ? isPaid
              ? "bg-purple-50 text-purple-600 cursor-default"
              : "bg-blue-50 text-blue-600 cursor-default"
            : "border border-[#7a1f2b] text-[#7a1f2b] hover:bg-[#7a1f2b]/5"
        } disabled:opacity-60`}
        title={isFavorited ? (isPaid ? "Permanent favorite" : statusText) : label}
      >
        <Heart size={iconSize} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
        {isFavorited
          ? isPaid
            ? "Unlimited ♾️"
            : daysLeft !== null
              ? `${daysLeft}d left`
              : "Favourited"
          : label}
      </button>
    );
  }

  // Icon variant
  const sizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-9 w-9";

  let bgColor = "bg-white/90 dark:bg-neutral-100/90";
  let textColor = "text-neutral-400 hover:text-red-400";
  let cursorClass = "";

  if (isFavorited) {
    if (isPaid) {
      bgColor = "bg-purple-100";
      textColor = "text-purple-600 cursor-default";
    } else if (isTrialExpired) {
      bgColor = "bg-gray-100";
      textColor = "text-gray-400 cursor-default";
    } else if (isExpiringSoon) {
      bgColor = "bg-orange-100";
      textColor = "text-orange-600 cursor-default";
    } else {
      bgColor = "bg-red-100";
      textColor = "text-red-500 cursor-default";
    }
  }

  const title = isFavorited
    ? isPaid
      ? "Permanent favorite"
      : isTrialExpired
        ? "Expired - click to restore"
        : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
    : "Add to favourites";

  return (
    <div className="relative group">
      <button
        onClick={isTrialExpired && !isPaid ? handlePayClick : handleAdd}
        disabled={isFavorited && !isTrialExpired && !isExpiringSoon && !isPaid ? true : loading}
        className={`${sizeClass} flex items-center justify-center rounded-full transition-all active:scale-95 ${bgColor} ${textColor} disabled:opacity-60`}
        title={title}
      >
        <Heart
          size={iconSize}
          className={isFavorited ? "fill-current" : ""}
          strokeWidth={2}
        />
      </button>

      {/* Expiry badge for icon variant */}
      {isFavorited && daysLeft !== null && !isPaid && (
        <div
          className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center ${
            isExpiringSoon
              ? "bg-orange-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          {daysLeft}
        </div>
      )}

      {isFavorited && isTrialExpired && !isPaid && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center bg-gray-400 text-white">
          ✕
        </div>
      )}

      {isFavorited && isPaid && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center bg-purple-600 text-white">
          ∞
        </div>
      )}
    </div>
  );
}
