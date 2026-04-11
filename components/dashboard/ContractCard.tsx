/* ============================================
   ContractCard
   HQ dashboard card for the daily Contract.
   Self-loading: reads today's daily_contracts row,
   generates one via POST /api/generate-contract if missing,
   listens for contract-complete events to flip state,
   auto-self-heals progress via updateContractProgress on mount.
   ============================================ */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { Crosshair, Eye, ListChecks, Lock, Check, Plus } from "lucide-react";
import { todayLocalISO, contractExpiry, formatCountdown } from "@/lib/missions/date";
import type { DailyContract, ContractType, ProgressKey } from "@/types/missions";
import LogProgressModal from "@/components/mission/LogProgressModal";

// Map a contract type to its tag variant. Controls tag colour, icon
// tint, progress bar fill, and the LOG PROGRESS button accent. Bounty
// stays gold (the original), Scavenger gets sand, Recon gets teal.
const VARIANT_BY_TYPE: Record<ContractType, "gold" | "scavenger" | "recon"> = {
  bounty: "gold",
  scavenger: "scavenger",
  recon: "recon",
};

// Accent colour classes matching each variant, used for the icon and
// progress bar fill since those can't read the variant off Card alone.
const TYPE_ACCENT_TEXT: Record<ContractType, string> = {
  bounty: "text-xp-gold",
  scavenger: "text-scavenger",
  recon: "text-recon",
};

const TYPE_ACCENT_BG: Record<ContractType, string> = {
  bounty: "bg-xp-gold",
  scavenger: "bg-scavenger",
  recon: "bg-recon",
};

function iconFor(type: ContractType, muted: boolean) {
  const cls = muted ? "text-text-secondary mt-1" : `${TYPE_ACCENT_TEXT[type]} mt-1`;
  if (type === "bounty") return <Crosshair size={18} className={cls} />;
  if (type === "recon") return <Eye size={18} className={cls} />;
  return <ListChecks size={18} className={cls} />;
}

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

export default function ContractCard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState(1);
  const [contract, setContract] = useState<DailyContract | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const reload = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Pull rank first (gated at rank 2+)
    const { data: rankRow } = await supabase
      .from("ranks")
      .select("current_rank")
      .eq("user_id", user.id)
      .maybeSingle();
    const currentRank = rankRow?.current_rank ?? 1;
    setRank(currentRank);

    if (currentRank < 2) {
      setLoading(false);
      return;
    }

    const today = todayLocalISO();
    const { data: existing } = await supabase
      .from("daily_contracts")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      setContract(existing as DailyContract);
      // Self-heal: recompute progress from source rows in case a hook
      // fired while we were offline or the page was unmounted.
      try {
        const { updateContractProgress } = await import("@/lib/missions/progress");
        const updated = await updateContractProgress(supabase, user.id);
        if (updated) setContract(updated);
      } catch (err) {
        console.warn("[ContractCard] progress recompute failed:", err);
      }
      setLoading(false);
      return;
    }

    // Not present yet -- best-effort generate
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const res = await fetch("/api/generate-contract", { method: "POST" });
        if (res.ok) {
          const { contract: generated } = await res.json();
          if (generated) setContract(generated as DailyContract);
        }
      } catch (err) {
        console.warn("[ContractCard] generation failed:", err);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  // React to completion events dispatched by updateContractProgress
  useEffect(() => {
    function handler() {
      reload();
    }
    window.addEventListener("contract-complete", handler);
    return () => window.removeEventListener("contract-complete", handler);
  }, [reload]);

  // 1-second tick so the countdown stays live. Minimal perf cost for
  // a single component on HQ, and keeps mm:ss accurate when time is
  // short without extra bookkeeping.
  useEffect(() => {
    if (!contract || contract.completed) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [contract]);

  // Computed countdown display based on the contract's date and the
  // latest nowMs tick. Memoised so the JSX stays stable across ticks
  // when nothing relevant has changed.
  const countdown = useMemo(() => {
    if (!contract) return null;
    return formatCountdown(contractExpiry(contract.date), nowMs);
  }, [contract, nowMs]);

  if (loading) return <div className="skeleton h-28 w-full" />;

  // Rank 2 gate
  if (rank < 2) {
    return (
      <Card tag="CLASSIFIED" tagVariant="locked" scanLines>
        <div className="flex items-start gap-3">
          <Lock size={18} className="text-text-secondary mt-1" />
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              Contracts Locked
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Unlock at Rank 2 (Private). Prove yourself in the field first.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Generation failed and nothing cached
  if (!contract) {
    return (
      <Card tag="CONTRACT" tagVariant="gold" scanLines>
        <div className="flex items-start gap-3">
          <Crosshair size={18} className="text-text-secondary mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              No contract available
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              HQ comms offline. Check back shortly.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const pct = clampPct(contract.current_value, contract.target_value);
  const completed = contract.completed;
  const type = contract.contract_type;
  const tagText = completed ? "COMPLETE" : type.toUpperCase();
  const tagVariant: "complete" | "gold" | "scavenger" | "recon" = completed
    ? "complete"
    : VARIANT_BY_TYPE[type];
  const canLog = !completed && supportsManualLog(contract.progress_key);

  // Accent colour classes derived from the type
  const accentTextClass = TYPE_ACCENT_TEXT[type];
  const accentBgClass = TYPE_ACCENT_BG[type];
  // Border colour for the LOG button: map type → the right border util
  const accentBorderClass =
    type === "bounty"
      ? "border-xp-gold"
      : type === "scavenger"
        ? "border-scavenger"
        : "border-recon";
  // Hover bg tint (10% opacity)
  const accentHoverBgClass =
    type === "bounty"
      ? "hover:bg-xp-gold/10"
      : type === "scavenger"
        ? "hover:bg-scavenger/10"
        : "hover:bg-recon/10";

  return (
    <>
      <Card tag={tagText} tagVariant={tagVariant} scanLines>
        <div className="flex items-start gap-3">
          {completed ? (
            <Check size={18} className="text-green-light mt-1" />
          ) : (
            iconFor(type, false)
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              {contract.title}
            </h3>
            <p
              className={`text-xs mt-1 ${
                completed ? "text-text-secondary" : "text-text-primary"
              }`}
            >
              {contract.description}
            </p>

            <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
              <Tag variant={completed ? "complete" : VARIANT_BY_TYPE[type]}>
                {`+${contract.xp_value} XP`}
              </Tag>
              {countdown && !completed && (
                <Tag variant={countdown.urgent ? "danger" : "default"}>
                  {countdown.text}
                </Tag>
              )}
            </div>

            {/* Progress bar -- chunkier so it reads at a glance */}
            <div className="mt-3 h-2 bg-green-darkest w-full overflow-hidden border border-green-dark">
              <div
                className={`h-full transition-all duration-500 ${
                  completed ? "bg-green-light" : accentBgClass
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
                {contract.current_value} / {contract.target_value} {contract.unit}
              </p>
              <p
                className={`text-[0.6rem] font-mono uppercase tracking-wider ${accentTextClass}`}
              >
                {pct}%
              </p>
            </div>

            {/* Manual log button (rep-based contracts only) */}
            {canLog && (
              <button
                type="button"
                onClick={() => setLogModalOpen(true)}
                className={`mt-3 w-full flex items-center justify-center gap-1 py-2 border ${accentBorderClass} ${accentTextClass} ${accentHoverBgClass} transition-colors font-mono text-[0.65rem] uppercase tracking-wider min-h-[36px]`}
              >
                <Plus size={14} /> LOG PROGRESS
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
          progressKey={contract.progress_key}
          label={labelForKey(contract.progress_key)}
          unit={contract.unit}
          current={contract.current_value}
          target={contract.target_value}
        />
      )}
    </>
  );
}
