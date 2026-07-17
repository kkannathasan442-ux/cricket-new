import { createServiceClient } from "@/lib/supabase/admin";
import {
  DB,
  type BallEventRow,
  type InningsRow,
  type ScoringPayload,
} from "@/features/scoring";

/** A legal delivery advances the ball count; illegal (wide/no-ball) does not. */
const LEGAL_ACTION = "run" as const;

/**
 * Computes the next ball number + over boundary for a delivery.
 * Ball numbering is continuous per innings (legal balls only). An over is
 * 6 legal balls. Returns 1-based over_number and ball_number (within over).
 */
function computeBallPosition(
  ballsBowled: number,
): { overNumber: number; ballNumber: number } {
  const overNumber = Math.floor(ballsBowled / 6) + 1;
  const ballNumber = (ballsBowled % 6) + 1;
  return { overNumber, ballNumber };
}

function isLegalAction(action: ScoringPayload["action"]): boolean {
  return action === LEGAL_ACTION || action === "wicket";
}

/**
 * Applies a scoring action to the existing schema:
 *   1. Inserts a delivery row into `ball_by_ball`.
 *   2. Updates `innings` totals (runs, wickets, balls, extras, overs).
 *   3. Appends a `match_events` row for the action.
 *
 * Does NOT create matches/innings — it requires an active innings to exist.
 * Returns the inserted ball and the updated innings.
 */
export async function applyScoringEvent(
  matchId: string,
  payload: ScoringPayload,
): Promise<{ ball: BallEventRow; innings: InningsRow }> {
  const supabase = createServiceClient();

  // 1. Resolve the active innings for this match.
  const { data: inningsRows, error: inningsErr } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .eq(DB.innings.isCompleted, false)
    .order(DB.innings.inningsNumber, { ascending: true })
    .limit(1);

  if (inningsErr) throw new Error(inningsErr.message);
  const innings = inningsRows?.[0] as unknown as InningsRow | undefined;
  if (!innings) {
    throw new Error("No active innings found for this match.");
  }

  const legal = isLegalAction(payload.action);
  const runs = payload.action === "run" ? payload.runs ?? 0 : 0;
  const extras = payload.action === "wide" || payload.action === "no_ball"
    ? 1 + (payload.runs ?? 0)
    : payload.action === "bye" || payload.action === "leg_bye" || payload.action === "overthrow"
      ? payload.runs ?? 0
      : 0;
  const isWicket = payload.action === "wicket";
  const extrasType =
    payload.action === "wide"
      ? "wide"
      : payload.action === "no_ball"
        ? "no_ball"
        : payload.action === "bye"
          ? "bye"
          : payload.action === "leg_bye"
            ? "leg_bye"
            : payload.action === "overthrow"
              ? "overthrow"
              : null;

  const { overNumber, ballNumber } = computeBallPosition(innings.balls_bowled);

  // 2. Insert delivery.
  const insertRow = {
    [DB.ball.inningsId]: innings.id,
    [DB.ball.overNumber]: overNumber,
    [DB.ball.ballNumber]: ballNumber,
    [DB.ball.batsmanId]: payload.batsmanId ?? null,
    [DB.ball.bowlerId]: payload.bowlerId ?? null,
    [DB.ball.runs]: runs,
    [DB.ball.extras]: extras,
    [DB.ball.extrasType]: extrasType,
    [DB.ball.isLegal]: legal,
    [DB.ball.isWicket]: isWicket,
    [DB.ball.dismissalType]: isWicket ? payload.dismissalType ?? null : null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from(DB.TABLES.ballByBall)
    .insert(insertRow)
    .select("*")
    .single();

  if (insertErr) throw new Error(insertErr.message);
  const ball = inserted as unknown as BallEventRow;

  // 3. Update innings totals.
  const newBallsBowled = legal ? innings.balls_bowled + 1 : innings.balls_bowled;
  const newOvers = Math.floor(newBallsBowled / 6);
  const updateRow = {
    [DB.innings.totalRuns]: innings.total_runs + runs + extras,
    [DB.innings.totalWickets]: innings.total_wickets + (isWicket ? 1 : 0),
    [DB.innings.ballsBowled]: newBallsBowled,
    [DB.innings.oversCompleted]: newOvers,
    [DB.innings.extras]: innings.extras + extras,
  };

  const { data: updated, error: updateErr } = await supabase
    .from(DB.TABLES.innings)
    .update(updateRow)
    .eq(DB.innings.id, innings.id)
    .select("*")
    .single();

  if (updateErr) throw new Error(updateErr.message);
  const updatedInnings = updated as unknown as InningsRow;

  // 4. Record a match event.
  await supabase.from(DB.TABLES.matchEvents).insert({
    [DB.matchEvent.matchId]: matchId,
    [DB.matchEvent.inningsId]: innings.id,
    [DB.matchEvent.eventType]: payload.action,
    [DB.matchEvent.eventData]: {
      ballId: ball.id,
      runs,
      extras,
      isWicket,
      extrasType,
    },
  });

  return { ball, innings: updatedInnings };
}

/**
 * Reverts the most recent delivery for a match (Undo).
 *   1. Deletes the last `ball_by_ball` row for the active innings.
 *   2. Recomputes & restores `innings` totals from the remaining balls.
 */
export async function undoLastBall(
  matchId: string,
): Promise<{ innings: InningsRow }> {
  const supabase = createServiceClient();

  const { data: inningsRows, error: inningsErr } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .eq(DB.innings.isCompleted, false)
    .order(DB.innings.inningsNumber, { ascending: true })
    .limit(1);

  if (inningsErr) throw new Error(inningsErr.message);
  const innings = inningsRows?.[0] as unknown as InningsRow | undefined;
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

  const { error: delErr } = await supabase
    .from(DB.TABLES.ballByBall)
    .delete()
    .eq(DB.ball.id, (lastBall as unknown as BallEventRow).id);

  if (delErr) throw new Error(delErr.message);

  // Recompute totals from the remaining balls (single source of truth).
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

  const updateRow = {
    [DB.innings.totalRuns]: totalRuns,
    [DB.innings.totalWickets]: totalWickets,
    [DB.innings.ballsBowled]: legalBalls,
    [DB.innings.oversCompleted]: Math.floor(legalBalls / 6),
    [DB.innings.extras]: extras,
  };

  const { data: updated, error: updateErr } = await supabase
    .from(DB.TABLES.innings)
    .update(updateRow)
    .eq(DB.innings.id, innings.id)
    .select("*")
    .single();

  if (updateErr) throw new Error(updateErr.message);
  return { innings: updated as unknown as InningsRow };
}
