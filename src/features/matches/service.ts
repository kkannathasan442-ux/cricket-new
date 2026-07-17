import { createServiceClient } from "@/lib/supabase/admin";
import { DB } from "@/features/scoring";

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
    player_id: string;
    player_name: string;
    runs: number;
    balls_faced: number;
    fours: number;
    sixes: number;
    is_out: boolean;
    dismissal_type: string | null;
  }[];
  bowling: {
    player_id: string;
    player_name: string;
    overs: number;
    runs_conceded: number;
    wickets: number;
    wides: number;
    no_balls: number;
  }[];
  commentary: {
    id: string;
    over_number: number;
    ball_number: number;
    runs: number;
    extras: number;
    extras_type: string | null;
    is_wicket: boolean;
    dismissal_type: string | null;
    batsman_id: string | null;
    bowler_id: string | null;
  }[];
}

export interface MatchListItem {
  id: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  tournamentName: string | null;
  status: string;
  totalRuns: number | null;
  totalWickets: number | null;
  ballsBowled: number | null;
  target: number | null;
  inningsNumber: number | null;
  matchDate: string | null;
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
  let commentary: MatchCenterData["commentary"] = [];

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
    const ballRows = (balls ?? []) as unknown as MatchCenterData["commentary"];
    commentary = ballRows
      .slice()
      .reverse()
      .map((b) => ({
        id: b.id,
        over_number: b.over_number,
        ball_number: b.ball_number,
        runs: b.runs,
        extras: b.extras,
        extras_type: b.extras_type,
        is_wicket: b.is_wicket,
        dismissal_type: b.dismissal_type,
        batsman_id: b.batsman_id,
        bowler_id: b.bowler_id,
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
        player_id: string;
        runs: number;
        balls_faced: number;
        fours: number;
        sixes: number;
        is_out: boolean;
        dismissal_type: string | null;
        players?: { player_name: string } | null;
      };
      return {
        player_id: row.player_id,
        player_name: row.players?.player_name ?? "Unknown",
        runs: row.runs,
        balls_faced: row.balls_faced,
        fours: row.fours,
        sixes: row.sixes,
        is_out: row.is_out,
        dismissal_type: row.dismissal_type,
      };
    });

    const { data: bowl } = await supabase
      .from(DB.TABLES.bowlingScorecard)
      .select("*, players(player_name)")
      .eq(DB.bowling.inningsId, innings.id);
    bowling = (bowl ?? []).map((r) => {
      const row = r as unknown as {
        player_id: string;
        overs: number;
        runs_conceded: number;
        wickets: number;
        wides: number;
        no_balls: number;
        players?: { player_name: string } | null;
      };
      return {
        player_id: row.player_id,
        player_name: row.players?.player_name ?? "Unknown",
        overs: row.overs,
        runs_conceded: row.runs_conceded,
        wickets: row.wickets,
        wides: row.wides,
        no_balls: row.no_balls,
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

export async function listMatches(): Promise<MatchListItem[]> {
  const supabase = createServiceClient();

  const { data: matches, error } = await supabase
    .from(DB.TABLES.matches)
    .select(
      "id, team_a_id, team_b_id, status, match_date, tournaments(tournament_name)",
    )
    .order("match_date", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const { data: teams } = await supabase
    .from(DB.TABLES.teams)
    .select("id, team_name");

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.team_name]));

  const { data: inningsRows } = await supabase
    .from(DB.TABLES.innings)
    .select("match_id, total_runs, total_wickets, balls_bowled, target, innings_number")
    .in(
      "match_id",
      (matches ?? []).map((m) => m.id),
    );

  const inningsMap = new Map(
    (inningsRows ?? []).map((i) => [
      i.match_id,
      {
        totalRuns: i.total_runs,
        totalWickets: i.total_wickets,
        ballsBowled: i.balls_bowled,
        target: i.target,
        inningsNumber: i.innings_number,
      },
    ]),
  );

  return (matches ?? []).map((m) => {
    const mid = m as unknown as {
      id: string;
      team_a_id: string;
      team_b_id: string;
      status: string;
      match_date: string | null;
      tournaments?: { tournament_name: string | null } | null;
    };
    const inn = inningsMap.get(mid.id);
    return {
      id: mid.id,
      teamA: { id: mid.team_a_id, name: teamMap.get(mid.team_a_id) ?? "Team A" },
      teamB: { id: mid.team_b_id, name: teamMap.get(mid.team_b_id) ?? "Team B" },
      tournamentName: mid.tournaments?.tournament_name ?? null,
      status: mid.status,
      totalRuns: inn?.totalRuns ?? null,
      totalWickets: inn?.totalWickets ?? null,
      ballsBowled: inn?.ballsBowled ?? null,
      target: inn?.target ?? null,
      inningsNumber: inn?.inningsNumber ?? null,
      matchDate: mid.match_date,
    };
  });
}

export async function getAdminDashboardStats(): Promise<{
  matches: number;
  tournaments: number;
  teams: number;
  players: number;
  liveMatches: number;
}> {
  const supabase = createServiceClient();

  const [{ count: matchCount }, { count: tournamentCount }, { count: teamCount }, { count: playerCount }] =
    await Promise.all([
      supabase.from(DB.TABLES.matches).select("*", { count: "exact", head: true }),
      supabase.from(DB.TABLES.tournaments).select("*", { count: "exact", head: true }),
      supabase.from(DB.TABLES.teams).select("*", { count: "exact", head: true }),
      supabase.from(DB.TABLES.players).select("*", { count: "exact", head: true }),
    ]);

  const { count: liveMatchCount } = await supabase
    .from(DB.TABLES.matches)
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  return {
    matches: matchCount ?? 0,
    tournaments: tournamentCount ?? 0,
    teams: teamCount ?? 0,
    players: playerCount ?? 0,
    liveMatches: liveMatchCount ?? 0,
  };
}
