import { PageShell } from "@/components/common/page-shell";
import { ErrorState } from "@/components/common/error-state";
import { listMatches } from "@/features/matches/service";
import { LiveMatchesGrid } from "@/features/matches/components/live-matches-grid";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  let matches: Awaited<ReturnType<typeof listMatches>> = [];
  let error;
  try {
    matches = await listMatches();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load matches.";
  }

  if (error) {
    return (
      <PageShell>
        <div className="py-10">
          <ErrorState message={error} />
        </div>
      </PageShell>
    );
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
