"use client";

import * as React from "react";
import { Activity, Radio } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { BALLS_PER_OVER } from "@/features/scoring/rules";

interface PublicScoreboardProps {
  matchId: string;
  initial: {
    teamA: string;
    teamB: string;
    battingTeam: string | null;
    bowlingTeam: string | null;
    totalRuns: number;
    totalWickets: number;
    ballsBowled: number;
    target: number | null;
    inningsNumber: number | null;
    striker: string | null;
    bowler: string | null;
    recentBalls: { id: string; runs: number; extras: number; extras_type: string | null; is_wicket: boolean; over_number: number; ball_number: number }[];
  };
}

/**
 * Public live scoreboard (no login required). Subscribes to realtime changes
 * on the match's ball-by-ball feed + innings totals for instant, no-refresh
 * updates. Re-renders from a local snapshot kept in sync by the subscription.
 */
export function PublicScoreboard({ matchId, initial }: PublicScoreboardProps) {
  const [snapshot, setSnapshot] = React.useState(initial);
  const [live, setLive] = React.useState(false);

  // Realtime: on any change to this match's events, refetch the compact
  // snapshot so the public scoreboard updates instantly with no page refresh.
  const refetch = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/match/${matchId}/scoreboard`);
      if (res.ok) setSnapshot(await res.json());
    } catch {
      /* ignore transient network errors */
    }
  }, [matchId]);

  useRealtimeSubscription({
    table: "match_events",
    filter: `match_id=eq.${matchId}`,
    onEvent: () => {
      setLive(true);
      void refetch();
    },
    enabled: true,
  });

  const overs = `${Math.floor(snapshot.ballsBowled / BALLS_PER_OVER)}.${
    snapshot.ballsBowled % BALLS_PER_OVER
  }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="live" className="gap-1">
          <Radio className="size-3" /> LIVE
        </Badge>
        <span className="text-xs text-muted-foreground">
          Innings {snapshot.inningsNumber ?? "-"}
        </span>
      </div>

      <Card className="border-primary/20 bg-card/60">
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {snapshot.battingTeam ?? snapshot.teamA}
            {snapshot.bowlingTeam ? ` v ${snapshot.bowlingTeam}` : ""}
          </p>
          <p className="text-4xl font-black neon-text">
            {snapshot.totalRuns}/{snapshot.totalWickets}
            <span className="ml-2 text-base font-medium text-muted-foreground">
              ({overs} ov)
            </span>
          </p>
          {snapshot.target != null && (
            <p className="mt-1 text-sm text-muted-foreground">
              Target: {snapshot.target} · Need{" "}
              {Math.max(0, snapshot.target - snapshot.totalRuns)} off{" "}
              {Math.max(
                0,
                BALLS_PER_OVER * 20 - snapshot.ballsBowled,
              )}{" "}
              balls
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Batsman: </span>
              <span className="font-medium">{snapshot.striker ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Bowler: </span>
              <span className="font-medium">{snapshot.bowler ?? "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Activity className="size-3" /> Ball-by-ball
          </p>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.recentBalls.length === 0 && (
              <span className="text-sm text-muted-foreground">
                Waiting for the first ball…
              </span>
            )}
            {snapshot.recentBalls
              .slice()
              .reverse()
              .map((b) => (
                <span
                  key={b.id}
                  className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold"
                  title={`Over ${b.over_number}.${b.ball_number}`}
                >
                  {b.is_wicket
                    ? "W"
                    : b.extras > 0
                      ? b.extras_type?.[0]?.toUpperCase() ?? "E"
                      : b.runs}
                </span>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { type PublicScoreboardProps };
