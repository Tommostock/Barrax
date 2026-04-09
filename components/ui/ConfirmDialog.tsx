/* ============================================
   ConfirmDialog Component
   Simple confirmation overlay for destructive
   actions like deleting food entries or workouts.
   Military-themed: dark panel, sharp corners.
   ============================================ */

"use client";

import Button from "@/components/ui/Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "CONFIRM",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center px-6">
        <div className="bg-bg-panel border border-green-dark w-full max-w-sm p-5 space-y-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
            {title}
          </h3>
          <p className="text-xs text-text-secondary">{message}</p>
          <div className="flex gap-2">
            <Button onClick={onConfirm} fullWidth className="bg-danger border-danger">
              {confirmLabel}
            </Button>
            <Button variant="secondary" onClick={onCancel} fullWidth>
              CANCEL
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
