# Active Context: CrickPulse — Phase 1 Foundation

## Current State

**Project**: CrickPulse — real-time cricket live scoring + tournament management platform (mobile-first, comparable to CricHeroes grassroots scoring).

**Phase**: Phase 1 — Project Foundation Architecture (complete).

The codebase is a scalable Next.js scaffold with dark sports/neon theme, Supabase integration, ShadCN-style UI, PWA base, and route groups for auth/admin/public. No cricket business logic is implemented yet (by design — Phase 1 only).

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

## Current Focus

Foundation is complete. Awaiting Phase 2: Tournament system, Team/Player modules, database tables + RLS.

## Important Notes

- Build uses system fonts (no Google Fonts fetch) because sandbox has no network. If fonts needed later, self-host or enable TLS certs.
- Next 16 uses `src/proxy.ts` (not middleware.ts) for session refresh — convention renamed.
- Supabase env vars fall back to "" in dev for type-safety; production now warns (no throw at import) so dynamic route build/collection succeeds.

## Recently Completed (Scoring MVP)

- [x] Admin score page: `src/app/(admin)/matches/[id]/score/page.tsx`
- [x] ScoreControls component: `src/components/admin/scoring/ScoreControls.tsx` (run +1/+2/+3/+4/+6, Wicket, Undo; scoreboard w/ score/wickets/overs/batsman/bowler)
- [x] Scoring API: `src/app/api/match/[id]/score/route.ts` (POST; inserts ball_by_ball, updates innings totals, match_events)
- [x] Scoring feature module: types + DB column mapping (`src/features/scoring/index.ts`), service (`service.ts`), engine (`engine.ts`)
- [x] Uses EXISTING tables only: innings, overs, ball_by_ball, match_events. NO new match_innings/balls tables.
- [x] Realtime intentionally NOT used (normal API + router.refresh state updates per instructions)

## Open Issue / Assumption

- `007_live_scoring.sql` was NOT present in the repo. Column mapping in `src/features/scoring/index.ts` `DB` object is the assumed contract for the existing tables. Reconcile `DB` mapping with the real migration before connecting a live DB.

## Session History

| Date | Changes |
|------|---------|
| 2026-07-17 | Phase 1 foundation: full project architecture scaffold built & verified (typecheck/lint/build green) |
| 2026-07-17 | Scoring MVP: admin score page, ScoreControls, scoring API, feature module w/ existing-table mapping |
