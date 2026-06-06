import { Navbar } from "@/components/Navbar";

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="w-full">{children}</main>
    </div>
  );
}
