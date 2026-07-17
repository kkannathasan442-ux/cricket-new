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
    ballByBall: "ball_by_ball",
    battingScorecard: "batting_scorecard",
    bowlingScorecard: "bowling_scorecard",
    playerStats: "player_stats",
    pointsTable: "points_table",
    matchEvents: "match_events",
    playingXi: "playing_xi",
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
  // batting_scorecard columns
  batting: {
    id: "id",
    inningsId: "innings_id",
    playerId: "player_id",
    runs: "runs",
    ballsFaced: "balls_faced",
    fours: "fours",
    sixes: "sixes",
    isOut: "is_out",
    dismissalType: "dismissal_type",
    retiredHurt: "retired_hurt",
    strike: "strike",
  },
  // bowling_scorecard columns
  bowling: {
    id: "id",
    inningsId: "innings_id",
    playerId: "player_id",
    overs: "overs",
    ballsBowled: "balls_bowled",
    runsConceded: "runs_conceded",
    wickets: "wickets",
    wides: "wides",
    noBalls: "no_balls",
  },
  // player_stats columns (lifetime aggregates)
  playerStats: {
    id: "id",
    playerId: "player_id",
    matches: "matches",
    runs: "runs",
    ballsFaced: "balls_faced",
    fours: "fours",
    sixes: "sixes",
    fifties: "fifties",
    hundreds: "hundreds",
    wickets: "wickets",
    ballsBowled: "balls_bowled",
    runsConceded: "runs_conceded",
    motmAwards: "motm_awards",
    updatedAt: "updated_at",
  },
  // points_table columns
  pointsTable: {
    id: "id",
    tournamentId: "tournament_id",
    teamId: "team_id",
    played: "played",
    won: "won",
    lost: "lost",
    tied: "tied",
    noResult: "no_result",
    points: "points",
    nrr: "nrr",
    rank: "rank",
  },
  // playing_xi columns (normalized many-to-many: match-team -> players)
  playingXi: {
    id: "id",
    matchId: "match_id",
    teamId: "team_id",
    playerId: "player_id",
    isPlaying: "is_playing",
    jerseyNumber: "jersey_number",
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
  | "wide"
  | "no_ball"
  | "bye"
  | "leg_bye"
  | "overthrow"
  | "wicket"
  | "end_innings"
  | "undo";

export interface ScoringPayload {
  /** Type of action the admin performed. */
  action: ScoringActionType;
  /** Runs credited to the batter (for `run` actions: 0,1,2,3,4,6). */
  runs?: number;
  /** Batsman on strike for this delivery. */
  batsmanId?: string;
  /** Non-striker (for wickets where partner may be involved, optional). */
  nonStrikerId?: string;
  /** Bowler delivering this ball. */
  bowlerId?: string;
  /** Dismissal method (for `wicket` actions). */
  dismissalType?: DismissalType;
  /** Next batsman to send in after a wicket (for `wicket` action). */
  nextBatsmanId?: string;
  /** New bowler for the next over (for over-completion bowler change). */
  nextBowlerId?: string;
}

/** Batting scorecard row (snake_case to match existing schema). */
export interface BattingScorecardRow {
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
  strike: 1 | 2 | null;
}

/** Bowling scorecard row (snake_case to match existing schema). */
export interface BowlingScorecardRow {
  id: string;
  innings_id: string;
  player_id: string;
  overs: number;
  balls_bowled: number;
  runs_conceded: number;
  wickets: number;
  wides: number;
  no_balls: number;
}

/** Player lifetime stats row. */
export interface PlayerStatsRow {
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

/** Points table row. */
export interface PointsTableRow {
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

/** Match result computed by the result engine. */
export interface MatchResult {
  resultType: "win_by_runs" | "win_by_wickets" | "tie" | "no_result";
  winnerId: string | null;
  margin: number | null;
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

/** Full context supplied to the admin score page + public scoreboard. */
export interface MatchScoringContext {
  matchId: string;
  tournamentId: string | null;
  tournamentName: string | null;
  teamA: TeamSummary;
  teamB: TeamSummary;
  innings: InningsRow | null;
  inningsList: InningsRow[];
  battingTeam: TeamSummary | null;
  bowlingTeam: TeamSummary | null;
  striker: PlayerSummary | null;
  bowler: PlayerSummary | null;
  recentBalls: BallEventRow[];
  playingXi: PlayingXiRow[];
  matchStarted: boolean;
}

/** Player listing used by modals (selection dropdowns). */
export interface PlayerOption {
  id: string;
  playerName: string;
  role: string;
}

/** Raw `playing_xi` row (normalized match-team -> player selection). */
export interface PlayingXiRow {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_playing: boolean;
  jersey_number: number | null;
  created_at: string;
}

/** Match start configuration produced by the Match Start Wizard. */
export interface MatchStartConfig {
  tossWinnerId: string;
  tossDecision: "bat" | "bowl";
  teamAPlayers: string[];
  teamBPlayers: string[];
  openingBatsmen: { teamId: string; strikerId: string; nonStrikerId: string };
  openingBowlerId: string;
}
