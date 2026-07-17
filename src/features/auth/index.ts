/**
 * Feature: Authentication (Supabase Auth).
 * Foundation only — UI flows are built in later phases.
 */
export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  callback: "/auth/callback",
} as const;
