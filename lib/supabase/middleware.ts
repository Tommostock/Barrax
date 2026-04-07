/* ============================================
   Supabase Auth Middleware
   Refreshes the user's auth session on every request.
   Redirects unauthenticated users to the sign-in page.
   ============================================ */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/auth/sign-in", "/auth/sign-up", "/auth/callback", "/auth/forgot-password", "/auth/reset-password"];

export async function updateSession(request: NextRequest) {
  // Start with a basic response that passes through the request
  let supabaseResponse = NextResponse.next({ request });

  // Create a Supabase client that can read and write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Also set cookies on the response (for the browser)
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is critical for keeping the user logged in.
  // Do NOT remove this getUser() call even if it looks unused.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow public routes through without auth check
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // If the user is not logged in and trying to access a protected route,
  // redirect them to the sign-in page
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
