import { Navbar } from "@/components/Navbar";

export default function InterestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
