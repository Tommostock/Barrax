/* ============================================
   Supabase Browser Client
   Used in client components (anything with "use client").
   Creates a single Supabase instance for the browser.
   ============================================ */

import { createBrowserClient } from "@supabase/ssr";

// Create a Supabase client for use in the browser.
// This reads the public env vars (NEXT_PUBLIC_*) which are
// safe to expose to the client — they only have anon-level access.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
