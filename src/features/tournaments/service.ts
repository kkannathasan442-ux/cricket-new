import { createServiceClient } from "@/lib/supabase/admin";
import { DB } from "@/features/scoring";

export interface TournamentSummary {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  oversPerMatch: number;
  playersPerTeam: number;
  teamCount: number;
}

export async function listTournaments(): Promise<TournamentSummary[]> {
  const supabase = createServiceClient();

  const { data: tournaments, error } = await supabase
    .from(DB.TABLES.tournaments)
    .select("id, tournament_name, status, start_date, end_date, overs_per_match, players_per_team")
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  const ids = (tournaments ?? []).map((t) => t.id);

  let teamCountMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: links } = await supabase
      .from("tournament_teams")
      .select("tournament_id")
      .in("tournament_id", ids);

    for (const row of links ?? []) {
      const tid = (row as unknown as { tournament_id: string }).tournament_id;
      teamCountMap.set(tid, (teamCountMap.get(tid) ?? 0) + 1);
    }
  }

  return (tournaments ?? []).map((t) => {
    const row = t as unknown as {
      id: string;
      tournament_name: string;
      status: string;
      start_date: string | null;
      end_date: string | null;
      overs_per_match: number;
      players_per_team: number;
    };
    return {
      id: row.id,
      name: row.tournament_name,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      oversPerMatch: row.overs_per_match,
      playersPerTeam: row.players_per_team,
      teamCount: teamCountMap.get(row.id) ?? 0,
    };
  });
}
