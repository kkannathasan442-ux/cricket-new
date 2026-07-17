import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

/**
 * (admin) route group — protected admin shell.
 * Architecture-ready: route protection (auth check + role gate) will be
 * enforced in Phase 2 once Supabase Auth + RLS policies are in place.
 * The middleware already refreshes sessions on every request.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
