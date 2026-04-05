/* ============================================
   RankStrip Component
   Full-width bar showing current rank, title,
   and XP progress to the next rank.
   ============================================ */

import ProgressBar from "@/components/ui/ProgressBar";
import Tag from "@/components/ui/Tag";
import { RANK_THRESHOLDS } from "@/types";

interface RankStripProps {
  currentRank: number;
  totalXp: number;
}

export default function RankStrip({ currentRank, totalXp }: RankStripProps) {
  // Find current and next rank info
  const current = RANK_THRESHOLDS[currentRank - 1] ?? RANK_THRESHOLDS[0];
  const next = RANK_THRESHOLDS[currentRank] ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];

  // XP progress within the current rank bracket
  const xpInRank = totalXp - current.xp;
  const xpNeeded = next.xp - current.xp;

  return (
    <div className="bg-bg-panel border border-green-dark p-4 camo-bg relative overflow-hidden">
      <div className="relative z-10">
        {/* Rank title and tag */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Tag variant="gold">{current.title}</Tag>
            <span className="text-xs text-text-secondary font-mono">
              RANK {currentRank}/12
            </span>
          </div>
        </div>

        {/* XP progress bar */}
        <ProgressBar
          value={xpInRank}
          max={xpNeeded}
          color="bg-xp-gold"
          showLabel
        />

        {/* XP text */}
        <p className="text-[0.65rem] text-text-secondary font-mono mt-1">
          {totalXp.toLocaleString()} XP TOTAL
        </p>
      </div>
    </div>
  );
}
