/* ============================================
   useBackNav
   Shared hook for back-button handlers that prefer
   the real browser back stack over a hardcoded
   fallback route.

   Rationale: most back buttons in the app used to
   push a fixed href (e.g. "/intel"). That meant if
   a user arrived at a page via a link from elsewhere
   and tapped back, they were teleported to the
   route's "parent" rather than the page they just
   came from. This hook returns a click handler that
   pops the history when there's something to pop,
   and only falls back to the fixed href on a fresh
   landing (shared link, new tab, etc).
   ============================================ */

"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function useBackNav(fallbackHref?: string) {
  const router = useRouter();

  return useCallback(() => {
    // window.history.length === 1 on a fresh tab/landing.
    // Anything > 1 means the user navigated here from
    // somewhere within the session, so honour that history.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fallbackHref) router.push(fallbackHref);
  }, [router, fallbackHref]);
}
