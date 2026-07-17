import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Mail, Shield, User as UserIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/features/auth/profile";
import { ROLE_PERMISSIONS } from "@/features/auth";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const role = await getUserRole(user.id);
  const roleLabel = ROLE_PERMISSIONS[role].label;
  const displayName =
    user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Profile</h1>

        <Card className="shadow-neon">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-5 text-primary" />
              {displayName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="size-4" />
              <span className="text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="size-4" />
              <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {roleLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/logout">
            <LogOut className="size-4" />
            Sign out
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
