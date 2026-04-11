/* ============================================
   PlankTestModal
   Full-screen plank hold test. Flow:
     1. 3-2-1 countdown (beeps)
     2. Large mm:ss stopwatch counting up
     3. STOP submits the duration in seconds

   On finish: writes via recordTestResult, fires a toast if PR.
   ============================================ */

"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordTestResult } from "@/lib/fitness/tests";
import { countdownBeep, completeBeep } from "@/lib/workout-audio";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (result: { value: number; isPR: boolean }) => void;
}

type Phase = "countdown" | "holding" | "saving";

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlankTestModal({ isOpen, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPhase("countdown");
      setCountdown(3);
      setElapsed(0);
      setError(null);
    }
  }, [isOpen]);

  // 3-2-1 countdown
  useEffect(() => {
    if (!isOpen || phase !== "countdown") return;
    if (countdown === 0) {
      completeBeep();
      startTimeRef.current = Date.now();
      setPhase("holding");
      return;
    }
    countdownBeep();
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isOpen, phase, countdown]);

  // Stopwatch
  useEffect(() => {
    if (phase !== "holding") return;
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  // Escape closes (except mid-save)
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase !== "saving") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, phase, onClose]);

  async function handleStop() {
    if (elapsed <= 0) {
      setError("Hold for at least 1 second");
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("saving");
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setPhase("holding");
      return;
    }

    const { isPR } = await recordTestResult({
      userId: user.id,
      testType: "plank_hold",
      value: elapsed,
      unit: "seconds",
    });

    onSaved({ value: elapsed, isPR });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pft-plank-title"
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col"
    >
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)", paddingBottom: "16px" }}
      >
        <h2
          id="pft-plank-title"
          className="text-sm font-heading uppercase tracking-wider text-sand"
        >
          Plank Hold Test
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

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {phase === "countdown" && (
          <>
            <p className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-text-secondary mb-4">
              Get into plank position
            </p>
            <p className="text-[8rem] font-heading text-xp-gold leading-none">
              {countdown > 0 ? countdown : "HOLD"}
            </p>
          </>
        )}

        {phase !== "countdown" && (
          <>
            <p className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-text-secondary mb-2">
              Elapsed
            </p>
            <p className="text-[9rem] font-heading text-xp-gold leading-none tabular-nums">
              {formatMMSS(elapsed)}
            </p>
            <p className="mt-4 text-xs font-mono uppercase tracking-wider text-text-secondary text-center">
              Hold the plank. Tap STOP when you break form.
            </p>
          </>
        )}

        {error && (
          <p className="mt-4 text-xs font-mono uppercase text-danger">{error}</p>
        )}
      </div>

      <div
        className="px-4"
        style={{ paddingTop: "16px", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        {phase === "holding" && (
          <Button fullWidth onClick={handleStop}>
            STOP TEST
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
