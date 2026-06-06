import { Navbar } from "@/components/Navbar";

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="w-full pt-4">{children}</main>
    </div>
  );
}
