/* ============================================
   Tag Component
   Uppercase monospace bordered chip.
   Used for inline status labels (e.g. "+50 XP",
   tier badges). Big classification labels at the
   top of cards are rendered via Card's `tag` prop
   which keeps the [BRACKETS] for emphasis.
   ============================================ */

interface TagProps {
  children: string;
  variant?:
    | "active"
    | "complete"
    | "locked"
    | "danger"
    | "default"
    | "gold"
    | "scavenger"
    | "recon";
  className?: string;
}

export default function Tag({
  children,
  variant = "default",
  className = "",
}: TagProps) {
  const variants = {
    active: "text-green-light border-green-primary",
    complete: "text-green-primary border-green-primary",
    locked: "text-text-secondary border-text-secondary opacity-50",
    danger: "text-danger border-danger",
    gold: "text-xp-gold border-xp-gold",
    scavenger: "tag-scavenger",
    recon: "tag-recon",
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
      {children}
    </span>
  );
}
