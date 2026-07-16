"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { Menu, Heart } from "lucide-react";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [collapsed,  setCollapsed]    = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
          <p className="text-sm text-neutral-500 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <AdminSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main content — no margin on mobile (overlay), dynamic margin on lg+ */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        collapsed ? "lg:ml-20" : "lg:ml-64"
      }`}>
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <Heart size={18} className="fill-[#7a1f2b] text-[#7a1f2b]" />
          <span className="font-bold text-[#7a1f2b]">Lura Admin</span>
        </div>

        <div className="min-h-full p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
