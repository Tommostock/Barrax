/* ============================================
   ClassifiedOpCard
   HQ dashboard card for the current month's Classified Op.
   Self-loading: reads this month's classified_ops row,
   generates via POST /api/generate-classified-op if missing,
   self-heals progress on mount, and dispatches
   open-classified-op on tap to open the full briefing overlay.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { Lock, Check, Shield, Plus } from "lucide-react";
import { monthStartLocalISO } from "@/lib/missions/date";
import type { ClassifiedOp, OpTier, ProgressKey } from "@/types/missions";
import LogProgressModal from "@/components/mission/LogProgressModal";

const TIER_LABEL: Record<OpTier, string> = {
  standard: "STANDARD",
  hard: "HARD",
  elite: "ELITE",
};

function clampPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

/** Can the user manually log progress against this key? */
function supportsManualLog(key: ProgressKey): boolean {
  return key.startsWith("reps_exercise:") || key === "reps_any";
}

/** Human label for the log-progress modal header. */
function labelForKey(key: ProgressKey): string {
  if (key.startsWith("reps_exercise:")) {
    const name = key.split(":")[1] ?? "";
    return name
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("-") + "s";
  }
  if (key === "reps_any") return "Total Reps";
  return "Progress";
}

export default function ClassifiedOpCard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [op, setOp] = useState<ClassifiedOp | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);

  const reload = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const monthStart = monthStartLocalISO();
    const { data: existing } = await supabase
      .from("classified_ops")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_start", monthStart)
      .maybeSingle();

    if (existing) {
      setOp(existing as ClassifiedOp);
      try {
        const { updateOpProgress } = await import("@/lib/missions/progress");
        const updated = await updateOpProgress(supabase, user.id);
        if (updated) setOp(updated);
      } catch (err) {
        console.warn("[ClassifiedOpCard] progress recompute failed:", err);
      }
      setLoading(false);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const res = await fetch("/api/generate-classified-op", { method: "POST" });
        if (res.ok) {
          const { op: generated } = await res.json();
          if (generated) setOp(generated as ClassifiedOp);
        }
      } catch (err) {
        console.warn("[ClassifiedOpCard] generation failed:", err);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    function handler() {
      reload();
    }
    window.addEventListener("classified-op-complete", handler);
    return () => window.removeEventListener("classified-op-complete", handler);
  }, [reload]);

  const openBriefing = () => {
    if (!op) return;
    window.dispatchEvent(new CustomEvent("open-classified-op", { detail: op }));
  };

  if (loading) return <div className="skeleton h-28 w-full" />;

  if (!op) {
    return (
      <Card tag="CLASSIFIED" tagVariant="danger">
        <div className="flex items-start gap-3">
          <Lock size={20} className="text-text-secondary mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              No operation available
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Command is radio silent. Check back shortly.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const pct = clampPct(op.current_value, op.target_value);
  const completed = op.completed;
  const tagText = completed ? "MISSION ACCOMPLISHED" : "CLASSIFIED";
  const tagVariant = completed ? "complete" : "danger";
  const canLog = !completed && supportsManualLog(op.progress_key);

  return (
    <>
      <Card tag={tagText} tagVariant={tagVariant} onClick={openBriefing}>
        {/* Background COMPLETE watermark */}
        {completed && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-heading text-5xl text-green-light opacity-10 rotate-12"
          >
            COMPLETE
          </span>
        )}

        <div className="flex items-start gap-3 relative">
          {completed ? (
            <Check size={20} className="text-green-light mt-1" />
          ) : (
            <Shield size={20} className="text-danger mt-1" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                {op.codename}
              </h3>
              <Tag variant={completed ? "complete" : "danger"}>
                {TIER_LABEL[op.tier]}
              </Tag>
            </div>
            <p
              className={`text-xs mt-1 line-clamp-1 ${
                completed ? "text-text-secondary" : "text-text-primary"
              }`}
            >
              {op.briefing.replace(/\*\*/g, "")}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <Tag variant={completed ? "complete" : "gold"}>
                {`+${op.xp_value} XP`}
              </Tag>
            </div>

            {/* Progress bar -- chunkier so it reads at a glance */}
            <div className="mt-3 h-2 bg-green-darkest w-full overflow-hidden border border-green-dark">
              <div
                className={`h-full transition-all duration-500 ${
                  completed ? "bg-green-light" : "bg-danger"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
                {op.current_value} / {op.target_value} {op.unit}
              </p>
              <p className="text-[0.6rem] font-mono text-danger uppercase tracking-wider">
                {pct}%
              </p>
            </div>

            {/* Manual log button -- stopPropagation so tapping it
                doesn't also open the briefing overlay. */}
            {canLog && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLogModalOpen(true);
                }}
                className="mt-3 w-full flex items-center justify-center gap-1 py-2 border border-xp-gold text-xp-gold hover:bg-xp-gold/10 transition-colors font-mono text-[0.65rem] uppercase tracking-wider min-h-[36px]"
              >
                <Plus size={12} /> LOG PROGRESS
              </button>
            )}
          </div>
        </div>
      </Card>

      {canLog && (
        <LogProgressModal
          isOpen={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          onLogged={reload}
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
