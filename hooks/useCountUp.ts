/* ============================================
   useCountUp Hook
   Animates a number counting up from its previous
   value to a new target. Used for XP, calories,
   macro totals — anywhere numbers change.
   ============================================ */

"use client";

import { useState, useEffect, useRef } from "react";

interface CountUpOptions {
  duration?: number; // animation duration in ms (default 600)
  decimals?: number; // decimal places (default 0)
}

export default function useCountUp(
  target: number,
  { duration = 600, decimals = 0 }: CountUpOptions = {}
): string {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const from = prevTarget.current;
    const to = target;
    prevTarget.current = target;

    // Don't animate if the difference is negligible
    if (Math.abs(to - from) < 0.5) {
      setDisplay(to);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out curve for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();
}
