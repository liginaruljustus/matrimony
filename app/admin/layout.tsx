// Auth guard and sidebar are handled by AdminLayout component used in each page.
// This route layout is a passthrough to avoid double-sidebar / double-scroll.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
