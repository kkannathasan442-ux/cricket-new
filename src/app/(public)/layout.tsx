import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

/**
 * (public) route group — public, no-login-required browsing.
 * Wraps public pages with the shared header + mobile bottom nav.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
