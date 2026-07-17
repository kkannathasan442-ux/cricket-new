import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { getUserRole } from "@/features/auth/profile";
import type { UserRole } from "@/types";

/**
 * Next.js middleware entrypoint.
 *
 * Responsibilities:
 *  - Refresh the Supabase auth session on every request (so cookies stay fresh
 *    and survive page refreshes).
 *  - Redirect logged-out users away from protected pages/APIs to /login.
 *  - Gate admin pages behind the `admin` role.
 *  - Redirect already-authenticated users away from /login and /register.
 */

const PUBLIC_PATHS = ["/login", "/register", "/auth"];
const ADMIN_PAGE_PREFIX = "/admin";

function isProtectedApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/match") ||
    pathname.startsWith("/api/teams") ||
    pathname.startsWith("/api/players") ||
    pathname.startsWith("/api/tournaments")
  );
}

function isProtectedPage(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PAGE_PREFIX) || pathname === "/profile";
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public auth pages: if already logged in, send them to the dashboard.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) && user) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_PAGE_PREFIX;
    return NextResponse.redirect(url);
  }

  // Unauthenticated access to protected surfaces → /login.
  const isProtected = isProtectedPage(pathname) || isProtectedApi(pathname);
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    if (isProtectedApi(pathname)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Role gate for admin pages (any authenticated role may hit APIs per route;
  // the admin *UI* is restricted to admins only).
  if (user && pathname.startsWith(ADMIN_PAGE_PREFIX)) {
    const role = await getUserRole(user.id);
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/profile";
      url.searchParams.set("error", "admin_only");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.webmanifest (PWA assets)
     * - static assets with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
