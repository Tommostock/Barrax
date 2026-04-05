/* ============================================
   useToast Hook
   Manages toast notifications. Add, remove, and
   auto-dismiss toasts from anywhere in the app.
   ============================================ */

"use client";

import { useState, useCallback } from "react";
import type { ToastData } from "@/components/ui/Toast";

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Add a new toast notification
  const addToast = useCallback(
    (message: string, type: ToastData["type"] = "info", duration?: number) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  // Remove a toast by ID
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
