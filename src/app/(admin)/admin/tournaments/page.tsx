import { Suspense } from "react";

import { PageShell } from "@/components/common";
import { TournamentManager } from "@/components/admin/tournaments/TournamentManager";
import { listTournaments } from "@/features/tournaments/service";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const initialTournaments = await listTournaments();

  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Tournaments</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage cricket tournaments.
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
          <TournamentManager initialData={initialTournaments} />
        </Suspense>
      </div>
    </PageShell>
  );
}
