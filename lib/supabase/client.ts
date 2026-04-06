/* ============================================
   Supabase Browser Client
   Used in client components (anything with "use client").
   Creates a single Supabase instance for the browser.
   ============================================ */

import { createBrowserClient } from "@supabase/ssr";

// Create a Supabase client for use in the browser.
// During build/prerender, env vars may not exist — return a
// dummy client that will be replaced on the real client render.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createBrowserClient(url, key);
}
