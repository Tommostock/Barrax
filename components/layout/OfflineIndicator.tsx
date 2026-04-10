/* ============================================
   OfflineIndicator
   Small header badge showing connection state.

   - Online + empty queue → nothing (silent)
   - Offline → red "OFFLINE" tag
   - Online + pending queue → amber "SYNCING (N)" tag
   ============================================ */

"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/lib/offline/useOfflineSync";

export default function OfflineIndicator() {
  const { isOnline, queueCount, syncing } = useOfflineSync();

  // Silent case — connected and nothing pending
  if (isOnline && queueCount === 0 && !syncing) return null;

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 border border-danger/70 bg-danger/10
                   text-[0.55rem] font-mono text-danger uppercase tracking-wider"
        title="You are offline. Changes will sync when the connection returns."
      >
        <WifiOff size={11} />
        <span>OFFLINE</span>
      </div>
    );
  }

  // Online + pending (either mid-sync or newly queued items still waiting)
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 border border-xp-gold/70 bg-xp-gold/10
                 text-[0.55rem] font-mono text-xp-gold uppercase tracking-wider"
      title={`Syncing ${queueCount} pending change${queueCount === 1 ? "" : "s"}`}
    >
      <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
      <span>SYNCING ({queueCount})</span>
    </div>
  );
}
