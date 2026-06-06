"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const NO_SHELL_PATHS = ["/login", "/register", "/terms", "/admin"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin pages & auth pages: render children fullscreen with NO navbar/main wrapper
  const isShellHidden = NO_SHELL_PATHS.some((p) => pathname.startsWith(p));

  if (isShellHidden) {
    return <>{children}</>;
  }

  // Regular pages: show Navbar + main wrapper
  return (
    <>
      <Navbar />
      <main className="w-full">{children}</main>
    </>
  );
}
