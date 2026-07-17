import Link from "next/link";

import { PageShell } from "@/components/common";
import { getMatchScoringContext } from "@/features/scoring/service";
import { PublicScoreboard } from "@/features/matches/components/public-scoreboard";

export const dynamic = "force-dynamic";

export default async function PublicMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getMatchScoringContext(id);

  if (!context) {
    return (
      <PageShell>
        <div className="text-center">
          <h1 className="text-xl font-bold">Match not found</h1>
          <Link href="/matches" className="mt-2 inline-block text-primary hover:underline">
            ← Back to matches
          </Link>
        </div>
      </PageShell>
    );
  }

  const initial = {
    teamA: context.teamA.teamName,
    teamB: context.teamB.teamName,
    battingTeam: context.battingTeam?.teamName ?? null,
    bowlingTeam: context.bowlingTeam?.teamName ?? null,
    totalRuns: context.innings?.total_runs ?? 0,
    totalWickets: context.innings?.total_wickets ?? 0,
    ballsBowled: context.innings?.balls_bowled ?? 0,
    target: context.innings?.target ?? null,
    inningsNumber: context.innings?.innings_number ?? null,
    striker: context.striker?.playerName ?? null,
    bowler: context.bowler?.playerName ?? null,
    recentBalls: context.recentBalls.map((b) => ({
      id: b.id,
      runs: b.runs,
      extras: b.extras,
      extras_type: b.extras_type,
      is_wicket: b.is_wicket,
      over_number: b.over_number,
      ball_number: b.ball_number,
    })),
  };

  return (
    <PageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/matches" className="text-sm text-primary hover:underline">
            ← Matches
          </Link>
        </div>
        <header>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {context.tournamentName ?? "Tournament"}
          </p>
          <h1 className="text-2xl font-black tracking-tight">
            {context.teamA.teamName}{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            {context.teamB.teamName}
          </h1>
        </header>
        <PublicScoreboard matchId={id} initial={initial} />
      </div>
    </PageShell>
  );
}
