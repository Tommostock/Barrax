/* ============================================
   EmptyState Component
   Reusable empty state visual with a pulsing icon,
   title, description, and optional action button.
   ============================================ */

import type { LucideIcon } from "lucide-react";
import Button from "@/components/ui/Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: EmptyStateProps) {
  return (
    <div className="text-center py-10 px-4">
      {/* Pulsing icon with border frame */}
      <div className="w-16 h-16 mx-auto mb-4 border border-green-dark flex items-center justify-center bg-bg-panel-alt">
        <Icon size={28} className="text-text-secondary empty-state-icon" />
      </div>

      <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">
        {title}
      </h3>
      <p className="text-xs text-text-secondary max-w-xs mx-auto mb-5">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={disabled}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
