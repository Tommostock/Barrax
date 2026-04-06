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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check your .env.local file or Vercel environment variables."
    );
  }

  return createBrowserClient(url, key);
}
