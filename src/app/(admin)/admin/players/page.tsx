import { Suspense } from "react";

import { PageShell } from "@/components/common";
import { PlayerManager } from "@/components/admin/players/PlayerManager";
import { listPlayers } from "@/features/players/service";
import { listTeams } from "@/features/teams/service";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const initialPlayers = await listPlayers();
  const initialTeams = await listTeams();

  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Players</h1>
            <p className="text-sm text-muted-foreground">
              Manage player profiles, photos, and roles.
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <PlayerManager initialPlayers={initialPlayers} initialTeams={initialTeams} />
        </Suspense>
      </div>
    </PageShell>
  );
}
