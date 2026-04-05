/* ============================================
   Rank-Up Screen
   Full-screen takeover when the user earns a new
   rank. Dark camo background, rank insignia,
   "PROMOTED" header. No confetti, no emojis.
   ============================================ */

"use client";

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

  if (!rankInfo) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col items-center justify-center px-6">
      {/* Camo background */}
      <div className="absolute inset-0 camo-bg opacity-30" />

      {/* Scan-line overlay */}
      <div className="absolute inset-0 scan-lines" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-6 animate-fade-in">
        {/* PROMOTED header */}
        <p className="text-sm font-mono text-xp-gold uppercase tracking-[0.3em]">
          PROMOTED
        </p>

        {/* Rank insignia */}
        <div className="w-24 h-24 mx-auto border-2 border-xp-gold flex items-center justify-center bg-bg-panel">
          <Shield size={48} className="text-xp-gold" />
        </div>

        {/* Rank title */}
        <h1 className="text-3xl font-heading font-bold uppercase tracking-[0.15em] text-sand">
          {rankInfo.title}
        </h1>

        {/* Rank number */}
        <p className="text-sm font-mono text-text-secondary">
          RANK {newRank} OF 12
        </p>

        {/* Total XP */}
        <p className="text-lg font-mono text-xp-gold">
          {totalXP.toLocaleString()} XP
        </p>

        {/* Unlocks */}
        <div className="bg-bg-panel border border-green-dark p-4 max-w-xs mx-auto">
          <p className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider mb-2">
            UNLOCKED
          </p>
          <p className="text-sm text-text-primary">
            {rankInfo.unlocks}
          </p>
        </div>

        {/* Dismiss */}
        <Button onClick={onDismiss} fullWidth className="max-w-xs mx-auto mt-6">
          DISMISSED
        </Button>
      </div>
    </div>
  );
}
