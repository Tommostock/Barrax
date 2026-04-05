/* ============================================
   Supabase Server Client
   Used in server components, API routes, and middleware.
   Reads/writes auth cookies so the user stays logged in.
   ============================================ */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create a Supabase client for use on the server.
// This needs access to cookies to manage the user's auth session.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Get all cookies from the request
        getAll() {
          return cookieStore.getAll();
        },
        // Set cookies on the response (for auth token refresh etc.)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can fail in Server Components where you can't set cookies.
            // That's fine — the middleware will handle refreshing the session.
          }
        },
      },
    }
  );
}
