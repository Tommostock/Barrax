/* ============================================
   AnimatedCounter Component
   Counts from 0 (or a start value) up to a target
   number with easing — like the XP tally at the
   end of a Call of Duty match.

   Uses requestAnimationFrame for smooth 60fps
   counting. Eases out so it starts fast and
   slows down as it approaches the target.
   ============================================ */

"use client";

import { useState, useEffect, useRef } from "react";

interface AnimatedCounterProps {
  /** The number to count up to */
  target: number;
  /** How long the count-up takes in milliseconds */
  duration?: number;
  /** Delay before counting starts (for staggered reveals) */
  delay?: number;
  /** Optional prefix (e.g. "+") */
  prefix?: string;
  /** Optional suffix (e.g. " XP", "kcal") */
  suffix?: string;
  /** Additional CSS classes for the number */
  className?: string;
}

// Ease-out cubic: starts fast, slows at the end — feels satisfying
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedCounter({
  target,
  duration = 1500,
  delay = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Wait for the delay, then start counting
    const timeout = setTimeout(() => {
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Apply easing so the counter decelerates toward the target
        const easedProgress = easeOutCubic(progress);
        setDisplay(Math.round(easedProgress * target));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay]);

  return (
    <span className={`font-mono font-bold ${className}`}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
