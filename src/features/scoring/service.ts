import { createServiceClient } from "@/lib/supabase/admin";
import {
  DB,
  type BallEventRow,
  type InningsRow,
  type MatchScoringContext,
  type PlayerOption,
  type TeamSummary,
} from "@/features/scoring";

/**
 * Fetch the active (incomplete) innings for a match, else the latest.
 */
async function resolveInnings(
  supabase: ReturnType<typeof createServiceClient>,
  matchId: string,
): Promise<InningsRow | null> {
  const { data } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .order(DB.innings.isCompleted, { ascending: true })
    .order(DB.innings.inningsNumber, { ascending: true })
    .limit(1);
  return (data?.[0] as unknown as InningsRow) ?? null;
}

/**
 * Builds the full scoring context for the admin score page / public
 * scoreboard. Uses the service-role client (scoring is admin-trusted).
 */
export async function getMatchScoringContext(
  matchId: string,
): Promise<MatchScoringContext | null> {
  const supabase = createServiceClient();

  const { data: match, error: matchError } = await supabase
    .from(DB.TABLES.matches)
    .select(
      "id, tournament_id, team_a_id, team_b_id, tournaments(tournament_name)",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) return null;
  const m = match as unknown as {
    id: string;
    tournament_id: string | null;
    team_a_id: string;
    team_b_id: string;
    tournaments?: { tournament_name: string | null } | null;
  };

  // All innings for the match.
  const { data: inningsData } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .order(DB.innings.inningsNumber, { ascending: true });
  const inningsList = (inningsData ?? []) as unknown as InningsRow[];

  const innings = await resolveInnings(supabase, matchId);

  // Teams A & B.
  const { data: teams } = await supabase
    .from(DB.TABLES.teams)
    .select("id, team_name")
    .in("id", [m.team_a_id, m.team_b_id]);
  const toSummary = (id: string, fallback: string): TeamSummary => {
    const t = teams?.find((x) => x.id === id);
    return t ? { id: t.id, teamName: t.team_name } : { id, teamName: fallback };
  };
  const teamA = toSummary(m.team_a_id, "Team A");
  const teamB = toSummary(m.team_b_id, "Team B");

  let battingTeam: TeamSummary | null = null;
  let bowlingTeam: TeamSummary | null = null;
  let striker: MatchScoringContext["striker"] = null;
  let nonStriker: MatchScoringContext["nonStriker"] = null;
  let bowler: MatchScoringContext["bowler"] = null;
  let recentBalls: BallEventRow[] = [];
  let requiresBowlerChange = false;
  let requiresNextBatsman = false;

  if (innings) {
    battingTeam = toSummary(innings.batting_team_id, "Batting");
    bowlingTeam = toSummary(innings.bowling_team_id, "Bowling");

    const { data: balls } = await supabase
      .from(DB.TABLES.ballByBall)
      .select("*")
      .eq(DB.ball.inningsId, innings.id)
      .order(DB.ball.createdAt, { ascending: false })
      .limit(12);
    recentBalls = (balls ?? []) as unknown as BallEventRow[];
    const last = recentBalls[0];

    if (last) {
      const playerIds = [
        last.batsman_id,
        last.bowler_id,
      ].filter(Boolean) as string[];
      const { data: players } = await supabase
        .from(DB.TABLES.players)
        .select("id, player_name")
        .in("id", playerIds);
      const find = (id: string) =>
        players?.find((p) => p.id === id)
          ? {
              id,
              playerName:
                players.find((p) => p.id === id)?.player_name ?? "Player",
            }
          : null;
      striker = find(last.batsman_id);
      bowler = find(last.bowler_id);

      // Until the next ball is recorded we cannot know the new striker;
      // the UI prompts for the next batsman when the last ball was a wicket.
      requiresNextBatsman = last.is_wicket;
      // Over completion is derived from ball count by the client, but we
      // surface it from the engine result at action time; default false here.
    }
  }

  return {
    matchId,
    tournamentId: m.tournament_id,
    tournamentName: m.tournaments?.tournament_name ?? null,
    teamA,
    teamB,
    innings,
    inningsList,
    battingTeam,
    bowlingTeam,
    striker,
    nonStriker,
    bowler,
    recentBalls: [...recentBalls].reverse(),
    requiresBowlerChange,
    requiresNextBatsman,
  };
}

/**
 * Lists players available for the innings' batting & bowling roles so the
 * admin can pick the next batsman / next bowler in the modals.
 *
 * NOTE: the global `players` table is not team-scoped (BRD 6.2 — stats never
 * reset across teams), so we return all players and let the admin choose.
 * When a squad/playing-XI link exists, filter by it here.
 */
export async function getInningsPlayers(
  matchId: string,
): Promise<{ batting: PlayerOption[]; bowling: PlayerOption[] }> {
  const supabase = createServiceClient();
  const innings = await resolveInnings(supabase, matchId);
  if (!innings) return { batting: [], bowling: [] };

  const { data } = await supabase
    .from(DB.TABLES.players)
    .select("id, player_name, role");

  const all: PlayerOption[] = (data ?? []).map((p) => ({
    id: p.id,
    playerName: p.player_name,
    role: p.role,
  }));

  return {
    batting: all,
    bowling: all.filter((p) => p.role !== "batsman"),
  };
}
