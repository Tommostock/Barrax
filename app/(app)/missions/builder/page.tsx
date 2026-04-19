/* ============================================
   CUSTOM WORKOUT BUILDER Page
   Lets Rank 7+ users build their own workouts:
     1. Choose a workout name and type
     2. Search and add exercises from the library
     3. Configure sets/reps or duration per exercise
     4. Reorder and remove exercises
     5. Save as a pending workout with XP value
   Rank < 7 users see a locked state message.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import useBackNav from "@/hooks/useBackNav";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  Search,
  GripVertical,
  Save,
} from "lucide-react";

/* ------------------------------------------
   TYPES
   ------------------------------------------ */

// A library exercise fetched from Supabase
interface LibraryExercise {
  id: string;
  name: string;
  description: string;
  form_cue: string;
  muscles: string[];
  difficulty: number;
  category: string;
  min_rank: number;
}

// An exercise added to the custom workout
// with user-configured sets/reps/duration
interface BuilderExercise {
  id: string;               // Unique ID for this builder entry
  exerciseId: string;        // Reference to the library exercise
  name: string;
  description: string;
  muscles: string[];
  sets: number;
  reps: number | null;       // null if duration-based
  durationSeconds: number | null; // null if reps-based
  restSeconds: number;
  difficulty: number;
}

// Workout types the user can choose from
const WORKOUT_TYPES = [
  { value: "strength", label: "STRENGTH" },
  { value: "cardio", label: "CARDIO" },
  { value: "hiit", label: "HIIT" },
  { value: "core", label: "CORE" },
  { value: "full_body", label: "FULL BODY" },
] as const;

type WorkoutType = (typeof WORKOUT_TYPES)[number]["value"];

/* ==============================================
   MAIN COMPONENT
   ============================================== */
export default function WorkoutBuilderPage() {
  const router = useRouter();
  const goBack = useBackNav("/missions");
  const supabase = createClient();

  // ---- State: access control ----
  const [userRank, setUserRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // ---- State: workout configuration ----
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState<WorkoutType>("strength");
  const [exercises, setExercises] = useState<BuilderExercise[]>([]);

  // ---- State: exercise search ----
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ---- State: saving ----
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* ------------------------------------------
     FETCH USER RANK + EXERCISE LIBRARY
     Check if the user has Rank 7+ access and
     load their exercise library for searching.
     ------------------------------------------ */
  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Fetch the user's current rank
    const { data: rankData } = await supabase
      .from("ranks")
      .select("current_rank")
      .eq("user_id", user.id)
      .single();

    const rank = rankData?.current_rank ?? 1;
    setUserRank(rank);

    // 3. If they have access, fetch the exercise library
    if (rank >= 7) {
      const { data: exerciseData } = await supabase
        .from("exercise_library")
        .select("id, name, description, form_cue, muscles, difficulty, category, min_rank")
        .eq("user_id", user.id)
        .lte("min_rank", rank) // Only show exercises they've unlocked
        .order("name", { ascending: true });

      if (exerciseData) {
        setLibrary(exerciseData as LibraryExercise[]);
      }
    }

    setLoading(false);
  }, [supabase]);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ------------------------------------------
     FILTERED LIBRARY
     Filter the exercise library based on the
     user's search query. Uses useMemo so we
     only recompute when inputs change.
     ------------------------------------------ */
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return library;

    const query = searchQuery.toLowerCase();
    return library.filter(
      (ex) =>
        ex.name.toLowerCase().includes(query) ||
        ex.muscles.some((m) => m.toLowerCase().includes(query)) ||
        ex.category.toLowerCase().includes(query)
    );
  }, [library, searchQuery]);

  /* ------------------------------------------
     ADD EXERCISE
     Take an exercise from the library and add
     it to the workout with default configuration.
     ------------------------------------------ */
  function addExercise(libExercise: LibraryExercise) {
    const newExercise: BuilderExercise = {
      id: `builder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      exerciseId: libExercise.id,
      name: libExercise.name,
      description: libExercise.description,
      muscles: libExercise.muscles,
      sets: 3,                  // Default: 3 sets
      reps: 10,                 // Default: 10 reps
      durationSeconds: null,    // Reps-based by default
      restSeconds: 60,          // Default: 60s rest
      difficulty: libExercise.difficulty,
    };

    setExercises((prev) => [...prev, newExercise]);
    setShowSearch(false);   // Close search panel after adding
    setSearchQuery("");     // Clear the search
  }

  /* ------------------------------------------
     REMOVE EXERCISE
     Remove an exercise from the workout by its
     builder ID.
     ------------------------------------------ */
  function removeExercise(builderId: string) {
    setExercises((prev) => prev.filter((ex) => ex.id !== builderId));
  }

  /* ------------------------------------------
     UPDATE EXERCISE
     Update a specific field on one exercise.
     ------------------------------------------ */
  function updateExercise(builderId: string, field: keyof BuilderExercise, value: number | null) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === builderId ? { ...ex, [field]: value } : ex
      )
    );
  }

  /* ------------------------------------------
     TOGGLE REPS VS DURATION
     Switch an exercise between reps-based and
     duration-based configuration.
     ------------------------------------------ */
  function toggleMode(builderId: string, mode: "reps" | "duration") {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== builderId) return ex;
        if (mode === "reps") {
          return { ...ex, reps: 10, durationSeconds: null };
        } else {
          return { ...ex, reps: null, durationSeconds: 30 };
        }
      })
    );
  }

  /* ------------------------------------------
     MOVE EXERCISE UP/DOWN
     Reorder exercises in the list.
     ------------------------------------------ */
  function moveExercise(index: number, direction: "up" | "down") {
    const newExercises = [...exercises];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Bounds check
    if (targetIndex < 0 || targetIndex >= newExercises.length) return;

    // Swap the two exercises
    [newExercises[index], newExercises[targetIndex]] =
      [newExercises[targetIndex], newExercises[index]];

    setExercises(newExercises);
  }

  /* ------------------------------------------
     ESTIMATE XP VALUE
     Based on the number of exercises, total
     sets, and estimated duration.
     ------------------------------------------ */
  const estimatedDurationMinutes = useMemo(() => {
    let totalSeconds = 0;

    exercises.forEach((ex) => {
      if (ex.durationSeconds) {
        // Duration-based: duration per set + rest between sets
        totalSeconds += (ex.durationSeconds + ex.restSeconds) * ex.sets;
      } else {
        // Reps-based: roughly 3 seconds per rep + rest
        const repsTime = (ex.reps ?? 10) * 3;
        totalSeconds += (repsTime + ex.restSeconds) * ex.sets;
      }
    });

    return Math.ceil(totalSeconds / 60);
  }, [exercises]);

  // XP scales with duration: roughly 10 XP per minute
  const estimatedXp = Math.max(estimatedDurationMinutes * 10, 25);

  /* ------------------------------------------
     SAVE WORKOUT
     Save the custom workout to the workouts
     table as a pending workout for today.
     ------------------------------------------ */
  async function saveWorkout() {
    // Validation
    if (!workoutName.trim()) {
      setError("Enter a workout name");
      return;
    }
    if (exercises.length === 0) {
      setError("Add at least one exercise");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 2. Build the workout_data JSONB object
      const workoutData = {
        name: workoutName.trim(),
        type: workoutType,
        duration_minutes: estimatedDurationMinutes,
        xp_value: estimatedXp,
        // Map builder exercises to the standard WorkoutExercise format
        warmup: [],
        exercises: exercises.map((ex) => ({
          name: ex.name,
          description: ex.description,
          form_cue: "",
          sets: ex.sets,
          reps: ex.reps,
          duration_seconds: ex.durationSeconds,
          rest_seconds: ex.restSeconds,
          difficulty: ex.difficulty,
          muscles: ex.muscles,
        })),
        cooldown: [],
      };

      // 3. Insert the workout with today's date
      const today = new Date().toISOString().split("T")[0];

      const { error: insertError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          programme_id: null,           // Custom workout, not from a programme
          workout_data: workoutData,
          status: "pending",
          scheduled_date: today,
          xp_earned: 0,                 // XP awarded on completion
        });

      if (insertError) throw insertError;

      // 4. Show success and redirect
      setSuccess(true);
      setTimeout(() => {
        router.push("/missions");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  /* ==============================================
     LOADING STATE
     ============================================== */
  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  /* ==============================================
     LOCKED STATE (Rank < 7)
     Show a message explaining the requirement.
     ============================================== */
  if (userRank < 7) {
    return (
      <div className="px-4 py-4 space-y-6 pb-24">
        {/* Back button */}
        <button
          onClick={goBack}
          aria-label="Back"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-mono uppercase">Missions</span>
        </button>

        {/* Locked card */}
        <Card tag="RESTRICTED" tagVariant="locked" className="text-center py-8">
          <Lock size={48} className="text-text-secondary mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-heading uppercase tracking-wider text-sand mb-2">
            Loadout Customization Locked
          </h2>
          <Tag variant="locked">RANK 7 REQUIRED</Tag>
          <p className="text-sm text-text-secondary mt-4 max-w-xs mx-auto">
            You don&apos;t have clearance yet. Reach Warrant Officer (Rank 7) to design your own assault loadouts.
          </p>
          <div className="mt-4 bg-bg-panel-alt border border-green-dark p-3 inline-block">
            <p className="text-[0.65rem] font-mono text-text-secondary uppercase">
              Current Rank: {userRank}
            </p>
            <p className="text-[0.65rem] font-mono text-text-secondary uppercase mt-1">
              Required: 7 (Warrant Officer)
            </p>
          </div>
        </Card>
      </div>
    );
  }

  /* ==============================================
     MAIN RENDER (Rank 7+)
     ============================================== */
  return (
    <div className="px-4 py-4 space-y-6 pb-24">
      {/* ---- BACK BUTTON ---- */}
      <button
        onClick={goBack}
        aria-label="Back"
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-mono uppercase">Missions</span>
      </button>

      {/* ---- PAGE TITLE ---- */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          Assemble Your Loadout
        </h2>
        <Tag variant="gold">RANK 7 REQUIRED</Tag>
      </div>

      {/* ---- WORKOUT NAME INPUT ---- */}
      <div>
        <label className="block text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider mb-2">
          Workout Name
        </label>
        <input
          type="text"
          placeholder="e.g. UPPER BODY BLAST"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="w-full bg-bg-panel border border-green-dark text-text-primary
                     px-4 py-3 text-sm font-mono uppercase
                     placeholder:text-text-secondary placeholder:normal-case
                     focus:outline-none focus:border-green-primary transition-colors
                     min-h-[44px]"
        />
      </div>

      {/* ---- WORKOUT TYPE SELECTOR ---- */}
      <div>
        <label className="block text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider mb-2">
          Workout Type
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {WORKOUT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setWorkoutType(type.value)}
              className={`shrink-0 px-4 py-2 text-[0.65rem] font-mono uppercase tracking-wider
                           border transition-colors min-h-[44px]
                ${workoutType === type.value
                  ? "bg-green-primary/20 border-green-primary text-green-light"
                  : "bg-bg-panel border-green-dark text-text-secondary hover:border-green-primary/50"
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- EXERCISES LIST ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
            Exercises ({exercises.length})
          </h3>
          {/* Estimated stats */}
          {exercises.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[0.6rem] font-mono text-text-secondary">
                ~{estimatedDurationMinutes} min
              </span>
              <span className="text-[0.6rem] font-mono text-xp-gold">
                +{estimatedXp} XP
              </span>
            </div>
          )}
        </div>

        {/* Empty state — no exercises added yet */}
        {exercises.length === 0 && !showSearch && (
          <Card>
            <div className="text-center py-4">
              <p className="text-sm font-mono text-text-secondary">
                No exercises added yet.
              </p>
              <p className="text-xs font-mono text-text-secondary mt-1">
                Tap the button below to search and add exercises.
              </p>
            </div>
          </Card>
        )}

        {/* ---- EXERCISE CARDS ---- */}
        {exercises.map((ex, index) => (
          <Card key={ex.id}>
            <div className="flex items-start gap-2">
              {/* Drag handle / reorder buttons */}
              <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                <GripVertical size={14} className="text-text-secondary" />
                {/* Move up button */}
                <button
                  onClick={() => moveExercise(index, "up")}
                  disabled={index === 0}
                  className="text-[0.5rem] font-mono text-text-secondary hover:text-green-light
                             disabled:opacity-30 min-h-[22px] min-w-[22px]"
                  aria-label="Move up"
                >
                  UP
                </button>
                {/* Move down button */}
                <button
                  onClick={() => moveExercise(index, "down")}
                  disabled={index === exercises.length - 1}
                  className="text-[0.5rem] font-mono text-text-secondary hover:text-green-light
                             disabled:opacity-30 min-h-[22px] min-w-[22px]"
                  aria-label="Move down"
                >
                  DN
                </button>
              </div>

              {/* Exercise details and configuration */}
              <div className="flex-1 min-w-0">
                {/* Exercise name and remove button */}
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-heading uppercase tracking-wider text-sand truncate">
                    {ex.name}
                  </h4>
                  <button
                    onClick={() => removeExercise(ex.id)}
                    className="p-1 text-text-secondary hover:text-danger transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Remove ${ex.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Muscle tags */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.muscles.slice(0, 3).map((muscle) => (
                    <Tag key={muscle} variant="default">
                      {muscle.toUpperCase()}
                    </Tag>
                  ))}
                </div>

                {/* Configuration: sets, reps/duration, rest */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {/* Sets input */}
                  <div>
                    <label className="block text-[0.5rem] font-mono text-text-secondary uppercase mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={ex.sets}
                      onChange={(e) => updateExercise(ex.id, "sets", parseInt(e.target.value) || 1)}
                      className="w-full bg-bg-primary border border-green-dark text-text-primary
                                 px-2 py-1.5 text-sm font-mono text-center
                                 focus:outline-none focus:border-green-primary transition-colors
                                 min-h-[44px]"
                    />
                  </div>

                  {/* Reps or Duration input (togglable) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[0.5rem] font-mono text-text-secondary uppercase">
                        {ex.reps !== null ? "Reps" : "Secs"}
                      </label>
                      {/* Toggle between reps and duration */}
                      <button
                        onClick={() => toggleMode(ex.id, ex.reps !== null ? "duration" : "reps")}
                        className="text-[0.45rem] font-mono text-green-light hover:text-green-primary
                                   transition-colors underline"
                      >
                        {ex.reps !== null ? "USE TIME" : "USE REPS"}
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={ex.reps !== null ? 100 : 300}
                      value={ex.reps !== null ? (ex.reps ?? 10) : (ex.durationSeconds ?? 30)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (ex.reps !== null) {
                          updateExercise(ex.id, "reps", val);
                        } else {
                          updateExercise(ex.id, "durationSeconds", val);
                        }
                      }}
                      className="w-full bg-bg-primary border border-green-dark text-text-primary
                                 px-2 py-1.5 text-sm font-mono text-center
                                 focus:outline-none focus:border-green-primary transition-colors
                                 min-h-[44px]"
                    />
                  </div>

                  {/* Rest seconds input */}
                  <div>
                    <label className="block text-[0.5rem] font-mono text-text-secondary uppercase mb-1">
                      Rest (s)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      step={15}
                      value={ex.restSeconds}
                      onChange={(e) => updateExercise(ex.id, "restSeconds", parseInt(e.target.value) || 0)}
                      className="w-full bg-bg-primary border border-green-dark text-text-primary
                                 px-2 py-1.5 text-sm font-mono text-center
                                 focus:outline-none focus:border-green-primary transition-colors
                                 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* ---- ADD EXERCISE BUTTON ---- */}
        {!showSearch && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowSearch(true)}
          >
            <span className="flex items-center gap-2 justify-center">
              <Plus size={16} />
              ADD EXERCISE
            </span>
          </Button>
        )}

        {/* ---- EXERCISE SEARCH PANEL ---- */}
        {showSearch && (
          <Card>
            <h4 className="text-sm font-heading uppercase tracking-wider text-sand mb-3">
              Search Exercises
            </h4>

            {/* Search input */}
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Search by name, muscle, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-bg-primary border border-green-dark text-text-primary
                           pl-10 pr-4 py-2.5 text-sm font-mono
                           placeholder:text-text-secondary
                           focus:outline-none focus:border-green-primary transition-colors"
              />
            </div>

            {/* Results count */}
            <p className="text-[0.55rem] font-mono text-text-secondary mb-2">
              {filteredLibrary.length} exercise{filteredLibrary.length !== 1 ? "s" : ""} found
            </p>

            {/* Scrollable results list */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredLibrary.map((ex) => {
                // Check if already added to prevent duplicates
                const alreadyAdded = exercises.some((e) => e.exerciseId === ex.id);

                return (
                  <div
                    key={ex.id}
                    className={`flex items-center justify-between p-2 border border-green-dark/50
                                transition-colors
                                ${alreadyAdded
                                  ? "opacity-40 bg-bg-panel-alt"
                                  : "bg-bg-primary hover:bg-bg-panel-alt cursor-pointer"
                                }`}
                    onClick={() => !alreadyAdded && addExercise(ex)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-heading uppercase tracking-wider text-sand truncate">
                        {ex.name}
                      </p>
                      <p className="text-[0.55rem] font-mono text-text-secondary mt-0.5">
                        {ex.muscles.slice(0, 3).join(", ")} | {ex.category}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <Tag variant="complete">ADDED</Tag>
                    ) : (
                      <Plus size={16} className="text-green-primary shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}

              {/* No results message */}
              {filteredLibrary.length === 0 && (
                <p className="text-center py-4 text-sm font-mono text-text-secondary">
                  No exercises match your search.
                </p>
              )}
            </div>

            {/* Close search button */}
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
              className="mt-3 text-xs font-mono text-text-secondary hover:text-green-light
                         uppercase tracking-wider transition-colors min-h-[44px]"
            >
              CLOSE SEARCH
            </button>
          </Card>
        )}
      </div>

      {/* ---- ERROR MESSAGE ---- */}
      {error && (
        <p className="text-sm font-mono text-danger">{error}</p>
      )}

      {/* ---- SUCCESS MESSAGE ---- */}
      {success && (
        <div className="bg-green-primary/20 border border-green-primary p-3 text-center">
          <p className="text-sm font-heading uppercase tracking-wider text-green-light">
            Loadout Locked In
          </p>
          <p className="text-xs font-mono text-text-secondary mt-1">
            Returning to operations...
          </p>
        </div>
      )}

      {/* ---- SAVE BUTTON ---- */}
      {exercises.length > 0 && !success && (
        <div className="space-y-3">
          {/* Workout summary before saving */}
          <div className="bg-bg-panel border border-green-dark p-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-mono text-text-secondary uppercase">
                Estimated Duration
              </span>
              <span className="text-sm font-mono text-text-primary">
                ~{estimatedDurationMinutes} min
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[0.6rem] font-mono text-text-secondary uppercase">
                XP Value
              </span>
              <span className="text-sm font-mono text-xp-gold">
                +{estimatedXp} XP
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[0.6rem] font-mono text-text-secondary uppercase">
                Exercises
              </span>
              <span className="text-sm font-mono text-text-primary">
                {exercises.length}
              </span>
            </div>
          </div>

          {/* Save button */}
          <Button
            fullWidth
            onClick={saveWorkout}
            disabled={saving}
          >
            <span className="flex items-center gap-2 justify-center">
              <Save size={16} />
              {saving ? "LOCKING IN..." : "DEPLOY LOADOUT"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
