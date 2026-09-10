import { Navbar } from "@/components/Navbar";

export default function AcceptedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20 lg:pb-0">
      <Navbar />
      <main className="w-full pt-4">{children}</main>
    </div>
  );
}
