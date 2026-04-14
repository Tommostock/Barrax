/* ============================================
   ObjectivesCard
   Single card showing both the daily Contract and
   the monthly Classified Op as compact rows inside
   a shared frame. Replaces the two separate
   ContractCard + ClassifiedOpCard components with
   a single component that:

   - Loads contract + op + rank in one pass
   - Generates either if missing (best-effort, online)
   - Listens for completion events and re-loads
   - Self-heals progress via updateMissionsProgress
   - Renders rank-2 lock state for contracts
   - Dispatches open-classified-op on tap
   - Exposes a LOG PROGRESS button for rep-based
     contracts/ops via the shared LogProgressModal
   - Shows per-row countdowns (1s tick for contract,
     1m tick for op) using the formatCountdown helper

   Visually: classification tag at top, two mission
   rows inside. Each row is icon · title · progress
   bar · countdown · (optional) log-plus button.
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
  todayLocalISO,
  monthStartLocalISO,
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

// ---------- Helpers (same rules as the old cards) ----------

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
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState(1);
  const [contract, setContract] = useState<DailyContract | null>(null);
  const [op, setOp] = useState<ClassifiedOp | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Log-progress modal state. Shared by both rows; the selected row
  // decides which progress key to log against.
  const [logTarget, setLogTarget] = useState<
    | { kind: "contract"; row: DailyContract }
    | { kind: "op"; row: ClassifiedOp }
    | null
  >(null);

  // ---------- Data load ----------
  const reload = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Rank (for contract gating)
    const { data: rankRow } = await supabase
      .from("ranks")
      .select("current_rank")
      .eq("user_id", user.id)
      .maybeSingle();
    const currentRank = rankRow?.current_rank ?? 1;
    setRank(currentRank);

    // 2. Load existing contract + op in parallel
    const today = todayLocalISO();
    const monthStart = monthStartLocalISO();
    const [contractRes, opRes] = await Promise.all([
      currentRank >= 2
        ? supabase
            .from("daily_contracts")
            .select("*")
            .eq("user_id", user.id)
            .eq("date", today)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("classified_ops")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_start", monthStart)
        .maybeSingle(),
    ]);

    let loadedContract = (contractRes.data as DailyContract | null) ?? null;
    let loadedOp = (opRes.data as ClassifiedOp | null) ?? null;

    // 3. Self-heal progress on anything we found
    if (loadedContract || loadedOp) {
      try {
        const { updateContractProgress, updateOpProgress } = await import(
          "@/lib/missions/progress"
        );
        if (loadedContract) {
          const updated = await updateContractProgress(supabase, user.id);
          if (updated) loadedContract = updated;
        }
        if (loadedOp) {
          const updated = await updateOpProgress(supabase, user.id);
          if (updated) loadedOp = updated;
        }
      } catch (err) {
        console.warn("[ObjectivesCard] progress recompute failed:", err);
      }
    }

    // 4. Best-effort generate anything missing (only online)
    if (typeof navigator !== "undefined" && navigator.onLine) {
      if (!loadedContract && currentRank >= 2) {
        try {
          const res = await fetch("/api/generate-contract", { method: "POST" });
          if (res.ok) {
            const { contract: generated } = await res.json();
            if (generated) loadedContract = generated as DailyContract;
          }
        } catch (err) {
          console.warn("[ObjectivesCard] contract generation failed:", err);
        }
      }
      if (!loadedOp) {
        try {
          const res = await fetch("/api/generate-classified-op", { method: "POST" });
          if (res.ok) {
            const { op: generated } = await res.json();
            if (generated) loadedOp = generated as ClassifiedOp;
          }
        } catch (err) {
          console.warn("[ObjectivesCard] op generation failed:", err);
        }
      }
    }

    setContract(loadedContract);
    setOp(loadedOp);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Re-fetch on completion events dispatched by the progress engine
  useEffect(() => {
    function handler() {
      reload();
    }
    window.addEventListener("contract-complete", handler);
    window.addEventListener("classified-op-complete", handler);
    return () => {
      window.removeEventListener("contract-complete", handler);
      window.removeEventListener("classified-op-complete", handler);
    };
  }, [reload]);

  // 1s tick so the contract countdown is live. Op countdown measures
  // in days so the same tick is more than fast enough.
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
  function openOpBriefing() {
    if (!op) return;
    window.dispatchEvent(new CustomEvent("open-classified-op", { detail: op }));
  }

  // ---------- Render ----------
  if (loading) return <div className="skeleton h-36 w-full" />;

  // Rank 2 gate -- no contracts yet, but still show op if we have one
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

        {/* Divider between the two rows */}
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

      {/* Shared log-progress modal, wired by the current logTarget */}
      {logTarget && (
        <LogProgressModal
          isOpen={logTarget !== null}
          onClose={() => setLogTarget(null)}
          onLogged={reload}
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

// ---------- Subcomponents (inline rows) ----------

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

        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 bg-green-darkest w-full overflow-hidden border border-green-dark">
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

        <div className="mt-1.5 h-1.5 bg-green-darkest w-full overflow-hidden border border-green-dark">
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
