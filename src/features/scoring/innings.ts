import { createServiceClient } from "@/lib/supabase/admin";
import {
  DB,
  type InningsRow,
  type MatchResult,
  type PointsTableRow,
} from "@/features/scoring";
import { computeTarget, resolveMatchResult } from "@/features/scoring/rules";
import { POINTS } from "@/constants";

type Sb = ReturnType<typeof createServiceClient>;

async function getMatch(supabase: Sb, matchId: string) {
  const { data, error } = await supabase
    .from(DB.TABLES.matches)
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as
    | (Record<string, unknown> & {
        id: string;
        tournament_id: string | null;
        team_a_id: string;
        team_b_id: string;
        overs_per_match?: number;
      })
    | null;
}

async function getInningsRows(supabase: Sb, matchId: string) {
  const { data, error } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .order(DB.innings.inningsNumber, { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as InningsRow[];
}

/**
 * Completes the active innings:
 *  - marks it `is_completed = true`
 *  - if it was the first innings, computes the target for the second and
 *    automatically creates the second innings (chasing team bats).
 * Returns the (possibly newly created) active innings or null if the match
 * is now complete.
 */
export async function endInnings(
  matchId: string,
): Promise<{ completed: InningsRow; nextInnings: InningsRow | null }> {
  const supabase = createServiceClient();
  const match = await getMatch(supabase, matchId);
  if (!match) throw new Error("Match not found.");

  const inningsRows = await getInningsRows(supabase, matchId);
  const active = inningsRows.find((i) => !i.is_completed);
  if (!active) throw new Error("No active innings to end.");

  const { error: endErr } = await supabase
    .from(DB.TABLES.innings)
    .update({ [DB.innings.isCompleted]: true })
    .eq(DB.innings.id, active.id);
  if (endErr) throw new Error(endErr.message);

  const completed: InningsRow = { ...active, is_completed: true };

  // First innings finished -> start second innings (chase).
  if (active.innings_number === 1) {
    const target = computeTarget(active.total_runs);
    const { data: created, error: createErr } = await supabase
      .from(DB.TABLES.innings)
      .insert({
        [DB.innings.matchId]: matchId,
        [DB.innings.inningsNumber]: 2,
        [DB.innings.battingTeamId]: active.bowling_team_id,
        [DB.innings.bowlingTeamId]: active.batting_team_id,
        [DB.innings.totalRuns]: 0,
        [DB.innings.totalWickets]: 0,
        [DB.innings.ballsBowled]: 0,
        [DB.innings.oversCompleted]: 0,
        [DB.innings.extras]: 0,
        [DB.innings.target]: target,
        [DB.innings.isCompleted]: false,
      })
      .select("*")
      .single();
    if (createErr) throw new Error(createErr.message);
    return { completed, nextInnings: created as unknown as InningsRow };
  }

  // Second innings finished -> finalize the match.
  await finalizeMatch(matchId, match, [...inningsRows, completed]);
  return { completed, nextInnings: null };
}

/**
 * Resolves the match result and updates the tournament points table.
 * Only runs when the match belongs to a tournament.
 */
export async function finalizeMatch(
  matchId: string,
  match: NonNullable<Awaited<ReturnType<typeof getMatch>>>,
  inningsRows: InningsRow[],
): Promise<MatchResult> {
  const supabase = createServiceClient();
  const first = inningsRows.find((i) => i.innings_number === 1);
  const second = inningsRows.find((i) => i.innings_number === 2);

  let result: MatchResult;
  if (first && second) {
    result = resolveMatchResult({
      firstRuns: first.total_runs,
      secondRuns: second.total_runs,
      firstWickets: first.total_wickets,
      secondWickets: second.total_wickets,
      firstTeamId: first.batting_team_id,
      secondTeamId: second.batting_team_id,
      maxOvers: (match.overs_per_match as number) ?? 20,
      secondBallsBowled: second.balls_bowled,
    });
  } else if (first) {
    result = {
      resultType: "no_result",
      winnerId: null,
      margin: null,
    };
  } else {
    throw new Error("Cannot finalize a match with no innings.");
  }

  // Persist match outcome.
  const { error: matchErr } = await supabase
    .from(DB.TABLES.matches)
    .update({
      status: "completed",
      result_type: result.resultType,
      winner_id: result.winnerId,
    })
    .eq("id", matchId);
  if (matchErr) throw new Error(matchErr.message);

  // Update points table only for tournament matches.
  if (match.tournament_id) {
    await updatePointsTable(
      supabase,
      match.tournament_id as string,
      match.team_a_id,
      match.team_b_id,
      result,
    );
  }

  return result;
}

/**
 * Applies the match result to the tournament points table (BRD 6.7/6.8).
 * Win = 2, Loss = 0, Tie = 1 each, No result = 1 each.
 */
export async function updatePointsTable(
  supabase: Sb,
  tournamentId: string,
  teamA: string,
  teamB: string,
  result: MatchResult,
): Promise<void> {
  if (result.resultType === "tie") {
    await bumpPoints(supabase, tournamentId, teamA, "tied");
    await bumpPoints(supabase, tournamentId, teamB, "tied");
    return;
  }
  if (result.resultType === "no_result") {
    await bumpPoints(supabase, tournamentId, teamA, "no_result");
    await bumpPoints(supabase, tournamentId, teamB, "no_result");
    return;
  }
  if (result.winnerId) {
    await bumpPoints(supabase, tournamentId, result.winnerId, "won");
    const loser = result.winnerId === teamA ? teamB : teamA;
    await bumpPoints(supabase, tournamentId, loser, "lost");
  }
}

async function bumpPoints(
  supabase: Sb,
  tournamentId: string,
  teamId: string,
  outcome: "won" | "lost" | "tied" | "no_result",
): Promise<void> {
  const { data: existing, error: selErr } = await supabase
    .from(DB.TABLES.pointsTable)
    .select("*")
    .eq(DB.pointsTable.tournamentId, tournamentId)
    .eq(DB.pointsTable.teamId, teamId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);

  const add = {
    played: 1,
    won: outcome === "won" ? 1 : 0,
    lost: outcome === "lost" ? 1 : 0,
    tied: outcome === "tied" ? 1 : 0,
    no_result: outcome === "no_result" ? 1 : 0,
    points:
      outcome === "won"
        ? POINTS.win
        : outcome === "tied" || outcome === "no_result"
          ? POINTS.tie
          : POINTS.loss,
  };

  if (existing) {
    const row = existing as unknown as PointsTableRow;
    const { error: updErr } = await supabase
      .from(DB.TABLES.pointsTable)
      .update({
        [DB.pointsTable.played]: row.played + add.played,
        [DB.pointsTable.won]: row.won + add.won,
        [DB.pointsTable.lost]: row.lost + add.lost,
        [DB.pointsTable.tied]: row.tied + add.tied,
        [DB.pointsTable.noResult]: row.no_result + add.no_result,
        [DB.pointsTable.points]: row.points + add.points,
      })
      .eq(DB.pointsTable.id, row.id);
    if (updErr) throw new Error(updErr.message);
  } else {
    const { error: insErr } = await supabase
      .from(DB.TABLES.pointsTable)
      .insert({
        [DB.pointsTable.tournamentId]: tournamentId,
        [DB.pointsTable.teamId]: teamId,
        [DB.pointsTable.played]: add.played,
        [DB.pointsTable.won]: add.won,
        [DB.pointsTable.lost]: add.lost,
        [DB.pointsTable.tied]: add.tied,
        [DB.pointsTable.noResult]: add.no_result,
        [DB.pointsTable.points]: add.points,
        [DB.pointsTable.nrr]: 0,
        [DB.pointsTable.rank]: 0,
      });
    if (insErr) throw new Error(insErr.message);
  }
}
