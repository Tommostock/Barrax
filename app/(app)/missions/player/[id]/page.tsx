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
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Check,
  Clock,
  Zap,
  ChevronLeft,
} from "lucide-react";
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
  // 3. Actions
  // ────────────────────────────────────────────

  /** Start the workout (transition from briefing -> active) */
  const handleDeploy = useCallback(async () => {
    startTimeRef.current = new Date();

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

    // If there are more sets left, show rest screen then advance
    if (currentSet < exercise.sets) {
      // Always show a rest screen between sets so the user gets
      // clear feedback that the set was recorded. Uses the exercise's
      // rest_seconds or defaults to 30s if none specified.
      setSubPhase("rest");
      setRestKey((k) => k + 1);
      setCurrentSet((prev) => prev + 1);
      return;
    }

    // All sets done for this exercise — record the result
    setResults((prev) => [
      ...prev,
      {
        name: exercise.name,
        setsCompleted: exercise.sets,
        repsCompleted: exercise.reps,
        durationSeconds: exercise.duration_seconds,
        skipped: false,
        orderIndex: currentExIndex,
      },
    ]);

    // Move to next exercise (or finish)
    moveToNextExercise(exercise);
  }, [allExercises, currentExIndex, currentSet]);

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

    moveToNextExercise(exercise);
  }, [allExercises, currentExIndex]);

  /** Shared logic to advance to the next exercise or finish */
  function moveToNextExercise(currentExercise: WorkoutExercise) {
    const nextIndex = currentExIndex + 1;

    if (nextIndex >= allExercises.length) {
      // No more exercises — transition to debrief
      finishWorkout();
      return;
    }

    // Always show a rest screen between exercises so the user
    // has a clear transition point before the next exercise starts.
    setSubPhase("rest");
    setRestKey((k) => k + 1);

    setCurrentExIndex(nextIndex);
    setCurrentSet(1);
  }

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
  }, [confirmFinish]);

  // ────────────────────────────────────────────
  // 4. Finish & save results
  // ────────────────────────────────────────────

  async function finishWorkout() {
    setPhase("debrief");
    setSaving(true);

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
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        {/* ── Top bar: elapsed time, pause, and finish ── */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-secondary" />
            <span className="font-mono text-sm text-text-secondary">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-1">
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

            {/* Show what's coming up next */}
            <p className="text-sm font-mono text-text-primary uppercase tracking-wider">
              NEXT: {currentExercise.name} — Round {currentSet} of {currentExercise.sets || 1}
            </p>

            {/* key={restKey} forces the Timer to remount and reset even if
                the duration is the same as the previous rest period */}
            <Timer
              key={restKey}
              initialSeconds={currentExercise.rest_seconds || 30}
              mode="countdown"
              running={!paused}
              onComplete={handleSkipRest}
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
          <div className="flex-1 flex flex-col px-4">
            {/* Set indicator */}
            <div className="text-center mb-3 mt-2">
              <Tag variant="active">
                {`ROUND ${currentSet} / ${currentExercise.sets || 1}`}
              </Tag>
            </div>

            {/* Exercise name — LARGE and bright for outdoor visibility */}
            <h2 className="text-3xl font-heading uppercase tracking-wider text-sand text-center mb-2">
              {currentExercise.name}
            </h2>

            {/* Form cue / description — brighter text, larger */}
            {(currentExercise.form_cue || currentExercise.description) && (
              <p className="text-base text-text-primary text-center mb-4 max-w-sm mx-auto leading-relaxed">
                {currentExercise.form_cue || currentExercise.description}
              </p>
            )}

            {/* Muscle group visual — shows which body areas are targeted */}
            {currentExercise.muscles && currentExercise.muscles.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {currentExercise.muscles.map((muscle) => (
                  <span key={muscle}
                    className="px-3 py-1.5 bg-green-primary/20 border border-green-primary/40 text-sm font-mono text-green-light uppercase">
                    {muscle}
                  </span>
                ))}
              </div>
            )}

            {/* Rep counter OR duration timer — LARGER for outdoor visibility */}
            <div className="flex items-center justify-center mb-4">
              {currentExercise.duration_seconds ? (
                <div className="text-center">
                  <p className="text-sm font-mono uppercase tracking-wider text-text-primary mb-2">
                    COUNTDOWN
                  </p>
                  <Timer
                    initialSeconds={currentExercise.duration_seconds}
                    mode="countdown"
                    running={!paused}
                    onComplete={handleCompleteExercise}
                    size="lg"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-mono uppercase tracking-wider text-text-primary mb-2">
                    TARGET REPS
                  </p>
                  <span className="font-mono text-7xl font-bold text-sand">
                    {currentExercise.reps ?? "MAX"}
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Bottom action buttons — sticky so they're always visible ── */}
        {subPhase === "exercise" && (
          <div className="sticky bottom-0 left-0 right-0 p-3 bg-bg-primary/95 backdrop-blur-sm border-t border-green-dark space-y-2 safe-bottom">
            <Button fullWidth onClick={handleCompleteExercise} className="py-4">
              <span className="flex items-center justify-center gap-2 text-lg">
                <Check size={22} />
                {currentSet < (currentExercise.sets || 1)
                  ? `DONE — ROUND ${currentSet}/${currentExercise.sets || 1}`
                  : "EXERCISE COMPLETE"}
              </span>
            </Button>
            <button onClick={handleSkipExercise}
              className="w-full py-2 text-xs font-mono text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors min-h-[36px]">
              SKIP THIS ONE
            </button>
          </div>
        )}
      </div>
    );
  }

  // =============================================
  // PHASE 3: MISSION DEBRIEF
  // =============================================

  if (phase === "debrief") {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
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
          onClick={() => router.push("/missions")}
          disabled={saving}
        >
          RETURN TO BASE
        </Button>
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
