/* ============================================
   useOfflineSync hook
   Tracks online/offline state, the number of queued
   mutations, and auto-flushes the queue when the
   connection returns.

   Mount this hook once in a top-level layout so the
   queue is drained as soon as signal comes back.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { flushQueue, getQueueCount } from "./queue";

export interface OfflineSyncState {
  isOnline: boolean;
  queueCount: number;
  syncing: boolean;
}

export function useOfflineSync(): OfflineSyncState {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    setQueueCount(await getQueueCount());
  }, []);

  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    setSyncing(true);
    try {
      const supabase = createClient();
      await flushQueue(supabase);
    } finally {
      setSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Seed initial state from the browser.
    setIsOnline(navigator.onLine);
    refreshCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // If the app boots with pending items (e.g. user closed the tab
    // mid-sync), try to flush immediately.
    if (navigator.onLine) {
      void handleOnline();
    }

    // Refresh count every 5s while mounted so the badge reflects
    // newly-queued mutations from other components.
    const interval = window.setInterval(refreshCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(interval);
    };
  }, [handleOnline, handleOffline, refreshCount]);

  return { isOnline, queueCount, syncing };
}
