/* ============================================
   AuthGuard Component
   Client-side auth check that replaces middleware.
   Checks if the user has a Supabase session.
   If not, redirects to /auth/sign-in.
   Runs once on mount — does NOT block navigation
   between tabs (which was causing "page couldn't load").
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/sign-in");
      } else {
        setChecked(true);
      }
    }
    checkAuth();

    // Also listen for sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/sign-in");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Show nothing until auth is confirmed (prevents flash of protected content)
  if (!checked) {
    return (
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center">
        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
