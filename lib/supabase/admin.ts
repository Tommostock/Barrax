/* ============================================
   Supabase Admin Client (service role)
   ----------------------------------------------
   This client uses the SERVICE_ROLE key and bypasses Row
   Level Security. Use it ONLY in server routes that
   authenticate the caller through some other means
   (e.g. the widget_tokens table for the widget API).

   NEVER import this from a client component. The service
   role key would leak into the browser bundle.
   ============================================ */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdXd5cWJ1aWZnenV2cHV6a3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQxOTc1NSwiZXhwIjoyMDkwOTk1NzU1fQ.Wamw_dhZXo4ccGhSL88P2VjdrefkSHcuoWdkAqvxIxY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add SUPABASE_SERVICE_ROLE_KEY to .env.local / Vercel env vars."
    );
  }

  // Disable session persistence -- there's no user here, just a service
  // role. Don't auto-refresh tokens either; the service key is static.
  cached = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
