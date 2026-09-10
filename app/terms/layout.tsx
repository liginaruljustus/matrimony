import { Navbar } from "@/components/Navbar";

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f2] to-[#f3e9d8] pb-20 lg:pb-0">
      <Navbar />
      {children}
    </div>
  );
}
