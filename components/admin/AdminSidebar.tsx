"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  User,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users,           label: "Users",      href: "/admin/users",        badge: true },
  { icon: User,            label: "Profiles",   href: "/admin/profiles",     badge: true },
  { icon: BarChart3,       label: "Analytics",  href: "/admin/analytics" },
  { icon: CheckCircle,     label: "Verification", href: "/admin/verification", badge: true },
  { icon: AlertCircle,     label: "Reports",    href: "/admin/reports",      badge: true },
  { icon: CreditCard,      label: "Payments",   href: "/admin/payments" },
  { icon: Settings,        label: "Settings",   href: "/admin/settings" },
];

export function AdminSidebar({
  isOpen = false,
  onClose,
  collapsed,
  setCollapsed,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "AD";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-[#7a1f2b] text-white transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37] text-[#7a1f2b] font-bold text-sm">
              <Heart size={16} />
            </div>
            <span className="font-bold text-base tracking-wide">Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-white/10"
          title="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : ""}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-[#d4af37] text-[#7a1f2b]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[#7a1f2b] text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {session?.user?.name ?? "Admin User"}
              </p>
              <p className="truncate text-xs text-white/60">
                {session?.user?.email ?? ""}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500/80"
          title={collapsed ? "Sign out" : ""}
        >
          <LogOut size={18} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
      </aside>
    </>
  );
}
