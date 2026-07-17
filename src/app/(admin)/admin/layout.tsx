import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/features/auth/profile";

/**
 * (admin) route group — protected admin shell.
 * Middleware enforces auth + the `admin` role, this layout adds a
 * server-side defense-in-depth check so pages can never render for an
 * unauthorized session.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const role = await getUserRole(user.id);
  if (role !== "admin") {
    redirect("/profile");
  }

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
