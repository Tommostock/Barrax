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
import ExerciseDetailSheet from "@/components/workout/ExerciseDetailSheet";
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
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  countdownBeep,
  completeBeep,
  exerciseCompleteSound,
  workoutCompleteSound,
  restOverBeep,
  setWorkoutAudioContext,
} from "@/lib/workout-audio";
import { requestWakeLock, releaseWakeLock } from "@/lib/wake-lock";
import { queueOrExecute } from "@/lib/offline/queue";
import { useCoachingAudio } from "@/hooks/useCoachingAudio";
import CoachingSubtitle from "@/components/workout/CoachingSubtitle";
import CoachingStatus from "@/components/workout/CoachingStatus";
import type { WorkoutData, WorkoutExercise } from "@/types";

// ──────────────────────────────────────────────
// Types local to this page
// ──────────────────────────────────────────────

/** Which phase the player is in */
type Phase = "briefing" | "countdown" | "active" | "debrief";

/** Duration of the DEPLOY → first-exercise prep countdown, in seconds. */
const PREP_COUNTDOWN_SECONDS = 5;

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

  // ── DEPLOY prep countdown (5s → 0 before first exercise) ──
  // Starts when the user taps DEPLOY, counts down while showing the
  // first exercise as a preview, then transitions to phase="active".
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);

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

  // ── Progressive overload suggestions ──
  const [overloadSuggestions, setOverloadSuggestions] = useState<{ name: string; current: string; next: string }[]>([]);

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

  // ── How-to detail sheet (works in briefing and active phases) ──
  const [detailExercise, setDetailExercise] = useState<WorkoutExercise | null>(null);

  // ── Voice commands ──
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // ── AI Audio Coach (Battle Buddy) ──
  // Pre-generates drill-sergeant cues via /api/coaching-script at DEPLOY
  // time, then dispatches them onto existing state transitions. See
  // hooks/useCoachingAudio.ts + lib/coaching/controller.ts.
  const coaching = useCoachingAudio({ workoutId, workoutData });

  // ── Rest countdown (parallel to Timer component for 10s-remaining cue) ──
  // The Timer component only exposes onComplete, so we mirror its countdown
  // here in state. Same pattern as the duration countdown above. Timer still
  // fires restOverBeep via onComplete — this is purely for cue dispatch.
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const restCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Coach cues tied to the duration countdown:
  // - 10s remaining → push cue
  // - halfway       → momentum cue (only for exercises ≥30s)
  // - 0s            → "go" cue, delayed 400ms so completeBeep plays first
  useEffect(() => {
    if (secondsLeft === null || !coaching.ready) return;
    const ex = allExercises[currentExIndex];
    if (!ex?.duration_seconds) return;

    if (secondsLeft === 10) {
      coaching.dispatch("exercise_countdown_10s", currentExIndex, currentSet);
    }
    if (ex.duration_seconds >= 30) {
      const halfway = Math.floor(ex.duration_seconds / 2);
      if (secondsLeft === halfway) {
        coaching.dispatch("exercise_halfway", currentExIndex, currentSet);
      }
    }
    if (secondsLeft === 0) {
      // Delay so the beep + cue don't overlap (beep ~300ms, cue ~1s)
      const t = setTimeout(() => {
        coaching.dispatch("exercise_countdown_go", currentExIndex, currentSet);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [secondsLeft, coaching, currentExIndex, currentSet, allExercises]);

  // Dispatch exercise_start / final_exercise_intro whenever we enter
  // an exercise sub-phase. Runs on every (exercise, set) change.
  useEffect(() => {
    if (phase !== "active" || subPhase !== "exercise") return;
    if (!coaching.ready) return;
    const isFinal =
      currentExIndex === allExercises.length - 1 && currentSet === 1;
    if (isFinal) {
      coaching.dispatch("final_exercise_intro", currentExIndex, currentSet);
    } else {
      coaching.dispatch("exercise_start", currentExIndex, currentSet);
    }
  }, [phase, subPhase, currentExIndex, currentSet, coaching, allExercises.length]);

  // Rest countdown: mirror the Timer's countdown in React state so we can
  // dispatch rest_start + rest_countdown_10s cues. Timer itself handles
  // onComplete → handleRestComplete.
  useEffect(() => {
    if (phase !== "active" || subPhase !== "rest") {
      setRestSecondsLeft(null);
      if (restCountdownRef.current) {
        clearInterval(restCountdownRef.current);
        restCountdownRef.current = null;
      }
      return;
    }
    const ex = allExercises[currentExIndex];
    const restTotal = ex?.rest_seconds || 30;
    setRestSecondsLeft(restTotal);

    // Dispatch rest_start cue once on entry
    if (coaching.ready) {
      coaching.dispatch("rest_start", currentExIndex, currentSet);
    }

    restCountdownRef.current = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev === null || prev <= 0) {
          if (restCountdownRef.current) clearInterval(restCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (restCountdownRef.current) clearInterval(restCountdownRef.current);
    };
    // We deliberately omit coaching from deps to avoid re-running the
    // interval whenever the hook reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, subPhase, currentExIndex, currentSet, allExercises, restKey]);

  // 10s-remaining cue for rest
  useEffect(() => {
    if (restSecondsLeft === 10 && coaching.ready) {
      coaching.dispatch("rest_countdown_10s", currentExIndex, currentSet);
    }
  }, [restSecondsLeft, coaching, currentExIndex, currentSet]);

  // Pause/resume the rest countdown with the main pause
  useEffect(() => {
    if (paused && restCountdownRef.current) {
      clearInterval(restCountdownRef.current);
      restCountdownRef.current = null;
    } else if (!paused && phase === "active" && subPhase === "rest" && restSecondsLeft !== null && restSecondsLeft > 0) {
      restCountdownRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null || prev <= 0) {
            if (restCountdownRef.current) clearInterval(restCountdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restCountdownRef.current) clearInterval(restCountdownRef.current);
      restCountdownRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // Destroy the coaching controller on unmount
  useEffect(() => {
    return () => {
      setWorkoutAudioContext(null);
    };
  }, []);

  // ────────────────────────────────────────────
  // Feature 4: Cleanup wake lock on unmount
  // ────────────────────────────────────────────

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Re-acquire wake lock whenever the active phase begins, in case the
  // initial request from handleDeploy failed or the user came back from
  // another app. The wake-lock module also reacquires on visibilitychange.
  useEffect(() => {
    if (phase === "active") {
      requestWakeLock();
    }
  }, [phase]);

  // ────────────────────────────────────────────
  // Prep countdown (briefing → countdown → active)
  // ────────────────────────────────────────────

  // Ticks prepSecondsLeft down once per second while phase==="countdown".
  // When it hits 0, flips phase to "active" and resets the counter.
  // The existing duration-countdown + exercise-start effects then fire
  // naturally as phase transitions to "active".
  useEffect(() => {
    if (phase !== "countdown" || prepSecondsLeft === null) return;

    // Play a beep at 3, 2, 1 (matches the duration countdown pattern)
    if (prepSecondsLeft === 3 || prepSecondsLeft === 2 || prepSecondsLeft === 1) {
      countdownBeep();
    }

    if (prepSecondsLeft === 0) {
      // Prep finished — start the actual workout clock and flip to active.
      startTimeRef.current = new Date();
      setPhase("active");
      setPrepSecondsLeft(null);
      return;
    }

    const timer = setTimeout(() => {
      setPrepSecondsLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, prepSecondsLeft]);

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

  /** Start the workout — transitions briefing → countdown → active.
      The 5s prep countdown is shown first so the user can get into
      position and read the first exercise description. The elapsed
      clock and the real workout state do not start until the countdown
      hits zero (see the prep-countdown effect below). */
  const handleDeploy = useCallback(async () => {
    // ───── CRITICAL: init audio inside the user gesture ─────
    // On iOS Safari, the silent-loop trick only works if
    // HTMLAudioElement.play() runs synchronously inside a click handler.
    // This MUST come before any `await` — even a microtask break
    // invalidates the gesture. The coach also disables voice commands
    // to avoid the microphone stealing iOS audio focus (which would duck
    // Spotify aggressively and fight cue playback).
    if (coaching.enabled) {
      coaching.initAudio();
      // Share the same AudioContext with the beep system so both play
      // through the silent-loop-unlocked graph.
      setWorkoutAudioContext(coaching.getContext());
      // If coach is active, disable voice commands for this mission.
      setVoiceActive(false);
    }

    // Feature 4: Keep screen awake — do this at the start of the
    // countdown so the screen stays on during prep too.
    requestWakeLock();

    // Mark workout as "in_progress" in the database
    if (workoutId) {
      await supabase
        .from("workouts")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", workoutId);
    }

    // Enter the prep countdown. The effect below ticks it down and
    // transitions to active when it hits zero.
    setPrepSecondsLeft(PREP_COUNTDOWN_SECONDS);
    setPhase("countdown");

    // Fire manifest fetch in parallel with the countdown. This hides
    // the Gemini + Edge TTS latency behind the 5-second prep window —
    // by the time the countdown finishes, the cues should be decoded
    // and ready to dispatch on the first exercise_start.
    if (coaching.enabled) {
      void coaching.loadManifest().then(() => {
        coaching.dispatch("mission_start");
      });
    }
  }, [workoutId, supabase, coaching]);

  /** Complete the current set (or final set of the exercise) */
  const handleCompleteExercise = useCallback(() => {
    const exercise = allExercises[currentExIndex];
    if (!exercise) return;

    // Haptic feedback on supported devices
    navigator.vibrate?.(100);

    // Feature 1: Play exercise complete sound
    exerciseCompleteSound();

    // Coach cue: set done (after the beep, short overlap is fine)
    coaching.dispatch("exercise_done", currentExIndex, currentSet);

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
  }, [allExercises, currentExIndex, currentSet, actualReps, coaching]);

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
  // Voice commands — refs keep the recognition callback
  // up-to-date without restarting the recogniser on every render.
  // ────────────────────────────────────────────

  const voiceStateRef = useRef({ subPhase, paused });
  const voiceActionsRef = useRef({
    complete: handleCompleteExercise,
    skipEx: handleSkipExercise,
    skipRest: handleSkipRest,
    togglePause: handleTogglePause,
  });

  useEffect(() => { voiceStateRef.current.subPhase = subPhase; }, [subPhase]);
  useEffect(() => { voiceStateRef.current.paused = paused; }, [paused]);
  useEffect(() => {
    voiceActionsRef.current = {
      complete: handleCompleteExercise,
      skipEx: handleSkipExercise,
      skipRest: handleSkipRest,
      togglePause: handleTogglePause,
    };
  }, [handleCompleteExercise, handleSkipExercise, handleSkipRest, handleTogglePause]);

  // Start / stop recognition when voiceActive toggles
  useEffect(() => {
    if (!voiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Voice commands not supported on this device/browser");
      setVoiceActive(false);
      return;
    }

    if (!window.isSecureContext) {
      setVoiceError("Voice commands require HTTPS");
      setVoiceActive(false);
      return;
    }

    let cancelled = false;

    // Explicitly request microphone permission first so the user sees the
    // Chrome permission prompt. Without this the SpeechRecognition sometimes
    // fails silently on mobile PWAs.
    (async () => {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Release the stream immediately — we only needed the permission
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        if (!cancelled) {
          setVoiceError("Microphone permission denied");
          setVoiceActive(false);
        }
        return;
      }

      if (cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-GB";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results as ArrayLike<SpeechRecognitionResult>)
          .slice(event.resultIndex)
          .filter((r) => r.isFinal)
          .map((r) => r[0].transcript.trim().toLowerCase())
          .join(" ");

        if (!transcript) return;

        setVoiceCommand(transcript);
        setTimeout(() => setVoiceCommand(null), 1500);

        const { subPhase: sp, paused: isPaused } = voiceStateRef.current;
        const actions = voiceActionsRef.current;
        const contains = (w: string) => transcript.includes(w);

        if (sp === "rest") {
          if (["next", "skip", "go", "ready", "let's go", "lets go"].some(contains)) {
            actions.skipRest();
          }
        } else {
          if (["done", "complete", "finished", "next", "yes"].some(contains)) {
            actions.complete();
          } else if (["skip"].some(contains)) {
            actions.skipEx();
          }
        }
        if (contains("pause") && !isPaused) actions.togglePause();
        if ((contains("resume") || contains("continue")) && isPaused) actions.togglePause();
      };

      // Auto-restart on silence — recognition stops if no sound detected
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          try { recognition.start(); } catch { /* already running */ }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        // not-allowed / no-speech / aborted — surface permission errors
        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          setVoiceError("Microphone permission denied");
          setVoiceActive(false);
        }
      };

      recognitionRef.current = recognition;
      try { recognition.start(); } catch { /* already running */ }
    })();

    return () => {
      cancelled = true;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }
    };
  }, [voiceActive]);

  // Auto-dismiss voice error toast
  useEffect(() => {
    if (!voiceError) return;
    const t = setTimeout(() => setVoiceError(null), 3500);
    return () => clearTimeout(t);
  }, [voiceError]);

  // Deactivate voice when leaving the active phase
  useEffect(() => {
    if (phase !== "active") setVoiceActive(false);
  }, [phase]);

  // ────────────────────────────────────────────
  // 4. Finish & save results
  // ────────────────────────────────────────────

  async function finishWorkout() {
    setPhase("debrief");
    setSaving(true);

    // Feature 1: Play workout complete sound
    workoutCompleteSound();

    // Coach cue: mission complete (drill sergeant sign-off)
    coaching.dispatch("mission_end");

    // Feature 4: Release wake lock
    releaseWakeLock();

    const totalDuration = elapsedSeconds;
    const xp = calculateXP(totalDuration);
    setXpEarned(xp);

    try {
      // 4a. Mark the workout row complete. Wrapped in queueOrExecute
      // so it survives an offline finish (gym basement) — the update
      // replays on reconnect.
      if (workoutId) {
        const workoutUpdate = {
          status: "complete" as const,
          completed_at: new Date().toISOString(),
          duration_seconds: totalDuration,
          xp_earned: xp,
        };
        await queueOrExecute(
          async () => {
            const { error } = await supabase
              .from("workouts")
              .update(workoutUpdate)
              .eq("id", workoutId);
            return { error };
          },
          {
            table: "workouts",
            operation: "update",
            payload: workoutUpdate,
            filter: { id: workoutId },
          },
        );
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

        // Queue-aware insert — preserves workout set logs across
        // signal drops in gym basements.
        await queueOrExecute(
          async () => {
            const { error } = await supabase
              .from("workout_exercises")
              .insert(rows);
            return { error };
          },
          {
            table: "workout_exercises",
            operation: "insert",
            payload: rows,
          },
        );
      }

      // 4c. Award XP + fire notification for workout complete and rank-up
      const { completeWorkoutAndNotify } = await import("@/lib/award-and-notify");
      await completeWorkoutAndNotify(xp, totalDuration);

      // 4c-bis. Tell the HQ data cache that something changed so the
      // rank/XP + today's workout card refresh next time HQ is visible.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("workout-complete"));
      }

      // Check and award badges
      const { data: { user } } = await supabase.auth.getUser();

      // 4d. Recompute daily contract + classified op progress from the new
      // workout_exercises rows. Fire-and-forget -- we don't block the
      // completion flow on this.
      if (user) {
        import("@/lib/missions/progress")
          .then(({ updateMissionsProgress }) => updateMissionsProgress(supabase, user.id))
          .catch(() => {});
      }
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
      // Progressive overload: suggest increasing reps/duration for exercises where targets were hit
      try {
        const exerciseMap = new Map(allExercises.map((ex) => [ex.name, ex]));
        const suggestions: { name: string; current: string; next: string }[] = [];
        for (const result of allResults.filter((r) => !r.skipped)) {
          const planned = exerciseMap.get(result.name);
          if (!planned) continue;
          const plannedSets = planned.sets || 1;
          if (planned.reps && result.repsCompleted !== null && result.repsCompleted >= planned.reps && result.setsCompleted >= plannedSets) {
            suggestions.push({ name: result.name, current: `${plannedSets}×${planned.reps}`, next: `${plannedSets}×${planned.reps + 1}` });
          } else if (planned.duration_seconds && result.durationSeconds !== null && result.durationSeconds >= planned.duration_seconds && result.setsCompleted >= plannedSets) {
            suggestions.push({ name: result.name, current: `${plannedSets}×${planned.duration_seconds}s`, next: `${plannedSets}×${planned.duration_seconds + 10}s` });
          }
        }
        if (suggestions.length > 0) setOverloadSuggestions(suggestions.slice(0, 3));
      } catch { /* non-critical */ }
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
                  <ExerciseBriefingRow key={`warmup-${i}`} exercise={ex} onOpenDetail={setDetailExercise} />
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
                  <ExerciseBriefingRow key={`ex-${i}`} exercise={ex} onOpenDetail={setDetailExercise} />
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
                  <ExerciseBriefingRow key={`cooldown-${i}`} exercise={ex} onOpenDetail={setDetailExercise} />
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

        {/* Exercise detail sheet — tap any exercise row to see the breakdown */}
        <ExerciseDetailSheet
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      </div>
    );
  }

  // =============================================
  // PHASE 1.5: PREP COUNTDOWN
  // =============================================

  const currentExercise = allExercises[currentExIndex] ?? null;

  if (phase === "countdown" && currentExercise) {
    const firstEx = allExercises[0] ?? currentExercise;
    const targetLine = firstEx.reps
      ? `${firstEx.sets} × ${firstEx.reps} reps`
      : firstEx.duration_seconds
        ? `${firstEx.sets} × ${firstEx.duration_seconds}s`
        : `${firstEx.sets} sets`;
    return (
      <div className="flex flex-col min-h-dvh bg-bg-primary px-6" style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 60px)" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <Tag variant="default">GET READY</Tag>

          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            FIRST UP
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-wider text-sand leading-tight">
            {firstEx.name}
          </h2>
          <p className="text-sm font-mono text-green-light">{targetLine}</p>

          {(firstEx.form_cue || firstEx.description) && (
            <p className="text-base text-text-primary max-w-md leading-snug">
              {firstEx.form_cue || firstEx.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center w-40 h-40 border-2 border-green-primary bg-bg-panel">
            <span className="text-7xl font-heading text-green-light tabular-nums drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
              {prepSecondsLeft ?? PREP_COUNTDOWN_SECONDS}
            </span>
          </div>

          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary animate-pulse">
            MISSION BEGINS IN {prepSecondsLeft ?? PREP_COUNTDOWN_SECONDS} SECONDS
          </p>
        </div>
      </div>
    );
  }

  // =============================================
  // PHASE 2: ACTIVE WORKOUT
  // =============================================

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

        {/* Voice command recognised toast */}
        {voiceCommand && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] border border-green-primary bg-bg-panel px-4 py-2 flex items-center gap-2 pointer-events-none">
            <Mic size={14} className="text-green-light" />
            <span className="font-mono text-sm text-green-light uppercase tracking-wider">{voiceCommand}</span>
          </div>
        )}

        {/* Voice error toast */}
        {voiceError && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] border border-danger bg-bg-panel px-4 py-2 flex items-center gap-2 pointer-events-none max-w-[90vw]">
            <MicOff size={14} className="text-danger" />
            <span className="font-mono text-xs text-danger uppercase tracking-wider">{voiceError}</span>
          </div>
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
          </div>
          <div className="flex items-center gap-1">
            {/* Coach status chip — only visible when loading/lost/error */}
            <CoachingStatus state={coaching.state} onResume={coaching.resume} />

            {/* Feature 10: Music launcher */}
            <button
              onClick={handleOpenMusic}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-green-light transition-colors"
              aria-label="Open music"
            >
              <Music size={18} />
            </button>

            {/* Coach mute toggle — only visible when feature enabled */}
            {coaching.enabled && (
              <button
                onClick={() => coaching.setMute(!coaching.muted)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors
                           ${coaching.muted ? "text-text-secondary hover:text-green-light" : "text-green-light"}`}
                aria-label={coaching.muted ? "Unmute coach" : "Mute coach"}
              >
                {coaching.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            {/* Voice commands toggle — hidden when coach is enabled to avoid
                iOS audio session fight (mic → PlayAndRecord ducks Spotify) */}
            {!coaching.enabled && (
              <button
                onClick={() => setVoiceActive((v) => !v)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors
                           ${voiceActive ? "text-green-light" : "text-text-secondary hover:text-green-light"}`}
                aria-label={voiceActive ? "Disable voice commands" : "Enable voice commands"}
              >
                {voiceActive ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
            )}

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

            {/* Feature 2: Show what's coming next more prominently.
                Includes the exercise description so the user can prepare
                during the rest period — they shouldn't have to wait for
                the rest timer to end before knowing what to do. */}
            <div className="text-center border border-green-dark bg-bg-panel px-6 py-4 max-w-md mx-auto">
              <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-1">
                UP NEXT
              </p>
              <p className="text-lg font-heading uppercase tracking-wider text-sand">
                {currentExercise.name}
              </p>
              <p className="text-sm font-mono text-green-light mt-1">
                Round {currentSet} of {totalSets}
              </p>
              {(currentExercise.form_cue || currentExercise.description) && (
                <p className="mt-3 text-sm text-text-primary leading-snug">
                  {currentExercise.form_cue || currentExercise.description}
                </p>
              )}
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
          <div className="flex-1 flex flex-col px-6 pb-2 justify-center">
            {/* Feature 6: Set-by-set tracking indicators */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: totalSets }, (_, i) => {
                const setNum = i + 1;
                const isCompleted = completedSetsForExercise.includes(setNum);
                const isCurrent = setNum === currentSet;

                return (
                  <div
                    key={setNum}
                    className={`flex items-center justify-center w-10 h-10 text-base font-mono font-bold
                      ${isCompleted
                        ? "bg-green-primary/40 border-2 border-green-primary text-green-light"
                        : isCurrent
                          ? "bg-bg-panel border-2 border-sand text-sand"
                          : "bg-bg-panel border border-green-dark text-text-secondary opacity-60"
                      }`}
                  >
                    {isCompleted ? <Check size={18} /> : setNum}
                  </div>
                );
              })}
            </div>

            {/* Set indicator tag — bigger */}
            <div className="text-center mb-3">
              <span className="inline-block px-4 py-1.5 bg-green-primary/25 border-2 border-green-primary text-green-light text-sm font-heading font-bold uppercase tracking-widest">
                {`ROUND ${currentSet} / ${totalSets}`}
              </span>
            </div>

            {/* Exercise name — much bigger and brighter */}
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-wider text-white text-center mb-2 leading-tight drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              {currentExercise.name}
            </h2>

            {/* Feature 8: Workout history */}
            {exerciseHistory && (
              <p className="text-sm font-mono text-text-primary text-center mb-2 opacity-80">
                {exerciseHistory}
              </p>
            )}

            {/* Coach subtitle — auto-fades after 4s */}
            <CoachingSubtitle subtitle={coaching.lastSubtitle} />

            {/* Form cue — bigger and brighter */}
            {(currentExercise.form_cue || currentExercise.description) && (
              <p className="text-base text-text-primary text-center mb-3 max-w-md mx-auto leading-snug">
                {currentExercise.form_cue || currentExercise.description}
              </p>
            )}

            {/* HOW TO button — bigger */}
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setDetailExercise(currentExercise)}
                className="flex items-center gap-2 px-4 py-2 border border-green-primary bg-bg-panel text-green-light hover:bg-bg-panel-alt active:scale-[0.98] transition-all text-sm font-mono uppercase tracking-wider min-h-[40px]"
              >
                <Info size={16} /> How To Perform
              </button>
            </div>

            {/* Muscle tags — bigger */}
            {currentExercise.muscles && currentExercise.muscles.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {currentExercise.muscles.map((muscle) => (
                  <span key={muscle} className="px-3 py-1 bg-green-primary/25 border border-green-primary text-sm font-mono font-bold text-green-light uppercase tracking-wider">
                    {muscle}
                  </span>
                ))}
              </div>
            )}

            {/* Rep counter OR duration timer */}
            <div className="flex items-center justify-center">
              {isTimerExercise ? (
                <div className="text-center">
                  <p className="text-sm font-mono uppercase tracking-widest text-green-light mb-2 font-bold">COUNTDOWN</p>
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
                  <p className="text-sm font-mono uppercase tracking-widest text-green-light mb-2 font-bold">TARGET REPS</p>
                  <span className="font-mono text-8xl font-bold text-white drop-shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                    {currentExercise.reps ?? "MAX"}
                  </span>

                  {/* Feature 5: +/- rep counter buttons — bigger */}
                  {isRepExercise && (
                    <div className="flex items-center justify-center gap-5 mt-4">
                      <button
                        onClick={() => setActualReps((prev) => Math.max(0, prev - 1))}
                        className="min-h-[56px] min-w-[56px] flex items-center justify-center border-2 border-green-primary bg-bg-panel text-text-primary hover:bg-bg-panel-alt active:scale-95 transition-all"
                        aria-label="Decrease reps"
                      >
                        <Minus size={28} />
                      </button>
                      <div className="text-center min-w-[80px]">
                        <span className="font-mono text-5xl font-bold text-green-light">
                          {actualReps}
                        </span>
                        <p className="text-xs font-mono uppercase tracking-widest text-text-primary mt-1 font-bold">
                          ACTUAL
                        </p>
                      </div>
                      <button
                        onClick={() => setActualReps((prev) => prev + 1)}
                        className="min-h-[56px] min-w-[56px] flex items-center justify-center border-2 border-green-primary bg-bg-panel text-text-primary hover:bg-bg-panel-alt active:scale-95 transition-all"
                        aria-label="Increase reps"
                      >
                        <Plus size={28} />
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

        {/* ── Bottom action buttons — bigger and brighter ── */}
        {subPhase === "exercise" && (
          <div className="px-6 pb-8 bg-bg-primary border-t-2 border-green-primary pt-4 space-y-3">
            <Button fullWidth onClick={handleCompleteExercise} className="py-5">
              <span className="flex items-center justify-center gap-3 text-xl font-bold tracking-wider">
                <Check size={26} />
                {currentSet < totalSets
                  ? `DONE — ROUND ${currentSet}/${totalSets}`
                  : isRepExercise
                    ? `DONE — ${actualReps} REPS`
                    : "EXERCISE COMPLETE"}
              </span>
            </Button>
            <Button variant="secondary" fullWidth onClick={handleSkipExercise} className="py-3">
              <span className="flex items-center justify-center gap-2 text-base font-bold">
                <SkipForward size={20} /> SKIP EXERCISE
              </span>
            </Button>
          </div>
        )}

        {/* Exercise detail sheet — detailed HOW TO breakdown */}
        <ExerciseDetailSheet
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />

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

          {/* Progressive overload suggestions */}
          {overloadSuggestions.length > 0 && (
            <div className="w-full max-w-sm mb-8">
              <h3 className="text-xs font-heading uppercase tracking-wider text-green-light mb-3 text-center">
                Ready to Level Up
              </h3>
              <div className="space-y-2">
                {overloadSuggestions.map((s, i) => (
                  <div key={i} className="border border-green-primary/40 bg-bg-panel p-3 flex items-center justify-between">
                    <span className="text-xs font-heading uppercase tracking-wider text-sand truncate flex-1 mr-2">{s.name}</span>
                    <span className="text-xs font-mono text-text-secondary line-through shrink-0">{s.current}</span>
                    <span className="text-xs font-mono text-green-light ml-2 shrink-0">→ {s.next}</span>
                  </div>
                ))}
              </div>
              <p className="text-[0.5rem] font-mono text-text-secondary uppercase text-center mt-2">Try these targets next session</p>
            </div>
          )}

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

function ExerciseBriefingRow({
  exercise,
  onOpenDetail,
}: {
  exercise: WorkoutExercise;
  onOpenDetail?: (ex: WorkoutExercise) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetail?.(exercise)}
      className="w-full text-left border border-green-dark bg-bg-panel p-3 flex items-center justify-between press-scale hover:bg-bg-panel-alt transition-colors"
    >
      <div className="flex-1 min-w-0">
        {/* Exercise name */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-heading uppercase tracking-wider text-sand">
            {exercise.name}
          </p>
          <Info size={12} className="text-green-light shrink-0" />
        </div>
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
      <div className="flex gap-1 flex-wrap justify-end shrink-0">
        {exercise.muscles?.slice(0, 2).map((m) => (
          <Tag key={m} variant="default">
            {m}
          </Tag>
        ))}
      </div>
    </button>
  );
}
