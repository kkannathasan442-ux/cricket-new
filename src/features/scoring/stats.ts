import { createServiceClient } from "@/lib/supabase/admin";
import { DB } from "@/features/scoring";
import { calculateNRR } from "@/features/scoring/rules";

export interface OrangeCapEntry {
  playerId: string;
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  strikeRate: number;
}

export interface PurpleCapEntry {
  playerId: string;
  playerName: string;
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
  economy: number;
}

export interface MvpEntry {
  playerId: string;
  playerName: string;
  runs: number;
  wickets: number;
  motmAwards: number;
  score: number;
}

export interface StandingsEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
  rank: number;
}

export async function getGlobalStats(): Promise<{
  orangeCap: OrangeCapEntry[];
  purpleCap: PurpleCapEntry[];
  mvp: MvpEntry[];
}> {
  const supabase = createServiceClient();

  const { data: players, error: pErr } = await supabase
    .from(DB.TABLES.playerStats)
    .select("*, players(id, player_name)")
    .order(DB.playerStats.runs, { ascending: false })
    .limit(50);
  if (pErr) throw new Error(pErr.message);

  const orangeCap: OrangeCapEntry[] = (players ?? [])
    .map((row) => {
      const r = row as unknown as {
        player_id: string;
        runs: number;
        balls_faced: number;
        fours: number;
        sixes: number;
        fifties: number;
        hundreds: number;
        players?: { player_name: string } | null;
      };
      return {
        playerId: r.player_id,
        playerName: r.players?.player_name ?? "Unknown",
        runs: r.runs,
        ballsFaced: r.balls_faced,
        fours: r.fours,
        sixes: r.sixes,
        fifties: r.fifties,
        hundreds: r.hundreds,
        strikeRate:
          r.balls_faced > 0 ? Number(((r.runs / r.balls_faced) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10);

  const purpleCap: PurpleCapEntry[] = (players ?? [])
    .map((row) => {
      const r = row as unknown as {
        player_id: string;
        wickets: number;
        runs_conceded: number;
        balls_bowled: number;
        players?: { player_name: string } | null;
      };
      const overs = r.balls_bowled > 0 ? r.balls_bowled / 6 : 0;
      return {
        playerId: r.player_id,
        playerName: r.players?.player_name ?? "Unknown",
        wickets: r.wickets,
        runsConceded: r.runs_conceded,
        ballsBowled: r.balls_bowled,
        economy: overs > 0 ? Number((r.runs_conceded / overs).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 10);

  const mvp: MvpEntry[] = (players ?? [])
    .map((row) => {
      const r = row as unknown as {
        player_id: string;
        runs: number;
        wickets: number;
        motm_awards: number;
        players?: { player_name: string } | null;
      };
      return {
        playerId: r.player_id,
        playerName: r.players?.player_name ?? "Unknown",
        runs: r.runs,
        wickets: r.wickets,
        motmAwards: r.motm_awards,
        score: Number((r.runs / 20 + r.wickets * 2 + r.motm_awards * 3).toFixed(2)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return { orangeCap, purpleCap, mvp };
}

/**
 * Tournament statistics (Phase 5): Orange Cap, Purple Cap, MVP leaderboard,
 * and team standings with Net Run Rate read from the points_table.
 */
export async function getTournamentStats(tournamentId: string): Promise<{
  orangeCap: OrangeCapEntry[];
  purpleCap: PurpleCapEntry[];
  mvp: MvpEntry[];
  standings: StandingsEntry[];
}> {
  const supabase = createServiceClient();

  const { data: players, error: pErr } = await supabase
    .from(DB.TABLES.playerStats)
    .select("*, players(id, player_name)")
    .order(DB.playerStats.runs, { ascending: false })
    .limit(50);
  if (pErr) throw new Error(pErr.message);

  const orangeCap: OrangeCapEntry[] = (players ?? [])
    .map((row) => {
      const r = row as unknown as {
        player_id: string;
        runs: number;
        balls_faced: number;
        fours: number;
        sixes: number;
        fifties: number;
        hundreds: number;
        players?: { player_name: string } | null;
      };
      return {
        playerId: r.player_id,
        playerName: r.players?.player_name ?? "Unknown",
        runs: r.runs,
        ballsFaced: r.balls_faced,
        fours: r.fours,
        sixes: r.sixes,
        fifties: r.fifties,
        hundreds: r.hundreds,
        strikeRate:
          r.balls_faced > 0 ? Number(((r.runs / r.balls_faced) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10);

  const purpleCap: PurpleCapEntry[] = (players ?? [])
    .map((row) => {
      const r = row as unknown as {
        player_id: string;
        wickets: number;
        runs_conceded: number;
        balls_bowled: number;
        players?: { player_name: string } | null;
      };
      const overs = r.balls_bowled > 0 ? r.balls_bowled / 6 : 0;
      return {
        playerId: r.player_id,
        playerName: r.players?.player_name ?? "Unknown",
        wickets: r.wickets,
        runsConceded: r.runs_conceded,
        ballsBowled: r.balls_bowled,
        economy: overs > 0 ? Number((r.runs_conceded / overs).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 10);

  const mvp: MvpEntry[] = (players ?? [])
    .map((row) => {
      const r = row as unknown as {
        player_id: string;
        runs: number;
        wickets: number;
        motm_awards: number;
        players?: { player_name: string } | null;
      };
      return {
        playerId: r.player_id,
        playerName: r.players?.player_name ?? "Unknown",
        runs: r.runs,
        wickets: r.wickets,
        motmAwards: r.motm_awards,
        score: Number((r.runs / 20 + r.wickets * 2 + r.motm_awards * 3).toFixed(2)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const { data: standings, error: sErr } = await supabase
    .from(DB.TABLES.pointsTable)
    .select("*, teams(team_name)")
    .eq(DB.pointsTable.tournamentId, tournamentId);
  if (sErr) throw new Error(sErr.message);

  const standingsRows: StandingsEntry[] = (standings ?? [])
    .map((row) => {
      const r = row as unknown as {
        team_id: string;
        played: number;
        won: number;
        lost: number;
        tied: number;
        no_result: number;
        points: number;
        nrr: number;
        rank: number;
        teams?: { team_name: string } | null;
      };
      return {
        teamId: r.team_id,
        teamName: r.teams?.team_name ?? "Team",
        played: r.played,
        won: r.won,
        lost: r.lost,
        tied: r.tied,
        noResult: r.no_result,
        points: r.points,
        nrr: Number(r.nrr) || 0,
        rank: r.rank,
      };
    })
    .sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  void calculateNRR;

  return { orangeCap, purpleCap, mvp, standings: standingsRows };
}
