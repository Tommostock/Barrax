"use client";

/* ============================================
   CoachingSubtitle
   On-screen transcript of the last coaching cue.
   Auto-fades after 4s by default — override with
   stickyMode=true to keep it on permanently.

   Used in the workout player, mounted under the
   exercise name where the user's eyes are.
   ============================================ */

import { useEffect, useState } from "react";
import type { CoachingCue } from "@/types";

interface Props {
  subtitle: CoachingCue | null;
  /** If true, subtitle stays on permanently. Otherwise fades after 4s. */
  stickyMode?: boolean;
}

export default function CoachingSubtitle({ subtitle, stickyMode = false }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!subtitle) return;
    setVisible(true);
    if (stickyMode) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [subtitle, stickyMode]);

  if (!subtitle || !visible) return null;

  return (
    <div
      className="mx-auto mt-3 mb-2 flex max-w-md items-start gap-2 border border-green-primary bg-bg-panel-alt px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <span className="shrink-0 font-heading text-[0.55rem] uppercase tracking-widest text-green-light">
        COACH
      </span>
      <span className="font-mono text-xs leading-snug text-text-primary">
        {subtitle.text}
      </span>
    </div>
  );
}
