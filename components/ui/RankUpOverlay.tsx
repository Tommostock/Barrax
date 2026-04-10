/* ============================================
   RankUpOverlay Component
   Full-screen celebration when the user ranks up.
   Listens for the global "rankup" custom event
   dispatched from lib/award-and-notify.ts.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { RANK_THRESHOLDS } from "@/types";

interface RankUpEvent {
  rank: number;
  title: string;
  xp: number;
}

export default function RankUpOverlay() {
  const [event, setEvent] = useState<RankUpEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<RankUpEvent>).detail;
      setEvent(detail);
      setVisible(true);
    }
    window.addEventListener("rankup", handler);
    return () => window.removeEventListener("rankup", handler);
  }, []);

  if (!visible || !event) return null;

  const rankInfo = RANK_THRESHOLDS[event.rank - 1];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 animate-page-enter px-6"
      onClick={() => setVisible(false)}
    >
      {/* Decorative corner lines */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-green-primary opacity-60" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-green-primary opacity-60" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-green-primary opacity-60" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-green-primary opacity-60" />

      {/* Rank number badge */}
      <div className="relative mb-6">
        <div className="w-24 h-24 border-2 border-xp-gold flex items-center justify-center bg-bg-panel">
          <Shield size={40} className="text-xp-gold" />
        </div>
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-xp-gold flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-black">{event.rank}</span>
        </div>
      </div>

      {/* Promotion text */}
      <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-widest mb-2">
        Promotion Confirmed
      </p>

      <h1 className="text-4xl font-heading uppercase tracking-wider text-xp-gold text-center mb-2">
        {event.title}
      </h1>

      <div className="w-16 h-px bg-green-primary mx-auto my-4" />

      {rankInfo?.unlocks && (
        <p className="text-xs font-mono text-green-light text-center mb-2 max-w-xs">
          {rankInfo.unlocks}
        </p>
      )}

      <p className="text-sm font-mono text-text-secondary text-center mb-10">
        Total XP: <span className="text-xp-gold font-bold">{event.xp.toLocaleString()}</span>
      </p>

      <button
        onClick={() => setVisible(false)}
        className="px-8 py-3 border border-green-primary text-green-light text-xs font-mono uppercase tracking-widest hover:bg-green-primary hover:text-text-primary transition-colors"
      >
        Acknowledged
      </button>

      <p className="text-[0.5rem] font-mono text-text-secondary mt-6 uppercase tracking-wider opacity-50">
        Tap anywhere to dismiss
      </p>
    </div>
  );
}
