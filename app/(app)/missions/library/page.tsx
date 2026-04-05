/* ============================================
   EXERCISE LIBRARY Page
   Browse all exercises in the user's library.
   Filter by name, muscle group, and difficulty.
   Toggle favourites, view form cues, and see
   which exercises are locked behind higher ranks.
   ============================================ */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  Search,
  Heart,
  Lock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import type { Exercise } from "@/types";

/* ------------------------------------------
   MUSCLE GROUP FILTER OPTIONS
   "ALL" shows everything. The rest map to
   common muscle keywords in the exercises.
   ------------------------------------------ */
const MUSCLE_GROUPS = [
  "ALL",
  "CHEST",
  "BACK",
  "SHOULDERS",
  "ARMS",
  "CORE",
  "LEGS",
  "FULL BODY",
  "CARDIO",
] as const;

// Type for the muscle group filter values
type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/* ------------------------------------------
   DIFFICULTY LEVELS
   Exercises range from 1 (easiest) to 5 (hardest).
   Clicking a level filters to that difficulty only.
   ------------------------------------------ */
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

/* ------------------------------------------
   MUSCLE GROUP MATCHING HELPER
   Maps each filter button to the keywords we
   search for inside an exercise's muscles array.
   ------------------------------------------ */
const MUSCLE_KEYWORDS: Record<MuscleGroup, string[]> = {
  ALL: [],
  CHEST: ["chest"],
  BACK: ["back", "upper back", "lower back"],
  SHOULDERS: ["shoulders"],
  ARMS: ["triceps", "biceps", "arms"],
  CORE: ["core", "obliques", "hip flexors", "spine"],
  LEGS: ["quads", "glutes", "hamstrings", "calves", "adductors"],
  "FULL BODY": ["full body"],
  CARDIO: ["cardio"],
};

/* ==============================================
   MAIN COMPONENT
   ============================================== */
export default function ExerciseLibraryPage() {
  const router = useRouter();
  const supabase = createClient();

  // ---- State: data from the database ----
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userRank, setUserRank] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // ---- State: filters ----
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  // ---- State: which exercise's form cue is expanded ----
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ------------------------------------------
     FETCH EXERCISES + USER RANK
     Runs once when the page loads. Pulls all
     exercises for this user and their current rank.
     ------------------------------------------ */
  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Get the current logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Fetch all exercises from the exercise_library table
    const { data: exerciseData } = await supabase
      .from("exercise_library")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (exerciseData) {
      setExercises(exerciseData as Exercise[]);
    }

    // 3. Fetch the user's current rank (used to check locked exercises)
    const { data: rankData } = await supabase
      .from("ranks")
      .select("current_rank")
      .eq("user_id", user.id)
      .single();

    if (rankData) {
      setUserRank(rankData.current_rank);
    }

    setLoading(false);
  }, [supabase]);

  // Run the data fetch on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ------------------------------------------
     TOGGLE FAVOURITE
     Flips is_favourite in the database and
     updates local state so the UI reacts instantly.
     ------------------------------------------ */
  async function toggleFavourite(exerciseId: string, currentValue: boolean) {
    // Optimistic update: flip the value in local state first
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, is_favourite: !currentValue } : ex
      )
    );

    // Then persist the change to Supabase
    await supabase
      .from("exercise_library")
      .update({ is_favourite: !currentValue })
      .eq("id", exerciseId);
  }

  /* ------------------------------------------
     FILTER + SORT LOGIC
     1. Filter by search query (name match)
     2. Filter by muscle group
     3. Filter by difficulty
     4. Sort: favourites first, then by difficulty
     useMemo so we only recompute when inputs change.
     ------------------------------------------ */
  const filteredExercises = useMemo(() => {
    let result = [...exercises];

    // --- Search filter: match exercise name ---
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((ex) =>
        ex.name.toLowerCase().includes(query)
      );
    }

    // --- Muscle group filter ---
    if (selectedMuscle !== "ALL") {
      const keywords = MUSCLE_KEYWORDS[selectedMuscle];

      // Special case: CARDIO matches by category, not muscles array
      if (selectedMuscle === "CARDIO") {
        result = result.filter((ex) => ex.category === "cardio");
      } else {
        result = result.filter((ex) =>
          ex.muscles.some((muscle) =>
            keywords.some((kw) => muscle.toLowerCase().includes(kw))
          )
        );
      }
    }

    // --- Difficulty filter ---
    if (selectedDifficulty !== null) {
      result = result.filter((ex) => ex.difficulty === selectedDifficulty);
    }

    // --- Sort: favourites first, then by difficulty ascending ---
    result.sort((a, b) => {
      // Favourites always come first
      if (a.is_favourite && !b.is_favourite) return -1;
      if (!a.is_favourite && b.is_favourite) return 1;
      // Then sort by difficulty (easy to hard)
      return a.difficulty - b.difficulty;
    });

    return result;
  }, [exercises, searchQuery, selectedMuscle, selectedDifficulty]);

  /* ------------------------------------------
     HELPER: Render difficulty as filled squares
     e.g. difficulty 3 = [#][#][#][ ][ ]
     ------------------------------------------ */
  function DifficultyIndicator({ level }: { level: number }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 border ${
              i <= level
                ? "bg-green-primary border-green-light"
                : "bg-transparent border-green-dark"
            }`}
          />
        ))}
      </div>
    );
  }

  /* ------------------------------------------
     HELPER: Check if an exercise is locked
     Locked = exercise min_rank is higher than
     the user's current rank.
     ------------------------------------------ */
  function isLocked(exercise: Exercise): boolean {
    return exercise.min_rank > userRank;
  }

  /* ==============================================
     LOADING STATE
     Show skeleton cards while data is being fetched
     ============================================== */
  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        {/* Back button skeleton */}
        <div className="skeleton h-5 w-32" />
        {/* Search bar skeleton */}
        <div className="skeleton h-10 w-full" />
        {/* Filter buttons skeleton */}
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-7 w-20 shrink-0" />
          ))}
        </div>
        {/* Exercise card skeletons */}
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  /* ==============================================
     MAIN RENDER
     ============================================== */
  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* ---- HEADER: Back link + title ---- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/missions")}
          className="text-text-secondary hover:text-green-light transition-colors"
          aria-label="Back to missions"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          Exercise Library
        </h2>
        <Dumbbell size={18} className="text-green-primary" />
      </div>

      {/* ---- SEARCH BAR ---- */}
      <div className="relative">
        {/* Search icon inside the input */}
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-panel border border-green-dark text-text-primary
                     pl-10 pr-4 py-2.5 text-sm font-mono
                     placeholder:text-text-secondary
                     focus:outline-none focus:border-green-primary transition-colors"
        />
      </div>

      {/* ---- MUSCLE GROUP FILTER BUTTONS ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedMuscle(group)}
            className={`shrink-0 px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-wider
                         border transition-colors
              ${
                selectedMuscle === group
                  ? "bg-green-primary/20 border-green-primary text-green-light"
                  : "bg-bg-panel border-green-dark text-text-secondary hover:border-green-primary/50"
              }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* ---- DIFFICULTY FILTER BUTTONS ---- */}
      <div className="flex items-center gap-2">
        <span className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider">
          Difficulty:
        </span>
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() =>
              // Clicking the same level again deselects it
              setSelectedDifficulty(selectedDifficulty === level ? null : level)
            }
            className={`w-7 h-7 text-xs font-mono border transition-colors
              ${
                selectedDifficulty === level
                  ? "bg-green-primary/20 border-green-primary text-green-light"
                  : "bg-bg-panel border-green-dark text-text-secondary hover:border-green-primary/50"
              }`}
          >
            {level}
          </button>
        ))}
        {/* Clear difficulty filter button */}
        {selectedDifficulty !== null && (
          <button
            onClick={() => setSelectedDifficulty(null)}
            className="text-[0.6rem] font-mono text-text-secondary hover:text-green-light
                       underline transition-colors ml-1"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* ---- RESULTS COUNT ---- */}
      <p className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider">
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} found
      </p>

      {/* ---- EXERCISE CARDS ---- */}
      <div className="space-y-3">
        {filteredExercises.length === 0 ? (
          /* Empty state when no exercises match the filters */
          <Card>
            <div className="text-center py-6">
              <Dumbbell size={28} className="text-text-secondary mx-auto mb-3" />
              <p className="text-sm font-mono text-text-secondary">
                No exercises match your filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMuscle("ALL");
                  setSelectedDifficulty(null);
                }}
                className="text-xs font-mono text-green-light mt-2 underline
                           hover:text-green-primary transition-colors"
              >
                CLEAR ALL FILTERS
              </button>
            </div>
          </Card>
        ) : (
          filteredExercises.map((exercise) => {
            const locked = isLocked(exercise);
            const isExpanded = expandedId === exercise.id;

            return (
              <Card
                key={exercise.id}
                tag={locked ? "LOCKED" : undefined}
                tagVariant={locked ? "locked" : undefined}
                className={locked ? "opacity-60" : ""}
              >
                {/* Top row: name + favourite toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* Exercise name */}
                    <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                      {exercise.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {exercise.description}
                    </p>
                  </div>

                  {/* Favourite heart button + lock icon */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {locked ? (
                      /* Show lock icon for locked exercises */
                      <div className="flex items-center gap-1">
                        <Lock size={14} className="text-text-secondary" />
                        <span className="text-[0.55rem] font-mono text-text-secondary">
                          RANK {exercise.min_rank}
                        </span>
                      </div>
                    ) : (
                      /* Show favourite toggle for unlocked exercises */
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavourite(exercise.id, exercise.is_favourite);
                        }}
                        className="p-1 transition-colors"
                        aria-label={
                          exercise.is_favourite
                            ? "Remove from favourites"
                            : "Add to favourites"
                        }
                      >
                        <Heart
                          size={18}
                          className={
                            exercise.is_favourite
                              ? "text-red-500 fill-red-500"
                              : "text-text-secondary hover:text-red-400"
                          }
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Muscle tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {exercise.muscles.map((muscle) => (
                    <Tag key={muscle} variant="default">
                      {muscle.toUpperCase()}
                    </Tag>
                  ))}
                </div>

                {/* Difficulty + category row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] font-mono text-text-secondary uppercase">
                      Difficulty
                    </span>
                    <DifficultyIndicator level={exercise.difficulty} />
                  </div>
                  <Tag variant="default">{exercise.category.toUpperCase()}</Tag>
                </div>

                {/* Form cue: collapsible section (tap to show/hide) */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : exercise.id)
                  }
                  className="flex items-center gap-1 mt-3 text-[0.65rem] font-mono
                             text-green-light hover:text-green-primary transition-colors
                             uppercase tracking-wider"
                >
                  {isExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  Form Cue
                </button>

                {/* Expanded form cue content */}
                {isExpanded && (
                  <div className="mt-2 p-3 bg-bg-primary border border-green-dark">
                    <p className="text-xs text-text-primary leading-relaxed font-mono">
                      {exercise.form_cue}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
