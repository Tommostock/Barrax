/* ============================================
   RankUpOverlay
   Listens for the global "rankup" window event
   dispatched from lib/award-and-notify.ts and
   delegates to RankUpScreen for the full UI.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import RankUpScreen from "@/components/rank/RankUpScreen";

interface RankUpEvent { rank: number; xp: number; }

export default function RankUpOverlay() {
  const [event, setEvent] = useState<RankUpEvent | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      setEvent((e as CustomEvent<RankUpEvent>).detail);
    }
    window.addEventListener("rankup", handler);
    return () => window.removeEventListener("rankup", handler);
  }, []);

  if (!event) return null;
  return (
    <RankUpScreen
      newRank={event.rank}
      totalXP={event.xp}
      onDismiss={() => setEvent(null)}
    />
  );
}
