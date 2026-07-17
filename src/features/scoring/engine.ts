import { createServiceClient } from "@/lib/supabase/admin";
import type { DismissalType } from "@/types";
import {
  DB,
  type BallEventRow,
  type InningsRow,
  type ScoringActionType,
  type ScoringPayload,
} from "@/features/scoring";
import {
  BALLS_PER_OVER,
  isOverComplete,
  nextBallPosition,
} from "@/features/scoring/rules";

const LEGAL = new Set<ScoringActionType>(["run", "wicket"]);
const EXTRA_TYPES = ["wide", "no_ball", "bye", "leg_bye", "overthrow"] as const;
type ExtraType = (typeof EXTRA_TYPES)[number];

function isLegal(action: ScoringActionType): boolean {
  return LEGAL.has(action);
}

/** Extra runs attributed on a delivery (wides/no-balls add the penalty ball). */
function extraRunsFor(
  action: ScoringActionType,
  batterRuns: number,
): { extras: number; extrasType: ExtraType | null } {
  switch (action) {
    case "wide":
    case "no_ball":
      // Penalty delivery + any runs taken off the bat/byes.
      return { extras: 1 + batterRuns, extrasType: action as ExtraType };
    case "bye":
    case "leg_bye":
    case "overthrow":
      // Runs are all extras, no penalty ball.
      return { extras: batterRuns, extrasType: action as ExtraType };
    default:
      return { extras: 0, extrasType: null };
  }
}

/**
 * Resolve the active (incomplete) innings for a match, ordered by number.
 */
async function getActiveInnings(supabase: ReturnType<typeof createServiceClient>, matchId: string) {
  const { data, error } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .eq(DB.innings.isCompleted, false)
    .order(DB.innings.inningsNumber, { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0] as unknown as InningsRow | undefined) ?? null;
}

/** Upsert a batting scorecard row, applying a delta to the existing one. */
async function applyBattingDelta(
  supabase: ReturnType<typeof createServiceClient>,
  inningsId: string,
  playerId: string,
  delta: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    isOut?: boolean;
    dismissalType?: DismissalType | null;
  },
) {
  const { data: existing, error: selErr } = await supabase
    .from(DB.TABLES.battingScorecard)
    .select("*")
    .eq(DB.batting.inningsId, inningsId)
    .eq(DB.batting.playerId, playerId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);

  if (existing) {
    const row = existing as unknown as {
      runs: number;
      balls_faced: number;
      fours: number;
      sixes: number;
      is_out: boolean;
      dismissal_type: DismissalType | null;
    };
    const { error: updErr } = await supabase
      .from(DB.TABLES.battingScorecard)
      .update({
        [DB.batting.runs]: row.runs + (delta.runs ?? 0),
        [DB.batting.ballsFaced]: row.balls_faced + (delta.balls ?? 0),
        [DB.batting.fours]: row.fours + (delta.fours ?? 0),
        [DB.batting.sixes]: row.sixes + (delta.sixes ?? 0),
        [DB.batting.isOut]: delta.isOut ?? row.is_out,
        [DB.batting.dismissalType]:
          delta.dismissalType ?? row.dismissal_type,
      })
      .eq(DB.batting.id, existing.id);
    if (updErr) throw new Error(updErr.message);
  } else {
    const { error: insErr } = await supabase
      .from(DB.TABLES.battingScorecard)
      .insert({
        [DB.batting.inningsId]: inningsId,
        [DB.batting.playerId]: playerId,
        [DB.batting.runs]: delta.runs ?? 0,
        [DB.batting.ballsFaced]: delta.balls ?? 0,
        [DB.batting.fours]: delta.fours ?? 0,
        [DB.batting.sixes]: delta.sixes ?? 0,
        [DB.batting.isOut]: delta.isOut ?? false,
        [DB.batting.dismissalType]: delta.dismissalType ?? null,
        [DB.batting.retiredHurt]: false,
      });
    if (insErr) throw new Error(insErr.message);
  }
}

/** Upsert a bowling scorecard row, applying a delta to the existing one. */
async function applyBowlingDelta(
  supabase: ReturnType<typeof createServiceClient>,
  inningsId: string,
  playerId: string,
  delta: {
    balls?: number;
    runsConceded?: number;
    wickets?: number;
    wides?: number;
    noBalls?: number;
  },
) {
  const { data: existing, error: selErr } = await supabase
    .from(DB.TABLES.bowlingScorecard)
    .select("*")
    .eq(DB.bowling.inningsId, inningsId)
    .eq(DB.bowling.playerId, playerId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);

  if (existing) {
    const row = existing as unknown as {
      balls_bowled: number;
      runs_conceded: number;
      wickets: number;
      wides: number;
      no_balls: number;
    };
    const balls = row.balls_bowled + (delta.balls ?? 0);
    const { error: updErr } = await supabase
      .from(DB.TABLES.bowlingScorecard)
      .update({
        [DB.bowling.ballsBowled]: balls,
        [DB.bowling.overs]: Math.floor(balls / BALLS_PER_OVER),
        [DB.bowling.runsConceded]:
          row.runs_conceded + (delta.runsConceded ?? 0),
        [DB.bowling.wickets]: row.wickets + (delta.wickets ?? 0),
        [DB.bowling.wides]: row.wides + (delta.wides ?? 0),
        [DB.bowling.noBalls]: row.no_balls + (delta.noBalls ?? 0),
      })
      .eq(DB.bowling.id, existing.id);
    if (updErr) throw new Error(updErr.message);
  } else {
    const balls = delta.balls ?? 0;
    const { error: insErr } = await supabase
      .from(DB.TABLES.bowlingScorecard)
      .insert({
        [DB.bowling.inningsId]: inningsId,
        [DB.bowling.playerId]: playerId,
        [DB.bowling.ballsBowled]: balls,
        [DB.bowling.overs]: Math.floor(balls / BALLS_PER_OVER),
        [DB.bowling.runsConceded]: delta.runsConceded ?? 0,
        [DB.bowling.wickets]: delta.wickets ?? 0,
        [DB.bowling.wides]: delta.wides ?? 0,
        [DB.bowling.noBalls]: delta.noBalls ?? 0,
      });
    if (insErr) throw new Error(insErr.message);
  }
}

/** Increment a player's lifetime stats row (create if missing). */
async function applyPlayerStatsDelta(
  supabase: ReturnType<typeof createServiceClient>,
  playerId: string,
  delta: {
    matches?: number;
    runs?: number;
    ballsFaced?: number;
    fours?: number;
    sixes?: number;
    fifties?: number;
    hundreds?: number;
    wickets?: number;
    ballsBowled?: number;
    runsConceded?: number;
  },
) {
  const { data: existing, error: selErr } = await supabase
    .from(DB.TABLES.playerStats)
    .select("*")
    .eq(DB.playerStats.playerId, playerId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);

  if (existing) {
    const row = existing as unknown as Record<string, number>;
    const patch: Record<string, number> = {};
    for (const [k, v] of Object.entries(delta)) {
      patch[k] = (row[k] ?? 0) + (v ?? 0);
    }
    const { error: updErr } = await supabase
      .from(DB.TABLES.playerStats)
      .update(patch)
      .eq(DB.playerStats.id, existing.id);
    if (updErr) throw new Error(updErr.message);
  } else {
    const { error: insErr } = await supabase
      .from(DB.TABLES.playerStats)
      .insert({ [DB.playerStats.playerId]: playerId, ...delta });
    if (insErr) throw new Error(insErr.message);
  }
}

/**
 * Applies a single delivery to the existing schema: ball_by_ball insert,
 * innings totals, batting/bowling scorecards, player lifetime stats, and a
 * match_events row. Also recomputes strike rotation and over completion.
 *
 * Does NOT create matches/innings — requires an active innings.
 */
export async function applyScoringEvent(
  matchId: string,
  payload: ScoringPayload,
): Promise<{ ball: BallEventRow; innings: InningsRow; overCompleted: boolean }> {
  const supabase = createServiceClient();
  const innings = await getActiveInnings(supabase, matchId);
  if (!innings) throw new Error("No active innings found for this match.");

  const legal = isLegal(payload.action);
  const batterRuns = payload.action === "run" ? payload.runs ?? 0 : 0;
  const { extras, extrasType } = extraRunsFor(payload.action, batterRuns);
  const isWicket = payload.action === "wicket";

  const { overNumber, ballNumber } = nextBallPosition(innings.balls_bowled);

  // Insert the delivery.
  const insertRow = {
    [DB.ball.inningsId]: innings.id,
    [DB.ball.overNumber]: overNumber,
    [DB.ball.ballNumber]: ballNumber,
    [DB.ball.batsmanId]: payload.batsmanId ?? null,
    [DB.ball.bowlerId]: payload.bowlerId ?? null,
    [DB.ball.runs]: batterRuns,
    [DB.ball.extras]: extras,
    [DB.ball.extrasType]: extrasType,
    [DB.ball.isLegal]: legal,
    [DB.ball.isWicket]: isWicket,
    [DB.ball.dismissalType]: isWicket ? payload.dismissalType ?? null : null,
  };
  const { data: inserted, error: insErr } = await supabase
    .from(DB.TABLES.ballByBall)
    .insert(insertRow)
    .select("*")
    .single();
  if (insErr) throw new Error(insErr.message);
  const ball = inserted as unknown as BallEventRow;

  // Update innings totals.
  const newBalls = innings.balls_bowled + (legal ? 1 : 0);
  const overCompleted = legal ? isOverComplete(newBalls) : false;
  const updateRow = {
    [DB.innings.totalRuns]: innings.total_runs + batterRuns + extras,
    [DB.innings.totalWickets]: innings.total_wickets + (isWicket ? 1 : 0),
    [DB.innings.ballsBowled]: newBalls,
    [DB.innings.oversCompleted]: Math.floor(newBalls / BALLS_PER_OVER),
    [DB.innings.extras]: innings.extras + extras,
  };
  const { data: updated, error: updErr } = await supabase
    .from(DB.TABLES.innings)
    .update(updateRow)
    .eq(DB.innings.id, innings.id)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);
  const updatedInnings = updated as unknown as InningsRow;

  // Scorecards + player stats (only when players are identified).
  if (payload.batsmanId) {
    const isBoundaryFour = payload.action === "run" && batterRuns === 4;
    const isBoundarySix = payload.action === "run" && batterRuns === 6;
    await applyBattingDelta(supabase, innings.id, payload.batsmanId, {
      runs: batterRuns + (extrasType === "leg_bye" || extrasType === "bye" ? 0 : extras),
      balls: legal ? 1 : 0,
      fours: isBoundaryFour ? 1 : 0,
      sixes: isBoundarySix ? 1 : 0,
      isOut: isWicket,
      dismissalType: isWicket ? payload.dismissalType ?? null : null,
    });
    await applyPlayerStatsDelta(supabase, payload.batsmanId, {
      runs: batterRuns,
      ballsFaced: legal ? 1 : 0,
      fours: isBoundaryFour ? 1 : 0,
      sixes: isBoundarySix ? 1 : 0,
    });
  }

  if (payload.bowlerId) {
    await applyBowlingDelta(supabase, innings.id, payload.bowlerId, {
      balls: legal ? 1 : 0,
      runsConceded: batterRuns + extras,
      wickets: isWicket ? 1 : 0,
      wides: extrasType === "wide" ? 1 + batterRuns : 0,
      noBalls: extrasType === "no_ball" ? 1 + batterRuns : 0,
    });
    await applyPlayerStatsDelta(supabase, payload.bowlerId, {
      ballsBowled: legal ? 1 : 0,
      runsConceded: batterRuns + extras,
      wickets: isWicket ? 1 : 0,
    });
  }

  // Match event for realtime sync.
  await supabase.from(DB.TABLES.matchEvents).insert({
    [DB.matchEvent.matchId]: matchId,
    [DB.matchEvent.inningsId]: innings.id,
    [DB.matchEvent.eventType]: payload.action,
    [DB.matchEvent.eventData]: {
      ballId: ball.id,
      runs: batterRuns,
      extras,
      extrasType,
      isWicket,
      overCompleted,
    },
  });

  return { ball, innings: updatedInnings, overCompleted };
}

/**
 * Reverts the most recent delivery: deletes the last ball_by_ball row and
 * recomputes innings totals, scorecards, and player stats from remaining balls.
 */
export async function undoLastBall(
  matchId: string,
): Promise<{ innings: InningsRow }> {
  const supabase = createServiceClient();
  const innings = await getActiveInnings(supabase, matchId);
  if (!innings) throw new Error("No active innings found for this match.");

  const { data: lastBall, error: lastErr } = await supabase
    .from(DB.TABLES.ballByBall)
    .select("*")
    .eq(DB.ball.inningsId, innings.id)
    .order(DB.ball.createdAt, { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) throw new Error(lastErr.message);
  if (!lastBall) throw new Error("No ball to undo.");

  const ball = lastBall as unknown as BallEventRow;

  // Reverse player/bowler scorecard + stats contributions.
  if (ball.batsman_id) {
    const isBoundaryFour = ball.runs === 4;
    const isBoundarySix = ball.runs === 6;
    const isExtra = ball.extras_type === "bye" || ball.extras_type === "leg_bye";
    await applyBattingDelta(supabase, innings.id, ball.batsman_id, {
      runs: -(ball.runs + (isExtra ? 0 : ball.extras)),
      balls: ball.is_legal ? -1 : 0,
      fours: isBoundaryFour ? -1 : 0,
      sixes: isBoundarySix ? -1 : 0,
      isOut: false,
      dismissalType: null,
    });
    await applyPlayerStatsDelta(supabase, ball.batsman_id, {
      runs: -ball.runs,
      ballsFaced: ball.is_legal ? -1 : 0,
      fours: isBoundaryFour ? -1 : 0,
      sixes: isBoundarySix ? -1 : 0,
    });
  }
  if (ball.bowler_id) {
    await applyBowlingDelta(supabase, innings.id, ball.bowler_id, {
      balls: ball.is_legal ? -1 : 0,
      runsConceded: -(ball.runs + ball.extras),
      wickets: ball.is_wicket ? -1 : 0,
      wides: ball.extras_type === "wide" ? -(1 + ball.runs) : 0,
      noBalls: ball.extras_type === "no_ball" ? -(1 + ball.runs) : 0,
    });
    await applyPlayerStatsDelta(supabase, ball.bowler_id, {
      ballsBowled: ball.is_legal ? -1 : 0,
      runsConceded: -(ball.runs + ball.extras),
      wickets: ball.is_wicket ? -1 : 0,
    });
  }

  const { error: delErr } = await supabase
    .from(DB.TABLES.ballByBall)
    .delete()
    .eq(DB.ball.id, ball.id);
  if (delErr) throw new Error(delErr.message);

  // Recompute innings totals from remaining balls.
  const { data: remaining, error: remErr } = await supabase
    .from(DB.TABLES.ballByBall)
    .select("*")
    .eq(DB.ball.inningsId, innings.id);
  if (remErr) throw new Error(remErr.message);

  const balls = (remaining ?? []) as unknown as BallEventRow[];
  let totalRuns = 0;
  let totalWickets = 0;
  let extras = 0;
  let legalBalls = 0;
  for (const b of balls) {
    totalRuns += b.runs + b.extras;
    extras += b.extras;
    if (b.is_wicket) totalWickets += 1;
    if (b.is_legal) legalBalls += 1;
  }

  const { data: updated, error: updErr } = await supabase
    .from(DB.TABLES.innings)
    .update({
      [DB.innings.totalRuns]: totalRuns,
      [DB.innings.totalWickets]: totalWickets,
      [DB.innings.ballsBowled]: legalBalls,
      [DB.innings.oversCompleted]: Math.floor(legalBalls / BALLS_PER_OVER),
      [DB.innings.extras]: extras,
    })
    .eq(DB.innings.id, innings.id)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);

  return { innings: updated as unknown as InningsRow };
}
