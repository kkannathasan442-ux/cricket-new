import { createServiceClient } from "@/lib/supabase/admin";
import { DB } from "@/features/scoring";
import type { BallEventRow } from "@/features/scoring";

export interface CommentaryItem {
  id: string;
  over: number;
  ball: number;
  text: string;
  isWicket: boolean;
  runs: number;
  extras: number;
}

export interface MatchCenterData {
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
  batting: {
    playerName: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    dismissal: string;
  }[];
  bowling: {
    playerName: string;
    overs: number;
    runs: number;
    wickets: number;
    wides: number;
    noBalls: number;
  }[];
  commentary: CommentaryItem[];
}

function dismissalLabel(b: BallEventRow): string {
  if (!b.is_wicket) return "not out";
  return b.dismissal_type ? b.dismissal_type.replace(/_/g, " ") : "out";
}

function ballText(b: BallEventRow): string {
  if (b.is_wicket) return `WICKET! ${dismissalLabel(b)}.`;
  if (b.extras > 0) return `${b.extras_type?.replace(/_/g, " ")} (${b.extras}).`;
  if (b.runs === 4) return "FOUR!";
  if (b.runs === 6) return "SIX!";
  return `${b.runs} run${b.runs === 1 ? "" : "s"}.`;
}

export async function getMatchCenterData(
  matchId: string,
): Promise<MatchCenterData | null> {
  const supabase = createServiceClient();

  const { data: match, error } = await supabase
    .from(DB.TABLES.matches)
    .select("id, tournament_id, team_a_id, team_b_id, tournaments(tournament_name)")
    .eq("id", matchId)
    .maybeSingle();
  if (error || !match) return null;
  const m = match as unknown as {
    tournaments?: { tournament_name: string | null } | null;
    team_a_id: string;
    team_b_id: string;
  };

  const { data: teams } = await supabase
    .from(DB.TABLES.teams)
    .select("id, team_name")
    .in("id", [m.team_a_id, m.team_b_id]);
  const teamA = {
    id: m.team_a_id,
    name: teams?.find((t) => t.id === m.team_a_id)?.team_name ?? "Team A",
  };
  const teamB = {
    id: m.team_b_id,
    name: teams?.find((t) => t.id === m.team_b_id)?.team_name ?? "Team B",
  };

  const { data: inningsRows } = await supabase
    .from(DB.TABLES.innings)
    .select("*")
    .eq(DB.innings.matchId, matchId)
    .order(DB.innings.inningsNumber, { ascending: true })
    .limit(1);
  const innings = (inningsRows?.[0] as unknown as
    | import("@/features/scoring").InningsRow
    | undefined) ?? null;

  let striker: string | null = null;
  let bowler: string | null = null;
  let batting: MatchCenterData["batting"] = [];
  let bowling: MatchCenterData["bowling"] = [];
  let commentary: CommentaryItem[] = [];

  if (innings) {
    const battingTeamName =
      teams?.find((t) => t.id === innings.batting_team_id)?.team_name ?? "";
    const bowlingTeamName =
      teams?.find((t) => t.id === innings.bowling_team_id)?.team_name ?? "";

    const { data: balls } = await supabase
      .from(DB.TABLES.ballByBall)
      .select("*")
      .eq(DB.ball.inningsId, innings.id)
      .order(DB.ball.createdAt, { ascending: false })
      .limit(40);
    const ballRows = (balls ?? []) as unknown as BallEventRow[];
    commentary = ballRows
      .slice()
      .reverse()
      .map((b) => ({
        id: b.id,
        over: b.over_number,
        ball: b.ball_number,
        text: ballText(b),
        isWicket: b.is_wicket,
        runs: b.runs,
        extras: b.extras,
      }));

    const last = ballRows[0];
    if (last) {
      const { data: players } = await supabase
        .from(DB.TABLES.players)
        .select("id, player_name")
        .in("id", [last.batsman_id, last.bowler_id]);
      striker =
        players?.find((p) => p.id === last.batsman_id)?.player_name ?? null;
      bowler =
        players?.find((p) => p.id === last.bowler_id)?.player_name ?? null;
    }

    const { data: bat } = await supabase
      .from(DB.TABLES.battingScorecard)
      .select("*, players(player_name)")
      .eq(DB.batting.inningsId, innings.id);
    batting = (bat ?? []).map((r) => {
      const row = r as unknown as {
        runs: number;
        balls_faced: number;
        fours: number;
        sixes: number;
        is_out: boolean;
        dismissal_type: string | null;
        players?: { player_name: string } | null;
      };
      return {
        playerName: row.players?.player_name ?? "Unknown",
        runs: row.runs,
        balls: row.balls_faced,
        fours: row.fours,
        sixes: row.sixes,
        dismissal: row.is_out
          ? row.dismissal_type?.replace(/_/g, " ") ?? "out"
          : "not out",
      };
    });

    const { data: bowl } = await supabase
      .from(DB.TABLES.bowlingScorecard)
      .select("*, players(player_name)")
      .eq(DB.bowling.inningsId, innings.id);
    bowling = (bowl ?? []).map((r) => {
      const row = r as unknown as {
        overs: number;
        runs_conceded: number;
        wickets: number;
        wides: number;
        no_balls: number;
        players?: { player_name: string } | null;
      };
      return {
        playerName: row.players?.player_name ?? "Unknown",
        overs: row.overs,
        runs: row.runs_conceded,
        wickets: row.wickets,
        wides: row.wides,
        noBalls: row.no_balls,
      };
    });

    return {
      teamA,
      teamB,
      tournamentName: m.tournaments?.tournament_name ?? null,
      innings: {
        number: innings.innings_number,
        battingTeamId: innings.batting_team_id,
        bowlingTeamId: innings.bowling_team_id,
        totalRuns: innings.total_runs,
        totalWickets: innings.total_wickets,
        ballsBowled: innings.balls_bowled,
        target: innings.target,
        battingTeamName,
        bowlingTeamName,
      },
      striker,
      bowler,
      batting,
      bowling,
      commentary,
    };
  }

  return {
    teamA,
    teamB,
    tournamentName: m.tournaments?.tournament_name ?? null,
    innings: null,
    striker: null,
    bowler: null,
    batting: [],
    bowling: [],
    commentary: [],
  };
}
