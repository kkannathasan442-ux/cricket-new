# Active Context: CrickPulse — Phase 7 Authentication & Authorization

## Current State

**Project**: CrickPulse — real-time cricket live scoring + tournament management platform (mobile-first, comparable to CricHeroes grassroots scoring).

**Phase**: Phase 7 — Authentication & Authorization (complete; verified typecheck/lint/build green).

The codebase has a fully functional scoring engine (Phase 4) with match start wizard, playing XI selection, full cricket rules, scorecards, player stats, and points table. Phase 5 adds the public-facing and admin-facing data layers that make the platform consumable.

## Recently Completed

- [x] **Phase 7 Auth**: Email+password auth via Supabase, Next.js middleware route protection + role gating, API guards (requireUser/requireRole), 3 roles (admin/scorer/viewer)
- [x] Replaced `src/proxy.ts` session-refresh stub with real `src/middleware.ts` (auth redirect + admin role gate + 401 on protected APIs)
- [x] Auth helpers: `src/features/auth/guards.ts` (getServerUser/requireUser/requireRole), `src/features/auth/profile.ts` (getUserRole/ensureProfile), `src/features/auth/index.ts` (routes + role permissions)
- [x] Protected API routes: players, teams, tournaments (GET all roles, writes admin/scorer), match start/score (admin/scorer), scoreboard (all), upload (admin/scorer)
- [x] Login page wired with signInWithPassword + friendly error handling + redirect param
- [x] Register page wired with signUp + profile creation
- [x] Profile page (server component): name, email, role badge, sign-out button
- [x] Logout route `src/app/auth/logout/route.ts` (server signOut + cookie clear + redirect)
- [x] Sidebar "Sign out" links to /auth/logout; admin layout adds server-side defense-in-depth role check
- [x] DB migration `src/database/auth-profiles.sql`: profiles table, RLS, new-user trigger → default role 'viewer'
- [x] UserRole type updated to "admin" | "scorer" | "viewer"
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

Phase 7 complete. Auth (Supabase email/password), middleware-based route protection, role-based access (admin/scorer/viewer), and API guards are all in place. All protected routes return 401/403 appropriately.

## Important Notes

- Next.js middleware is now `src/middleware.ts` (the prior `src/proxy.ts` / `src/lib/supabase/middleware.ts` were removed — the session-refresh logic lives in `src/middleware.ts`).
- Roles are stored in `public.profiles.role`; resolved server-side via the service-role client (`getUserRole`). New users default to `viewer` via the `on_auth_user_created` trigger.
- API services still use the service-role client for DB writes, so RLS does not gate them — authorization is enforced at the API route level via `requireRole`. This is intentional per the existing architecture.
- Scoring engine untouched (no schema changes to scoring tables).
- Supabase env vars fall back to "" in dev; production warns if missing. The "Missing NEXT_PUBLIC_SUPABASE_URL" build warning is expected in the sandbox.
- Phase 8 production hardening complete: full core schema DDL + transaction RPC + sitemap/robots + valid PWA icons + error-monitoring integration point + hardened uploads + OG metadata.

## Current Focus

Phase 8 complete. Production readiness: DB migrations generated for every table the app uses, SEO/sitemap/robots in place, PWA icons valid, security headers + upload validation hardened, error-monitoring hook prepared.

## Session History

| Date | Changes |
|------|---------|
| 2026-07-17 | Phase 1 foundation: full project architecture scaffold built & verified (typecheck/lint/build green) |
| 2026-07-17 | Scoring MVP: admin score page, ScoreControls, scoring API, feature module w/ existing-table mapping |
| 2026-07-17 | Phase 4: full cricket rules engine, scorecards, player stats, points table, realtime public scoreboard |
| 2026-07-17 | Phase 5: fixed duplicate types, public match/tournament/stats pages with real data, admin dashboard with live counts, API routes |
| 2026-07-17 | Phase 7: Supabase email/password auth, middleware route protection + role gating, API guards (401/403), login/register/profile pages, logout route, profiles table migration |
| 2026-07-17 | Phase 8: generated core schema DDL (14 tables) + transaction RPC, sitemap/robots, valid PWA icons, Sentry/Logtail instrumentation hook, hardened uploads, OG metadata; typecheck/lint/build green |
