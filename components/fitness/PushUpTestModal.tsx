/* ============================================
   PushUpTestModal
   Full-screen push-up max test. Flow:
     1. 3-2-1 countdown (beeps, matches the run tracker cadence)
     2. Giant + button the user taps for every rep
        (-1 button for mis-counts)
     3. FINISH at the bottom submits the count

   On finish: writes via recordTestResult, fires a toast if PR.
   ============================================ */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordTestResult } from "@/lib/fitness/tests";
import { countdownBeep, completeBeep } from "@/lib/workout-audio";
import Button from "@/components/ui/Button";
import { X, Plus, Minus } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful test save so parent can reload. */
  onSaved: (result: { value: number; isPR: boolean }) => void;
}

type Phase = "countdown" | "counting" | "saving";

export default function PushUpTestModal({ isOpen, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [reps, setReps] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase("countdown");
      setCountdown(3);
      setReps(0);
      setError(null);
    }
  }, [isOpen]);

  // Drive the 3-2-1 countdown
  useEffect(() => {
    if (!isOpen || phase !== "countdown") return;
    if (countdown === 0) {
      completeBeep();
      setPhase("counting");
      return;
    }
    countdownBeep();
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isOpen, phase, countdown]);

  // Escape closes the modal (except mid-save)
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase !== "saving") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, phase, onClose]);

  const addRep = useCallback(() => {
    navigator.vibrate?.(10);
    setReps((r) => r + 1);
  }, []);

  const subRep = useCallback(() => {
    navigator.vibrate?.(5);
    setReps((r) => Math.max(0, r - 1));
  }, []);

  async function handleFinish() {
    if (reps <= 0) {
      setError("Log at least 1 rep");
      return;
    }
    setPhase("saving");
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setPhase("counting");
      return;
    }

    const { isPR } = await recordTestResult({
      userId: user.id,
      testType: "push_up_max",
      value: reps,
      unit: "reps",
    });

    onSaved({ value: reps, isPR });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pft-pushup-title"
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
    >
      {/* Top bar: title + close */}
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "16px" }}
      >
        <h2
          id="pft-pushup-title"
          className="text-sm font-heading uppercase tracking-wider text-sand"
        >
          Push-Up Max Test
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel test"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-sand"
          disabled={phase === "saving"}
        >
          <X size={24} />
        </button>
      </div>

      {/* Phase body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {phase === "countdown" && (
          <>
            <p className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-text-secondary mb-4">
              Assume the position
            </p>
            <p className="text-[8rem] font-heading text-xp-gold leading-none">
              {countdown > 0 ? countdown : "GO"}
            </p>
          </>
        )}

        {phase !== "countdown" && (
          <>
            <p className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-text-secondary mb-2">
              Reps
            </p>
            <p className="text-[9rem] font-heading text-xp-gold leading-none tabular-nums">
              {reps}
            </p>

            {/* Big tap-to-add button */}
            <button
              type="button"
              onClick={addRep}
              aria-label="Add rep"
              className="mt-8 w-40 h-40 border-2 border-xp-gold bg-xp-gold/10 text-xp-gold flex items-center justify-center active:bg-xp-gold/20 transition-colors"
              disabled={phase === "saving"}
            >
              <Plus size={56} strokeWidth={3} />
            </button>

            {/* Minus button for mis-counts */}
            <button
              type="button"
              onClick={subRep}
              aria-label="Subtract rep"
              className="mt-4 px-6 py-2 border border-text-secondary text-text-secondary hover:text-sand font-mono text-xs uppercase tracking-wider flex items-center gap-2 min-h-[40px]"
              disabled={phase === "saving" || reps === 0}
            >
              <Minus size={14} /> Miscount
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-xs font-mono uppercase text-danger">{error}</p>
        )}
      </div>

      {/* Bottom bar: FINISH */}
      <div
        className="px-4"
        style={{ paddingTop: "16px", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        {phase === "counting" && (
          <Button fullWidth onClick={handleFinish} disabled={reps <= 0}>
            FINISH TEST
          </Button>
        )}
        {phase === "saving" && (
          <p className="text-center text-xs font-mono uppercase tracking-wider text-text-secondary py-3">
            Saving result...
          </p>
        )}
      </div>
    </div>
  );
}
