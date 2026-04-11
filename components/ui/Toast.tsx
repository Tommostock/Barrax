/* ============================================
   Toast Component
   Bottom-positioned notification that auto-dismisses.
   Used for XP awards, badges, errors, etc.

   ToastContainer now renders up to 3 toasts stacked
   vertically (newest at the bottom). Older toasts
   fade as they climb so the focus stays on the most
   recent event.
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
  /** 0 = newest (bottom of stack), 1 = one up, 2 = top of stack */
  stackOffset?: number;
}

// Base bottom offset (matches the old `bottom-20` class = 5rem).
// Each stacked toast rises by its own height + a small gap.
const BASE_BOTTOM_REM = 5;
const TOAST_HEIGHT_PX = 68;
const GAP_PX = 8;

export default function Toast({
  toast,
  onDismiss,
  stackOffset = 0,
}: ToastProps) {
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
        fixed left-4 right-4 z-[100]
        bg-bg-panel border ${borderColor} p-3
        flex items-center justify-between gap-3
        transition-all duration-200
        ${visible ? "animate-slide-up" : ""}
        safe-bottom
      `}
      style={{
        bottom: `calc(${BASE_BOTTOM_REM}rem + ${stackOffset * (TOAST_HEIGHT_PX + GAP_PX)}px)`,
        opacity: visible ? Math.max(0.55, 1 - stackOffset * 0.2) : 0,
      }}
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
   Toast Container — renders the 3 most recent
   active toasts. Use the useToast hook to
   add/remove toasts.
   ============================================ */

const MAX_VISIBLE_TOASTS = 3;

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  // toasts is newest-last (useToast appends via [...prev, new]).
  // We slice the last N and reverse so the newest ends up at index 0
  // (bottom of the visual stack), with older ones climbing up.
  const visible = toasts.slice(-MAX_VISIBLE_TOASTS).reverse();
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((toast, i) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          stackOffset={i}
        />
      ))}
    </>
  );
}
