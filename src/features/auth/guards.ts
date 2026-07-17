import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/features/auth/profile";
import type { UserRole } from "@/types";

export interface AuthedUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Reads the session from the request cookies and resolves the user's role.
 * Returns `null` when there is no authenticated session.
 * Use for read-only checks; call `requireUser` / `requireRole` when you need
 * to short-circuit the request handler.
 */
export async function getServerUser(): Promise<AuthedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = await getUserRole(user.id);
  return {
    id: user.id,
    email: user.email ?? "",
    role,
  };
}

/**
 * Enforces an authenticated session. Returns the user, or a 401 response that
 * the calling route should return directly (`if (res) return res`).
 */
export async function requireUser(): Promise<
  AuthedUser | NextResponse<{ error: string }>
> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return user;
}

/**
 * Enforces an authenticated session AND one of the allowed roles.
 * Returns the user, or a 401/403 response to return directly.
 */
export async function requireRole(
  roles: UserRole[],
): Promise<AuthedUser | NextResponse<{ error: string }>> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!roles.includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions." },
      { status: 403 },
    );
  }
  return user;
}
