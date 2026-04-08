/* ============================================
   Error Boundary
   Catches any rendering/navigation errors and shows
   a retry screen instead of Chrome's "page couldn't
   load" error. This is the key fix for the tab
   switching crash on mobile.
   ============================================ */

"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center px-6 text-center">
      <AlertTriangle size={32} className="text-xp-gold mb-4" />
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand mb-2">
        CONNECTION LOST
      </h2>
      <p className="text-xs text-text-secondary mb-6 max-w-xs">
        The page failed to load. This usually happens on an unstable connection. Tap below to try again.
      </p>
      <div className="space-y-3 w-full max-w-xs">
        <Button fullWidth onClick={reset}>
          <span className="flex items-center justify-center gap-2">
            <RefreshCw size={16} /> TRY AGAIN
          </span>
        </Button>
        <Button variant="secondary" fullWidth onClick={() => window.location.href = "/"}>
          RETURN TO HQ
        </Button>
      </div>
    </div>
  );
}
