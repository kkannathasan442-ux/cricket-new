import { createServiceClient } from "@/lib/supabase/admin";
import { DB, type MatchScoringContext } from "@/features/scoring";

/**
 * Fetches the full scoring context for a match used by the admin score page.
 *
 * Uses the service-role client (scoring is admin-trusted). Reads from the
 * existing `matches`, `tournaments`, `teams`, `innings`, `ball_by_ball`
 * tables. Returns null when the match does not exist.
 */
export async function getMatchScoringContext(
  matchId: string,
): Promise<MatchScoringContext | null> {
  const supabase = createServiceClient();

  const { data: match, error: matchError } = await supabase
    .from(DB.TABLES.matches)
    .select(
      "id, tournament_id, team_a_id, team_b_id, tournaments(tournament_name), teams!matches_team_a_id_fkey(id, team_name), teams!matches_team_b_id_fkey(id, team_name)",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) return null;

  const teamA = (match as unknown as { teams?: { id: string; team_name: string } }).teams;
  const teamB = (match as unknown as { teams?: { id: string; team_name: string } }).teams;

  // Innings for the match (first incomplete, else latest).
  const { data: inningsRows } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .order(DB.innings.inningsNumber, { ascending: true })
    .limit(1);

  const innings = (inningsRows?.[0] as unknown as MatchScoringContext["innings"]) ?? null;

  let battingTeam = null;
  let bowlingTeam = null;
  let striker = null;
  let bowler = null;
  let recentBalls: MatchScoringContext["recentBalls"] = [];

  if (innings) {
    const { data: teams } = await supabase
      .from(DB.TABLES.teams)
      .select("id, team_name")
      .in("id", [innings.batting_team_id, innings.bowling_team_id]);

    battingTeam =
      teams?.find((t) => t.id === innings.batting_team_id)
        ? {
            id: innings.batting_team_id,
            teamName:
              teams.find((t) => t.id === innings.batting_team_id)?.team_name ??
              "Team",
          }
        : null;
    bowlingTeam =
      teams?.find((t) => t.id === innings.bowling_team_id)
        ? {
            id: innings.bowling_team_id,
            teamName:
              teams.find((t) => t.id === innings.bowling_team_id)?.team_name ??
              "Team",
          }
        : null;

    const { data: balls } = await supabase
      .from(DB.TABLES.ballByBall)
      .select("*")
      .eq(DB.ball.inningsId, innings.id)
      .order(DB.ball.createdAt, { ascending: false })
      .limit(12);

    recentBalls = (balls ?? []) as unknown as MatchScoringContext["recentBalls"];
    const lastBall = recentBalls[0];
    if (lastBall) {
      const { data: players } = await supabase
        .from(DB.TABLES.players)
        .select("id, player_name")
        .in("id", [lastBall.batsman_id, lastBall.bowler_id]);
      striker = players?.find((p) => p.id === lastBall.batsman_id)
        ? {
            id: lastBall.batsman_id,
            playerName:
              players.find((p) => p.id === lastBall.batsman_id)?.player_name ??
              "Batsman",
          }
        : null;
      bowler = players?.find((p) => p.id === lastBall.bowler_id)
        ? {
            id: lastBall.bowler_id,
            playerName:
              players.find((p) => p.id === lastBall.bowler_id)?.player_name ??
              "Bowler",
          }
        : null;
    }
  }

  return {
    matchId,
    tournamentName:
      (match as unknown as { tournaments?: { tournament_name: string | null } })
        .tournaments?.tournament_name ?? null,
    teamA: teamA
      ? { id: teamA.id, teamName: teamA.team_name }
      : { id: match.team_a_id, teamName: "Team A" },
    teamB: teamB
      ? { id: teamB.id, teamName: teamB.team_name }
      : { id: match.team_b_id, teamName: "Team B" },
    innings,
    battingTeam,
    bowlingTeam,
    striker,
    bowler,
    recentBalls: [...recentBalls].reverse(),
  };
}
