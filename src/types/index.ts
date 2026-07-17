/**
 * CrickPulse — Global database & domain type definitions.
 *
 * These are the canonical TypeScript representations of the planned
 * PostgreSQL schema. They will be refined once the database is created
 * (see Phase 2 database module). Kept here so UI, services, and hooks
 * share a single source of truth.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

/** Player specialisation. */
export type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicket-keeper";

/** Roles within the CrickPulse platform. */
export type UserRole = "admin" | "public";

/** Lifecycle state of a tournament. */
export type TournamentStatus = "upcoming" | "ongoing" | "completed" | "archived";

/** Lifecycle state of a match. */
export type MatchStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "abandoned";

/** Result type resolved by the match result engine. */
export type MatchResultType =
  | "win_by_runs"
  | "win_by_wickets"
  | "tie"
  | "no_result";

/** Dismissal methods supported by the scoring engine. */
export type DismissalType =
  | "bowled"
  | "caught"
  | "lbw"
  | "run_out"
  | "stumped"
  | "hit_wicket"
  | "obstructing_field";

// ---------------------------------------------------------------------------
// Database row shapes (mirror planned Supabase tables)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  team_name: string;
  logo_url: string | null;
  owner_name: string;
  owner_phone: string;
  created_at: string;
}

export interface Player {
  id: string;
  player_name: string;
  photo_url: string | null;
  role: PlayerRole;
  jersey_name: string | null;
  jersey_number: number | null;
  contact_number: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  tournament_name: string;
  overs_per_match: number;
  max_teams: number;
  players_per_team: number;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  created_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  team_id: string;
  joined_at: string;
}

export interface Match {
  id: string;
  tournament_id: string | null;
  team_a_id: string;
  team_b_id: string;
  ground: string | null;
  match_date: string;
  match_time: string | null;
  status: MatchStatus;
  toss_winner_id: string | null;
  toss_decision: "bat" | "bowl" | null;
  result_type: MatchResultType | null;
  winner_id: string | null;
  created_at: string;
}

export interface Innings {
  id: string;
  match_id: string;
  batting_team_id: string;
  bowling_team_id: string;
  innings_number: 1 | 2;
  total_runs: number;
  total_wickets: number;
  overs_completed: number;
  extras: number;
  target: number | null;
  is_completed: boolean;
  created_at: string;
}

export interface BallByBall {
  id: string;
  innings_id: string;
  over_number: number;
  ball_number: number;
  batsman_id: string;
  bowler_id: string;
  runs: number;
  is_legal: boolean;
  is_wicket: boolean;
  dismissal_type: DismissalType | null;
  extras_type: "wide" | "no_ball" | "bye" | "leg_bye" | "overthrow" | null;
  created_at: string;
}

export interface BattingScorecard {
  id: string;
  innings_id: string;
  player_id: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  is_out: boolean;
  dismissal_type: DismissalType | null;
  retired_hurt: boolean;
}

export interface BowlingScorecard {
  id: string;
  innings_id: string;
  player_id: string;
  overs: number;
  runs_conceded: number;
  wickets: number;
  wides: number;
  no_balls: number;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  matches: number;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  wickets: number;
  balls_bowled: number;
  runs_conceded: number;
  motm_awards: number;
  updated_at: string;
}

export interface PointsTableEntry {
  id: string;
  tournament_id: string;
  team_id: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  no_result: number;
  points: number;
  nrr: number;
  rank: number;
}

export interface Award {
  id: string;
  tournament_id: string;
  award_type: "man_of_series" | "best_batter" | "best_bowler" | "mvp";
  player_id: string;
  created_at: string;
}
