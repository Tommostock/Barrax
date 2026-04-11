/* ============================================
   ClassifiedOpBriefingOverlay
   Full-screen "redacted classified document" briefing,
   mounted once in app/(app)/layout.tsx alongside RankUpOverlay.
   Event-driven: listens for open-classified-op CustomEvent.
   Closes on Escape, backdrop click, or close button.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";
import Tag from "@/components/ui/Tag";
import { X } from "lucide-react";
import type { ClassifiedOp, OpTier } from "@/types/missions";

const TIER_LABEL: Record<OpTier, string> = {
  standard: "STANDARD",
  hard: "HARD",
  elite: "ELITE",
};

function clampPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function monthYearFromDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleString("en-GB", { month: "long", year: "numeric" })
    .toUpperCase();
}

/** Convert **bold** markers to <strong> + preserve \n\n paragraph breaks. */
function renderBriefing(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export default function ClassifiedOpBriefingOverlay() {
  const [op, setOp] = useState<ClassifiedOp | null>(null);

  const close = useCallback(() => setOp(null), []);

  // Listen for open events from ClassifiedOpCard
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<ClassifiedOp>).detail;
      if (detail) setOp(detail);
    }
    window.addEventListener("open-classified-op", handler);
    return () => window.removeEventListener("open-classified-op", handler);
  }, []);

  // Escape to close
  useEffect(() => {
    if (!op) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [op, close]);

  if (!op) return null;

  const pct = clampPct(op.current_value, op.target_value);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="classified-op-codename"
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-page-enter"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md bg-bg-panel border-2 border-danger p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top classified bar */}
        <div className="border-b-2 border-danger pb-2 mb-4">
          <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-danger text-center">
            CLASSIFIED — EYES ONLY — {monthYearFromDate(op.month_start)}
          </p>
        </div>

        {/* Close button (top right) */}
        <button
          type="button"
          onClick={close}
          aria-label="Close briefing"
          className="absolute top-4 right-4 text-text-secondary hover:text-sand transition-colors"
        >
          <X size={20} />
        </button>

        {/* Codename */}
        <h2
          id="classified-op-codename"
          className="font-heading text-2xl text-sand uppercase tracking-wider mb-2"
        >
          {op.codename}
        </h2>

        {/* Tier + category tags */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Tag variant={op.completed ? "complete" : "danger"}>
            {TIER_LABEL[op.tier]}
          </Tag>
          <Tag variant="default">{op.category.toUpperCase()}</Tag>
          <Tag variant="gold">{`+${op.xp_value} XP`}</Tag>
          {op.completed && <Tag variant="complete">MISSION ACCOMPLISHED</Tag>}
        </div>

        {/* Large progress bar */}
        <div className="mb-2">
          <div className="h-2 bg-green-darkest w-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                op.completed ? "bg-green-light" : "bg-danger"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[0.65rem] font-mono text-text-secondary mt-1 uppercase tracking-wider">
            {op.current_value} / {op.target_value} {op.unit} ({pct}%)
          </p>
        </div>

        {/* Briefing prose */}
        <div
          className="mt-5 text-sm text-text-primary leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: renderBriefing(op.briefing) }}
        />

        {/* Bottom REDACTED stamp */}
        <div className="mt-6 pt-4 border-t border-danger/40 relative">
          <p className="font-mono text-[0.55rem] uppercase tracking-wider text-text-secondary text-center">
            Document issued by BARRAX HQ. Unauthorised distribution prohibited.
          </p>
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-4 right-0 font-heading text-4xl text-danger opacity-20 rotate-[-8deg]"
          >
            REDACTED
          </span>
        </div>

        {/* Close text button */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={close}
            className="font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-sand transition-colors"
          >
            [ CLOSE ]
          </button>
        </div>
      </div>
    </div>
  );
}
