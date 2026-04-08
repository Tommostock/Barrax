/* ============================================
   Global Error Boundary
   Catches fatal errors at the root level.
   ============================================ */

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-[#0C0C0C] text-[#D4D4C8] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-mono uppercase tracking-wider text-[#8B3232] mb-4">
        SYSTEM ERROR
      </p>
      <h2 className="text-xl font-bold uppercase tracking-wider text-[#C4B090] mb-2">
        Something went wrong
      </h2>
      <p className="text-xs text-[#7A7A6E] mb-6">
        Tap below to reload.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#4A6B3A] text-[#D4D4C8] font-bold uppercase tracking-wider text-sm"
      >
        RELOAD
      </button>
      <button
        onClick={() => window.location.href = "/"}
        className="mt-3 px-6 py-3 border border-[#2D4220] text-[#7A7A6E] font-bold uppercase tracking-wider text-sm"
      >
        GO HOME
      </button>
    </div>
  );
}
