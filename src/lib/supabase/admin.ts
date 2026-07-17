import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Privileged server-side Supabase client using the service role key.
 * BYPASSES Row Level Security.
 * Use ONLY in trusted server contexts (e.g. webhooks, admin scripts).
 * NEVER import this from a Client Component.
 */
export function createServiceClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
