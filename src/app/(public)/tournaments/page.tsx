import { PageShell } from "@/components/common/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/common/error-state";
import { listTournaments, type TournamentSummary } from "@/features/tournaments";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  let tournaments: TournamentSummary[] = [];
  let error;
  try {
    tournaments = await listTournaments();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tournaments.";
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
        <h1 className="text-2xl font-black tracking-tight">Tournaments</h1>
        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No tournaments yet. Check back later.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>Status: {t.status}</p>
                  <p>Teams: {t.teamCount}</p>
                  <p>Overs: {t.oversPerMatch}</p>
                  {t.startDate && <p>Starts: {new Date(t.startDate).toLocaleDateString()}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
