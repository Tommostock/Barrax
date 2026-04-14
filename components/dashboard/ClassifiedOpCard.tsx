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
import { Shield, Check, Plus } from "lucide-react";
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
  if (loading && !data) return <div className="skeleton h-40 w-full" />;

  if (!op) {
    return (
      <Card tag="CLASSIFIED" tagVariant="danger" className="h-full">
        <div className="flex flex-col items-start gap-1 min-w-0 h-full">
          <div className="flex items-center gap-2">
            <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-danger flex items-center justify-center flex-shrink-0">
              <Shield size={14} className="text-danger" />
            </div>
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
              Classified
            </p>
          </div>
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            Standing by
          </p>
          <p className="text-[0.6rem] font-mono text-text-secondary mt-auto pt-1">
            Command radio silent
          </p>
        </div>
      </Card>
    );
  }

  const pct = clampPct(op.current_value, op.target_value);
  const completed = op.completed;
  const canLog = !completed && supportsManualLog(op.progress_key);

  return (
    <>
      <Card
        tag={completed ? "MISSION ACCOMPLISHED" : "CLASSIFIED"}
        tagVariant={completed ? "complete" : "danger"}
        onClick={openBriefing}
        className="h-full"
      >
        <div className="flex flex-col items-start gap-1 min-w-0 h-full relative">
          {/* COMPLETE watermark (behind content) */}
          {completed && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-heading text-4xl text-green-light opacity-10 rotate-12"
            >
              COMPLETE
            </span>
          )}

          {/* Icon + label */}
          <div className="flex items-center gap-2 relative">
            <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-danger flex items-center justify-center flex-shrink-0">
              {completed ? (
                <Check size={14} className="text-green-light" />
              ) : (
                <Shield size={14} className="text-danger" />
              )}
            </div>
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
              Classified
            </p>
          </div>

          {/* Codename (2 lines max) */}
          <p className="text-sm font-heading uppercase tracking-wider text-sand line-clamp-2 leading-snug w-full relative">
            {op.codename}
          </p>

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
