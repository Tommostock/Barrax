/* ============================================
   Rank-Up Screen
   Full-screen takeover when the user earns a new
   rank. Dark background, animated rank insignia,
   "PROMOTION CONFIRMED" header with staggered
   reveal. Military ceremony feel — no confetti,
   no emojis, just impact.
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { RANK_THRESHOLDS } from "@/types";
import Button from "@/components/ui/Button";
import RankInsignia from "@/components/rank/RankInsignia";

interface RankUpScreenProps {
  newRank: number;
  totalXP: number;
  onDismiss: () => void;
}

// Colours for the glow effect behind the insignia — matches rank accent
const RANK_GLOW: Record<number, string> = {
  1: "#6B6B6B", 2: "#3A5428", 3: "#4A6B3A", 4: "#3A8B4A",
  5: "#3A7A8B", 6: "#3A6A9B", 7: "#5A3A9B", 8: "#9B3A3A",
  9: "#9B6A3A", 10: "#B08A3A", 11: "#A8A8B4", 12: "#D4B850",
};

export default function RankUpScreen({ newRank, totalXP, onDismiss }: RankUpScreenProps) {
  const rankInfo = RANK_THRESHOLDS[newRank - 1];
  const prevRankInfo = RANK_THRESHOLDS[newRank - 2];
  const [phase, setPhase] = useState(0);
  const glowColour = RANK_GLOW[newRank] ?? "#B8A04A";

  // Stagger animation phases for dramatic reveal
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // Show "PROMOTION CONFIRMED"
      setTimeout(() => setPhase(2), 1000),  // Show insignia
      setTimeout(() => setPhase(3), 1600),  // Show rank title
      setTimeout(() => setPhase(4), 2200),  // Show details
      setTimeout(() => setPhase(5), 2800),  // Show dismiss
    ];
    // Strong haptic — promotion is a big moment
    navigator.vibrate?.([100, 50, 100, 50, 200]);
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!rankInfo) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Diagonal stripe background */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)" }} />

      {/* Radial glow behind insignia — colour matches rank */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-25"
        style={{ background: `radial-gradient(circle, ${glowColour} 0%, transparent 70%)`, animation: "pulse-subtle 3s ease-in-out infinite" }} />

      {/* Content — each element fades in on its phase */}
      <div className="relative z-10 text-center space-y-6 max-w-sm">
        {/* Header line */}
        <div className={`transition-all duration-700 ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="w-16 h-[2px] mx-auto mb-3" style={{ backgroundColor: glowColour }} />
          <p className="text-xs font-mono uppercase tracking-[0.4em]" style={{ color: glowColour }}>
            Promotion Confirmed
          </p>
          <div className="w-16 h-[2px] mx-auto mt-3" style={{ backgroundColor: glowColour }} />
        </div>

        {/* Rank insignia — large, centred, with glow border and light sweep */}
        <div className={`transition-all duration-700 ${phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
          <div className="w-32 h-32 mx-auto border-2 flex items-center justify-center bg-bg-panel relative overflow-hidden"
            style={{ borderColor: glowColour, boxShadow: phase >= 2 ? `0 0 40px ${glowColour}40` : "none" }}>
            <RankInsignia rank={newRank} size={72} />
            {/* Light sweep — a bright bar sweeps across the insignia */}
            {phase >= 2 && (
              <div className="absolute inset-0 rank-light-sweep"
                style={{ background: `linear-gradient(90deg, transparent 0%, ${glowColour}80 50%, transparent 100%)`, width: "40%" }} />
            )}
          </div>
        </div>

        {/* Previous rank -> New rank (typewriter effect on title) */}
        <div className={`transition-all duration-700 ${phase >= 3 ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          {prevRankInfo && (
            <p className="text-xs font-mono text-text-secondary mb-2">
              {prevRankInfo.title.toUpperCase()} &rarr;
            </p>
          )}
          <h1 className="text-4xl font-heading font-bold uppercase tracking-[0.15em] text-sand">
            <TypewriterText text={rankInfo.title} active={phase >= 3} />
          </h1>
          <p className="text-sm font-mono text-text-secondary mt-2">RANK {newRank} OF 12</p>
        </div>

        {/* XP + Unlocks */}
        <div className={`space-y-3 transition-all duration-500 ${phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-2xl font-mono font-bold" style={{ color: glowColour }}>
            {totalXP.toLocaleString()} XP
          </p>

          <div className="bg-bg-panel border border-green-dark p-4">
            <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider mb-2">New Capabilities</p>
            <p className="text-sm text-text-primary">{rankInfo.unlocks}</p>
          </div>
        </div>

        {/* Dismiss */}
        <div className={`transition-all duration-500 ${phase >= 5 ? "opacity-100" : "opacity-0"}`}>
          <Button onClick={onDismiss} fullWidth className="mt-4">DISMISSED, SOLDIER</Button>
        </div>
      </div>
    </div>
  );
}

/* ---- Typewriter Text ----
   Types out text one character at a time with a blinking cursor.
   Used for the rank title reveal — feels like a military dispatch. */
function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [charCount, setCharCount] = useState(0);
  const upperText = text.toUpperCase();

  useEffect(() => {
    if (!active) return;
    setCharCount(0);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= upperText.length) clearInterval(interval);
    }, 60); // 60ms per character — snappy but readable

    return () => clearInterval(interval);
  }, [active, upperText]);

  if (!active) return null;

  return (
    <span>
      {upperText.slice(0, charCount)}
      {charCount < upperText.length && (
        <span className="typewriter-cursor" />
      )}
    </span>
  );
}
