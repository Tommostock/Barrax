/* ============================================
   PullToRefresh Indicator
   Shows a small spinner/arrow at the top of the
   page when the user pulls down to refresh.
   ============================================ */

"use client";

import { Loader2, ChevronDown } from "lucide-react";

interface PullToRefreshProps {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

export default function PullToRefresh({ pullDistance, refreshing, threshold = 80 }: PullToRefreshProps) {
  if (pullDistance === 0 && !refreshing) return null;

  const ready = pullDistance >= threshold;

  return (
    <div
      className="flex items-center justify-center transition-all overflow-hidden"
      style={{ height: pullDistance }}
    >
      {refreshing ? (
        <Loader2 size={20} className="text-green-primary animate-spin" />
      ) : (
        <ChevronDown
          size={20}
          className={`transition-transform ${ready ? "text-green-primary rotate-180" : "text-text-secondary"}`}
        />
      )}
    </div>
  );
}
