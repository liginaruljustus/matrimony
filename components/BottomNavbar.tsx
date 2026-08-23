"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  Home, Search, MessageCircle, User, Heart, CheckCircle, Settings,
  MoreHorizontal, X, Star, Wallet, Phone, CreditCard, LucideIcon,
} from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

function useUnreadCount() {
  const [unread, setUnread] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setUnread(data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => clearInterval(id);
  }, [fetchCount]);

  return unread;
}

export function BottomNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const unread = useUnreadCount();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the More sheet on route change
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const profileType = (session?.user as any)?.profileType as "BRIDE" | "GROOM" | undefined;
  const isAdmin = session?.user?.role === "ADMIN";

  // No bottom nav for logged-out visitors or admins (admin panel stays desktop-oriented)
  if (!session?.user || isAdmin) return null;

  const isGroom = profileType === "GROOM";

  const groomTabs: Tab[] = [
    { href: "/dashboard", label: "Home",    icon: Home },
    { href: "/profiles",  label: "Browse",  icon: Search },
    { href: "/inbox",     label: "Inbox",   icon: MessageCircle, badge: unread },
    { href: "/my-profile",label: "Profile", icon: User },
  ];
  const groomMoreLinks = [
    { href: "/favorites",       label: "Favourites",     icon: Star },
    { href: "/payment/first",   label: "1st Payment",    icon: Wallet },
    { href: "/payment/second",  label: "2nd Payment",    icon: Wallet },
    { href: "/payment/history", label: "Payment History", icon: CreditCard },
    { href: "/contact-details", label: "Contacts",       icon: Phone },
    { href: "/settings",        label: "Settings",       icon: Settings },
  ];

  const brideTabs: Tab[] = [
    { href: "/dashboard",    label: "Home",      icon: Home },
    { href: "/bride-inbox",  label: "Proposals", icon: Heart, badge: unread },
    { href: "/accepted",     label: "Accepted",  icon: CheckCircle },
    { href: "/my-profile",   label: "Profile",   icon: User },
    { href: "/settings",     label: "Settings",  icon: Settings },
  ];

  const tabs = isGroom ? groomTabs : brideTabs;
  const showMore = isGroom; // only groom has overflow items

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {/* More sheet — groom overflow links */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white dark:bg-neutral-100 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <p className="text-sm font-bold text-neutral-800">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {groomMoreLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center hover:bg-neutral-50 transition-colors"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isActive(href) ? "bg-[#7a1f2b]/10 text-[#7a1f2b]" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    <Icon size={18} />
                  </span>
                  <span className="text-[11px] font-medium text-neutral-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 dark:border-neutral-200 bg-white/95 dark:bg-neutral-100/95 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur-sm md:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors ${
                    active ? "text-[#7a1f2b]" : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <span className={`relative transition-transform ${active ? "scale-110" : ""}`}>
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                    {!!tab.badge && tab.badge > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-[#7a1f2b] px-0.5 text-[8px] font-bold text-white">
                        {tab.badge > 9 ? "9+" : tab.badge}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] font-semibold ${active ? "text-[#7a1f2b]" : "text-neutral-400"}`}>
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
          {showMore && (
            <li>
              <button
                onClick={() => setMoreOpen(true)}
                className="flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <MoreHorizontal size={20} />
                <span className="text-[10px] font-semibold">More</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
