/* ============================================
   Supabase Auth Middleware
   Checks auth session on each request and redirects
   unauthenticated users to sign-in.

   Uses getSession() (local cookie read) instead of
   getUser() (network call to Supabase) for speed.
   This prevents "page couldn't load" errors on slow
   mobile connections where the network call times out.
   ============================================ */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/auth/sign-in", "/auth/sign-up", "/auth/callback", "/auth/forgot-password", "/auth/reset-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Allow public routes through immediately — no auth check needed
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  try {
    // Use getSession() instead of getUser() — reads from the cookie
    // locally without making a network call to Supabase. This is
    // much faster and won't fail on slow mobile connections.
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // No session cookie — redirect to sign-in
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      return NextResponse.redirect(url);
    }
  } catch {
    // If auth check fails for any reason (network error, cookie issue),
    // let the request through rather than showing "page couldn't load".
    // The page's own auth check will handle the redirect if needed.
  }

  return supabaseResponse;
}
