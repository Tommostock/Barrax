/* ============================================
   HudFrame Component
   Wraps content with tactical corner brackets
   like a military HUD / FPS game UI element.
   Each corner is a small L-shaped border piece
   positioned at the card's edges.

   Use instead of plain borders for key panels
   to give that Call of Duty / Battlefield feel.
   ============================================ */

interface HudFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Length of each corner bracket arm in pixels */
  cornerSize?: number;
  /** Border colour — defaults to green-dark */
  color?: string;
  /** When true, corners animate in on mount */
  animated?: boolean;
}

export default function HudFrame({
  children,
  className = "",
  cornerSize = 16,
  color = "var(--green-dark)",
  animated = false,
}: HudFrameProps) {
  // Each corner is a small div with two borders forming an L shape.
  // Positioned absolutely at each corner of the parent container.
  const cornerStyle = {
    width: cornerSize,
    height: cornerSize,
    borderColor: color,
    position: "absolute" as const,
  };

  const animClass = animated ? "hud-corner-animate" : "";

  return (
    <div className={`relative ${className}`}>
      {/* Top-left corner ┌ */}
      <div
        className={`border-t-2 border-l-2 top-0 left-0 ${animClass}`}
        style={{ ...cornerStyle, animationDelay: animated ? "0ms" : undefined }}
      />

      {/* Top-right corner ┐ */}
      <div
        className={`border-t-2 border-r-2 top-0 right-0 ${animClass}`}
        style={{ ...cornerStyle, animationDelay: animated ? "50ms" : undefined }}
      />

      {/* Bottom-left corner └ */}
      <div
        className={`border-b-2 border-l-2 bottom-0 left-0 ${animClass}`}
        style={{ ...cornerStyle, animationDelay: animated ? "100ms" : undefined }}
      />

      {/* Bottom-right corner ┘ */}
      <div
        className={`border-b-2 border-r-2 bottom-0 right-0 ${animClass}`}
        style={{ ...cornerStyle, animationDelay: animated ? "150ms" : undefined }}
      />

      {/* Actual content */}
      {children}
    </div>
  );
}
