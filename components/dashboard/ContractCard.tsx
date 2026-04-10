/* ============================================
   ContractCard
   HQ dashboard card for the daily Contract.
   Self-loading: reads today's daily_contracts row,
   generates one via POST /api/generate-contract if missing,
   listens for contract-complete events to flip state,
   auto-self-heals progress via updateContractProgress on mount.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { Crosshair, Eye, ListChecks, Lock, Check } from "lucide-react";
import { todayLocalISO } from "@/lib/missions/date";
import type { DailyContract, ContractType } from "@/types/missions";

function iconFor(type: ContractType, muted: boolean) {
  const cls = muted ? "text-text-secondary mt-1" : "text-xp-gold mt-1";
  if (type === "bounty") return <Crosshair size={20} className={cls} />;
  if (type === "recon") return <Eye size={20} className={cls} />;
  return <ListChecks size={20} className={cls} />;
}

function clampPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export default function ContractCard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState(1);
  const [contract, setContract] = useState<DailyContract | null>(null);

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

  if (loading) return <div className="skeleton h-28 w-full" />;

  // Rank 2 gate
  if (rank < 2) {
    return (
      <Card tag="CLASSIFIED" tagVariant="locked">
        <div className="flex items-start gap-3">
          <Lock size={20} className="text-text-secondary mt-1" />
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
      <Card tag="CONTRACT" tagVariant="gold">
        <div className="flex items-start gap-3">
          <Crosshair size={20} className="text-text-secondary mt-1" />
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
  const tagText = completed
    ? "COMPLETE"
    : contract.contract_type.toUpperCase();
  const tagVariant = completed ? "complete" : "gold";

  return (
    <Card tag={tagText} tagVariant={tagVariant}>
      <div className="flex items-start gap-3">
        {completed ? (
          <Check size={20} className="text-green-light mt-1" />
        ) : (
          iconFor(contract.contract_type, false)
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

          <div className="flex items-center gap-2 mt-2">
            <Tag variant={completed ? "complete" : "gold"}>
              {`+${contract.xp_value} XP`}
            </Tag>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-green-darkest w-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                completed ? "bg-green-light" : "bg-xp-gold"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[0.6rem] font-mono text-text-secondary mt-1 uppercase tracking-wider">
            {contract.current_value} / {contract.target_value} {contract.unit}
          </p>
        </div>
      </div>
    </Card>
  );
}
