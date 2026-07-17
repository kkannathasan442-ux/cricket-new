"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Undo2,
  User,
  Users,
  Flag,
  Zap,
  Ban,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  type MatchScoringContext,
  type PlayerOption,
  type ScoringActionType,
} from "@/features/scoring";
import { BALLS_PER_OVER } from "@/features/scoring/rules";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { SelectionModal } from "@/components/admin/scoring/selection-modal";
import { ConfirmModal } from "@/components/admin/scoring/confirm-modal";

const RUN_BUTTONS = [0, 1, 2, 3, 4, 6] as const;

function formatOvers(ballsBowled: number): string {
  return `${Math.floor(ballsBowled / BALLS_PER_OVER)}.${
    ballsBowled % BALLS_PER_OVER
  }`;
}

interface ScoreControlsProps {
  context: MatchScoringContext;
  /** Player options for the modals (fetched server-side). */
  players: { batting: PlayerOption[]; bowling: PlayerOption[] };
}

/**
 * Admin live scoring control surface (Phase 4).
 * - All delivery types: dot, runs, extras (wide/no-ball/bye/leg-bye/overthrow), wicket
 * - Auto strike rotation + over completion handled by the engine
 * - Bowler-change + next-batsman modals driven by engine results
 * - End-innings flow with auto 2nd innings / result
 * - Realtime sync via Supabase (router.refresh on match_events changes)
 */
export function ScoreControls({ context, players }: ScoreControlsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<ScoringActionType | null>(null);
  const [bowlerModal, setBowlerModal] = React.useState(false);
  const [batsmanModal, setBatsmanModal] = React.useState(false);
  const [endModal, setEndModal] = React.useState(false);
  const [modalLoading, setModalLoading] = React.useState(false);

  const { innings, battingTeam, bowlingTeam, striker, bowler, teamA, teamB } =
    context;

  // Realtime: when a delivery event lands for this match, refresh server state.
  useRealtimeSubscription({
    table: "match_events",
    filter: `match_id=eq.${context.matchId}`,
    onEvent: React.useCallback(() => router.refresh(), [router]),
  });

  async function send(
    action: ScoringActionType,
    extra?: Record<string, unknown>,
  ) {
    setPending(action);
    try {
      const res = await fetch(`/api/match/${context.matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Scoring failed.");

      if (action === "end_innings") {
        toast.success("Innings ended. Target set, next innings started.");
        setEndModal(false);
        router.refresh();
        return;
      }

      toast.success(
        action === "undo" ? "Last ball undone" : `Recorded: ${action}`,
      );

      // Engine flags over completion -> prompt bowler change.
      if (data.overCompleted && action !== "undo") {
        setBowlerModal(true);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scoring failed.");
    } finally {
      setPending(null);
    }
  }

  async function confirmBowler(id: string) {
    setModalLoading(true);
    try {
      // Record bowler change by persisting the selection via a no-op delivery
      // context: we simply refresh; the next ball uses the chosen bowler.
      // The chosen bowler is sent with the next legal ball automatically by
      // the UI which stores it in component state below.
      setSelectedBowler(id);
      setBowlerModal(false);
      toast.success("Bowler updated for the new over.");
    } finally {
      setModalLoading(false);
    }
  }

  async function confirmBatsman(id: string) {
    setModalLoading(true);
    try {
      setSelectedBatsman(id);
      setBatsmanModal(false);
      toast.success("Next batsman set.");
    } finally {
      setModalLoading(false);
    }
  }

  const [selectedBowler, setSelectedBowler] = React.useState<string | undefined>(
    bowler?.id,
  );
  const [selectedBatsman, setSelectedBatsman] = React.useState<
    string | undefined
  >(striker?.id);

  React.useEffect(() => setSelectedBowler(bowler?.id), [bowler?.id]);
  React.useEffect(() => setSelectedBatsman(striker?.id), [striker?.id]);

  const busy = pending !== null;
  const active = !!innings && !innings.is_completed;

  const runBtn = (r: number) => (
    <Button
      key={r}
      variant={r === 0 ? "outline" : "neon"}
      size="lg"
      className="text-lg font-black"
      disabled={busy || !active}
      onClick={() =>
        send("run", { runs: r, batsmanId: selectedBatsman, bowlerId: selectedBowler })
      }
    >
      {pending === "run" ? (
        <Loader2 className="size-5 animate-spin" />
      ) : r === 0 ? (
        "•"
      ) : (
        `+${r}`
      )}
    </Button>
  );

  const extraBtn = (
    label: string,
    action: ScoringActionType,
    icon: React.ReactNode,
  ) => (
    <Button
      key={action}
      variant="secondary"
      className="text-sm font-semibold"
      disabled={busy || !active}
      onClick={() =>
        send(action, {
          runs: 0,
          batsmanId: selectedBatsman,
          bowlerId: selectedBowler,
        })
      }
    >
      {icon}
      {label}
    </Button>
  );

  return (
    <div className="space-y-4">
      <Container className="px-0">
        {/* Scoreboard */}
        <Card className="border-primary/20 bg-card/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {battingTeam?.teamName ?? teamA.teamName}
                  {bowlingTeam ? ` v ${bowlingTeam.teamName}` : ""}
                </p>
                <p className="text-3xl font-black neon-text">
                  {innings ? `${innings.total_runs}/${innings.total_wickets}` : "0/0"}
                  <span className="ml-2 text-base font-medium text-muted-foreground">
                    ({innings ? formatOvers(innings.balls_bowled) : "0.0"} ov)
                  </span>
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>
                  Innings {innings?.innings_number ?? "-"}
                  {innings?.is_completed && " (done)"}
                </p>
                {innings?.target != null && <p>Target: {innings.target}</p>}
                {innings && (
                  <p>
                    Need {innings.target != null
                      ? Math.max(0, innings.target - innings.total_runs)
                      : "-"}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span className="text-muted-foreground">Batsman:</span>
                <span className="font-medium">{striker?.playerName ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span className="text-muted-foreground">Bowler:</span>
                <span className="font-medium">{bowler?.playerName ?? "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>

      {!innings && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No active innings. Start an innings to begin scoring.
        </p>
      )}

      {innings?.is_completed && (
        <Badge variant="neon" className="w-full justify-center py-1.5">
          Innings complete — second innings underway / match finalised.
        </Badge>
      )}

      {/* Runs */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {RUN_BUTTONS.map(runBtn)}
      </div>

      {/* Extras */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {extraBtn("Wide", "wide", <Zap className="size-4" />)}
        {extraBtn("No Ball", "no_ball", <Ban className="size-4" />)}
        {extraBtn("Bye", "bye", <ArrowRightLeft className="size-4" />)}
        {extraBtn("Leg Bye", "leg_bye", <ArrowRightLeft className="size-4" />)}
        {extraBtn("Overthrow", "overthrow", <ArrowRightLeft className="size-4" />)}
      </div>

      {/* Wicket + Undo + End */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="destructive"
          size="lg"
          className="font-bold"
          disabled={busy || !active}
          onClick={() => {
            if (!selectedBatsman) {
              toast.error("Select the batsman first.");
              return;
            }
            setBatsmanModal(true);
          }}
        >
          {pending === "wicket" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Users className="size-4" /> Wicket
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="font-bold"
          disabled={busy || !active}
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
        <Button
          variant="outline"
          size="lg"
          className="font-bold"
          disabled={busy || !innings}
          onClick={() => setEndModal(true)}
        >
          <Flag className="size-4" /> End
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
      )}

      {/* Modals */}
      <SelectionModal
        open={bowlerModal}
        onOpenChange={setBowlerModal}
        title="Bowler for next over"
        description="Select the bowler who will start the new over."
        options={players.bowling.map((p) => ({
          id: p.id,
          label: p.playerName,
          sublabel: p.role,
        }))}
        loading={modalLoading}
        onConfirm={confirmBowler}
      />

      <SelectionModal
        open={batsmanModal}
        onOpenChange={setBatsmanModal}
        title="Next batsman"
        description="Select the batter coming in next."
        options={players.batting.map((p) => ({
          id: p.id,
          label: p.playerName,
          sublabel: p.role,
        }))}
        loading={modalLoading}
        onConfirm={(id) => {
          // Record the wicket with the selected next batsman, then close.
          send("wicket", {
            batsmanId: selectedBatsman,
            bowlerId: selectedBowler,
            dismissalType: "bowled",
            nextBatsmanId: id,
          });
          setBatsmanModal(false);
        }}
      />

      <ConfirmModal
        open={endModal}
        onOpenChange={setEndModal}
        title="End this innings?"
        description="The innings will be closed. If this was the first innings, the target will be set and the second innings will start automatically."
        confirmLabel="End innings"
        variant="destructive"
        loading={pending === "end_innings"}
        onConfirm={() => send("end_innings")}
      />
    </div>
  );
}
