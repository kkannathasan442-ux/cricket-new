import { PageShell } from "@/components/common/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalStats } from "@/features/scoring/stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  let stats: Awaited<ReturnType<typeof getGlobalStats>> = { orangeCap: [], purpleCap: [], mvp: [] };
  try {
    stats = await getGlobalStats();
  } catch {
    stats = { orangeCap: [], purpleCap: [], mvp: [] };
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-black tracking-tight">Stats</h1>

        {stats.orangeCap.length === 0 && stats.purpleCap.length === 0 && stats.mvp.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No stats yet. Stats will appear here after matches are played.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Orange Cap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.orangeCap.map((p, i) => (
                  <div key={p.playerId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 px-2">{p.playerName}</span>
                    <span className="font-semibold">{p.runs}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Purple Cap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.purpleCap.map((p, i) => (
                  <div key={p.playerId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 px-2">{p.playerName}</span>
                    <span className="font-semibold">{p.wickets}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">MVP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.mvp.map((p, i) => (
                  <div key={p.playerId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">#{i + 1}</span>
                    <span className="flex-1 px-2">{p.playerName}</span>
                    <span className="font-semibold">{p.score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
