import { Navbar } from "@/components/Navbar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0">
      <Navbar />
      <main className="w-full pt-4">{children}</main>
    </div>
  );
}
