/**
 * CrickPulse — Global constants & configuration values.
 * Centralised so magic strings/numbers stay consistent across the app.
 */

export const APP_NAME = "CrickPulse";
export const APP_TAGLINE = "Real-time cricket scoring for the grassroots game";

/** Points awarded per match outcome (see BRD 6.7). */
export const POINTS = {
  win: 2,
  loss: 0,
  tie: 1,
  noResult: 1,
} as const;

/** Maximum teams a tournament can hold by default. */
export const DEFAULT_TOURNAMENT_MAX_TEAMS = 16;

/** Default overs per match. */
export const DEFAULT_OVERS_PER_MATCH = 20;

/** Legal runs selectable during live scoring (BRD 6.5). */
export const RUN_OPTIONS = [0, 1, 2, 3, 4, 6] as const;

/** Player roles (BRD 6.2). */
export const PLAYER_ROLES = [
  "batsman",
  "bowler",
  "all-rounder",
  "wicket-keeper",
] as const;

/** Tournament statuses. */
export const TOURNAMENT_STATUSES = [
  "upcoming",
  "ongoing",
  "completed",
  "archived",
] as const;

/** Match statuses. */
export const MATCH_STATUSES = [
  "scheduled",
  "live",
  "completed",
  "abandoned",
] as const;

/** Bottom navigation items (mobile-first UX). */
export const BOTTOM_NAV_ITEMS = [
  { key: "home", label: "Home", href: "/", icon: "Home" },
  { key: "matches", label: "Matches", href: "/matches", icon: "Activity" },
  {
    key: "tournaments",
    label: "Tournaments",
    href: "/tournaments",
    icon: "Trophy",
  },
  { key: "stats", label: "Stats", href: "/stats", icon: "BarChart3" },
  { key: "profile", label: "Profile", href: "/profile", icon: "User" },
] as const;

/** Routes that require an authenticated session. */
export const ADMIN_ROUTES = ["/admin"] as const;

/** Platform user roles (Phase 7 auth). */
export const USER_ROLES = ["admin", "scorer", "viewer"] as const;

/** Storage buckets used by the platform. */
export const STORAGE_BUCKETS = {
  teamLogos: "team-logos",
  playerPhotos: "player-photos",
  tournamentBanners: "tournament-banners",
} as const;
