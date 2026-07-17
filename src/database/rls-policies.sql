-- ============================================================================
-- CrickPulse — Production RLS Policies
-- ============================================================================
-- Apply these policies in Supabase SQL Editor or via migration.
-- The app uses the service-role client for admin-trusted operations, so
-- RLS mainly protects against direct client-side misuse and documents the
-- intended access model.
--
-- Assumed schema: matches, teams, players, tournaments, tournament_teams,
-- innings, ball_by_ball, batting_scorecard, bowling_scorecard, player_stats,
-- points_table, match_events, playing_xi
-- ============================================================================

-- Enable RLS on all tables
alter table if exists public.matches enable row level security;
alter table if exists public.teams enable row level security;
alter table if exists public.players enable row level security;
alter table if exists public.tournaments enable row level security;
alter table if exists public.tournament_teams enable row level security;
alter table if exists public.innings enable row level security;
alter table if exists public.ball_by_ball enable row level security;
alter table if exists public.batting_scorecard enable row level security;
alter table if exists public.bowling_scorecard enable row level security;
alter table if exists public.player_stats enable row level security;
alter table if exists public.points_table enable row level security;
alter table if exists public.match_events enable row level security;
alter table if exists public.playing_xi enable row level security;

-- ---------------------------------------------------------------------------
-- matches: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "matches_read_public" on public.matches
  for select using (true);
create policy "matches_write_service" on public.matches
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- teams: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "teams_read_public" on public.teams
  for select using (true);
create policy "teams_write_service" on public.teams
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- players: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "players_read_public" on public.players
  for select using (true);
create policy "players_write_service" on public.players
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- tournaments: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "tournaments_read_public" on public.tournaments
  for select using (true);
create policy "tournaments_write_service" on public.tournaments
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- tournament_teams: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "tournament_teams_read_public" on public.tournament_teams
  for select using (true);
create policy "tournament_teams_write_service" on public.tournament_teams
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- innings: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "innings_read_public" on public.innings
  for select using (true);
create policy "innings_write_service" on public.innings
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- ball_by_ball: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "ball_by_ball_read_public" on public.ball_by_ball
  for select using (true);
create policy "ball_by_ball_write_service" on public.ball_by_ball
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- batting_scorecard: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "batting_scorecard_read_public" on public.batting_scorecard
  for select using (true);
create policy "batting_scorecard_write_service" on public.batting_scorecard
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- bowling_scorecard: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "bowling_scorecard_read_public" on public.bowling_scorecard
  for select using (true);
create policy "bowling_scorecard_write_service" on public.bowling_scorecard
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- player_stats: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "player_stats_read_public" on public.player_stats
  for select using (true);
create policy "player_stats_write_service" on public.player_stats
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- points_table: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "points_table_read_public" on public.points_table
  for select using (true);
create policy "points_table_write_service" on public.points_table
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- match_events: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "match_events_read_public" on public.match_events
  for select using (true);
create policy "match_events_write_service" on public.match_events
  for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- playing_xi: public read, service-role write
-- ---------------------------------------------------------------------------
create policy "playing_xi_read_public" on public.playing_xi
  for select using (true);
create policy "playing_xi_write_service" on public.playing_xi
  for all using (auth.role() = 'service_role');

-- ============================================================================
-- Recommended indexes for realtime + query performance
-- ============================================================================
create index if not exists idx_ball_by_ball_innings_created
  on public.ball_by_ball (innings_id, created_at desc);
create index if not exists idx_match_events_match
  on public.match_events (match_id, created_at desc);
create index if not exists idx_innings_match
  on public.innings (match_id, innings_number);
create index if not exists idx_batting_scorecard_innings
  on public.batting_scorecard (innings_id);
create index if not exists idx_bowling_scorecard_innings
  on public.bowling_scorecard (innings_id);
create index if not exists idx_playing_xi_match
  on public.playing_xi (match_id);
