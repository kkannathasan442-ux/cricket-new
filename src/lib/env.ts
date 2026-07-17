/**
 * Centralised, validated access to Supabase environment variables.
 * Failing early here prevents runtime errors deep in the app.
 */

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missingPublic = !rawSupabaseUrl || !rawSupabaseAnonKey;

// In production, public Supabase vars MUST be present.
if (missingPublic && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check your environment variables.",
  );
}

/**
 * Non-undefined exports for type-safety in client factories.
 * During local dev without a real project these fall back to empty strings
 * so the app still type-checks and boots; real values are required in prod.
 */
export const SUPABASE_URL: string = rawSupabaseUrl ?? "";
export const SUPABASE_ANON_KEY: string = rawSupabaseAnonKey ?? "";
export const SUPABASE_SERVICE_ROLE_KEY: string = rawServiceRoleKey ?? "";
