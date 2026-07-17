# Active Context: CrickPulse — Phase 5 Public Consumption

## Current State

**Project**: CrickPulse — real-time cricket live scoring + tournament management platform (mobile-first, comparable to CricHeroes grassroots scoring).

**Phase**: Phase 5 — Tournament Management & Public Consumption (in progress).

The codebase has a fully functional scoring engine (Phase 4) with match start wizard, playing XI selection, full cricket rules, scorecards, player stats, and points table. Phase 5 adds the public-facing and admin-facing data layers that make the platform consumable.

## Recently Completed

- [x] Installed deps: @supabase/supabase-js, @supabase/ssr, framer-motion, next-themes, sonner, lucide-react, cva, clsx, tailwind-merge, tw-animate-css, Radix slot/dialog/dropdown/toast
- [x] Tailwind v4 dark/neon theme tokens in globals.css
- [x] ShadCN setup (components.json + ui/: button, card, badge, skeleton, sheet, container, sonner; barrel index.ts)
- [x] Supabase clients: browser (client.ts), server (server.ts w/ cookies), admin/service-role (admin.ts), proxy/session refresh (middleware.ts), env validation (env.ts)
- [x] Providers: ThemeProvider (next-themes, default dark) + Sonner Toaster
- [x] Root layout: PWA metadata, viewport, manifest, themeColor, providers
- [x] Layout components: Header, MobileBottomNav (bottom 5-tab), Sidebar (admin md+)
- [x] Common components: Loading, ErrorState, EmptyState, PageShell (+ barrel)
- [x] Route groups: (public) [matches, tournaments, stats, profile], (auth) [login, register], (admin) [dashboard], root / with loading/error/not-found
- [x] Types (src/types), constants (src/constants), services base (src/services), feature modules (auth/teams/players/tournaments/matches/scoring/stats), hooks (useMediaQuery, useRealtimeSubscription)
- [x] DB schema planning location: src/database/schema-plan.sql
- [x] PWA: manifest.webmanifest + placeholder icons
- [x] typecheck + lint + next build all pass
- [x] Admin score page: `src/app/(admin)/matches/[id]/score/page.tsx`
- [x] ScoreControls component: `src/components/admin/scoring/ScoreControls.tsx` (run +1/+2/+3/+4/+6, Wicket, Undo; scoreboard w/ score/wickets/overs/batsman/bowler)
- [x] Scoring API: `src/app/api/match/[id]/score/route.ts` (POST; inserts ball_by_ball, updates innings totals, match_events)
- [x] Scoring feature module: types + DB column mapping (`src/features/scoring/index.ts`), service (`service.ts`), engine (`engine.ts`)
- [x] Uses EXISTING tables only: innings, overs, ball_by_ball, match_events. NO new match_innings/balls tables.
- [x] Realtime intentionally NOT used (normal API + router.refresh state updates per instructions)
- [x] All delivery types: dot, runs (0/1/2/3/4/6), wide, no-ball, bye, leg-bye, overthrow, wicket
- [x] Legal/illegal ball counting (only legal balls advance over) in `rules.ts`
- [x] Automatic strike rotation (odd runs) + over completion detection
- [x] Bowler-change modal after each over; Next-batsman modal after wicket (SelectionModal)
- [x] End-innings flow: completes innings, computes target, auto-starts 2nd innings (`innings.ts`)
- [x] Match result engine: win_by_runs / win_by_wickets / tie / no_result (`resolveMatchResult`)
- [x] Batting + bowling scorecard upserts + player lifetime stats (`player_stats`) on every ball + undo
- [x] Tournament points table update (win=2, loss=0, tie/no-result=1) on finalize
- [x] Transaction helper (`transaction.ts`) via `crickpulse_transaction` RPC w/ sequential fallback
- [x] Public live scoreboard with Supabase Realtime (no refresh) + `/api/match/[id]/scoreboard` GET
- [x] Centralized `DB` mapping extended to scorecards/player_stats/points_table
- [x] Match Start Wizard (`MatchStartWizard.tsx`) — toss, Playing XI, openers
- [x] Playing XI service (`playing-xi.ts`) — persists XI per match
- [x] Tournament statistics service (`stats.ts`) — Orange Cap, Purple Cap, MVP leaderboards
- [x] Admin dashboard with real counts (matches, tournaments, teams, players, live matches)
- [x] Public match listing (`/matches`) with server-side data fetching
- [x] Public tournament listing (`/tournaments`) with server-side data fetching
- [x] Public stats page (`/stats`) with Orange Cap, Purple Cap, MVP leaderboards
- [x] API routes: `GET /api/matches`, `GET /api/tournaments`

## Current Focus

Public consumption layer is complete. The app now has real server-rendered public pages and an admin dashboard with live counts. Awaiting Phase 6: Team/Player/Tournament CRUD pages, match creation/scheduling, and auth integration.

## Important Notes

- Build uses system fonts (no Google Fonts fetch) because sandbox has no network. If fonts needed later, self-host or enable TLS certs.
- Next 16 uses `src/proxy.ts` (not middleware.ts) for session refresh — convention renamed.
- Supabase env vars fall back to "" in dev for type-safety; production now warns (no throw at import) so dynamic route build/collection succeeds.
- `007_live_scoring.sql` still NOT present. `DB` mapping in `src/features/scoring/index.ts` is the assumed contract. Reconcile before connecting a live DB.
- `crickpulse_transaction` RPC must be created in DB for true atomic transactions (falls back to sequential writes otherwise).
- `players` table has no team linkage, so modals list all players (filter by playing-XI when available).
- Fixed duplicate type declarations in `src/features/scoring/index.ts` (BallEventRow, InningsRow, TeamSummary were declared twice).

## Session History

| Date | Changes |
|------|---------|
| 2026-07-17 | Phase 1 foundation: full project architecture scaffold built & verified (typecheck/lint/build green) |
| 2026-07-17 | Scoring MVP: admin score page, ScoreControls, scoring API, feature module w/ existing-table mapping |
| 2026-07-17 | Phase 4: full cricket rules engine, scorecards, player stats, points table, realtime public scoreboard |
| 2026-07-17 | Phase 5: fixed duplicate types, public match/tournament/stats pages with real data, admin dashboard with live counts, API routes |
