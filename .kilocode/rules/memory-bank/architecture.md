# System Patterns: CrickPulse

## Architecture Overview

```
src/
├── app/                          # Next.js App Router (route groups)
│   ├── layout.tsx               # Root: providers, PWA metadata, theme
│   ├── page.tsx                 # Landing / home
│   ├── globals.css              # Tailwind v4 + neon theme tokens
│   ├── (public)/                # No-login public browsing
│   │   ├── matches/             # Live matches (loading/error/not-found)
│   │   ├── tournaments/         # Tournament listings
│   │   ├── stats/               # Global player stats
│   │   └── profile/             # User profile
│   ├── (auth)/                  # login, register
│   └── (admin)/                 # admin dashboard (protected-ready)
├── components/
│   ├── ui/                      # ShadCN-style primitives + barrel
│   ├── layout/                  # Header, MobileBottomNav, Sidebar
│   └── common/                  # Loading, ErrorState, EmptyState, PageShell
├── features/                    # Domain modules (auth, teams, players,
│   │                            #   tournaments, matches, scoring, stats)
│   └── matches/components/      # LiveMatchesGrid (foundation placeholder)
├── lib/
│   ├── supabase/                # client, server, admin, middleware, env
│   └── utils.ts                 # cn() helper
├── hooks/                       # useMediaQuery, useRealtimeSubscription
├── services/                    # Data-access layer base (getSupabase)
├── types/                       # Canonical DB + domain types
├── constants/                   # App constants (nav, points, routes)
├── providers/                   # Providers (theme + toast)
└── database/                    # schema-plan.sql (DB planning artifact)
```

## Key Design Patterns

### 1. Route Groups (no URL prefix)
- `(public)` — public, no auth (matches, tournaments, stats, profile)
- `(auth)` — login/register, minimal chrome
- `(admin)` — protected shell (Sidebar + bottom nav); auth gate added Phase 2

### 2. Server Components by default
Components are RSC unless `"use client"` (nav, providers, realtime hook).

### 3. Supabase Client Strategy (BRD 11/12)
- `lib/supabase/client.ts` — browser singleton (anon key)
- `lib/supabase/server.ts` — server client w/ cookie passthrough
- `lib/supabase/admin.ts` — service-role (bypasses RLS; server-only)
- `lib/supabase/middleware.ts` — session refresh used by `src/proxy.ts`
- `lib/env.ts` — validated, non-undefined exports

### 4. Realtime (BRD 10/12)
- `useRealtimeSubscription` subscribes to ONE table only (avoid full-DB listeners)
- Planned realtime tables: ball_by_ball, innings, matches

### 5. UI / Theming
- Tailwind v4 with CSS variable tokens (`.dark` default via next-themes)
- Neon sports accents: `--neon`, `--neon-cyan`, `--neon-amber`, `--neon-pink`
- Mobile-first: fixed bottom nav, `pb-safe` safe-area, md+ sidebar

### 6. Single Source of Truth
- Types in `src/types`, constants in `src/constants`, data access in `src/services`
- Feature modules never write ad-hoc queries in components

## Conventions
- Components: PascalCase; pages/routes: lowercase; dirs: lowercase
- Aliases: `@/components`, `@/lib`, `@/hooks`, `@/features`
- No comments in code unless requested
