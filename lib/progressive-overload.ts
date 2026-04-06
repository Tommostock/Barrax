/* ============================================
   Progressive Overload Tracking
   Tracks how exercises have progressed over time.
   Used to inform AI workout generation so it
   progressively increases difficulty.
   ============================================ */

import { createClient } from "@/lib/supabase/client";

interface ExerciseProgress {
  exercise_name: string;
  dates: string[];
  reps: number[];
  sets: number[];
  durations: number[];
}

// Get the progression history for a specific exercise
// Shows how reps/sets/duration have changed over time
export async function getExerciseProgression(
  userId: string,
  exerciseName: string,
  limit: number = 20
): Promise<ExerciseProgress | null> {
  const supabase = createClient();

  // Get workout exercises for this exercise name, ordered by date
  const { data } = await supabase
    .from("workout_exercises")
    .select(`
      exercise_name,
      sets_completed,
      reps_completed,
      duration_seconds,
      workout_id,
      workouts!inner(completed_at, user_id)
    `)
    .eq("exercise_name", exerciseName)
    .eq("workouts.user_id", userId)
    .eq("skipped", false)
    .order("workouts(completed_at)", { ascending: true })
    .limit(limit);

  if (!data || data.length === 0) return null;

  return {
    exercise_name: exerciseName,
    dates: data.map((d) => {
      const workout = d.workouts as unknown as { completed_at: string };
      return workout?.completed_at?.split("T")[0] ?? "";
    }),
    reps: data.map((d) => d.reps_completed ?? 0),
    sets: data.map((d) => d.sets_completed ?? 0),
    durations: data.map((d) => d.duration_seconds ?? 0),
  };
}

// Get a summary of all exercises the user has done and their latest stats.
// This is passed to the AI for informed programme generation.
export async function getProgressionSummary(userId: string): Promise<string> {
  const supabase = createClient();

  // Get the most recent completed exercises (last 30 unique exercises)
  const { data } = await supabase
    .from("workout_exercises")
    .select(`
      exercise_name,
      sets_completed,
      reps_completed,
      duration_seconds,
      workout_id,
      workouts!inner(completed_at, user_id)
    `)
    .eq("workouts.user_id", userId)
    .eq("skipped", false)
    .order("workouts(completed_at)", { ascending: false })
    .limit(100);

  if (!data || data.length === 0) {
    return "No exercise history yet.";
  }

  // Group by exercise name and get latest stats
  const exerciseMap = new Map<string, { sets: number; reps: number; duration: number; count: number }>();

  for (const ex of data) {
    const existing = exerciseMap.get(ex.exercise_name);
    if (!existing) {
      exerciseMap.set(ex.exercise_name, {
        sets: ex.sets_completed,
        reps: ex.reps_completed ?? 0,
        duration: ex.duration_seconds ?? 0,
        count: 1,
      });
    } else {
      existing.count++;
    }
  }

  // Format as a summary string for AI prompts
  const lines: string[] = [];
  for (const [name, stats] of exerciseMap) {
    if (stats.reps > 0) {
      lines.push(`${name}: ${stats.sets} sets x ${stats.reps} reps (done ${stats.count}x)`);
    } else if (stats.duration > 0) {
      lines.push(`${name}: ${stats.sets} sets x ${stats.duration}s (done ${stats.count}x)`);
    }
  }

  return lines.slice(0, 20).join("\n") || "No exercise history yet.";
}
