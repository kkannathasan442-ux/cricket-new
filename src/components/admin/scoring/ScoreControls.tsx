"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, User, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type MatchScoringContext,
  type ScoringActionType,
} from "@/features/scoring";

const RUN_BUTTONS = [1, 2, 3, 4, 6] as const;

function formatOvers(ballsBowled: number): string {
  const overs = Math.floor(ballsBowled / 6);
  const balls = ballsBowled % 6;
  return `${overs}.${balls}`;
}

interface ScoreControlsProps {
  context: MatchScoringContext;
}

/**
 * Admin live scoring control surface.
 * Posts scoring events to /api/match/[id]/score and refreshes server state.
 * Uses normal API state updates (Supabase Realtime not wired yet, per plan).
 */
export function ScoreControls({ context }: ScoreControlsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<ScoringActionType | null>(null);

  const { innings, battingTeam, bowlingTeam, striker, bowler, teamA, teamB } =
    context;

  async function send(action: ScoringActionType, extra?: Record<string, unknown>) {
    setPending(action);
    try {
      const res = await fetch(`/api/match/${context.matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Scoring failed.");
      toast.success(
        action === "undo" ? "Last ball undone" : `Recorded: ${action}`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scoring failed.");
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="space-y-4">
      {/* Scoreboard header */}
      <Card className="border-primary/20 bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {battingTeam?.teamName ?? teamA.teamName}
                {bowlingTeam ? ` v ${bowlingTeam.teamName}` : ""}
              </p>
              <p className="text-3xl font-black neon-text">
                {innings
                  ? `${innings.total_runs}/${innings.total_wickets}`
                  : "0/0"}
                <span className="ml-2 text-base font-medium text-muted-foreground">
                  ({innings ? formatOvers(innings.balls_bowled) : "0.0"} ov)
                </span>
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Innings {innings?.innings_number ?? "-"}</p>
              {innings?.target != null && <p>Target: {innings.target}</p>}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span className="text-muted-foreground">Batsman:</span>
              <span className="font-medium">
                {striker?.playerName ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span className="text-muted-foreground">Bowler:</span>
              <span className="font-medium">{bowler?.playerName ?? "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!innings && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No active innings. Start an innings to begin scoring.
        </p>
      )}

      {/* Run controls */}
      <div className="grid grid-cols-5 gap-2">
        {RUN_BUTTONS.map((r) => (
          <Button
            key={r}
            variant="neon"
            size="lg"
            className="text-lg font-black"
            disabled={busy || !innings}
            onClick={() => send("run", { runs: r })}
          >
            {pending === "run" ? <Loader2 className="size-5 animate-spin" /> : `+${r}`}
          </Button>
        ))}
      </div>

      {/* Wicket + Undo */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="destructive"
          size="lg"
          className="font-bold"
          disabled={busy || !innings}
          onClick={() => send("wicket")}
        >
          {pending === "wicket" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <User className="size-4" /> Wicket
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="font-bold"
          disabled={busy || !innings}
          onClick={() => send("undo")}
        >
          {pending === "undo" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Undo2 className="size-4" /> Undo
            </>
          )}
        </Button>
      </div>

      {/* Recent balls */}
      {context.recentBalls.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Recent deliveries
            </p>
            <div className="flex flex-wrap gap-1.5">
              {context.recentBalls
                .slice()
                .reverse()
                .map((b) => (
                  <span
                    key={b.id}
                    className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold"
                    title={`Over ${b.over_number}.${b.ball_number}`}
                  >
                    {b.is_wicket ? "W" : b.extras > 0 ? b.extras_type?.[0]?.toUpperCase() ?? "E" : b.runs}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
