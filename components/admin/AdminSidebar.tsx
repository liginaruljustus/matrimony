"use client";

import { useState, useEffect } from "react";
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
  PencilLine,
} from "lucide-react";

type Badges = {
  newUsers: number;
  pendingProfiles: number;
  pendingVerification: number;
  openReports: number;
  pendingPayments: number;
  pendingEditRequests: number;
};

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  badgeKey?: keyof Badges;
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/dashboard" },
  { icon: Users,           label: "Users",        href: "/admin/users",         badgeKey: "newUsers" },
  { icon: User,            label: "Profiles",     href: "/admin/profiles",      badgeKey: "pendingProfiles" },
  { icon: BarChart3,       label: "Analytics",    href: "/admin/analytics" },
  { icon: CheckCircle,     label: "Verification", href: "/admin/verification",  badgeKey: "pendingVerification" },
  { icon: AlertCircle,     label: "Reports",      href: "/admin/reports",       badgeKey: "openReports" },
  { icon: CreditCard,      label: "Payments",     href: "/admin/payments",      badgeKey: "pendingPayments" },
  { icon: PencilLine,      label: "Edit Requests", href: "/admin/edit-requests", badgeKey: "pendingEditRequests" },
  { icon: Settings,        label: "Settings",     href: "/admin/settings" },
];

function BadgePill({ count, active }: { count: number; active: boolean }) {
  if (count === 0) return null;
  return (
    <span
      className={`ml-auto flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold leading-none min-w-[18px] h-[18px] ${
        active ? "bg-[#7a1f2b] text-white" : "bg-red-500 text-white"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

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
  const [badges, setBadges] = useState<Badges>({
    newUsers: 0,
    pendingProfiles: 0,
    pendingVerification: 0,
    openReports: 0,
    pendingPayments: 0,
    pendingEditRequests: 0,
  });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/admin/badges");
        if (res.ok) setBadges(await res.json());
      } catch { /* silent */ }
    };

    fetchBadges();
    const id = setInterval(fetchBadges, 60_000);
    return () => clearInterval(id);
  }, []);

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
            const count = item.badgeKey ? badges[item.badgeKey] : 0;

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
                {/* Icon — with dot badge when collapsed */}
                <span className="relative flex-shrink-0">
                  <Icon size={20} />
                  {collapsed && count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>

                {/* Label + pill badge when expanded */}
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <BadgePill count={count} active={active} />
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
