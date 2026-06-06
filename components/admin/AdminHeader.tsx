"use client";

import { usePathname } from "next/navigation";

type AdminHeaderProps = {
  title?: string;
  description?: string;
};

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard":              { title: "Dashboard",          description: "Platform overview and metrics" },
  "/admin/users":            { title: "User Management",    description: "Manage and monitor user accounts" },
  "/admin/profiles":         { title: "Profile Management", description: "Review and approve profiles" },
  "/admin/analytics":        { title: "Analytics",          description: "Platform statistics and trends" },
  "/admin/settings":         { title: "Settings",           description: "Configure platform settings" },
  "/admin/verification":     { title: "Verification",       description: "Review user document submissions" },
  "/admin/reports":          { title: "Reports",            description: "Manage user reports and moderation" },
  "/admin/payments":         { title: "Payment Approvals",  description: "Review and approve payment submissions" },
};

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const pathname = usePathname();

  const pageData =
    title && description
      ? { title, description }
      : pageTitles[pathname] ?? { title: "Admin Panel", description: "" };

  return (
    <div className="mb-6 border-b border-neutral-200 pb-5">
      <h1 className="text-2xl font-bold text-[#7a1f2b] lg:text-3xl">
        {pageData.title}
      </h1>
      {pageData.description && (
        <p className="mt-1 text-sm text-neutral-500">{pageData.description}</p>
      )}
    </div>
  );
}
