-- ============================================================================
-- CrickPulse — Core Schema (Phase 8 / Production)
-- ============================================================================
-- Creates every table consumed by the application. This is the canonical
-- DDL that the prior rls-policies.sql / auth-profiles.sql assume exists.
-- Apply BEFORE the RLS and auth migrations (or together in one transaction).
--
-- Tables:
--   teams, players, tournaments, tournament_teams,
--   matches, innings, ball_by_ball, match_events,
--   batting_scorecard, bowling_scorecard, player_stats,
--   points_table, playing_xi, awards
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Reference / registry tables
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  logo_url text,
  owner_name text not null,
  owner_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  photo_url text,
  role text not null check (role in ('batsman','bowler','all-rounder','wicket-keeper')),
  jersey_name text,
  jersey_number int,
  contact_number text,
  team_id uuid references public.teams (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  tournament_name text not null,
  overs_per_match int not null default 20,
  max_teams int not null default 8,
  players_per_team int not null default 11,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming'
    check (status in ('upcoming','ongoing','completed','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

-- ---------------------------------------------------------------------------
-- Matches + scoring
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments (id) on delete set null,
  team_a_id uuid not null references public.teams (id) on delete restrict,
  team_b_id uuid not null references public.teams (id) on delete restrict,
  ground text,
  match_date date,
  match_time text,
  status text not null default 'scheduled'
    check (status in ('scheduled','live','completed','abandoned')),
  toss_winner_id uuid references public.teams (id) on delete set null,
  toss_decision text check (toss_decision in ('bat','bowl')),
  result_type text,
  winner_id uuid references public.teams (id) on delete set null,
  overs_per_match int not null default 20,
  created_at timestamptz not null default now()
);

create table if not exists public.innings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  innings_number int not null check (innings_number in (1, 2)),
  batting_team_id uuid not null references public.teams (id) on delete restrict,
  bowling_team_id uuid not null references public.teams (id) on delete restrict,
  total_runs int not null default 0,
  total_wickets int not null default 0,
  overs_completed numeric not null default 0,
  balls_bowled int not null default 0,
  extras int not null default 0,
  target int,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (match_id, innings_number)
);

create table if not exists public.ball_by_ball (
  id uuid primary key default gen_random_uuid(),
  innings_id uuid not null references public.innings (id) on delete cascade,
  over_number int not null,
  ball_number int not null,
  batsman_id uuid references public.players (id) on delete set null,
  bowler_id uuid references public.players (id) on delete set null,
  runs int not null default 0,
  extras int not null default 0,
  extras_type text check (
    extras_type is null or extras_type in ('wide','no_ball','bye','leg_bye','overthrow')
  ),
  is_legal boolean not null default true,
  is_wicket boolean not null default false,
  dismissal_type text check (
    dismissal_type is null or dismissal_type in
    ('bowled','caught','lbw','run_out','stumped','hit_wicket','obstructing_field')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  innings_id uuid references public.innings (id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Scorecards
-- ---------------------------------------------------------------------------
create table if not exists public.batting_scorecard (
  id uuid primary key default gen_random_uuid(),
  innings_id uuid not null references public.innings (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  runs int not null default 0,
  balls_faced int not null default 0,
  fours int not null default 0,
  sixes int not null default 0,
  is_out boolean not null default false,
  dismissal_type text check (
    dismissal_type is null or dismissal_type in
    ('bowled','caught','lbw','run_out','stumped','hit_wicket','obstructing_field')
  ),
  retired_hurt boolean not null default false,
  strike int check (strike is null or strike in (1, 2)),
  unique (innings_id, player_id)
);

create table if not exists public.bowling_scorecard (
  id uuid primary key default gen_random_uuid(),
  innings_id uuid not null references public.innings (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  overs numeric not null default 0,
  balls_bowled int not null default 0,
  runs_conceded int not null default 0,
  wickets int not null default 0,
  wides int not null default 0,
  no_balls int not null default 0,
  unique (innings_id, player_id)
);

-- ---------------------------------------------------------------------------
-- Aggregates
-- ---------------------------------------------------------------------------
create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  matches int not null default 0,
  runs int not null default 0,
  balls_faced int not null default 0,
  fours int not null default 0,
  sixes int not null default 0,
  fifties int not null default 0,
  hundreds int not null default 0,
  wickets int not null default 0,
  balls_bowled int not null default 0,
  runs_conceded int not null default 0,
  motm_awards int not null default 0,
  updated_at timestamptz not null default now(),
  unique (player_id)
);

create table if not exists public.points_table (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  played int not null default 0,
  won int not null default 0,
  lost int not null default 0,
  tied int not null default 0,
  no_result int not null default 0,
  points int not null default 0,
  nrr numeric not null default 0,
  rank int not null default 0,
  unique (tournament_id, team_id)
);

create table if not exists public.playing_xi (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete restrict,
  player_id uuid not null references public.players (id) on delete restrict,
  is_playing boolean not null default true,
  jersey_number int,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  award_type text not null check (
    award_type in ('man_of_series','best_batter','best_bowler','mvp')
  ),
  player_id uuid not null references public.players (id) on delete restrict,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (query + realtime performance)
-- ---------------------------------------------------------------------------
create index if not exists idx_teams_name on public.teams (team_name);
create index if not exists idx_players_team on public.players (team_id);
create index if not exists idx_tournaments_status on public.tournaments (status);
create index if not exists idx_tournament_teams_tournament
  on public.tournament_teams (tournament_id);
create index if not exists idx_tournament_teams_team
  on public.tournament_teams (team_id);
create index if not exists idx_matches_tournament on public.matches (tournament_id);
create index if not exists idx_matches_status on public.matches (status);
create index if not exists idx_matches_date on public.matches (match_date desc);
create index if not exists idx_innings_match
  on public.innings (match_id, innings_number);
create index if not exists idx_ball_by_ball_innings_created
  on public.ball_by_ball (innings_id, created_at desc);
create index if not exists idx_match_events_match
  on public.match_events (match_id, created_at desc);
create index if not exists idx_batting_scorecard_innings
  on public.batting_scorecard (innings_id);
create index if not exists idx_bowling_scorecard_innings
  on public.bowling_scorecard (innings_id);
create index if not exists idx_player_stats_runs on public.player_stats (runs desc);
create index if not exists idx_points_table_tournament
  on public.points_table (tournament_id, points desc);
create index if not exists idx_playing_xi_match on public.playing_xi (match_id);
create index if not exists idx_awards_tournament on public.awards (tournament_id);
