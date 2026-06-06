"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, MapPin, GraduationCap, Star, CreditCard,
  Clock, CheckCircle, Lock, AlertCircle, User,
  ShoppingCart, Inbox, ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

type FavItem = {
  id: string;
  favoriteUserId: string;
  status: "ACTIVE" | "PAYMENT_LOCKED" | "PAID";
  movedToPayment: boolean;
  paymentLockExpiresAt: string | null;
  lockExpired: boolean;
  firstPaidAt: string | null;
  firstPaymentApproved: boolean;
  inboxFrozenUntil: string | null;
  secondPaidAt: string | null;
  secondPaymentApproved: boolean;
  createdAt: string;
  isBrideFrozen: boolean;
  mdCard: {
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
    familyClass: string;
    nakshatra?: string;
    rashi?: string;
  } | null;
};

const CLASS_COLOR: Record<string, string> = {
  MC: "bg-blue-50 text-blue-700",
  UC: "bg-purple-50 text-purple-700",
  EC: "bg-amber-50 text-amber-700",
};

const PAYMENT_AMT: Record<string, number> = { MC: 500, UC: 2500, EC: 5000 };

function countdown(expires: string): string {
  const diff = new Date(expires).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [moving, setMoving]       = useState(false);
  const [error, setError]         = useState("");
  // Tick every minute so payment-lock countdown displays update
  const [, setTick] = useState(0);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites");
      const data = await res.json();
      setFavorites(data.favorites ?? []);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") loadFavorites();
  }, [status, loadFavorites, router]);

  // Refresh countdown display every 60 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const unpaid = favorites.filter(
    (f) => !f.firstPaidAt && !f.isBrideFrozen,
  );
  const inPaymentLock = favorites.filter(
    (f) => f.movedToPayment && !f.firstPaidAt && !f.lockExpired && !f.isBrideFrozen,
  );
  // 1st payment submitted but awaiting admin approval
  const pendingFirstApproval = favorites.filter(
    (f) => f.firstPaidAt && !f.firstPaymentApproved,
  );
  // 1st payment approved → in inbox
  const approvedInbox = favorites.filter(
    (f) => f.firstPaidAt && f.firstPaymentApproved && !f.secondPaidAt,
  );
  // 2nd payment submitted but awaiting admin approval
  const pendingSecondApproval = favorites.filter(
    (f) => f.secondPaidAt && !f.secondPaymentApproved,
  );
  // Both payments approved → contact unlocked
  const fullyPaid = favorites.filter((f) => f.secondPaidAt && f.secondPaymentApproved);
  const frozenFavs = favorites.filter((f) => f.isBrideFrozen);

  const selectable = unpaid.filter((f) => !f.movedToPayment || f.lockExpired);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedTotal = Array.from(selected).reduce((acc, id) => {
    const fav = favorites.find((f) => f.id === id);
    const fc = fav?.mdCard?.familyClass ?? "MC";
    return acc + (PAYMENT_AMT[fc] ?? 500);
  }, 0);

  const handleMoveToPayment = async () => {
    if (!selected.size) return;
    setMoving(true);
    setError("");
    try {
      const selectedArr = Array.from(selected);
      const res = await fetch("/api/favorites/move-to-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteIds: selectedArr }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      // Navigate to payment page with amount + ids
      router.push(
        `/payment/first?ids=${selectedArr.join(",")}&amount=${data.totalAmount}`,
      );
    } catch {
      setError("Network error");
    } finally {
      setMoving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#7a1f2b] flex items-center gap-2">
            <Heart size={22} className="fill-[#7a1f2b]" />
            My Favourites
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {favorites.length} profile{favorites.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {/* Quick nav */}
        <div className="flex gap-2">
          <Link
            href="/inbox"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <Inbox size={14} />
            Inbox
            {approvedInbox.length > 0 && (
              <span className="ml-1 rounded-full bg-[#7a1f2b] px-1.5 py-0.5 text-[10px] text-white">
                {approvedInbox.length}
              </span>
            )}
          </Link>
          <Link
            href="/contact-details"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <CreditCard size={14} />
            <span className="hidden xs:inline">Contact Details</span>
            <span className="xs:hidden">Contacts</span>
          </Link>
        </div>
      </div>

      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Selection toolbar ─────────────────────────── */}
          {selectable.length > 0 && (
            <div className="mb-5 rounded-xl border border-[#7a1f2b]/20 bg-[#faf7f2] p-4">
              <p className="mb-3 text-sm font-semibold text-[#7a1f2b]">
                Select profiles to move to payment
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    setSelected(
                      selected.size === selectable.length
                        ? new Set()
                        : new Set(selectable.map((f) => f.id)),
                    )
                  }
                  className="text-xs font-medium text-[#7a1f2b] underline"
                >
                  {selected.size === selectable.length ? "Deselect all" : "Select all"}
                </button>
                {selected.size > 0 && (
                  <>
                    <span className="text-xs text-neutral-500">
                      {selected.size} selected · ₹{selectedTotal.toLocaleString("en-IN")} due
                    </span>
                    <button
                      onClick={handleMoveToPayment}
                      disabled={moving}
                      className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#7a1f2b] px-4 py-2 text-xs font-bold text-white hover:bg-[#6b1823] transition-colors disabled:opacity-60"
                    >
                      <ShoppingCart size={13} />
                      {moving ? "Processing…" : "Move to Payment"}
                    </button>
                  </>
                )}
              </div>
              {error && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>
          )}

          {/* ── Payment-locked banner ─────────────────────── */}
          {inPaymentLock.length > 0 && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                <Lock size={14} />
                {inPaymentLock.length} profile{inPaymentLock.length > 1 ? "s" : ""} awaiting payment
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Complete payment before the lock expires, or it will reset.
              </p>
              <Link
                href="/payment/first"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-800 underline"
              >
                Go to Payment Page <ChevronRight size={12} />
              </Link>
            </div>
          )}

          {/* ── Unpaid profiles ───────────────────────────── */}
          {unpaid.length > 0 && (
            <Section title="Unpaid Profiles" count={unpaid.length}>
              {unpaid.map((fav) => {
                const isLocked = fav.movedToPayment && !fav.lockExpired;
                const canSelect = !isLocked;
                return (
                  <FavCard
                    key={fav.id}
                    fav={fav}
                    selectable={canSelect}
                    selected={selected.has(fav.id)}
                    onSelect={() => canSelect && toggleSelect(fav.id)}
                    badge={
                      isLocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                          <Lock size={10} />
                          {fav.paymentLockExpiresAt ? countdown(fav.paymentLockExpiresAt) : "Locked"}
                        </span>
                      ) : null
                    }
                  />
                );
              })}
            </Section>
          )}

          {/* ── Frozen profiles ───────────────────────────── */}
          {frozenFavs.length > 0 && (
            <Section title="Frozen Profiles" count={frozenFavs.length} muted>
              {frozenFavs.map((fav) => (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  selectable={false}
                  selected={false}
                  onSelect={() => {}}
                  badge={
                    <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-500">
                      <AlertCircle size={10} />
                      Profile Frozen
                    </span>
                  }
                  frozen
                />
              ))}
            </Section>
          )}

          {/* ── Awaiting 1st payment approval ────────────── */}
          {pendingFirstApproval.length > 0 && (
            <Section title="Payment Submitted — Awaiting Approval" count={pendingFirstApproval.length} muted>
              {pendingFirstApproval.map((fav) => (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  selectable={false}
                  selected={false}
                  onSelect={() => {}}
                  badge={
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <AlertCircle size={10} />
                      Pending admin approval
                    </span>
                  }
                />
              ))}
            </Section>
          )}

          {/* ── Inbox (1st payment approved) ─────────────── */}
          {approvedInbox.length > 0 && (
            <Section title="In Inbox (Additional Details Unlocked)" count={approvedInbox.length}>
              {approvedInbox.map((fav) => {
                const inboxFrozen =
                  fav.inboxFrozenUntil && new Date(fav.inboxFrozenUntil) > new Date();
                return (
                  <FavCard
                    key={fav.id}
                    fav={fav}
                    selectable={false}
                    selected={false}
                    onSelect={() => {}}
                    badge={
                      inboxFrozen ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700">
                          <Clock size={10} />
                          Inbox active until{" "}
                          {new Date(fav.inboxFrozenUntil!).toLocaleDateString("en-IN")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700">
                          <CheckCircle size={10} />
                          Ready for 2nd payment
                        </span>
                      )
                    }
                    actionButton={
                      <Link
                        href="/inbox"
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7a1f2b] py-2 text-xs font-bold text-white hover:bg-[#6b1823] transition-colors"
                      >
                        <Inbox size={13} />
                        View in Inbox
                      </Link>
                    }
                  />
                );
              })}
            </Section>
          )}

          {/* ── Awaiting 2nd payment approval ────────────── */}
          {pendingSecondApproval.length > 0 && (
            <Section title="Contact Payment — Awaiting Approval" count={pendingSecondApproval.length} muted>
              {pendingSecondApproval.map((fav) => (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  selectable={false}
                  selected={false}
                  onSelect={() => {}}
                  badge={
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                      <AlertCircle size={10} />
                      Pending admin approval
                    </span>
                  }
                />
              ))}
            </Section>
          )}

          {/* ── Fully unlocked ───────────────────────────── */}
          {fullyPaid.length > 0 && (
            <Section title="Contact Details Unlocked" count={fullyPaid.length}>
              {fullyPaid.map((fav) => (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  selectable={false}
                  selected={false}
                  onSelect={() => {}}
                  badge={
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700">
                      <CheckCircle size={10} />
                      Contact Details Unlocked
                    </span>
                  }
                  actionButton={
                    <Link
                      href="/contact-details"
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                    >
                      <CreditCard size={13} />
                      View Contact Details
                    </Link>
                  }
                />
              ))}
            </Section>
          )}
        </>
      )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title, count, children, muted = false,
}: {
  title: string; count: number; children: React.ReactNode; muted?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2 className={`mb-3 text-sm font-bold uppercase tracking-wide ${muted ? "text-neutral-400" : "text-[#7a1f2b]"}`}>
        {title}
        <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
          {count}
        </span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function FavCard({
  fav, selectable, selected, onSelect, badge, actionButton, frozen = false,
}: {
  fav: FavItem;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
  frozen?: boolean;
}) {
  const card = fav.mdCard;
  if (!card) return null;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all ${
        selected
          ? "border-[#7a1f2b] ring-2 ring-[#7a1f2b]/20 shadow-md"
          : frozen
          ? "border-neutral-100 opacity-60"
          : "border-neutral-100 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Checkbox overlay */}
      {selectable && (
        <button
          onClick={onSelect}
          className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white transition-colors"
          style={{ borderColor: selected ? "#7a1f2b" : "#d1d5db" }}
        >
          {selected && (
            <span className="h-2.5 w-2.5 rounded-full bg-[#7a1f2b]" />
          )}
        </button>
      )}

      {/* Photo */}
      <div className="relative h-40 bg-gradient-to-br from-[#7a1f2b]/10 to-[#d4af37]/10">
        {card.photo ? (
          <img src={card.photo} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-2xl font-bold text-[#7a1f2b]">
              {card.name.charAt(0)}
            </div>
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            CLASS_COLOR[card.familyClass] ?? "bg-neutral-100 text-neutral-700"
          }`}
        >
          {card.familyClass}
        </span>
        {badge && (
          <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 backdrop-blur-sm">
            {badge}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-neutral-900">{card.name}</h3>
          <span className="ml-1 font-mono text-[10px] text-neutral-400">{card.profileId}</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          {card.age} yrs · {card.maritalStatus?.replace("_", " ") ?? "Single"}
        </p>

        <div className="mt-2 space-y-1">
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <Star size={10} className="text-[#d4af37]" />
            {card.religion} · {card.caste}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <MapPin size={10} className="text-[#7a1f2b]" />
            {card.district}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <GraduationCap size={10} className="text-[#7a1f2b]" />
            {card.education}
          </p>
        </div>

        {/* Payment amount hint */}
        {selectable && (
          <p className="mt-2 text-[10px] font-semibold text-[#7a1f2b]">
            Payment: ₹{(PAYMENT_AMT[card.familyClass] ?? 500).toLocaleString("en-IN")}
          </p>
        )}

        <Link
          href={`/profiles/${fav.favoriteUserId}`}
          className="mt-3 flex w-full items-center justify-center rounded-lg border border-neutral-200 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          View Profile
        </Link>

        {actionButton}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Heart size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
      <h2 className="text-lg font-bold text-neutral-600">No Favourites Yet</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Browse profiles and add them to your favourites
      </p>
      <Link
        href="/profiles"
        className="mt-5 rounded-lg bg-[#7a1f2b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
      >
        Browse Profiles
      </Link>
    </div>
  );
}
