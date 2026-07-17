import { createServiceClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";

export const DEFAULT_ROLE: UserRole = "viewer";

interface ProfileRow {
  id: string;
  role: UserRole;
  display_name: string | null;
}

/**
 * Resolves a user's platform role from the `profiles` table.
 * Uses the service-role client (server-only) so it works regardless of RLS.
 * Falls back to `viewer` when no profile row exists yet.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return DEFAULT_ROLE;
    return (data as ProfileRow).role ?? DEFAULT_ROLE;
  } catch {
    return DEFAULT_ROLE;
  }
}

/**
 * Ensures a `profiles` row exists for the given user.
 * Called right after sign-up / first login so role lookups never fail.
 */
export async function ensureProfile(
  userId: string,
  email: string,
  displayName?: string | null,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role: DEFAULT_ROLE,
        display_name: displayName ?? email.split("@")[0] ?? null,
        email,
      },
      { onConflict: "id" },
    );
}
