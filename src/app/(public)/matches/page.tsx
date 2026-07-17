import { PageShell } from "@/components/common/page-shell";
import { listMatches } from "@/features/matches/service";
import { LiveMatchesGrid } from "@/features/matches/components/live-matches-grid";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  let matches: Awaited<ReturnType<typeof listMatches>> = [];
  try {
    matches = await listMatches();
  } catch {
    matches = [];
  }

  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Matches</h1>
        <LiveMatchesGrid
          matches={matches.map((m) => ({
            id: m.id,
            title: `${m.teamA.name} vs ${m.teamB.name}`,
            status: m.status,
          }))}
        />
      </div>
    </PageShell>
  );
}
