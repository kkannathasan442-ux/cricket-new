import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BattingRow {
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: string;
}

export interface BowlingRow {
  playerName: string;
  overs: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export function BattingScorecard({ rows }: { rows: BattingRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Batting</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border/60 text-left">
              <th className="px-3 py-2 font-medium">Batter</th>
              <th className="px-3 py-2 text-right font-medium">R</th>
              <th className="px-3 py-2 text-right font-medium">B</th>
              <th className="px-3 py-2 text-right font-medium">4s</th>
              <th className="px-3 py-2 text-right font-medium">6s</th>
              <th className="px-3 py-2 text-right font-medium">SR</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  No batting data yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/40">
                <td className="px-3 py-2">
                  <span className="font-medium">{r.playerName}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {r.dismissal}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold">{r.runs}</td>
                <td className="px-3 py-2 text-right">{r.balls}</td>
                <td className="px-3 py-2 text-right">{r.fours}</td>
                <td className="px-3 py-2 text-right">{r.sixes}</td>
                <td className="px-3 py-2 text-right">
                  {r.balls > 0 ? ((r.runs / r.balls) * 100).toFixed(0) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function BowlingScorecard({ rows }: { rows: BowlingRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bowling</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border/60 text-left">
              <th className="px-3 py-2 font-medium">Bowler</th>
              <th className="px-3 py-2 text-right font-medium">O</th>
              <th className="px-3 py-2 text-right font-medium">R</th>
              <th className="px-3 py-2 text-right font-medium">W</th>
              <th className="px-3 py-2 text-right font-medium">ECON</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                  No bowling data yet.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/40">
                <td className="px-3 py-2 font-medium">{r.playerName}</td>
                <td className="px-3 py-2 text-right">{r.overs.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{r.runs}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.wickets}</td>
                <td className="px-3 py-2 text-right">
                  {r.overs > 0 ? (r.runs / r.overs).toFixed(2) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
