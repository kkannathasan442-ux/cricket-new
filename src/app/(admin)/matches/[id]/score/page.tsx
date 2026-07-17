import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/common";
import { ScoreControls } from "@/components/admin/scoring/ScoreControls";
import { getMatchScoringContext, getInningsPlayers } from "@/features/scoring/service";
import type { PlayerOption } from "@/features/scoring";

export const dynamic = "force-dynamic";

export default async function MatchScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getMatchScoringContext(id);

  let players: { batting: PlayerOption[]; bowling: PlayerOption[] } = {
    batting: [],
    bowling: [],
  };
  if (context) {
    const excludeBatting = [
      context.striker?.id,
      context.nonStriker?.id,
      ...context.dismissedPlayerIds,
    ].filter(Boolean) as string[];
    const excludeBowling = [context.bowler?.id].filter(Boolean) as string[];
    players = await getInningsPlayers(id, {
      excludeBatting,
      excludeBowling,
    });
  }

  if (!context) {
    return (
      <PageShell withBottomNav={false} fluid className="md:py-6">
        <div className="px-4 md:px-6">
          <Link
            href="/admin"
            className="text-sm text-primary hover:underline"
          >
            ← Back to dashboard
          </Link>
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <h1 className="text-xl font-bold">Match not found</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This match does not exist or has no scoring data.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-sm text-primary hover:underline"
          >
            ← Dashboard
          </Link>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Scoring
          </span>
        </div>

        <header className="mb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {context.tournamentName ?? "Tournament"}
          </p>
          <h1 className="text-2xl font-black tracking-tight">
            {context.teamA.teamName}{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            {context.teamB.teamName}
          </h1>
        </header>

        <ScoreControls context={context} players={players} />
      </div>
    </PageShell>
  );
}
