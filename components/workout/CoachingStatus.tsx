"use client";

/* ============================================
   CoachingStatus
   Tiny status chip for the workout player header.
   States:
   - loading     → "COACH LOADING"
   - ready       → "COACH READY" (shown briefly, then hidden)
   - lost        → "COACH LOST — TAP TO RESUME" (tap handler)
   - error       → "COACH OFFLINE" (beeps only)
   - idle/initialised → not rendered
   ============================================ */

import { useEffect, useState } from "react";
import type { CoachingState } from "@/types";
import { Headphones, AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  state: CoachingState;
  onResume?: () => void;
}

export default function CoachingStatus({ state, onResume }: Props) {
  // Show "READY" briefly on transition, then hide
  const [showReady, setShowReady] = useState(false);
  useEffect(() => {
    if (state === "ready") {
      setShowReady(true);
      const t = setTimeout(() => setShowReady(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (state === "idle" || state === "initialised") return null;

  if (state === "loading") {
    return (
      <div className="flex items-center gap-1.5 border border-xp-gold bg-bg-panel px-2 py-1">
        <RefreshCw size={12} className="animate-spin text-xp-gold" />
        <span className="font-heading text-[0.55rem] uppercase tracking-widest text-xp-gold">
          LOADING COACH
        </span>
      </div>
    );
  }

  if (state === "lost") {
    return (
      <button
        onClick={onResume}
        className="flex items-center gap-1.5 border border-xp-gold bg-bg-panel px-2 py-1 animate-pulse"
      >
        <AlertTriangle size={12} className="text-xp-gold" />
        <span className="font-heading text-[0.55rem] uppercase tracking-widest text-xp-gold">
          TAP TO RESUME
        </span>
      </button>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-1.5 border border-danger bg-bg-panel px-2 py-1">
        <AlertTriangle size={12} className="text-danger" />
        <span className="font-heading text-[0.55rem] uppercase tracking-widest text-danger">
          COACH OFFLINE
        </span>
      </div>
    );
  }

  if (showReady) {
    return (
      <div className="flex items-center gap-1.5 border border-green-primary bg-bg-panel px-2 py-1">
        <Headphones size={12} className="text-green-primary" />
        <span className="font-heading text-[0.55rem] uppercase tracking-widest text-green-primary">
          COACH READY
        </span>
      </div>
    );
  }

  return null;
}
