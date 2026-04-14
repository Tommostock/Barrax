/* ============================================
   ObjectivesCard
   Single card showing both the daily Contract and
   the monthly Classified Op as compact rows inside
   a shared frame. Reads cached data from HQDataProvider
   instead of fetching on mount.

   Side effects it still owns:
     - Best-effort generation of a missing contract or op
       via the /api/generate-* endpoints
     - Self-heal of current_value via updateMissionsProgress
     - Refresh the HQ provider after any of the above
   Completion events (contract-complete / classified-op-complete)
   are picked up by the provider automatically.
   ============================================ */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import {
  Crosshair,
  Eye,
  ListChecks,
  Lock,
  Check,
  Shield,
  Plus,
} from "lucide-react";
import {
  contractExpiry,
  classifiedOpExpiry,
  formatCountdown,
} from "@/lib/missions/date";
import type {
  DailyContract,
  ClassifiedOp,
  ContractType,
  ProgressKey,
} from "@/types/missions";
import LogProgressModal from "@/components/mission/LogProgressModal";
import { useHQData } from "@/components/providers/HQDataProvider";

// ---------- Helpers ----------

const TYPE_ACCENT_TEXT: Record<ContractType, string> = {
  bounty: "text-xp-gold",
  scavenger: "text-xp-gold",
  recon: "text-recon",
};

const TYPE_ACCENT_BG: Record<ContractType, string> = {
  bounty: "bg-xp-gold",
  scavenger: "bg-xp-gold",
  recon: "bg-recon",
};

function contractIcon(type: ContractType, className: string) {
  if (type === "bounty") return <Crosshair size={16} className={className} />;
  if (type === "recon") return <Eye size={16} className={className} />;
  return <ListChecks size={16} className={className} />;
}

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
export default function ObjectivesCard() {
  const supabase = createClient();
  const { data, loading, refresh } = useHQData();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [triedGeneration, setTriedGeneration] = useState(false);

  // Log-progress modal state. Shared by both rows; the selected row
  // decides which progress key to log against.
  const [logTarget, setLogTarget] = useState<
    | { kind: "contract"; row: DailyContract }
    | { kind: "op"; row: ClassifiedOp }
    | null
  >(null);

  const rank = data?.rankLevel ?? 1;
  const contract = data?.contract ?? null;
  const op = data?.op ?? null;

  // ---------- Best-effort generation of missing contract/op ----------
  // Runs once per HQ visit. The server routes are idempotent so this
  // is safe even if the DB already has a row. Only attempted when the
  // provider has loaded AND we're online AND the row is genuinely
  // missing.
  useEffect(() => {
    if (loading || triedGeneration) return;
    if (!data) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    async function generateMissing() {
      let mutated = false;

      if (!contract && rank >= 2) {
        try {
          const res = await fetch("/api/generate-contract", { method: "POST" });
          if (res.ok) mutated = true;
        } catch (err) {
          console.warn("[ObjectivesCard] contract generation failed:", err);
        }
      }
      if (!op) {
        try {
          const res = await fetch("/api/generate-classified-op", { method: "POST" });
          if (res.ok) mutated = true;
        } catch (err) {
          console.warn("[ObjectivesCard] op generation failed:", err);
        }
      }
      if (mutated) refresh();
    }

    setTriedGeneration(true);
    generateMissing();
  }, [loading, triedGeneration, data, contract, op, rank, refresh]);

  // ---------- Self-heal progress on mount ----------
  // The progress engine runs from workout/meal/run hooks, but if a hook
  // was missed (e.g. offline, tab unmounted mid-write) we reconcile
  // here so HQ always shows the freshest aggregate.
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
        // updateMissionsProgress writes to Supabase but doesn't update
        // our local cache -- trigger a refresh so the bar moves.
        if (!cancelled) refresh();
      } catch (err) {
        console.warn("[ObjectivesCard] progress recompute failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only run once per data load, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.rank?.current_rank, contract?.id, op?.id]);

  // ---------- Countdown tick ----------
  useEffect(() => {
    const anyLive =
      (contract && !contract.completed) || (op && !op.completed);
    if (!anyLive) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [contract, op]);

  const contractCountdown = useMemo(() => {
    if (!contract) return null;
    return formatCountdown(contractExpiry(contract.date), nowMs);
  }, [contract, nowMs]);

  const opCountdown = useMemo(() => {
    if (!op) return null;
    return formatCountdown(classifiedOpExpiry(op.month_start), nowMs);
  }, [op, nowMs]);

  // ---------- Tap handlers ----------
  const openOpBriefing = useCallback(() => {
    if (!op) return;
    window.dispatchEvent(new CustomEvent("open-classified-op", { detail: op }));
  }, [op]);

  // ---------- Render ----------
  if (loading && !data) return <div className="skeleton h-36 w-full" />;

  const contractLocked = rank < 2;

  return (
    <>
      <Card tag="OBJECTIVES" tagVariant="gold">
        {/* ---------- CONTRACT ROW ---------- */}
        {contractLocked ? (
          <ContractLockedRow />
        ) : contract ? (
          <ContractRow
            contract={contract}
            countdownText={contractCountdown?.text ?? ""}
            countdownUrgent={contractCountdown?.urgent ?? false}
            onLog={
              supportsManualLog(contract.progress_key) && !contract.completed
                ? () => setLogTarget({ kind: "contract", row: contract })
                : null
            }
          />
        ) : (
          <EmptyRow label="NO CONTRACT AVAILABLE" />
        )}

        <div className="my-3 h-px bg-green-dark" />

        {/* ---------- CLASSIFIED OP ROW ---------- */}
        {op ? (
          <OpRow
            op={op}
            countdownText={opCountdown?.text ?? ""}
            countdownUrgent={opCountdown?.urgent ?? false}
            onOpenBriefing={openOpBriefing}
            onLog={
              supportsManualLog(op.progress_key) && !op.completed
                ? () => setLogTarget({ kind: "op", row: op })
                : null
            }
          />
        ) : (
          <EmptyRow label="NO OPERATION ACTIVE" />
        )}
      </Card>

      {logTarget && (
        <LogProgressModal
          isOpen={logTarget !== null}
          onClose={() => setLogTarget(null)}
          onLogged={refresh}
          progressKey={logTarget.row.progress_key}
          label={labelForKey(logTarget.row.progress_key)}
          unit={logTarget.row.unit}
          current={logTarget.row.current_value}
          target={logTarget.row.target_value}
        />
      )}
    </>
  );
}

// ---------- Subcomponents ----------

function ContractLockedRow() {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
        <Lock size={14} className="text-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
          Daily Contract
        </p>
        <p className="text-sm font-heading uppercase tracking-wider text-sand">
          Locked
        </p>
        <p className="text-[0.6rem] font-mono text-text-secondary mt-0.5">
          Unlocks at Rank 2
        </p>
      </div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
        <Crosshair size={14} className="text-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
          {label}
        </p>
        <p className="text-[0.6rem] font-mono text-text-secondary mt-0.5">
          HQ comms offline. Check back shortly.
        </p>
      </div>
    </div>
  );
}

function ContractRow({
  contract,
  countdownText,
  countdownUrgent,
  onLog,
}: {
  contract: DailyContract;
  countdownText: string;
  countdownUrgent: boolean;
  onLog: (() => void) | null;
}) {
  const pct = clampPct(contract.current_value, contract.target_value);
  const completed = contract.completed;
  const type = contract.contract_type;
  const accentText = TYPE_ACCENT_TEXT[type];
  const accentBg = TYPE_ACCENT_BG[type];

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
        {completed ? (
          <Check size={14} className="text-green-light" />
        ) : (
          contractIcon(type, accentText)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
            Contract · {type}
          </p>
          {!completed && countdownText && (
            <p
              className={`text-[0.55rem] font-mono uppercase tracking-wider ${
                countdownUrgent ? "text-danger" : "text-text-secondary"
              }`}
            >
              {countdownText}
            </p>
          )}
        </div>
        <p className="text-sm font-heading uppercase tracking-wider text-sand truncate">
          {contract.title}
        </p>

        <div className="mt-1.5 h-1.5 bg-bg-input w-full overflow-hidden border border-green-dark">
          <div
            className={`h-full transition-all duration-500 ${
              completed ? "bg-green-light" : accentBg
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            {contract.current_value} / {contract.target_value} {contract.unit} · +{contract.xp_value} XP
          </p>
          {onLog && (
            <button
              type="button"
              onClick={onLog}
              className={`flex items-center gap-0.5 text-[0.55rem] font-mono uppercase tracking-wider ${accentText} hover:opacity-80 transition-opacity min-h-[28px] px-2`}
              aria-label="Log contract progress"
            >
              <Plus size={12} /> LOG
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OpRow({
  op,
  countdownText,
  countdownUrgent,
  onOpenBriefing,
  onLog,
}: {
  op: ClassifiedOp;
  countdownText: string;
  countdownUrgent: boolean;
  onOpenBriefing: () => void;
  onLog: (() => void) | null;
}) {
  const pct = clampPct(op.current_value, op.target_value);
  const completed = op.completed;

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={onOpenBriefing}
        className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-danger flex items-center justify-center flex-shrink-0 active:opacity-70 transition-opacity"
        aria-label="Open classified op briefing"
      >
        {completed ? (
          <Check size={14} className="text-green-light" />
        ) : (
          <Shield size={14} className="text-danger" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
            Classified Op
          </p>
          {!completed && countdownText && (
            <p
              className={`text-[0.55rem] font-mono uppercase tracking-wider ${
                countdownUrgent ? "text-danger" : "text-text-secondary"
              }`}
            >
              {countdownText}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenBriefing}
          className="text-sm font-heading uppercase tracking-wider text-sand truncate text-left w-full hover:opacity-80 transition-opacity"
        >
          {op.codename}
        </button>

        <div className="mt-1.5 h-1.5 bg-bg-input w-full overflow-hidden border border-green-dark">
          <div
            className={`h-full transition-all duration-500 ${
              completed ? "bg-green-light" : "bg-danger"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            {op.current_value} / {op.target_value} {op.unit} · +{op.xp_value} XP
          </p>
          {onLog && (
            <button
              type="button"
              onClick={onLog}
              className="flex items-center gap-0.5 text-[0.55rem] font-mono uppercase tracking-wider text-xp-gold hover:opacity-80 transition-opacity min-h-[28px] px-2"
              aria-label="Log op progress"
            >
              <Plus size={12} /> LOG
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
