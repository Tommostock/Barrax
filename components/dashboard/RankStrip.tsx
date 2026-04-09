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

// ──────────────────────────────────────────────
// Rank insignia SVGs — military chevrons that
// evolve with rank. Each rank adds complexity:
//   1 = empty circle (recruit)
//   2-4 = 1-3 upward chevrons
//   5-6 = chevrons with a rocker bar beneath
//   7 = crown (warrant officer)
//   8-10 = 1-3 pips/stars (officer ranks)
//   11 = eagle (colonel)
//   12 = star wreath (general)
// Colour matches the rank's accent tone.
// ──────────────────────────────────────────────

const RANK_INSIGNIA_COLOURS: Record<number, string> = {
  1:  "#6B6B6B",  // grey
  2:  "#3A5428",  // dark olive
  3:  "#4A6B3A",  // olive
  4:  "#3A8B4A",  // forest
  5:  "#3A7A8B",  // teal
  6:  "#3A6A9B",  // steel blue
  7:  "#5A3A9B",  // purple
  8:  "#9B3A3A",  // crimson
  9:  "#9B6A3A",  // bronze
  10: "#B08A3A",  // amber
  11: "#A8A8B4",  // silver
  12: "#D4B850",  // gold
};

// Build a single upward chevron path at a given Y offset
function chevronPath(yOffset: number): string {
  return `M6,${22 + yOffset} L16,${14 + yOffset} L26,${22 + yOffset} L26,${18 + yOffset} L16,${10 + yOffset} L6,${18 + yOffset} Z`;
}

function RankInsignia({ rank }: { rank: number }) {
  const colour = RANK_INSIGNIA_COLOURS[rank] ?? "#6B6B6B";
  const size = 40;

  // Rank 1: Recruit — empty circle (no insignia yet)
  if (rank === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="10" stroke={colour} strokeWidth="2" fill="none" />
      </svg>
    );
  }

  // Ranks 2-4: 1-3 upward chevrons (enlisted)
  if (rank >= 2 && rank <= 4) {
    const count = rank - 1; // 1, 2, or 3 chevrons
    const startY = count === 1 ? 4 : count === 2 ? 0 : -4;
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill={colour}>
        {Array.from({ length: count }, (_, i) => (
          <path key={i} d={chevronPath(startY + i * 8)} />
        ))}
      </svg>
    );
  }

  // Ranks 5-6: 3 chevrons + 1-2 rocker bars (senior NCO)
  if (rank === 5 || rank === 6) {
    const rockers = rank - 4; // 1 or 2
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill={colour}>
        <path d={chevronPath(-4)} />
        <path d={chevronPath(4)} />
        <path d={chevronPath(12)} />
        {Array.from({ length: rockers }, (_, i) => (
          <path key={i} d={`M8,${26 + i * 4} Q16,${30 + i * 4} 24,${26 + i * 4}`}
            fill="none" stroke={colour} strokeWidth="2" />
        ))}
      </svg>
    );
  }

  // Rank 7: Warrant Officer — crown shape
  if (rank === 7) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill={colour}>
        <path d="M6,22 L10,12 L16,18 L22,12 L26,22 Z" />
        <rect x="6" y="22" width="20" height="3" />
      </svg>
    );
  }

  // Ranks 8-10: Officer pips (1-3 stars)
  if (rank >= 8 && rank <= 10) {
    const stars = rank - 7; // 1, 2, or 3
    const positions = stars === 1 ? [16] : stars === 2 ? [11, 21] : [8, 16, 24];
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill={colour}>
        {positions.map((cx, i) => (
          <polygon key={i}
            points={starPoints(cx, 16, 5, 2.2)}
          />
        ))}
      </svg>
    );
  }

  // Rank 11: Colonel — eagle silhouette
  if (rank === 11) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill={colour}>
        <path d="M16,6 L18,10 L24,8 L20,14 L26,16 L20,18 L24,24 L18,20 L16,26 L14,20 L8,24 L12,18 L6,16 L12,14 L8,8 L14,10 Z" />
      </svg>
    );
  }

  // Rank 12: General — large star in wreath
  if (rank === 12) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Wreath arcs */}
        <path d="M8,24 Q4,16 8,8" stroke={colour} strokeWidth="2" fill="none" />
        <path d="M24,24 Q28,16 24,8" stroke={colour} strokeWidth="2" fill="none" />
        {/* Central star */}
        <polygon points={starPoints(16, 15, 7, 3)} fill={colour} />
      </svg>
    );
  }

  return null;
}

// Generate SVG polygon points for a star shape
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    // Outer point
    const outerAngle = (i * 72 - 90) * (Math.PI / 180);
    points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    // Inner point
    const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return points.join(" ");
}

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
    <div className={`bg-gradient-to-r ${style.bg} border ${style.border} p-4 relative overflow-hidden`}>
      {/* Subtle diagonal stripe pattern for texture (not camo) */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)",
        }}
      />

      {/* Rank insignia — top right corner */}
      <div className="absolute top-3 right-3 opacity-80 z-10">
        <RankInsignia rank={currentRank} />
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
