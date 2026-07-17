# Technical Context: CrickPulse

## Technology Stack

| Technology        | Version | Purpose                                   |
| ----------------- | ------- | ----------------------------------------- |
| Next.js           | 16.x    | React framework, App Router               |
| React             | 19.x    | UI library                                |
| TypeScript        | 5.9.x   | Type-safe JavaScript (strict)             |
| Tailwind CSS      | 4.x     | Utility-first CSS, CSS-variable theming   |
| ShadCN (new-york) | —       | UI primitives (Radix + cva)               |
| Framer Motion     | 12.x    | Animations (dependency present, used later) |
| Supabase          | 2.x     | Postgres, Auth, Realtime, Storage         |
| @supabase/ssr     | 0.12.x  | Cookie-based SSR auth helpers             |
| next-themes       | 0.4.x   | Dark/light theme (default dark)           |
| sonner            | 2.x     | Toasts                                    |
| lucide-react      | 1.x     | Icons                                     |
| Bun               | 1.3.x   | Package manager & runtime                 |

## Commands

```bash
bun install        # Install dependencies
bun dev            # Dev server (auto-managed by sandbox)
bun build          # Production build (next build)
bun start          # Start production server
bun lint           # ESLint
bun typecheck      # tsc --noEmit
```

## Configuration

- `next.config.ts` — reactStrictMode, security headers, proxy matcher
- `tsconfig.json` — strict, path alias `@/*` → `src/*`, jsx react-jsx (auto-managed)
- `postcss.config.mjs` — `@tailwindcss/postcss`
- `components.json` — shadcn new-york, alias `@/components`, `@/lib`, `@/hooks`, `@/ui`
- `src/proxy.ts` — session refresh (Next 16 `proxy` convention, replaces middleware)

## Environment Variables (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Dependencies (added in Phase 1)

Production: @supabase/supabase-js, @supabase/ssr, framer-motion, next-themes, sonner, lucide-react, class-variance-authority, clsx, tailwind-merge, tw-animate-css, @radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-toast

## Key Constraints

- Build is offline-safe (system fonts, no Google Fonts fetch in sandbox)
- Supabase clients separated: browser / server / admin(service-role)
- No cricket business logic in Phase 1
- Mobile-first; theme default = dark sports/neon
