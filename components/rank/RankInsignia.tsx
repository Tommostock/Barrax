/* ============================================
   RankInsignia Component
   Military rank insignia SVGs that evolve with
   rank. Used in the dashboard RankStrip and the
   service record page.

   Rank progression:
     1  = empty circle (recruit)
     2-4  = 1-3 upward chevrons (enlisted)
     5-6  = chevrons + rocker bars (senior NCO)
     7  = crown (warrant officer)
     8-10 = 1-3 officer stars/pips
     11 = eagle (colonel)
     12 = star in wreath (general)
   ============================================ */

// Colour for each rank — matches the RankStrip accent
const RANK_INSIGNIA_COLOURS: Record<number, string> = {
  1:  "#6B6B6B",
  2:  "#3A5428",
  3:  "#4A6B3A",
  4:  "#3A8B4A",
  5:  "#3A7A8B",
  6:  "#3A6A9B",
  7:  "#5A3A9B",
  8:  "#9B3A3A",
  9:  "#9B6A3A",
  10: "#B08A3A",
  11: "#A8A8B4",
  12: "#D4B850",
};

// Build a single upward chevron path at a given Y offset
function chevronPath(yOffset: number): string {
  return `M6,${22 + yOffset} L16,${14 + yOffset} L26,${22 + yOffset} L26,${18 + yOffset} L16,${10 + yOffset} L6,${18 + yOffset} Z`;
}

// Generate SVG polygon points for a star shape
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * (Math.PI / 180);
    points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return points.join(" ");
}

interface RankInsigniaProps {
  rank: number;
  size?: number; // SVG size in px (default 40)
}

export default function RankInsignia({ rank, size = 40 }: RankInsigniaProps) {
  const colour = RANK_INSIGNIA_COLOURS[rank] ?? "#6B6B6B";

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
    const count = rank - 1;
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
    const rockers = rank - 4;
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
    const stars = rank - 7;
    const positions = stars === 1 ? [16] : stars === 2 ? [11, 21] : [8, 16, 24];
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill={colour}>
        {positions.map((cx, i) => (
          <polygon key={i} points={starPoints(cx, 16, 5, 2.2)} />
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
        <path d="M8,24 Q4,16 8,8" stroke={colour} strokeWidth="2" fill="none" />
        <path d="M24,24 Q28,16 24,8" stroke={colour} strokeWidth="2" fill="none" />
        <polygon points={starPoints(16, 15, 7, 3)} fill={colour} />
      </svg>
    );
  }

  return null;
}
