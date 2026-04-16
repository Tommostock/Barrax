/* ============================================
   Card Component
   Dark panel with 1px green-dark border.
   Optional classification tag at the top.
   Optional scan-line overlay for a HUD feel.
   ============================================ */

interface CardProps {
  children: React.ReactNode;
  tag?: string;
  tagVariant?:
    | "active"
    | "complete"
    | "locked"
    | "danger"
    | "default"
    | "gold"
    | "scavenger"
    | "recon";
  className?: string;
  onClick?: () => void;
  /** When true, layers a subtle scan-line texture over the card via
   *  the .scan-lines::after class. Enabled on the main HQ cards for
   *  a tactical HUD feel. */
  scanLines?: boolean;
}

export default function Card({
  children,
  tag,
  tagVariant = "default",
  className = "",
  onClick,
  scanLines = false,
}: CardProps) {
  // Map tag variants to their CSS classes
  const tagStyles = {
    active: "tag-active",
    complete: "tag-complete",
    locked: "tag-locked",
    danger: "tag-danger",
    gold: "text-xp-gold border-xp-gold",
    scavenger: "tag-scavenger",
    recon: "tag-recon",
    default: "",
  };

  return (
    <div
      className={`
        bg-bg-panel border border-green-dark p-4 relative
        flex flex-col
        ${scanLines ? "scan-lines" : ""}
        ${onClick ? "cursor-pointer press-scale" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Classification tag at top of card -- kept bracketed for emphasis.
          flex-shrink-0 so the tag never compresses in a flex column. */}
      {tag && (
        <span
          className={`tag ${tagStyles[tagVariant]} mb-3 block w-fit flex-shrink-0`}
        >
          [{tag}]
        </span>
      )}
      {children}
    </div>
  );
}
