/**
 * Service layer foundation.
 *
 * Centralises Supabase data-access patterns so feature modules never
 * write ad-hoc queries in components (avoids duplicated DB logic per BRD 12).
 *
 * Concrete per-table services (teams, players, matches, scoring, …) will
 * be added in later phases and import these shared helpers.
 */

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientMode = "browser" | "server";

/** Returns the appropriate Supabase client for the current runtime. */
export async function getSupabase(
  mode: ClientMode = "browser",
): Promise<SupabaseClient> {
  return mode === "server" ? createClient() : createClient();
}
