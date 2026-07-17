import { PageShell } from "@/components/common/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/common/error-state";
import { getAdminDashboardStats } from "@/features/matches/service";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let stats = { matches: 0, tournaments: 0, teams: 0, players: 0, liveMatches: 0 };
  let error;
  try {
    stats = await getAdminDashboardStats();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard.";
  }

  if (error) {
    return (
      <PageShell withBottomNav={false} fluid className="md:py-6">
        <div className="px-4 md:px-6">
          <ErrorState message={error} />
        </div>
      </PageShell>
    );
  }

  const items = [
    { label: "Live Matches", value: String(stats.liveMatches) },
    { label: "Matches", value: String(stats.matches) },
    { label: "Tournaments", value: String(stats.tournaments) },
    { label: "Teams", value: String(stats.teams) },
    { label: "Players", value: String(stats.players) },
  ];

  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="px-4 md:px-6">
        <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tournament, team, player and scoring management.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black neon-text">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
