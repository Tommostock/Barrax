/* ============================================
   BottomSheet Component
   Slide-up modal from the bottom of the screen.
   Military-themed: dark panel, green border, sharp corners.
   ============================================ */

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 bg-black/60 z-[90] animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[95]
                    bg-bg-panel border-t border-green-dark
                    max-h-[85dvh] overflow-y-auto
                    animate-sheet-up safe-bottom"
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between p-4 border-b border-green-dark">
          {title && (
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary
                       min-w-[44px] min-h-[44px] flex items-center justify-center ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
