/* ============================================
   Rank-Up Screen
   Full-screen takeover when the user earns a new
   rank. Dark camo background, rank insignia,
   "PROMOTED" header with animations. No confetti,
   no emojis — militarily restrained but impactful.
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { RANK_THRESHOLDS } from "@/types";
import Button from "@/components/ui/Button";
import { Shield } from "lucide-react";

interface RankUpScreenProps {
  newRank: number;
  totalXP: number;
  onDismiss: () => void;
}

export default function RankUpScreen({ newRank, totalXP, onDismiss }: RankUpScreenProps) {
  const rankInfo = RANK_THRESHOLDS[newRank - 1];
  const [phase, setPhase] = useState(0);

  // Stagger animation phases for dramatic reveal
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),   // Show "PROMOTED"
      setTimeout(() => setPhase(2), 800),   // Show insignia
      setTimeout(() => setPhase(3), 1300),  // Show title
      setTimeout(() => setPhase(4), 1800),  // Show details
      setTimeout(() => setPhase(5), 2300),  // Show dismiss
    ];
    // Haptic feedback on mount
    navigator.vibrate?.([100, 50, 100, 50, 200]);
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!rankInfo) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Camo background with slow pulse */}
      <div className="absolute inset-0 camo-bg opacity-20" style={{ animation: "pulse-subtle 4s ease-in-out infinite" }} />

      {/* Radial glow behind insignia */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-20"
        style={{ background: "radial-gradient(circle, var(--xp-gold) 0%, transparent 70%)", animation: "pulse-subtle 3s ease-in-out infinite" }} />

      {/* Scan-line overlay */}
      <div className="absolute inset-0 scan-lines" />

      {/* Content — each element fades in on its phase */}
      <div className="relative z-10 text-center space-y-6">
        {/* PROMOTED header */}
        <p className={`text-sm font-mono text-xp-gold uppercase tracking-[0.3em] transition-all duration-700
          ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          NEXT LEVEL UNLOCKED
        </p>

        {/* Rank insignia with scale animation */}
        <div className={`w-28 h-28 mx-auto border-2 border-xp-gold flex items-center justify-center bg-bg-panel
          transition-all duration-700 ${phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
          style={phase >= 2 ? { boxShadow: "0 0 30px rgba(184, 160, 74, 0.3)" } : {}}>
          <Shield size={56} className="text-xp-gold" />
        </div>

        {/* Rank title with scale */}
        <h1 className={`text-4xl font-heading font-bold uppercase tracking-[0.15em] text-sand transition-all duration-700
          ${phase >= 3 ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          {rankInfo.title}
        </h1>

        {/* Rank number + XP */}
        <div className={`space-y-1 transition-all duration-500 ${phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-sm font-mono text-text-secondary">RANK {newRank} OF 12</p>
          <p className="text-xl font-mono text-xp-gold font-bold">{totalXP.toLocaleString()} XP</p>
        </div>

        {/* Unlocks */}
        <div className={`bg-bg-panel border border-green-dark p-4 max-w-xs mx-auto transition-all duration-500
          ${phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider mb-2">UNLOCKED</p>
          <p className="text-sm text-text-primary">{rankInfo.unlocks}</p>
        </div>

        {/* Dismiss */}
        <div className={`transition-all duration-500 ${phase >= 5 ? "opacity-100" : "opacity-0"}`}>
          <Button onClick={onDismiss} fullWidth className="max-w-xs mx-auto mt-4">NOW GET TO WORK</Button>
        </div>
      </div>
    </div>
  );
}
