/**
 * Feature: Authentication (Supabase Auth).
 * Auth UI flows + API guards + role helpers.
 */
export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  callback: "/auth/callback",
  logout: "/auth/logout",
} as const;

/** Routes that require an authenticated (any role) session. */
export const PROTECTED_PAGE_PREFIXES = [
  "/admin",
  "/profile",
] as const;

/** API route prefixes that require an authenticated session. */
export const PROTECTED_API_PREFIXES = [
  "/api/match",
  "/api/teams",
  "/api/players",
  "/api/tournaments",
] as const;

/** Role definitions (Phase 7). */
export const ROLE_PERMISSIONS = {
  admin: {
    label: "Admin",
    can: ["read", "write", "manage_users", "start_match", "live_score", "end_innings", "finish_match"],
  },
  scorer: {
    label: "Scorer",
    can: ["read", "start_match", "live_score", "end_innings", "finish_match"],
  },
  viewer: {
    label: "Viewer",
    can: ["read"],
  },
} as const;
