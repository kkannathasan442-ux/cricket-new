import { createServiceClient } from "@/lib/supabase/admin";
import {
  DB,
  type MatchStartConfig,
  type PlayingXiRow,
} from "@/features/scoring";

/**
 * Playing XI service (Phase 5).
 * Persists the confirmed Playing XI per team per match into the normalized
 * `playing_xi` table and records the Match Start configuration (toss, openers).
 * Batter / bowler selection in the scoreboard is then restricted to XI players.
 */

export async function getPlayingXi(
  matchId: string,
): Promise<PlayingXiRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(DB.TABLES.playingXi)
    .select("*")
    .eq(DB.playingXi.matchId, matchId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PlayingXiRow[];
}

/** Saves the full Playing XI for both teams (replaces existing rows). */
export async function savePlayingXi(
  matchId: string,
  teamAId: string,
  teamAPlayers: string[],
  teamBId: string,
  teamBPlayers: string[],
): Promise<void> {
  const supabase = createServiceClient();

  const { error: delErr } = await supabase
    .from(DB.TABLES.playingXi)
    .delete()
    .eq(DB.playingXi.matchId, matchId);
  if (delErr) throw new Error(delErr.message);

  const rows = [
    ...teamAPlayers.map((playerId) => ({
      [DB.playingXi.matchId]: matchId,
      [DB.playingXi.teamId]: teamAId,
      [DB.playingXi.playerId]: playerId,
      [DB.playingXi.isPlaying]: true,
    })),
    ...teamBPlayers.map((playerId) => ({
      [DB.playingXi.matchId]: matchId,
      [DB.playingXi.teamId]: teamBId,
      [DB.playingXi.playerId]: playerId,
      [DB.playingXi.isPlaying]: true,
    })),
  ];

  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from(DB.TABLES.playingXi)
      .insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
}

/**
 * Applies the Match Start Wizard result: saves Playing XI and updates the
 * match row with toss winner + decision, and marks the match live.
 */
export async function startMatch(
  matchId: string,
  teamAId: string,
  teamBId: string,
  config: MatchStartConfig,
): Promise<void> {
  const supabase = createServiceClient();

  await savePlayingXi(
    matchId,
    teamAId,
    config.teamAPlayers,
    teamBId,
    config.teamBPlayers,
  );

  const { error: matchErr } = await supabase
    .from(DB.TABLES.matches)
    .update({
      toss_winner_id: config.tossWinnerId,
      toss_decision: config.tossDecision,
      status: "live",
    })
    .eq("id", matchId);
  if (matchErr) throw new Error(matchErr.message);
}
