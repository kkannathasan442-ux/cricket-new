import { Suspense } from "react";

import { PageShell } from "@/components/common";
import { TeamManager } from "@/components/admin/teams/TeamManager";
import { listTeams } from "@/features/teams/service";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const initialTeams = await listTeams();

  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Teams</h1>
            <p className="text-sm text-muted-foreground">
              Manage cricket teams and logos.
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <TeamManager initialData={initialTeams} />
        </Suspense>
      </div>
    </PageShell>
  );
}
