/* ============================================
   WORKOUT PLAYER Page
   Full-screen workout execution with three phases:
   1. Mission Briefing — preview workout, then DEPLOY
   2. Active Workout   — exercise-by-exercise execution
   3. Mission Debrief  — summary, XP, and dismiss

   Route: /missions/player/[id]
   The [id] is the workout row UUID from the workouts table.
   ============================================ */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Timer from "@/components/ui/Timer";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import MusicBar from "@/components/workout/MusicBar";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Check,
  Clock,
  Zap,
  ChevronLeft,
  Music,
  Minus,
  Plus,
} from "lucide-react";
import {
  countdownBeep,
  completeBeep,
  exerciseCompleteSound,
  workoutCompleteSound,
  restOverBeep,
} from "@/lib/workout-audio";
import { requestWakeLock, releaseWakeLock } from "@/lib/wake-lock";
import type { WorkoutData, WorkoutExercise } from "@/types";

// ──────────────────────────────────────────────
// Types local to this page
// ──────────────────────────────────────────────

/** Which phase the player is in */
type Phase = "briefing" | "active" | "debrief";

/** What is happening inside the "active" phase */
type ActiveSubPhase = "exercise" | "rest";

/** Tracks the result for each exercise so we can save it later */
interface ExerciseResult {
  name: string;
  setsCompleted: number;
  repsCompleted: number | null;
  durationSeconds: number | null;
  skipped: boolean;
  orderIndex: number;
}

// ──────────────────────────────────────────────
// Helper: build a flat list of all exercises in order
// (warmup -> exercises -> cooldown) so the player
// can step through them one by one.
// ──────────────────────────────────────────────

function flattenExercises(data: WorkoutData): WorkoutExercise[] {
  return [
    ...(data.warmup ?? []),
    ...(data.exercises ?? []),
    ...(data.cooldown ?? []),
  ];
}

// ──────────────────────────────────────────────
// Helper: calculate XP from total duration
// ──────────────────────────────────────────────

function calculateXP(totalSeconds: number): number {
  const minutes = totalSeconds / 60;
  if (minutes < 15) return 30;
  if (minutes < 30) return 50;
  return 80;
}

// ──────────────────────────────────────────────
// Helper: format seconds into MM:SS or HH:MM:SS
// ──────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

// ──────────────────────────────────────────────
// Helper: estimate remaining time from remaining exercises
// ──────────────────────────────────────────────

function estimateRemainingSeconds(
  exercises: WorkoutExercise[],
  currentIndex: number,
  currentSet: number
): number {
  let total = 0;

  for (let i = currentIndex; i < exercises.length; i++) {
    const ex = exercises[i];
    const setsLeft = i === currentIndex ? ex.sets - currentSet + 1 : ex.sets;
    const perSet = ex.reps ? 30 : (ex.duration_seconds ?? 30);
    total += setsLeft * (perSet + (ex.rest_seconds ?? 0));
  }

  return total;
}

// ==============================================================
// MAIN COMPONENT
// ==============================================================

export default function WorkoutPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  // ── Data state ──
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Phase state ──
  const [phase, setPhase] = useState<Phase>("briefing");

  // ── Active-phase state ──
  const [allExercises, setAllExercises] = useState<WorkoutExercise[]>([]);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [subPhase, setSubPhase] = useState<ActiveSubPhase>("exercise");
  const [paused, setPaused] = useState(false);

  // Unique key that increments each time a rest period starts,
  // so the Timer component always resets even if the duration is the same.
  const [restKey, setRestKey] = useState(0);

  // ── Timing state ──
  // Total elapsed seconds — tracked manually so we can pause it.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // ── Results tracking ──
  const [results, setResults] = useState<ExerciseResult[]>([]);

  // ── Finish confirmation ──
  // Two-tap safety: first tap shows "confirm?", second tap ends the workout
  const [confirmFinish, setConfirmFinish] = useState(false);

  // ── Debrief state ──
  const [xpEarned, setXpEarned] = useState(0);
  const [saving, setSaving] = useState(false);

  // ── Post-workout difficulty rating ──
  const [rating, setRating] = useState<number | null>(null);

  // ── Feature 1: Audio countdown timer tracking ──
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Feature 2: "Well done" moment before rest ──
  const [showWellDone, setShowWellDone] = useState(false);

  // ── Feature 3: Green flash on exercise complete ──
  const [showFlash, setShowFlash] = useState(false);

  // ── Feature 5: Rep counter with +/- ──
  const [actualReps, setActualReps] = useState<number>(0);

  // ── Feature 6: Set-by-set tracking per exercise ──
  const [completedSetsForExercise, setCompletedSetsForExercise] = useState<number[]>([]);

  // ── Feature 8: Workout history per exercise ──
  const [exerciseHistory, setExerciseHistory] = useState<string | null>(null);

  // ────────────────────────────────────────────
  // 1. Load workout from Supabase on mount
  // ────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Get the authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be signed in.");
          setLoading(false);
          return;
        }
        // Fetch the workout row
        const { data: workout, error: fetchErr } = await supabase
          .from("workouts")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchErr || !workout) {
          setError("Workout not found.");
          setLoading(false);
          return;
        }

        setWorkoutId(workout.id);
        const wd = workout.workout_data as WorkoutData;
        setWorkoutData(wd);
        setAllExercises(flattenExercises(wd));
      } catch {
        setError("Failed to load workout.");
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ────────────────────────────────────────────
  // 2. Elapsed clock — runs while active & not paused
  // ────────────────────────────────────────────

  useEffect(() => {
    // Only tick when we are in the active phase and not paused
    if (phase !== "active" || paused) {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      return;
    }

    elapsedRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [phase, paused]);

  // ────────────────────────────────────────────
  // Feature 1: Audio countdown beeps for timer exercises
  // ────────────────────────────────────────────

  // Initialize secondsLeft when exercise changes or subPhase changes to exercise
  useEffect(() => {
    if (phase !== "active" || subPhase !== "exercise") {
      setSecondsLeft(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    const exercise = allExercises[currentExIndex];
    if (!exercise || !exercise.duration_seconds) {
      setSecondsLeft(null);
      return;
    }

    // Set initial seconds left
    setSecondsLeft(exercise.duration_seconds);

    // Start countdown interval
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [phase, subPhase, currentExIndex, currentSet, allExercises]);

  // Pause/resume the countdown with the main pause
  useEffect(() => {
    if (paused && countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    } else if (!paused && phase === "active" && subPhase === "exercise") {
      const exercise = allExercises[currentExIndex];
      if (exercise?.duration_seconds && secondsLeft !== null && secondsLeft > 0) {
        countdownRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev === null || prev <= 0) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Play beeps based on secondsLeft
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft === 3 || secondsLeft === 2 || secondsLeft === 1) {
      countdownBeep();
    }
    if (secondsLeft === 0) {
      completeBeep();
    }
  }, [secondsLeft]);

  // ────────────────────────────────────────────
  // Feature 4: Cleanup wake lock on unmount
  // ────────────────────────────────────────────

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  // ────────────────────────────────────────────
  // Feature 5: Reset actualReps when exercise/set changes
  // ────────────────────────────────────────────

  useEffect(() => {
    const exercise = allExercises[currentExIndex];
    if (exercise && exercise.reps) {
      setActualReps(exercise.reps);
    } else {
      setActualReps(0);
    }
  }, [currentExIndex, currentSet, allExercises]);

  // ────────────────────────────────────────────
  // Feature 6: Reset completed sets when exercise changes
  // ────────────────────────────────────────────

  useEffect(() => {
    setCompletedSetsForExercise([]);
  }, [currentExIndex]);

  // ────────────────────────────────────────────
  // Feature 8: Load exercise history when exercise changes
  // ────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "active") return;
    const exercise = allExercises[currentExIndex];
    if (!exercise) return;

    setExerciseHistory(null);

    async function loadHistory() {
      try {
        const { data } = await supabase
          .from("workout_exercises")
          .select("sets_completed, reps_completed, duration_seconds")
          .eq("exercise_name", exercise.name)
          .eq("skipped", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const prev = data[0];
          if (prev.reps_completed) {
            setExerciseHistory(`Last time: ${prev.sets_completed}x${prev.reps_completed}`);
          } else if (prev.duration_seconds) {
            setExerciseHistory(`Last time: ${prev.sets_completed}x${prev.duration_seconds}s`);
          }
        }
      } catch {
        // Silently fail — history is a nice-to-have
      }
    }

    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentExIndex, allExercises]);

  // ────────────────────────────────────────────
  // 3. Actions
  // ────────────────────────────────────────────

  /** Start the workout (transition from briefing -> active) */
  const handleDeploy = useCallback(async () => {
    startTimeRef.current = new Date();

    // Feature 4: Keep screen awake
    requestWakeLock();

    // Mark workout as "in_progress" in the database
    if (workoutId) {
      await supabase
        .from("workouts")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", workoutId);
    }

    setPhase("active");
  }, [workoutId, supabase]);

  /** Complete the current set (or final set of the exercise) */
  const handleCompleteExercise = useCallback(() => {
    const exercise = allExercises[currentExIndex];
    if (!exercise) return;

    // Haptic feedback on supported devices
    navigator.vibrate?.(100);

    // Feature 1: Play exercise complete sound
    exerciseCompleteSound();

    // Feature 3: Flash green
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    // Feature 6: Track this set as completed
    setCompletedSetsForExercise((prev) => [...prev, currentSet]);

    // If there are more sets left, show rest screen then advance
    if (currentSet < exercise.sets) {
      // Feature 2: Show "EXERCISE DONE" briefly before rest
      setShowWellDone(true);
      setTimeout(() => {
        setShowWellDone(false);
        setSubPhase("rest");
        setRestKey((k) => k + 1);
      }, 1000);
      setCurrentSet((prev) => prev + 1);
      return;
    }

    // All sets done for this exercise — record the result
    const isRepBased = !exercise.duration_seconds && exercise.reps;
    setResults((prev) => [
      ...prev,
      {
        name: exercise.name,
        setsCompleted: exercise.sets,
        repsCompleted: isRepBased ? actualReps : exercise.reps,
        durationSeconds: exercise.duration_seconds,
        skipped: false,
        orderIndex: currentExIndex,
      },
    ]);

    // Move to next exercise (or finish)
    moveToNextExercise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises, currentExIndex, currentSet, actualReps]);

  /** Skip the current exercise entirely */
  const handleSkipExercise = useCallback(() => {
    const exercise = allExercises[currentExIndex];
    if (!exercise) return;

    // Record as skipped
    setResults((prev) => [
      ...prev,
      {
        name: exercise.name,
        setsCompleted: 0,
        repsCompleted: null,
        durationSeconds: null,
        skipped: true,
        orderIndex: currentExIndex,
      },
    ]);

    moveToNextExercise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises, currentExIndex]);

  /** Shared logic to advance to the next exercise or finish */
  function moveToNextExercise() {
    const nextIndex = currentExIndex + 1;

    if (nextIndex >= allExercises.length) {
      // No more exercises — transition to debrief
      finishWorkout();
      return;
    }

    // Feature 2: Show "EXERCISE DONE" briefly before rest
    setShowWellDone(true);
    setTimeout(() => {
      setShowWellDone(false);
      setSubPhase("rest");
      setRestKey((k) => k + 1);
    }, 1000);

    setCurrentExIndex(nextIndex);
    setCurrentSet(1);
  }

  /** When rest timer ends naturally */
  const handleRestComplete = useCallback(() => {
    // Feature 1: Play rest over beep
    restOverBeep();
    setSubPhase("exercise");
  }, []);

  /** Skip the rest timer and go straight to the next exercise */
  const handleSkipRest = useCallback(() => {
    setSubPhase("exercise");
  }, []);

  /** Toggle pause */
  const handleTogglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  /** Finish the workout early — records completed exercises,
      marks remaining as skipped, and transitions to debrief. */
  const handleFinishEarly = useCallback(() => {
    if (!confirmFinish) {
      // First tap: show confirmation
      setConfirmFinish(true);
      // Auto-reset after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirmFinish(false), 3000);
      return;
    }
    // Second tap: actually finish
    setConfirmFinish(false);
    finishWorkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmFinish]);

  // ────────────────────────────────────────────
  // Feature 10: Music app launcher
  // ────────────────────────────────────────────

  const handleOpenMusic = useCallback(() => {
    // Try Spotify deep link first, fallback to web after 1 second
    const spotifyWindow = window.open("spotify://", "_blank");
    setTimeout(() => {
      // If the window is null or didn't navigate, open web player
      if (!spotifyWindow || spotifyWindow.closed) {
        window.open("https://open.spotify.com", "_blank");
      }
    }, 1000);
  }, []);

  // ────────────────────────────────────────────
  // 4. Finish & save results
  // ────────────────────────────────────────────

  async function finishWorkout() {
    setPhase("debrief");
    setSaving(true);

    // Feature 1: Play workout complete sound
    workoutCompleteSound();

    // Feature 4: Release wake lock
    releaseWakeLock();

    const totalDuration = elapsedSeconds;
    const xp = calculateXP(totalDuration);
    setXpEarned(xp);

    try {
      // 4a. Update the workout row
      if (workoutId) {
        await supabase
          .from("workouts")
          .update({
            status: "complete",
            completed_at: new Date().toISOString(),
            duration_seconds: totalDuration,
            xp_earned: xp,
          })
          .eq("id", workoutId);
      }

      // 4b. Insert individual exercise logs into workout_exercises
      // We include the results collected during the workout AND any
      // exercises that were never reached (treat them as skipped).
      const allResults: ExerciseResult[] = [...results];

      // Add any exercises we never got to (they are implicitly skipped)
      allExercises.forEach((ex, idx) => {
        const alreadyLogged = allResults.some((r) => r.orderIndex === idx);
        if (!alreadyLogged) {
          allResults.push({
            name: ex.name,
            setsCompleted: 0,
            repsCompleted: null,
            durationSeconds: null,
            skipped: true,
            orderIndex: idx,
          });
        }
      });

      if (workoutId) {
        const rows = allResults.map((r) => ({
          workout_id: workoutId,
          exercise_name: r.name,
          sets_completed: r.setsCompleted,
          reps_completed: r.repsCompleted,
          duration_seconds: r.durationSeconds,
          skipped: r.skipped,
          order_index: r.orderIndex,
        }));

        await supabase.from("workout_exercises").insert(rows);
      }

      // 4c. Award XP + fire notification for workout complete and rank-up
      const { completeWorkoutAndNotify } = await import("@/lib/award-and-notify");
      await completeWorkoutAndNotify(xp, totalDuration);

      // Check and award badges
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { checkWorkoutBadges, checkTimeBadges } = await import("@/lib/badges");
        const { notifyBadgeEarned } = await import("@/lib/notifications");
        const badgeResults = await checkWorkoutBadges(user.id);
        const timeBadges = await checkTimeBadges(user.id, new Date());
        for (const badge of [...badgeResults, ...timeBadges]) {
          notifyBadgeEarned(badge);
        }

        // Check personal records
        const { checkWorkoutRecords } = await import("@/lib/records");
        const { notifyPersonalRecord } = await import("@/lib/notifications");
        const newPRs = await checkWorkoutRecords(user.id, totalDuration);
        for (const pr of newPRs) {
          notifyPersonalRecord(pr, "");
        }

        // Check if all workouts in the programme are now complete
        if (workoutId) {
          const { data: programmeWorkouts } = await supabase
            .from("workouts")
            .select("status")
            .eq("programme_id", (await supabase.from("workouts").select("programme_id").eq("id", workoutId).single()).data?.programme_id);

          const allComplete = programmeWorkouts?.every(w => w.status === "complete");
          if (allComplete && programmeWorkouts && programmeWorkouts.length > 0) {
            const { awardXPAndNotify } = await import("@/lib/award-and-notify");
            await awardXPAndNotify(200, "weekly_programme_complete");
            const { showNotification } = await import("@/lib/notifications");
            showNotification("FULL PROGRAMME COMPLETE", "All missions cleared this week. +200 XP bonus.", "programme-complete");
          }
        }
      }
    } catch (err) {
      console.error("Error saving workout results:", err);
    } finally {
      setSaving(false);
    }
  }

  // ────────────────────────────────────────────
  // 5. Derived values
  // ────────────────────────────────────────────

  const completedCount = results.filter((r) => !r.skipped).length;
  const skippedCount = results.filter((r) => r.skipped).length;
  const totalExerciseCount = allExercises.length;

  // Feature 9: Estimated time remaining
  const estimatedRemaining = phase === "active"
    ? estimateRemainingSeconds(allExercises, currentExIndex, currentSet)
    : 0;
  const estimatedMinutes = Math.max(1, Math.round(estimatedRemaining / 60));

  // ────────────────────────────────────────────
  // 6. Render
  // ────────────────────────────────────────────

  // — Loading state —
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="font-mono text-text-secondary text-sm uppercase tracking-wider animate-pulse">
          Preparing orders, soldier...
        </p>
      </div>
    );
  }

  // — Error state —
  if (error || !workoutData) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-mono text-danger text-sm">{error ?? "Mission failed to load"}</p>
        <Button variant="secondary" onClick={() => router.push("/missions")}>
          <span className="flex items-center gap-2">
            <ChevronLeft size={16} /> RETURN TO BASE
          </span>
        </Button>
      </div>
    );
  }

  // =============================================
  // PHASE 1: MISSION BRIEFING
  // =============================================

  if (phase === "briefing") {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        {/* Header with back button */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => router.push("/missions")}
            className="text-text-secondary hover:text-green-light transition-colors min-h-[44px] flex items-center"
            aria-label="Back to missions"
          >
            <ChevronLeft size={24} />
          </button>
          <Tag variant="active">COMBAT BRIEFING</Tag>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {/* Workout name */}
          <h1 className="text-3xl font-heading uppercase tracking-wider text-sand mt-4 mb-1">
            {workoutData.name}
          </h1>

          {/* Workout type and duration */}
          <div className="flex items-center gap-4 mb-4">
            <Tag variant="default">{workoutData.type.replace(/_/g, " ")}</Tag>
            <span className="flex items-center gap-1 text-xs font-mono text-text-secondary">
              <Clock size={14} /> {workoutData.duration_minutes} MIN
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-xp-gold">
              <Zap size={14} /> +{workoutData.xp_value} XP
            </span>
          </div>

          {/* BIG START BUTTON — right at the top, impossible to miss */}
          <Button fullWidth onClick={handleDeploy} className="mb-6 py-4">
            <span className="flex items-center justify-center gap-3 text-lg">
              <Play size={24} /> START WORKOUT
            </span>
          </Button>

          {/* Exercise list preview (scrollable below the start button) */}
          <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider mb-3">
            {allExercises.length} EXERCISES — PREVIEW
          </p>

          {/* Warmup section (if any) */}
          {workoutData.warmup && workoutData.warmup.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">
                Warmup
              </h3>
              <div className="space-y-2">
                {workoutData.warmup.map((ex, i) => (
                  <ExerciseBriefingRow key={`warmup-${i}`} exercise={ex} />
                ))}
              </div>
            </div>
          )}

          {/* Main exercises */}
          {workoutData.exercises && workoutData.exercises.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">
                Exercises
              </h3>
              <div className="space-y-2">
                {workoutData.exercises.map((ex, i) => (
                  <ExerciseBriefingRow key={`ex-${i}`} exercise={ex} />
                ))}
              </div>
            </div>
          )}

          {/* Cooldown section (if any) */}
          {workoutData.cooldown && workoutData.cooldown.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">
                Cooldown
              </h3>
              <div className="space-y-2">
                {workoutData.cooldown.map((ex, i) => (
                  <ExerciseBriefingRow key={`cooldown-${i}`} exercise={ex} />
                ))}
              </div>
            </div>
          )}

          {/* Total XP available */}
          <div className="mt-6 border border-green-dark bg-bg-panel p-4 flex items-center justify-between">
            <span className="text-xs font-heading uppercase tracking-wider text-text-secondary">
              Total XP Available
            </span>
            <span className="flex items-center gap-1 font-mono text-lg font-bold text-xp-gold">
              <Zap size={18} /> {workoutData.xp_value}
            </span>
          </div>
        </div>

        {/* Sticky bottom START button — backup for users who scroll past the top one */}
        <div className="sticky bottom-0 left-0 right-0 p-3 bg-bg-primary/95 backdrop-blur-sm border-t border-green-dark">
          <Button fullWidth onClick={handleDeploy}>
            <span className="flex items-center justify-center gap-2">
              <Play size={18} /> START WORKOUT
            </span>
          </Button>
        </div>
      </div>
    );
  }

  // =============================================
  // PHASE 2: ACTIVE WORKOUT
  // =============================================

  const currentExercise = allExercises[currentExIndex] ?? null;

  if (phase === "active" && currentExercise) {
    const isTimerExercise = !!currentExercise.duration_seconds;
    const isRepExercise = !isTimerExercise && !!currentExercise.reps;
    const totalSets = currentExercise.sets || 1;

    return (
      <div className="fixed inset-0 z-[100] bg-bg-primary flex flex-col">
        {/* Feature 3: Green flash overlay */}
        {showFlash && (
          <div
            className="fixed inset-0 z-[200] bg-green-primary/30 pointer-events-none"
            style={{
              animation: "fadeOut 300ms ease-out forwards",
            }}
          />
        )}

        {/* Feature 2: "EXERCISE DONE" well done moment */}
        {showWellDone && (
          <div className="fixed inset-0 z-[150] bg-bg-primary flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-primary/20 border-2 border-green-primary mb-4">
                <Check size={32} className="text-green-light" />
              </div>
              <h2 className="text-2xl font-heading uppercase tracking-wider text-green-light">
                EXERCISE DONE
              </h2>
            </div>
          </div>
        )}

        {/* ── Top bar: elapsed time, estimated remaining, music, and finish ── */}
        <div className="px-4 pb-2 flex items-center justify-between" style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 50px)" }}>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-secondary" />
            <span className="font-mono text-sm text-text-secondary">
              {formatTime(elapsedSeconds)}
            </span>
            {/* Feature 9: Estimated time remaining */}
            <span className="font-mono text-xs text-text-secondary opacity-60">
              ~{estimatedMinutes}m left
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Feature 10: Music launcher */}
            <button
              onClick={handleOpenMusic}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-green-light transition-colors"
              aria-label="Open music"
            >
              <Music size={18} />
            </button>

            {/* Finish workout early — two-tap safety */}
            <button
              onClick={handleFinishEarly}
              className={`min-h-[44px] px-3 flex items-center justify-center gap-1
                         text-xs font-mono uppercase tracking-wider transition-colors
                         ${confirmFinish
                           ? "text-danger border border-danger"
                           : "text-text-secondary hover:text-sand"}`}
              aria-label="Finish workout"
            >
              <Square size={14} />
              {confirmFinish ? "CONFIRM?" : "FINISH"}
            </button>

            {/* Pause/resume toggle */}
            <button
              onClick={handleTogglePause}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-green-light transition-colors"
              aria-label={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play size={22} /> : <Pause size={22} />}
            </button>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="px-4 mb-4">
          <ProgressBar
            value={results.length}
            max={totalExerciseCount}
            showLabel
          />
        </div>

        {/* ── Pause banner — non-blocking, sits at top so you can still see the exercise ── */}
        {paused && (
          <div className="mx-4 mb-2 border border-xp-gold bg-bg-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag variant="danger">PAUSED</Tag>
              <span className="font-mono text-sm text-text-secondary">{formatTime(elapsedSeconds)}</span>
            </div>
            <Button onClick={handleTogglePause} className="px-4 py-2 text-xs">
              <span className="flex items-center gap-2"><Play size={14} /> RESUME</span>
            </Button>
          </div>
        )}

        {/* ── Rest timer between exercises / sets ── */}
        {subPhase === "rest" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <Tag variant="default">CATCH YOUR BREATH</Tag>
            <h2 className="text-xl font-heading uppercase tracking-wider text-sand">
              Recovery Timer
            </h2>

            {/* Feature 2: Show what's coming next more prominently */}
            <div className="text-center border border-green-dark bg-bg-panel px-6 py-3">
              <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-1">
                UP NEXT
              </p>
              <p className="text-lg font-heading uppercase tracking-wider text-sand">
                {currentExercise.name}
              </p>
              <p className="text-sm font-mono text-green-light mt-1">
                Round {currentSet} of {totalSets}
              </p>
            </div>

            {/* key={restKey} forces the Timer to remount and reset even if
                the duration is the same as the previous rest period */}
            <Timer
              key={restKey}
              initialSeconds={currentExercise.rest_seconds || 30}
              mode="countdown"
              running={!paused}
              onComplete={handleRestComplete}
              size="lg"
            />
            <Button variant="secondary" fullWidth onClick={handleSkipRest}>
              <span className="flex items-center justify-center gap-2">
                <SkipForward size={16} /> NO TIME FOR REST
              </span>
            </Button>
          </div>
        )}

        {/* ── Exercise display ── */}
        {subPhase === "exercise" && (
          <div className="flex-1 flex flex-col px-4 pb-2">
            {/* Feature 6: Set-by-set tracking indicators */}
            <div className="flex items-center justify-center gap-2 mb-3 mt-1">
              {Array.from({ length: totalSets }, (_, i) => {
                const setNum = i + 1;
                const isCompleted = completedSetsForExercise.includes(setNum);
                const isCurrent = setNum === currentSet;

                return (
                  <div
                    key={setNum}
                    className={`flex items-center justify-center w-8 h-8 text-xs font-mono font-bold
                      ${isCompleted
                        ? "bg-green-primary/30 border border-green-primary text-green-light"
                        : isCurrent
                          ? "bg-bg-panel border-2 border-sand text-sand"
                          : "bg-bg-panel border border-green-dark text-text-secondary opacity-50"
                      }`}
                  >
                    {isCompleted ? <Check size={14} /> : setNum}
                  </div>
                );
              })}
            </div>

            {/* Set indicator tag */}
            <div className="text-center mb-2">
              <Tag variant="active">
                {`ROUND ${currentSet} / ${totalSets}`}
              </Tag>
            </div>

            {/* Exercise name */}
            <h2 className="text-2xl font-heading uppercase tracking-wider text-sand text-center mb-1">
              {currentExercise.name}
            </h2>

            {/* Feature 8: Workout history */}
            {exerciseHistory && (
              <p className="text-xs font-mono text-text-secondary text-center mb-1">
                {exerciseHistory}
              </p>
            )}

            {/* Form cue — compact */}
            {(currentExercise.form_cue || currentExercise.description) && (
              <p className="text-sm text-text-primary text-center mb-2 max-w-xs mx-auto leading-snug">
                {currentExercise.form_cue || currentExercise.description}
              </p>
            )}

            {/* Muscle tags */}
            {currentExercise.muscles && currentExercise.muscles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                {currentExercise.muscles.map((muscle) => (
                  <span key={muscle} className="px-2 py-0.5 bg-green-primary/20 border border-green-primary/40 text-xs font-mono text-green-light uppercase">
                    {muscle}
                  </span>
                ))}
              </div>
            )}

            {/* Rep counter OR duration timer */}
            <div className="flex items-center justify-center mb-2">
              {isTimerExercise ? (
                <div className="text-center">
                  <p className="text-xs font-mono uppercase tracking-wider text-text-primary mb-1">COUNTDOWN</p>
                  <Timer
                    initialSeconds={currentExercise.duration_seconds!}
                    mode="countdown"
                    running={!paused}
                    onComplete={handleCompleteExercise}
                    size="lg"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs font-mono uppercase tracking-wider text-text-primary mb-1">TARGET REPS</p>
                  <span className="font-mono text-6xl font-bold text-sand">
                    {currentExercise.reps ?? "MAX"}
                  </span>

                  {/* Feature 5: +/- rep counter buttons */}
                  {isRepExercise && (
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <button
                        onClick={() => setActualReps((prev) => Math.max(0, prev - 1))}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-green-dark bg-bg-panel text-text-primary hover:bg-bg-panel-alt transition-colors"
                        aria-label="Decrease reps"
                      >
                        <Minus size={20} />
                      </button>
                      <div className="text-center">
                        <span className="font-mono text-3xl font-bold text-green-light">
                          {actualReps}
                        </span>
                        <p className="text-[0.6rem] font-mono uppercase tracking-wider text-text-secondary">
                          ACTUAL
                        </p>
                      </div>
                      <button
                        onClick={() => setActualReps((prev) => prev + 1)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-green-dark bg-bg-panel text-text-primary hover:bg-bg-panel-alt transition-colors"
                        aria-label="Increase reps"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Music launcher bar ── */}
        {subPhase === "exercise" && <MusicBar />}

        {/* ── Bottom action buttons ── */}
        {subPhase === "exercise" && (
          <div className="px-4 pb-8 bg-bg-primary border-t border-green-dark pt-4 space-y-3">
            <Button fullWidth onClick={handleCompleteExercise} className="py-3">
              <span className="flex items-center justify-center gap-2 text-base">
                <Check size={20} />
                {currentSet < totalSets
                  ? `DONE — ROUND ${currentSet}/${totalSets}`
                  : isRepExercise
                    ? `DONE — ${actualReps} REPS`
                    : "EXERCISE COMPLETE"}
              </span>
            </Button>
            <Button variant="secondary" fullWidth onClick={handleSkipExercise} className="py-3">
              <span className="flex items-center justify-center gap-2 text-sm">
                <SkipForward size={16} /> SKIP EXERCISE
              </span>
            </Button>
          </div>
        )}

        {/* Feature 3: CSS keyframe for flash fadeout */}
        <style jsx>{`
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // =============================================
  // PHASE 3: MISSION DEBRIEF
  // =============================================

  if (phase === "debrief") {
    // Build full results list for the summary (feature 7)
    const allResultsForSummary: ExerciseResult[] = [...results];
    allExercises.forEach((ex, idx) => {
      const alreadyLogged = allResultsForSummary.some((r) => r.orderIndex === idx);
      if (!alreadyLogged) {
        allResultsForSummary.push({
          name: ex.name,
          setsCompleted: 0,
          repsCompleted: null,
          durationSeconds: null,
          skipped: true,
          orderIndex: idx,
        });
      }
    });
    allResultsForSummary.sort((a, b) => a.orderIndex - b.orderIndex);

    return (
      <div className="fixed inset-0 z-[100] bg-bg-primary flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center px-4 py-8">
          {/* Tag */}
          <Tag variant="complete">HOSTILE ELIMINATED</Tag>

          {/* Heading */}
          <h1 className="text-3xl font-heading uppercase tracking-wider text-sand mt-6 mb-8 text-center">
            {workoutData.name}
          </h1>

          {/* Summary stats grid */}
          <div className="w-full max-w-sm space-y-4 mb-8">
            {/* Total duration */}
            <div className="flex items-center justify-between border border-green-dark bg-bg-panel p-3">
              <span className="flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-text-secondary">
                <Clock size={16} /> Duration
              </span>
              <span className="font-mono text-lg font-bold text-text-primary">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Exercises completed */}
            <div className="flex items-center justify-between border border-green-dark bg-bg-panel p-3">
              <span className="flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-text-secondary">
                <Check size={16} /> Completed
              </span>
              <span className="font-mono text-lg font-bold text-text-primary">
                {completedCount} / {totalExerciseCount}
              </span>
            </div>

            {/* Exercises skipped */}
            <div className="flex items-center justify-between border border-green-dark bg-bg-panel p-3">
              <span className="flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-text-secondary">
                <SkipForward size={16} /> Skipped
              </span>
              <span className="font-mono text-lg font-bold text-text-primary">
                {skippedCount}
              </span>
            </div>

            {/* XP earned — highlighted */}
            <div className="flex items-center justify-between border border-xp-gold bg-bg-panel p-4">
              <span className="flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-xp-gold">
                <Zap size={18} /> XP Earned
              </span>
              <span className="font-mono text-2xl font-bold text-xp-gold">
                +{xpEarned}
              </span>
            </div>
          </div>

          {/* Feature 7: Post-workout exercise summary */}
          <div className="w-full max-w-sm mb-8">
            <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-3">
              Exercise Summary
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allResultsForSummary.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-green-dark bg-bg-panel p-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {r.skipped ? (
                      <SkipForward size={14} className="text-text-secondary shrink-0" />
                    ) : (
                      <Check size={14} className="text-green-light shrink-0" />
                    )}
                    <span className="text-sm font-heading uppercase tracking-wider text-sand truncate">
                      {r.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-secondary ml-2 shrink-0">
                    {r.skipped
                      ? "SKIPPED"
                      : r.durationSeconds
                        ? `${r.setsCompleted}x${r.durationSeconds}s`
                        : r.repsCompleted
                          ? `${r.setsCompleted}x${r.repsCompleted}`
                          : `${r.setsCompleted} sets`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Post-workout difficulty rating */}
          <div className="w-full max-w-sm mb-8">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-3 text-center">
              How Did That Feel?
            </h3>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`flex flex-col items-center justify-center min-w-[52px] py-2 px-2 border text-xs font-mono transition-colors ${
                    rating === n
                      ? "bg-green-primary border-green-primary text-text-primary"
                      : "bg-bg-panel border-green-dark text-text-secondary hover:border-green-primary"
                  }`}
                >
                  <span className="text-lg font-bold">{n}</span>
                  {n === 1 && <span className="text-[0.5rem] uppercase mt-0.5">Easy</span>}
                  {n === 5 && <span className="text-[0.5rem] uppercase mt-0.5">Brutal</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Saving indicator */}
          {saving && (
            <p className="font-mono text-xs text-text-secondary mb-4 animate-pulse">
              Logging your victory...
            </p>
          )}

          {/* Dismiss button */}
          <Button
            fullWidth
            className="max-w-sm"
            onClick={async () => {
              if (rating && workoutId) {
                await supabase.from("workouts").update({ rating }).eq("id", workoutId);
              }
              router.push("/missions");
            }}
            disabled={saving}
          >
            RETURN TO BASE
          </Button>
        </div>
      </div>
    );
  }

  // Fallback (should never render, but just in case)
  return null;
}

// ──────────────────────────────────────────────
// Sub-component: Exercise row in the briefing
// ──────────────────────────────────────────────

function ExerciseBriefingRow({ exercise }: { exercise: WorkoutExercise }) {
  return (
    <div className="border border-green-dark bg-bg-panel p-3 flex items-center justify-between">
      <div>
        {/* Exercise name */}
        <p className="text-sm font-heading uppercase tracking-wider text-sand">
          {exercise.name}
        </p>
        {/* Sets x reps OR sets x duration */}
        <p className="text-xs font-mono text-text-secondary mt-1">
          {exercise.sets} set{exercise.sets > 1 ? "s" : ""}
          {exercise.reps
            ? ` x ${exercise.reps} reps`
            : exercise.duration_seconds
              ? ` x ${exercise.duration_seconds}s`
              : ""}
        </p>
      </div>
      {/* Muscle tags */}
      <div className="flex gap-1 flex-wrap justify-end">
        {exercise.muscles?.slice(0, 2).map((m) => (
          <Tag key={m} variant="default">
            {m}
          </Tag>
        ))}
      </div>
    </div>
  );
}
