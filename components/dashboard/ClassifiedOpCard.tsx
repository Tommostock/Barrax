/* ============================================
   ClassifiedOpCard (compact, half-width)
   Paired with ContractCard in a two-column grid
   on HQ. Reads the op from HQDataProvider.

   Side effects owned here:
     - Best-effort generation of this month's op
       if missing (once per HQ visit, idempotent)
     - Tap the card to open the full briefing
       overlay (via the open-classified-op event
       picked up by ClassifiedOpBriefingOverlay
       mounted in the layout)
     - LogProgressModal for rep-based ops
     - Live countdown (1-minute tick; ops measure
       in days, not seconds)

   Progress self-heal is owned by ContractCard to
   avoid double writes.
   ============================================ */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Card from "@/components/ui/Card";
import { Plus } from "lucide-react";
import {
  classifiedOpExpiry,
  formatCountdown,
} from "@/lib/missions/date";
import type { ProgressKey } from "@/types/missions";
import LogProgressModal from "@/components/mission/LogProgressModal";
import { useHQData } from "@/components/providers/HQDataProvider";

// ---------- Helpers ----------

function clampPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function supportsManualLog(key: ProgressKey): boolean {
  return key.startsWith("reps_exercise:") || key === "reps_any";
}

function labelForKey(key: ProgressKey): string {
  if (key.startsWith("reps_exercise:")) {
    const name = key.split(":")[1] ?? "";
    return (
      name
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("-") + "s"
    );
  }
  if (key === "reps_any") return "Total Reps";
  return "Progress";
}

// Strip markdown bold markers and grab the first sentence-ish chunk
// of the briefing for the card preview. The full briefing still
// renders in the overlay when the card is tapped.
function briefingSnippet(briefing: string): string {
  const cleaned = briefing.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const firstPara = cleaned.split("\n\n")[0] ?? cleaned;
  return firstPara;
}

// ---------- Component ----------
export default function ClassifiedOpCard() {
  const { data, loading, refresh } = useHQData();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [triedGeneration, setTriedGeneration] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const op = data?.op ?? null;

  // ---------- Generation ----------
  useEffect(() => {
    if (loading || triedGeneration) return;
    if (!data) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (op) {
      setTriedGeneration(true);
      return;
    }

    setTriedGeneration(true);
    (async () => {
      try {
        const res = await fetch("/api/generate-classified-op", {
          method: "POST",
        });
        if (res.ok) refresh();
      } catch (err) {
        console.warn("[ClassifiedOpCard] generation failed:", err);
      }
    })();
  }, [loading, triedGeneration, data, op, refresh]);

  // ---------- Countdown tick (1 min) ----------
  useEffect(() => {
    if (!op || op.completed) return;
    const interval = setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, [op]);

  const countdown = useMemo(() => {
    if (!op) return null;
    return formatCountdown(classifiedOpExpiry(op.month_start), nowMs);
  }, [op, nowMs]);

  // ---------- Tap handlers ----------
  const openBriefing = useCallback(() => {
    if (!op) return;
    window.dispatchEvent(new CustomEvent("open-classified-op", { detail: op }));
  }, [op]);

  // ---------- Render ----------
  if (loading && !data) return <div className="skeleton h-full w-full" />;

  if (!op) {
    return (
      <Card tag="CLASSIFIED" tagVariant="danger">
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
            Classified · pending
          </p>
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            Standing by
          </p>
          <p className="text-[0.6rem] font-mono text-text-secondary leading-snug">
            Command radio silent. A new high-value operation will be assigned
            on the next sync.
          </p>
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mt-auto pt-2">
            Pull to refresh
          </p>
        </div>
      </Card>
    );
  }

  const pct = clampPct(op.current_value, op.target_value);
  const completed = op.completed;
  const canLog = !completed && supportsManualLog(op.progress_key);
  const snippet = briefingSnippet(op.briefing);

  return (
    <>
      <Card
        tag={completed ? "MISSION ACCOMPLISHED" : "CLASSIFIED"}
        tagVariant={completed ? "complete" : "danger"}
        onClick={openBriefing}
      >
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1 relative">
          {/* COMPLETE watermark (behind content) */}
          {completed && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-heading text-4xl text-green-light opacity-10 rotate-12"
            >
              COMPLETE
            </span>
          )}

          {/* Label (icon removed) */}
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary relative">
            Classified · {op.tier} · {op.category}
          </p>

          {/* Codename (2 lines max) */}
          <p className="text-sm font-heading uppercase tracking-wider text-sand line-clamp-2 leading-snug w-full relative">
            {op.codename}
          </p>

          {/* Briefing snippet — first paragraph, 3 lines max */}
          {snippet && (
            <p className="text-[0.6rem] font-mono text-text-secondary line-clamp-3 leading-snug w-full relative">
              {snippet}
            </p>
          )}

          {/* Countdown + XP on one compact line */}
          {!completed && countdown && (
            <p className="text-[0.55rem] font-mono uppercase tracking-wider relative">
              <span
                className={
                  countdown.urgent ? "text-danger" : "text-text-secondary"
                }
              >
                {countdown.text}
              </span>
              <span className="text-xp-gold"> · +{op.xp_value} XP</span>
            </p>
          )}
          {completed && (
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-xp-gold relative">
              +{op.xp_value} XP · CLEARED
            </p>
          )}

          {/* Progress bar anchored to bottom */}
          <div className="w-full mt-auto pt-2 relative">
            <div className="h-1.5 bg-bg-input w-full overflow-hidden border border-green-dark">
              <div
                className={`h-full transition-all duration-500 ${
                  completed ? "bg-green-light" : "bg-danger"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mt-0.5 tabular-nums truncate">
              {op.current_value} / {op.target_value} {op.unit}
            </p>
          </div>

          {/* LOG button -- stopPropagation so tapping it doesn't
              open the briefing overlay */}
          {canLog && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLogOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1 py-1 mt-1 border border-xp-gold text-xp-gold hover:bg-xp-gold/10 transition-colors font-mono text-[0.55rem] uppercase tracking-wider min-h-[28px] relative"
              aria-label="Log op progress"
            >
              <Plus size={12} /> LOG PROGRESS
            </button>
          )}
        </div>
      </Card>

      {canLog && (
        <LogProgressModal
          isOpen={logOpen}
          onClose={() => setLogOpen(false)}
          onLogged={refresh}
          progressKey={op.progress_key}
          label={labelForKey(op.progress_key)}
          unit={op.unit}
          current={op.current_value}
          target={op.target_value}
        />
      )}
    </>
  );
}
