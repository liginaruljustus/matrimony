"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/** Full-screen photo viewer with prev/next and Esc / arrow-key support. */
export function PhotoLightbox({
  photos,
  index,
  alt,
  onClose,
  onIndexChange,
}: {
  photos: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const count = photos.length;
  const prev  = () => onIndexChange((index - 1 + count) % count);
  const next  = () => onIndexChange((index + 1) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) prev();
      else if (e.key === "ArrowRight" && count > 1) next();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }); // re-bind each render so prev/next see the current index

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      {count > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Previous photo"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-full rounded-lg object-contain shadow-2xl"
      />

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight size={26} />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {index + 1} / {count}
          </p>
        </>
      )}
    </div>
  );
}
