/* ============================================
   Tag Component
   Uppercase monospace status label.
   Wraps text in [BRACKETS] for military aesthetic.
   ============================================ */

interface TagProps {
  children: string;
  variant?: "active" | "complete" | "locked" | "danger" | "default" | "gold";
  className?: string;
}

export default function Tag({
  children,
  variant = "default",
  className = "",
}: TagProps) {
  const variants = {
    active: "text-green-light border-green-primary",
    complete: "text-success border-success",
    locked: "text-text-secondary border-text-secondary opacity-50",
    danger: "text-danger border-danger",
    gold: "text-xp-gold border-xp-gold",
    default: "text-text-secondary border-green-dark",
  };

  return (
    <span
      className={`
        font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em]
        px-2 py-[2px] border inline-block leading-relaxed
        ${variants[variant]} ${className}
      `}
    >
      [{children}]
    </span>
  );
}
