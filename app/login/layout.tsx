export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7f2] to-[#f3e9d8] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
