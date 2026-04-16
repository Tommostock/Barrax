/* ============================================
   XP Popup Component
   Floating "+50 XP" notification that rises and
   fades out — like a hit marker / kill confirmation
   in Call of Duty.

   Listens for a global "xp-awarded" CustomEvent
   on the window. Any component can trigger it:
     window.dispatchEvent(new CustomEvent("xp-awarded", {
       detail: { amount: 50, source: "workout" }
     }));

   Renders in the app layout so it's always visible.
   ============================================ */

"use client";

import { useState, useEffect, useCallback } from "react";

interface XpEvent {
  amount: number;
  source?: string;
}

interface PopupItem {
  id: number;
  amount: number;
}

let nextId = 0;

export default function XpPopup() {
  const [popups, setPopups] = useState<PopupItem[]>([]);

  const addPopup = useCallback((amount: number) => {
    const id = nextId++;
    setPopups((prev) => [...prev, { id, amount }]);

    // Auto-remove after the animation completes (1.5s)
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1500);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<XpEvent>).detail;
      if (detail?.amount) {
        addPopup(detail.amount);
      }
    }

    window.addEventListener("xp-awarded", handler);
    return () => window.removeEventListener("xp-awarded", handler);
  }, [addPopup]);

  if (popups.length === 0) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-[180] pointer-events-none flex flex-col items-center gap-2">
      {popups.map((popup) => (
        <div
          key={popup.id}
          className="xp-popup-rise font-mono font-bold text-2xl text-xp-gold"
          style={{ textShadow: "0 0 12px rgba(184, 160, 74, 0.5)" }}
        >
          +{popup.amount} XP
        </div>
      ))}
    </div>
  );
}
