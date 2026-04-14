/* ============================================
   ContractCard (compact, half-width)
   Paired with ClassifiedOpCard in a two-column grid
   on HQ. Reads the contract from HQDataProvider.

   Side effects owned here:
     - Best-effort generation of today's contract if
       missing (once per HQ visit, idempotent server
       route)
     - Progress self-heal via updateMissionsProgress,
       which also updates the op so ClassifiedOpCard
       doesn't need to run it separately
     - Shared LogProgressModal for rep-based contracts
     - Live countdown (1s tick until complete)
     - Rank-2 gate (shows a locked state below rank 2)
   ============================================ */

"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { Plus } from "lucide-react";
import {
  contractExpiry,
  formatCountdown,
} from "@/lib/missions/date";
import type { ContractType, ProgressKey } from "@/types/missions";
import { RANK_THRESHOLDS } from "@/types";
import LogProgressModal from "@/components/mission/LogProgressModal";
import { useHQData } from "@/components/providers/HQDataProvider";

// ---------- Helpers ----------

const VARIANT_BY_TYPE: Record<ContractType, "gold" | "scavenger" | "recon"> = {
  bounty: "gold",
  scavenger: "scavenger",
  recon: "recon",
};

const TYPE_ACCENT_BG: Record<ContractType, string> = {
  bounty: "bg-xp-gold",
  scavenger: "bg-xp-gold",
  recon: "bg-recon",
};

// Tagline shown under the title when there's no description text
// yet (generation fallback) — keeps the card from looking empty.
const TYPE_TAGLINE: Record<ContractType, string> = {
  bounty: "High-value target. Execute with prejudice.",
  scavenger: "Forage, gather, return with the spoils.",
  recon: "Observe. Report. Leave no trace.",
};

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
export default function ContractCard() {
  const supabase = createClient();
  const { data, loading, refresh } = useHQData();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [triedGeneration, setTriedGeneration] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const rank = data?.rankLevel ?? 1;
  const contract = data?.contract ?? null;
  const op = data?.op ?? null; // read op too so self-heal updates both
  const totalXp = data?.rank?.total_xp ?? 0;

  // ---------- Generation ----------
  useEffect(() => {
    if (loading || triedGeneration) return;
    if (!data) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (rank < 2) return;
    if (contract) {
      setTriedGeneration(true);
      return;
    }

    setTriedGeneration(true);
    (async () => {
      try {
        const res = await fetch("/api/generate-contract", { method: "POST" });
        if (res.ok) refresh();
      } catch (err) {
        console.warn("[ContractCard] generation failed:", err);
      }
    })();
  }, [loading, triedGeneration, data, contract, rank, refresh]);

  // ---------- Self-heal progress ----------
  // Shared for both contract + op since updateMissionsProgress touches
  // both tables. ClassifiedOpCard does NOT run its own self-heal to
  // avoid duplicate writes.
  useEffect(() => {
    if (!data || (!contract && !op)) return;
    let cancelled = false;
    (async () => {
      try {
        const { updateMissionsProgress } = await import("@/lib/missions/progress");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        await updateMissionsProgress(supabase, user.id);
        if (!cancelled) refresh();
      } catch (err) {
        console.warn("[ContractCard] self-heal failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.rank?.current_rank, contract?.id, op?.id]);

  // ---------- Countdown tick ----------
  useEffect(() => {
    if (!contract || contract.completed) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [contract]);

  const countdown = useMemo(() => {
    if (!contract) return null;
    return formatCountdown(contractExpiry(contract.date), nowMs);
  }, [contract, nowMs]);

  // ---------- Render ----------
  if (loading && !data) return <div className="skeleton h-full w-full" />;

  // Rank < 2 gate
  if (rank < 2) {
    const rank2Threshold = RANK_THRESHOLDS[1]?.xp ?? 200;
    const xpToRank2 = Math.max(0, rank2Threshold - totalXp);
    const progressToRank2 = clampPct(totalXp, rank2Threshold);
    return (
      <Card tag="LOCKED" tagVariant="locked">
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
            Contract · locked
          </p>
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            Insufficient clearance
          </p>
          <p className="text-[0.6rem] font-mono text-text-secondary leading-snug">
            Daily bounty, scavenger and recon contracts unlock at{" "}
            <span className="text-sand">Private (Rank 2)</span>.
          </p>

          {/* Progress toward rank 2 */}
          <div className="w-full mt-auto pt-2">
            <div className="flex items-center justify-between text-[0.55rem] font-mono uppercase tracking-wider tabular-nums">
              <span className="text-text-secondary">To rank 2</span>
              <span className="text-xp-gold">
                {xpToRank2.toLocaleString()} XP
              </span>
            </div>
            <div className="h-1.5 bg-bg-input w-full overflow-hidden border border-green-dark mt-1">
              <div
                className="h-full bg-xp-gold transition-all duration-500"
                style={{ width: `${progressToRank2}%` }}
              />
            </div>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mt-0.5 tabular-nums">
              {totalXp.toLocaleString()} / {rank2Threshold.toLocaleString()} XP
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // No contract yet (generation still pending or failed)
  if (!contract) {
    return (
      <Card tag="CONTRACT" tagVariant="gold">
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
            Contract · pending
          </p>
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            Standing by
          </p>
          <p className="text-[0.6rem] font-mono text-text-secondary leading-snug">
            HQ comms offline. A new daily contract will be issued on the next
            refresh.
          </p>
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mt-auto pt-2">
            Pull to refresh
          </p>
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
  const accentBg = TYPE_ACCENT_BG[type];
  const canLog = !completed && supportsManualLog(contract.progress_key);
  const description =
    contract.description?.trim() || TYPE_TAGLINE[type];

  return (
    <>
      <Card tag={tagText} tagVariant={tagVariant}>
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
          {/* Label (icon removed) */}
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
            Contract · {contract.difficulty}
          </p>

          {/* Title (2 lines max) */}
          <p className="text-sm font-heading uppercase tracking-wider text-sand line-clamp-2 leading-snug w-full">
            {contract.title}
          </p>

          {/* Description / flavour (3 lines max) */}
          <p className="text-[0.6rem] font-mono text-text-secondary line-clamp-3 leading-snug w-full">
            {description}
          </p>

          {/* Countdown + XP on one compact line */}
          {!completed && countdown && (
            <p className="text-[0.55rem] font-mono uppercase tracking-wider">
              <span
                className={
                  countdown.urgent ? "text-danger" : "text-text-secondary"
                }
              >
                {countdown.text}
              </span>
              <span className="text-xp-gold"> · +{contract.xp_value} XP</span>
            </p>
          )}
          {completed && (
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-xp-gold">
              +{contract.xp_value} XP · CLEARED
            </p>
          )}

          {/* Progress bar anchored to bottom */}
          <div className="w-full mt-auto pt-2">
            <div className="h-1.5 bg-bg-input w-full overflow-hidden border border-green-dark">
              <div
                className={`h-full transition-all duration-500 ${
                  completed ? "bg-green-light" : accentBg
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mt-0.5 tabular-nums truncate">
              {contract.current_value} / {contract.target_value} {contract.unit}
            </p>
          </div>

          {/* LOG button for rep-based contracts */}
          {canLog && (
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className={`w-full flex items-center justify-center gap-1 py-1 mt-1 border ${
                type === "recon"
                  ? "border-recon text-recon"
                  : "border-xp-gold text-xp-gold"
              } hover:opacity-80 transition-opacity font-mono text-[0.55rem] uppercase tracking-wider min-h-[28px]`}
              aria-label="Log contract progress"
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
