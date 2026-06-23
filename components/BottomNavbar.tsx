"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";

const items = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/profiles",
    label: "Search",
    icon: Search,
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Heart,
  },
  {
    href: "/chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
    href: "/dashboard",
    label: "Profile",
    icon: User,
  },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 dark:border-neutral-200 bg-white/95 dark:bg-neutral-100/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-lg backdrop-blur-sm md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const IconComponent = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-[var(--radius-lg)] px-1 py-1.5 transition-fast ${
                  active ? "text-primary" : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <span className={`transition-transform ${active ? "scale-110" : ""}`}>
                  <IconComponent
                    size={20}
                    strokeWidth={2}
                    className={active ? "fill-current" : ""}
                  />
                </span>
                <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-text-tertiary"}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
