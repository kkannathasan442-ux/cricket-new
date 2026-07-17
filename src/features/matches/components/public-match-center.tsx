"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, Radio, TrendingUp, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BALLS_PER_OVER, currentRunRate, requiredRunRate } from "@/features/scoring/rules";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface BallEvent {
  id: string;
  over_number: number;
  ball_number: number;
  runs: number;
  extras: number;
  extras_type: string | null;
  is_wicket: boolean;
  dismissal_type: string | null;
  batsman_id: string | null;
  bowler_id: string | null;
}

interface BattingRow {
  player_id: string;
  player_name: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  is_out: boolean;
  dismissal_type: string | null;
}

interface BowlingRow {
  player_id: string;
  player_name: string;
  overs: number;
  runs_conceded: number;
  wickets: number;
  wides: number;
  no_balls: number;
}

interface MatchCenterData {
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  tournamentName: string | null;
  innings: {
    number: number;
    battingTeamId: string;
    bowlingTeamId: string;
    totalRuns: number;
    totalWickets: number;
    ballsBowled: number;
    target: number | null;
    battingTeamName: string;
    bowlingTeamName: string;
  } | null;
  striker: string | null;
  bowler: string | null;
  batting: BattingRow[];
  bowling: BowlingRow[];
  commentary: BallEvent[];
}

interface PublicMatchCenterProps {
  matchId: string;
  data: MatchCenterData;
}

function formatOver(balls: number): string {
  return `${Math.floor(balls / BALLS_PER_OVER)}.${balls % BALLS_PER_OVER}`;
}

function ballLabel(b: BallEvent): string {
  if (b.is_wicket) return "W";
  if (b.extras > 0) return b.extras_type?.[0]?.toUpperCase() ?? "E";
  return String(b.runs);
}

export function PublicMatchCenter({ matchId, data }: PublicMatchCenterProps) {
  const router = useRouter();
  const innings = data.innings;
  const crr = innings && innings.ballsBowled > 0
    ? currentRunRate(innings.totalRuns, innings.ballsBowled)
    : 0;
  const rrr =
    innings && innings.target != null && innings.ballsBowled > 0
      ? requiredRunRate(
          innings.target,
          innings.totalRuns,
          Math.max(0, BALLS_PER_OVER * 20 - innings.ballsBowled),
        )
      : null;

  useRealtimeSubscription({
    table: "match_events",
    filter: `match_id=eq.${matchId}`,
    onEvent: React.useCallback(() => router.refresh(), [router]),
    enabled: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="live" className="gap-1">
          <Radio className="size-3" /> LIVE
        </Badge>
        <span className="text-xs text-muted-foreground">
          {data.tournamentName ?? "Tournament"} · Innings {innings?.number ?? "-"}
        </span>
      </div>

      {/* Scoreboard */}
      <Card className="border-primary/20 bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {innings?.battingTeamName ?? data.teamA.name}
                {innings?.bowlingTeamName ? ` v ${innings.bowlingTeamName}` : ""}
              </p>
              <p className="text-4xl font-black neon-text">
                {innings ? `${innings.totalRuns}/${innings.totalWickets}` : "0/0"}
                <span className="ml-2 text-base font-medium text-muted-foreground">
                  ({innings ? formatOver(innings.ballsBowled) : "0.0"} ov)
                </span>
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              {innings?.target != null && (
                <p>Target: {innings.target}</p>
              )}
              <p className="flex items-center gap-1 justify-end">
                <TrendingUp className="size-3" /> CRR: {crr.toFixed(2)}
              </p>
              {rrr !== null && (
                <p className="flex items-center gap-1 justify-end">
                  <Target className="size-3" /> RRR: {rrr.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Batsman: </span>
              <span className="font-medium">{data.striker ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Bowler: </span>
              <span className="font-medium">{data.bowler ?? "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batting Scorecard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Batting</CardTitle>
        </CardHeader>
        <CardContent className="px-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium" scope="col">Batter</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">R</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">B</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">4s</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">6s</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">SR</th>
              </tr>
            </thead>
            <tbody>
              {data.batting.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No batting data yet.
                  </td>
                </tr>
              )}
              {data.batting.map((row) => {
                const sr = row.balls_faced > 0 ? ((row.runs / row.balls_faced) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={row.player_id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2">
                      <span className="font-medium">{row.player_name}</span>
                      {row.is_out && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {row.dismissal_type?.replace(/_/g, " ") ?? "out"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center font-semibold">{row.runs}</td>
                    <td className="px-2 py-2 text-center">{row.balls_faced}</td>
                    <td className="px-2 py-2 text-center">{row.fours}</td>
                    <td className="px-2 py-2 text-center">{row.sixes}</td>
                    <td className="px-2 py-2 text-center">{sr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bowling Scorecard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bowling</CardTitle>
        </CardHeader>
        <CardContent className="px-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium" scope="col">Bowler</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">O</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">R</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">W</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">WD</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">NB</th>
                <th className="px-2 py-2 font-medium text-center" scope="col">Econ</th>
              </tr>
            </thead>
            <tbody>
              {data.bowling.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No bowling data yet.
                  </td>
                </tr>
              )}
              {data.bowling.map((row) => {
                const overs = row.overs > 0 ? row.overs : 0;
                const econ = overs > 0 ? (row.runs_conceded / overs).toFixed(2) : "0.00";
                return (
                  <tr key={row.player_id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2 font-medium">{row.player_name}</td>
                    <td className="px-2 py-2 text-center">{overs}</td>
                    <td className="px-2 py-2 text-center">{row.runs_conceded}</td>
                    <td className="px-2 py-2 text-center font-semibold">{row.wickets}</td>
                    <td className="px-2 py-2 text-center">{row.wides}</td>
                    <td className="px-2 py-2 text-center">{row.no_balls}</td>
                    <td className="px-2 py-2 text-center">{econ}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Ball-by-ball commentary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4" /> Commentary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.commentary.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for the first ball…</p>
          ) : (
            <ol className="space-y-2">
              {data.commentary.map((b, i) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="text-xs text-muted-foreground w-12 shrink-0">
                    Over {b.over_number}.{b.ball_number}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-xs font-bold",
                      b.is_wicket
                        ? "bg-red-500/15 text-red-500"
                        : b.extras > 0
                          ? "bg-amber-500/15 text-amber-500"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    {ballLabel(b)}
                  </span>
                  <span className="flex-1">
                    {b.is_wicket
                      ? `WICKET! ${b.dismissal_type?.replace(/_/g, " ") ?? "out"}.`
                      : b.extras > 0
                        ? `${b.extras_type?.replace(/_/g, " ")} (${b.extras}).`
                        : b.runs === 4
                          ? "FOUR!"
                          : b.runs === 6
                            ? "SIX!"
                            : `${b.runs} run${b.runs === 1 ? "" : "s"}.`}
                  </span>
                  {i === 0 && (
                    <span className="text-[10px] uppercase tracking-wide text-primary">Latest</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
