import Link from "next/link";

import { PageShell } from "@/components/common";
import { MatchStartWizard } from "@/components/admin/scoring/MatchStartWizard";
import { getMatchScoringContext } from "@/features/scoring/service";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getTeamPlayers(matchId: string) {
  const supabase = createServiceClient();
  const ctx = await getMatchScoringContext(matchId);
  if (!ctx) return null;
  const { data } = await supabase
    .from("players")
    .select("id, player_name, role, team_id")
    .in("team_id", [ctx.teamA.id, ctx.teamB.id]);
  const map = (teamId: string) =>
    (data ?? [])
      .filter((p: { team_id: string }) => p.team_id === teamId)
      .map((p: { id: string; player_name: string; role: string }) => ({
        id: p.id,
        playerName: p.player_name,
        role: p.role,
      }));
  return {
    ctx,
    teamAPlayers: map(ctx.teamA.id),
    teamBPlayers: map(ctx.teamB.id),
  };
}

export default async function MatchStartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTeamPlayers(id);

  if (!data) {
    return (
      <PageShell withBottomNav={false} fluid className="md:py-6">
        <div className="px-4 md:px-6">
          <p className="text-xl font-bold">Match not found</p>
          <Link href="/admin" className="text-primary hover:underline">
            ← Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  const { ctx, teamAPlayers, teamBPlayers } = data;

  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/admin" className="text-sm text-primary hover:underline">
            ← Dashboard
          </Link>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Match Start
          </span>
        </div>
        <header className="mb-4">
          <h1 className="text-2xl font-black tracking-tight">
            {ctx.teamA.teamName} <span className="text-muted-foreground">vs</span>{" "}
            {ctx.teamB.teamName}
          </h1>
        </header>
        <MatchStartWizard
          matchId={id}
          teamAId={ctx.teamA.id}
          teamBId={ctx.teamB.id}
          teamAName={ctx.teamA.teamName}
          teamBName={ctx.teamB.teamName}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
        />
      </div>
    </PageShell>
  );
}
