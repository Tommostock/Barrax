/* ============================================
   Header Component
   Top bar with BARRAX title and notification bell.
   Shows current date in muted text below title.
   ============================================ */

"use client";

import { Bell } from "lucide-react";

export default function Header() {
  // Format today's date in a military style: "05 APR 2026"
  const today = new Date();
  const formattedDate = today
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur-sm border-b border-green-dark safe-top scan-line-header relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Title and date */}
        <div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-sand font-heading">
            BARRAX
          </h1>
          <p className="text-[0.65rem] text-text-secondary font-mono tracking-wider">
            {formattedDate}
          </p>
        </div>

        {/* Notification bell */}
        <button
          className="min-w-[44px] min-h-[44px] flex items-center justify-center
                     text-text-secondary hover:text-green-light transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
