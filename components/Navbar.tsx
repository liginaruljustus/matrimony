"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useUIStore } from "@/store/uiStore";
import { Heart, Moon, Sun, Menu, X, Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function NotificationBell() {
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const dropRef                   = useRef<HTMLDivElement>(null);
  const router                    = useRouter();

  const fetchNotifs = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  // Poll every 60s for new notifications
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      // Mark all as read
      try {
        await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        setUnread(0);
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch { /* silent */ }
    }
  };

  const handleNotifClick = (notif: Notification) => {
    setOpen(false);
    if (notif.link) router.push(notif.link);
  };

  const TYPE_ICON: Record<string, string> = {
    PAYMENT_APPROVED: "💰", PAYMENT_REJECTED: "❌",
    PROFILE_APPROVED: "✅", PROFILE_REJECTED: "🚫",
    INTEREST_ACCEPTED: "💚", INTEREST_DECLINED: "💔",
    INTEREST_RECEIVED: "💌", NEW_MESSAGE: "💬",
  };

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#7a1f2b] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-100 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-bold text-neutral-800">Notifications</p>
            {notifs.some((n) => !n.isRead) && (
              <button
                onClick={async () => {
                  await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
                  setUnread(0);
                  setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
                }}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#7a1f2b] hover:underline"
              >
                <CheckCheck size={11} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2 text-neutral-200" />
                <p className="text-xs text-neutral-400">No notifications yet</p>
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                    !n.isRead ? "bg-[#7a1f2b]/3" : ""
                  }`}
                >
                  <span className="mt-0.5 text-base leading-none">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${!n.isRead ? "font-semibold text-neutral-900" : "text-neutral-600"}`}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {n.link && <ExternalLink size={11} className="mt-1 shrink-0 text-neutral-300" />}
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#7a1f2b]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const router   = useRouter();
  const theme    = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mid-session guard — if admin suspends/bans the user while they're logged in,
  // the JWT status field reflects it on the next token refresh. Redirect immediately.
  useEffect(() => {
    const status = (session?.user as any)?.status;
    if (status && status !== "ACTIVE") {
      router.replace("/account-suspended");
    }
  }, [session, router]);

  const profileType = (session?.user as any)?.profileType as "BRIDE" | "GROOM" | undefined;
  const isGroom     = profileType === "GROOM";
  const isBride     = profileType === "BRIDE";
  const isAdmin     = session?.user?.role === "ADMIN";

  const groomLinks = [
    { href: "/profiles",         label: "Browse Brides" },
    { href: "/favorites",        label: "Favourites" },
    { href: "/interests",        label: "Interests" },
    { href: "/inbox",            label: "Inbox" },
    { href: "/contact-details",  label: "Contacts" },
    { href: "/payment/history",  label: "Payments" },
    { href: "/my-profile",       label: "My Profile" },
    { href: "/settings",         label: "Settings" },
  ];

  const brideLinks = [
    { href: "/bride-inbox",  label: "Proposals" },
    { href: "/accepted",     label: "Accepted" },
    { href: "/my-profile",   label: "My Profile" },
    { href: "/settings",     label: "Settings" },
  ];

  const commonLinks = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  const navLinks = [
    ...(isGroom ? groomLinks : isBride ? brideLinks : []),
    ...commonLinks,
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 dark:bg-neutral-100/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Heart size={22} className="fill-current text-[#7a1f2b]" />
          <span className="text-lg font-bold text-[#7a1f2b]">Lura Matrimony</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-5 text-sm md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-medium text-neutral-600 hover:text-[#7a1f2b] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 transition-colors"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Notification Bell — shown only when logged in */}
          {session?.user && <NotificationBell />}

          {/* Auth Button */}
          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6b1823] transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[#7a1f2b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6b1823] transition-colors"
            >
              Login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 transition-colors md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white dark:bg-neutral-100 px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-[#7a1f2b] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
