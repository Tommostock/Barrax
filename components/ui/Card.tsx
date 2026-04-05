/* ============================================
   Card Component
   Dark panel with 1px green-dark border.
   Optional classification tag at the top.
   ============================================ */

interface CardProps {
  children: React.ReactNode;
  tag?: string;
  tagVariant?: "active" | "complete" | "locked" | "danger" | "default" | "gold";
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  tag,
  tagVariant = "default",
  className = "",
  onClick,
}: CardProps) {
  // Map tag variants to their CSS classes
  const tagStyles = {
    active: "tag-active",
    complete: "tag-complete",
    locked: "tag-locked",
    danger: "tag-danger",
    gold: "text-xp-gold border-xp-gold",
    default: "",
  };

  return (
    <div
      className={`
        bg-bg-panel border border-green-dark p-4 relative
        ${onClick ? "cursor-pointer press-scale" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Classification tag at top of card */}
      {tag && (
        <span className={`tag ${tagStyles[tagVariant]} mb-3 block w-fit`}>
          [{tag}]
        </span>
      )}
      {children}
    </div>
  );
}
