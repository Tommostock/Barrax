/* ============================================
   Toast Component
   Bottom-positioned notification that auto-dismisses.
   Used for XP awards, badges, errors, etc.
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ToastData {
  id: string;
  message: string;
  type?: "success" | "error" | "info" | "xp";
  duration?: number; // ms, default 3000
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for fade-out animation before removing
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  // Colour based on toast type
  const typeStyles = {
    success: "border-green-primary",
    error: "border-danger",
    info: "border-green-dark",
    xp: "border-xp-gold",
  };

  const borderColor = typeStyles[toast.type ?? "info"];

  return (
    <div
      className={`
        fixed bottom-20 left-4 right-4 z-[100]
        bg-bg-panel border ${borderColor} p-3
        flex items-center justify-between gap-3
        transition-opacity duration-200
        ${visible ? "animate-slide-up opacity-100" : "opacity-0"}
        safe-bottom
      `}
    >
      <p className="text-sm text-text-primary font-body flex-1">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px]
                   flex items-center justify-center"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ============================================
   Toast Container — renders all active toasts.
   Use the useToast hook to add/remove toasts.
   ============================================ */

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  // Only show the most recent toast to avoid stacking
  const latestToast = toasts[toasts.length - 1];
  if (!latestToast) return null;

  return <Toast toast={latestToast} onDismiss={onDismiss} />;
}
