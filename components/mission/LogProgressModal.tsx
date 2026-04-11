/* ============================================
   LogProgressModal
   Lets the user manually tally progress toward a
   contract or classified op without having to start
   a full workout. Writes a row to mission_manual_log
   which feeds into computeProgress().

   Shown for rep-based progress keys only -- other
   keys (meals, runs, water) are tracked from their
   natural source tables so manual entry would be
   redundant.
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import { X, Plus, Minus } from "lucide-react";
import type { ProgressKey } from "@/types/missions";

interface LogProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful log so the parent can refresh its state. */
  onLogged: () => void;
  /** The progress key to log against (e.g. "reps_exercise:push_up"). */
  progressKey: ProgressKey;
  /** Human label for the thing being logged (e.g. "Push-ups"). */
  label: string;
  /** Unit to show next to numbers (e.g. "reps"). */
  unit: string;
  /** Current progress, for context. */
  current: number;
  /** Target to reach. */
  target: number;
}

/** Quick-add buttons that slot under the number input. */
const QUICK_ADDS = [5, 10, 25, 50];

export default function LogProgressModal({
  isOpen,
  onClose,
  onLogged,
  progressKey,
  label,
  unit,
  current,
  target,
}: LogProgressModalProps) {
  const supabase = createClient();
  const [amount, setAmount] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the amount whenever the modal is opened fresh
  useEffect(() => {
    if (isOpen) {
      setAmount(10);
      setError(null);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remaining = Math.max(0, target - current);
  const projected = current + amount;
  const willComplete = projected >= target;

  async function handleSubmit() {
    if (amount <= 0) return;
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("mission_manual_log").insert({
      user_id: user.id,
      progress_key: progressKey,
      amount,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Trigger a mission progress recompute -- this will pick up the
    // new manual log row and flip the card to complete if we've hit
    // the target. Fire-and-forget.
    import("@/lib/missions/progress")
      .then(({ updateMissionsProgress }) => updateMissionsProgress(supabase, user.id))
      .catch(() => {});

    setSaving(false);
    onLogged();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-progress-title"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-bg-panel border border-green-dark relative"
        style={{
          paddingTop: "24px",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-text-secondary hover:text-sand min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={20} />
        </button>

        <h2
          id="log-progress-title"
          className="text-sm font-heading uppercase tracking-wider text-sand mb-1"
        >
          Log Progress
        </h2>
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
          {label}
        </p>

        {/* Current/target row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Tag variant="default">
            {`${current} / ${target} ${unit.toUpperCase()}`}
          </Tag>
          {remaining > 0 && (
            <Tag variant="gold">{`${remaining} TO GO`}</Tag>
          )}
        </div>

        {/* Number input with +/- buttons */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setAmount((a) => Math.max(1, a - 1))}
            aria-label="Decrease"
            className="min-w-[48px] min-h-[48px] border border-green-dark text-text-secondary hover:text-sand flex items-center justify-center"
          >
            <Minus size={18} />
          </button>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              setAmount(Number.isFinite(next) && next > 0 ? next : 1);
            }}
            className="flex-1 min-w-0 px-4 py-3 bg-bg-input border border-green-dark text-text-primary text-center text-xl font-mono focus:border-green-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setAmount((a) => a + 1)}
            aria-label="Increase"
            className="min-w-[48px] min-h-[48px] border border-green-dark text-text-secondary hover:text-sand flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Quick-add buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_ADDS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount((a) => a + n)}
              className="py-2 text-xs font-mono uppercase tracking-wider text-text-secondary border border-green-dark hover:text-green-light hover:border-green-primary transition-colors min-h-[40px]"
            >
              +{n}
            </button>
          ))}
        </div>

        {/* Preview / projection */}
        {willComplete ? (
          <p className="text-xs font-mono uppercase tracking-wider text-green-light text-center mb-4">
            This will complete the mission.
          </p>
        ) : (
          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary text-center mb-4">
            New total: {projected} / {target} {unit}
          </p>
        )}

        {error && (
          <p className="text-xs text-danger font-mono uppercase text-center mb-3">
            {error}
          </p>
        )}

        <Button fullWidth onClick={handleSubmit} disabled={saving || amount <= 0}>
          {saving ? "LOGGING..." : `ADD ${amount} ${unit.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
}
