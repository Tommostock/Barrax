/* ============================================
   RankStrip Component
   Full-width bar showing current rank, title,
   XP progress, and a military insignia in the
   top-right corner that evolves with rank.
   Background colour changes with rank — progresses
   from dark grey (Recruit) through greens, blues,
   purples, up to gold (General).
   ============================================ */

import ProgressBar from "@/components/ui/ProgressBar";
import Tag from "@/components/ui/Tag";
import RankInsignia from "@/components/rank/RankInsignia";
import { RANK_THRESHOLDS } from "@/types";

interface RankStripProps {
  currentRank: number;
  totalXp: number;
}

// Each rank gets a unique background gradient and accent colour.
// Progresses from muted/dark at low ranks to vibrant gold at max rank.
const RANK_STYLES: Record<number, { bg: string; border: string; accent: string }> = {
  1:  { bg: "from-[#1A1A1A] to-[#252525]", border: "border-[#3A3A3A]", accent: "bg-[#6B6B6B]" },       // Recruit — dark grey
  2:  { bg: "from-[#1A2214] to-[#1F2A18]", border: "border-[#2D4220]", accent: "bg-[#3A5428]" },       // Private — dark olive
  3:  { bg: "from-[#1A2A14] to-[#243618]", border: "border-[#3A5228]", accent: "bg-[#4A6B3A]" },       // Lance Cpl — olive green
  4:  { bg: "from-[#1A3020] to-[#203C28]", border: "border-[#2D6B3A]", accent: "bg-[#3A8B4A]" },       // Corporal — forest green
  5:  { bg: "from-[#142A30] to-[#183640]", border: "border-[#2A5A6B]", accent: "bg-[#3A7A8B]" },       // Sergeant — teal
  6:  { bg: "from-[#141E30] to-[#182840]", border: "border-[#2A4A6B]", accent: "bg-[#3A6A9B]" },       // Staff Sgt — steel blue
  7:  { bg: "from-[#1A1430] to-[#241840]", border: "border-[#3A2A6B]", accent: "bg-[#5A3A9B]" },       // Warrant — deep purple
  8:  { bg: "from-[#301A1A] to-[#401820]", border: "border-[#6B2A2A]", accent: "bg-[#9B3A3A]" },       // Lieutenant — crimson
  9:  { bg: "from-[#302014] to-[#402A18]", border: "border-[#6B4A2A]", accent: "bg-[#9B6A3A]" },       // Captain — bronze
  10: { bg: "from-[#302814] to-[#403618]", border: "border-[#8B6A2A]", accent: "bg-[#B08A3A]" },       // Major — amber
  11: { bg: "from-[#2A2A30] to-[#38383E]", border: "border-[#8A8A96]", accent: "bg-[#A8A8B4]" },       // Colonel — SILVER
  12: { bg: "from-[#3A3018] to-[#4A3E20]", border: "border-[#B8A04A]", accent: "bg-[#D4B850]" },       // General — GOLD
};

export default function RankStrip({ currentRank, totalXp }: RankStripProps) {
  const current = RANK_THRESHOLDS[currentRank - 1] ?? RANK_THRESHOLDS[0];
  const next = RANK_THRESHOLDS[currentRank] ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];

  const xpInRank = totalXp - current.xp;
  const xpNeeded = next.xp - current.xp;

  const style = RANK_STYLES[currentRank] ?? RANK_STYLES[1];

  // Progress bar colour also changes with rank
  const progressColor = currentRank >= 12 ? "bg-[#D4B850]"
    : currentRank >= 11 ? "bg-[#A8A8B4]"
    : currentRank >= 10 ? "bg-[#B08A3A]"
    : currentRank >= 7 ? "bg-[#5A3A9B]"
    : currentRank >= 5 ? "bg-[#3A7A8B]"
    : "bg-green-primary";

  return (
    <div
      className={`bg-gradient-to-r ${style.bg} border ${style.border} p-4 relative overflow-hidden scan-lines`}
    >
      {/* Subtle diagonal stripe pattern for texture (not camo) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)",
        }}
      />

      {/* Crosshair corner marks -- 4 little L-brackets in each corner
          for a HUD readout vibe. Subtle sand colour, 60% opacity. */}
      {[
        { pos: "top-1 left-1", rot: "rotate-0" },
        { pos: "top-1 right-1", rot: "rotate-90" },
        { pos: "bottom-1 left-1", rot: "-rotate-90" },
        { pos: "bottom-1 right-1", rot: "rotate-180" },
      ].map((c, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`absolute ${c.pos} ${c.rot} text-sand opacity-60 z-10`}
          aria-hidden
        >
          <path
            d="M 0 0 L 10 0 M 0 0 L 0 10"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ))}

      {/* Rank insignia — top right corner, with subtle rotating
          radar-sweep wedge behind it for ambient HUD motion */}
      <div className="absolute top-2 right-3 opacity-80 z-10">
        <div className="relative">
          <span className="radar-sweep" aria-hidden />
          <RankInsignia rank={currentRank} />
        </div>
      </div>

      <div className="relative z-10">
        {/* Rank title and tag */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Tag variant={currentRank >= 10 ? "gold" : "active"}>{current.title}</Tag>
            <span className="text-xs text-text-secondary font-mono">
              RANK {currentRank}/12
            </span>
          </div>
        </div>

        {/* XP progress bar */}
        <ProgressBar
          value={xpInRank}
          max={xpNeeded}
          color={progressColor}
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
