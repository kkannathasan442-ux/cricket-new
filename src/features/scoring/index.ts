/**
 * Feature: Live scoring (BRD 6.5).
 *
 * IMPORTANT — existing schema contract
 * -------------------------------------
 * This feature targets the EXISTING live-scoring tables defined in
 * `007_live_scoring.sql` (do NOT create new tables). The column names below
 * are the assumed mapping for those tables. If the real migration uses
 * different column names, update ONLY the `DB` mapping object here — every
 * query in the API route and the UI reads through it, so there is a single
 * source of truth to reconcile with the actual SQL.
 *
 * Existing tables used: innings, overs, ball_by_ball, match_events.
 * NOT used: match_innings, balls (per instructions).
 */

import type { DismissalType } from "@/types";

// ---------------------------------------------------------------------------
// DB column mapping (single source of truth for existing schema)
// ---------------------------------------------------------------------------

export const DB = {
  TABLES: {
    matches: "matches",
    tournaments: "tournaments",
    teams: "teams",
    players: "players",
    innings: "innings",
    overs: "overs",
    ballByBall: "ball_by_ball",
    matchEvents: "match_events",
  },
  // ball_by_ball columns
  ball: {
    id: "id",
    inningsId: "innings_id",
    overNumber: "over_number",
    ballNumber: "ball_number",
    batsmanId: "batsman_id",
    bowlerId: "bowler_id",
    runs: "runs",
    extras: "extras",
    extrasType: "extras_type",
    isLegal: "is_legal",
    isWicket: "is_wicket",
    dismissalType: "dismissal_type",
    createdAt: "created_at",
  },
  // innings columns
  innings: {
    id: "id",
    matchId: "match_id",
    inningsNumber: "innings_number",
    battingTeamId: "batting_team_id",
    bowlingTeamId: "bowling_team_id",
    totalRuns: "total_runs",
    totalWickets: "total_wickets",
    oversCompleted: "overs_completed",
    ballsBowled: "balls_bowled",
    extras: "extras",
    target: "target",
    isCompleted: "is_completed",
    createdAt: "created_at",
  },
  // match_events columns
  matchEvent: {
    id: "id",
    matchId: "match_id",
    inningsId: "innings_id",
    eventType: "event_type",
    eventData: "event_data",
    createdAt: "created_at",
  },
} as const;

// ---------------------------------------------------------------------------
// Domain types for the scoring screen
// ---------------------------------------------------------------------------

export type ScoringActionType =
  | "run"
  | "wicket"
  | "wide"
  | "no_ball"
  | "bye"
  | "leg_bye"
  | "overthrow"
  | "undo";

export interface ScoringPayload {
  /** Type of action the admin performed. */
  action: ScoringActionType;
  /** Runs credited to the batter (for `run` actions: 0,1,2,3,4,6). */
  runs?: number;
  /** Batsman on strike for this delivery. */
  batsmanId?: string;
  /** Bowler delivering this ball. */
  bowlerId?: string;
  /** Dismissal method (for `wicket` actions). */
  dismissalType?: DismissalType;
  /** ID of the delivery to revert (for `undo`). */
  revertBallId?: string;
}

/** Raw `ball_by_ball` row shape (snake_case, matches existing DB schema). */
export interface BallEventRow {
  id: string;
  innings_id: string;
  over_number: number;
  ball_number: number;
  batsman_id: string;
  bowler_id: string;
  runs: number;
  extras: number;
  extras_type: string | null;
  is_legal: boolean;
  is_wicket: boolean;
  dismissal_type: DismissalType | null;
  created_at: string;
}

/** Raw `innings` row shape (snake_case, matches existing DB schema). */
export interface InningsRow {
  id: string;
  match_id: string;
  innings_number: 1 | 2;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  total_wickets: number;
  overs_completed: number;
  balls_bowled: number;
  extras: number;
  target: number | null;
  is_completed: boolean;
}

export interface TeamSummary {
  id: string;
  teamName: string;
}

export interface PlayerSummary {
  id: string;
  playerName: string;
}

export interface MatchScoringContext {
  matchId: string;
  tournamentName: string | null;
  teamA: TeamSummary;
  teamB: TeamSummary;
  innings: InningsRow | null;
  battingTeam: TeamSummary | null;
  bowlingTeam: TeamSummary | null;
  striker: PlayerSummary | null;
  bowler: PlayerSummary | null;
  recentBalls: BallEventRow[];
}
