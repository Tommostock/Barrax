/* ============================================
   MISSIONS Page
   Weekly programme view. The calendar at the top
   lets you select a day — only that day's workout
   shows below. Clicking a day selects it; clicking
   the actual workout card navigates to the detail.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Swords, Plus, Play, Check, Clock, Zap, MapPin, Loader2, Wrench, Flame, Moon, Route, Trophy } from "lucide-react";
import { estimateCaloriesBurned } from "@/lib/calories";
import type { Workout, WorkoutData, TrainingSchedule } from "@/types";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface ProgrammeDay {
  day: string;
  is_rest_day: boolean;
  workout: { type: string; focus: string; name: string } | null;
}

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [programme, setProgramme] = useState<{ id: string; programme_data: ProgrammeDay[] } | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [trainingSchedule, setTrainingSchedule] = useState<TrainingSchedule>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingActivity, setCompletingActivity] = useState(false);

  // --- Swipe detection for day navigation ---
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;

    setSelectedDay((prev) => {
      const currentIdx = DAY_NAMES.indexOf(prev);
      if (dx < 0) {
        // Swipe left → next day
        return DAY_NAMES[Math.min(currentIdx + 1, 6)];
      } else {
        // Swipe right → previous day
        return DAY_NAMES[Math.max(currentIdx - 1, 0)];
      }
    });
  }

  // Selected day in the calendar — defaults to today
  const todayIndex = new Date().getDay();
  const todayName = DAY_NAMES[todayIndex === 0 ? 6 : todayIndex - 1];
  const [selectedDay, setSelectedDay] = useState(todayName);

  const loadProgramme = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch programme and training schedule in parallel
    const [progResult, profileResult] = await Promise.all([
      supabase
        .from("workout_programmes")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("profiles")
        .select("training_schedule")
        .eq("id", user.id)
        .single(),
    ]);

    // Store the training schedule so the calendar can show correct icons
    if (profileResult.data?.training_schedule) {
      setTrainingSchedule(profileResult.data.training_schedule as TrainingSchedule);
    }

    if (progResult.data) {
      setProgramme(progResult.data as { id: string; programme_data: ProgrammeDay[] });

      const { data: workoutData } = await supabase
        .from("workouts")
        .select("*")
        .eq("programme_id", progResult.data.id)
        .order("scheduled_date", { ascending: true });

      if (workoutData) setWorkouts(workoutData as Workout[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProgramme(); }, [loadProgramme]);

  async function generateProgramme() {
    setGenerating(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: rank } = await supabase.from("ranks").select("current_rank").eq("user_id", user.id).single();

      await fetch("/api/seed-exercises", { method: "POST" });

      const response = await fetch("/api/generate-programme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableMinutes: profile?.default_workout_minutes ?? 30,
          currentRank: rank?.current_rank ?? 1,
          fitnessLevel: profile?.fitness_level ?? "beginner",
          goals: profile?.goals ?? ["general fitness"],
          trainingSchedule: profile?.training_schedule ?? {},
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate programme");
      }
      await loadProgramme();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  // Quick-complete an activity day (e.g. Football) in one tap.
  // Marks the workout as complete, awards XP, and refreshes.
  async function completeActivity(workout: Workout) {
    setCompletingActivity(true);
    try {
      const wd = workout.workout_data as WorkoutData;
      const duration = wd.duration_minutes ?? 60;
      const xp = wd.xp_value ?? (duration < 15 ? 30 : duration < 30 ? 50 : 80);

      // Mark as complete in the database
      await supabase
        .from("workouts")
        .update({
          status: "complete",
          completed_at: new Date().toISOString(),
          duration_seconds: duration * 60,
          xp_earned: xp,
        })
        .eq("id", workout.id);

      // Award XP
      await fetch("/api/award-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: xp, source: "workout_complete" }),
      });

      // Refresh the data so the UI updates
      await loadProgramme();
    } catch (err) {
      console.error("Failed to complete activity:", err);
    } finally {
      setCompletingActivity(false);
    }
  }

  // Get the programme data and workout for the selected day
  const selectedDayData = programme?.programme_data?.find((d) => d.day === selectedDay);
  const selectedWorkout = workouts.find((w) => {
    const wd = new Date(w.scheduled_date);
    return DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1] === selectedDay;
  });

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-48" />
        <div className="grid grid-cols-7 gap-1">{DAY_LABELS.map((d) => <div key={d} className="skeleton h-16" />)}</div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Battle Plan</h2>
        <Button onClick={generateProgramme} disabled={generating} className="text-xs px-3 py-2">
          <span className="flex items-center gap-1"><Plus size={14} />{generating ? "DEPLOYING..." : "ATTACK"}</span>
        </Button>
      </div>

      {/* Week calendar — tap a day to SELECT it (not navigate) */}
      {programme && (
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((dayName, i) => {
            const dayData = programme.programme_data?.find((d) => d.day === dayName);
            const workout = workouts.find((w) => {
              const wd = new Date(w.scheduled_date);
              return DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1] === dayName;
            });
            const isToday = dayName === todayName;
            const isSelected = dayName === selectedDay;
            const isRest = dayData?.is_rest_day;
            const isComplete = workout?.status === "complete";

            return (
              <button key={dayName}
                onClick={() => setSelectedDay(dayName)}
                className={`p-2 text-center border transition-all min-h-[56px]
                  ${isSelected ? "border-green-primary bg-green-primary/15 scale-[1.02]"
                    : isComplete ? "border-green-light/50 bg-bg-panel"
                    : "border-green-dark bg-bg-panel hover:bg-bg-panel-alt"}`}
              >
                <p className={`text-[0.55rem] font-mono ${isSelected ? "text-green-light font-bold" : isToday ? "text-green-light" : "text-text-secondary"}`}>
                  {DAY_LABELS[i]}
                </p>
                <div className="w-6 h-6 mx-auto mt-1 flex items-center justify-center">
                  {(() => {
                    // Use the training schedule to pick the right icon
                    const scheduleRule = trainingSchedule[dayName as keyof TrainingSchedule];
                    const activeColor = isSelected || isToday ? "text-green-primary" : "text-text-secondary";

                    if (isComplete) return <Check size={14} className="text-green-light" />;
                    if (scheduleRule?.type === "run") return <Route size={12} className={activeColor} />;
                    if (scheduleRule?.type === "activity") return <Trophy size={12} className={isSelected || isToday ? "text-khaki" : "text-text-secondary"} />;
                    if (isRest) return <Moon size={11} className="text-text-secondary" />;
                    return <Swords size={12} className={activeColor} />;
                  })()}
                </div>
                {isToday && <div className="w-1 h-1 mx-auto mt-0.5 bg-green-light" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading overlay when generating */}
      {generating && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-green-primary animate-spin mb-4" />
          <p className="text-sm font-heading uppercase tracking-wider text-sand">Deploying Battle Plan</p>
          <p className="text-xs text-text-secondary mt-1">AI is crafting your assault schedule...</p>
        </div>
      )}

      {error && <p className="text-danger text-sm font-mono">{error}</p>}

      {/* No programme state */}
      {!programme && !generating && (
        <Card tag="NO ORDERS" tagVariant="default">
          <div className="text-center py-6">
            <Swords size={32} className="text-text-secondary mx-auto mb-3 empty-state-icon" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">No Battle Plan Active</h3>
            <p className="text-xs text-text-secondary mb-4">Stop wasting time. Build your battle plan tailored to YOUR fitness level and goals. MOVE!</p>
            <Button onClick={generateProgramme} disabled={generating}>
              <span className="flex items-center gap-2"><Plus size={16} />{generating ? "DEPLOYING..." : "DEPLOY BATTLE PLAN"}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Selected day's workout — only shows ONE day at a time */}
      {programme && selectedDayData && (
        <div
          className="space-y-3"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary">
            {DAY_LABELS[DAY_NAMES.indexOf(selectedDay)]}&apos;s Mission
          </h3>

          {selectedDayData.is_rest_day && !selectedWorkout ? (
            /* Rest day or run day (no workout row) */
            (() => {
              const scheduleRule = trainingSchedule[selectedDay as keyof TrainingSchedule];

              // Run day — prompt to go to the run tracker
              if (scheduleRule?.type === "run") {
                return (
                  <Card tag="COMBAT RUN" tagVariant="active">
                    <div className="text-center py-6">
                      <Route size={28} className="text-green-primary mx-auto mb-3" />
                      <h4 className="text-sm font-heading uppercase tracking-wider text-sand mb-1">Combat Run Scheduled</h4>
                      <p className="text-xs text-text-secondary mb-4">
                        Get your boots laced. Track your route with GPS. No excuses.
                      </p>
                      <Button onClick={() => router.push("/missions/run")}>
                        <span className="flex items-center gap-2"><Route size={14} /> DEPLOY TRACKER</span>
                      </Button>
                    </div>
                  </Card>
                );
              }

              // Default rest day
              return (
                <Card tag="RECOVERY DAY" tagVariant="default">
                  <div className="text-center py-6">
                    <Moon size={28} className="text-text-secondary mx-auto mb-3" />
                    <h4 className="text-sm font-heading uppercase tracking-wider text-sand mb-1">Regroup and Recover</h4>
                    <p className="text-xs text-text-secondary">
                      That&apos;s right—your body repairs itself on rest days. Don&apos;t slack off, though. Stay ready.
                    </p>
                  </div>
                </Card>
              );
            })()
          ) : selectedWorkout ? (
            /* Workout card — activities stay on this page, workouts go to player */
            <Card
              tag={selectedWorkout.status === "complete" ? "COMPLETE" : selectedDay === todayName ? "TODAY" : "PENDING"}
              tagVariant={selectedWorkout.status === "complete" ? "complete" : selectedDay === todayName ? "active" : "default"}
              onClick={() => {
                // Don't navigate for activity cards — they have an inline LOG COMPLETE button
                const isActivity = (selectedWorkout.workout_data as WorkoutData).is_activity;
                if (isActivity && selectedWorkout.status !== "complete") return;
                router.push(
                  selectedWorkout.status === "complete"
                    ? `/missions/${selectedWorkout.id}`
                    : `/missions/player/${selectedWorkout.id}`
                );
              }}
              className="press-scale"
            >
              {(() => {
                const wd = selectedWorkout.workout_data as WorkoutData;
                const isComplete = selectedWorkout.status === "complete";
                return (
                  <div>
                    <h4 className="text-lg font-heading uppercase tracking-wider text-sand">{wd.name}</h4>
                    <p className="text-xs text-text-secondary mt-1 capitalize">{wd.type?.replace("_", " ")} {wd.focus ? `- ${wd.focus}` : ""}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary">
                        <Clock size={12} /> {wd.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-xp-gold">
                        <Zap size={12} /> +{wd.xp_value} XP
                      </span>
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-khaki">
                        <Flame size={12} /> ~{wd.estimated_calories
                          ? wd.estimated_calories
                          : estimateCaloriesBurned(wd.type, (wd.duration_minutes ?? 30) * 60)} kcal
                      </span>
                    </div>

                    {/* Exercise preview */}
                    {wd.exercises && wd.exercises.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-dark/50">
                        <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-2">
                          {wd.exercises.length} EXERCISES
                        </p>
                        <div className="space-y-1">
                          {wd.exercises.slice(0, 4).map((ex, i) => (
                            <p key={i} className="text-xs text-text-primary">
                              {ex.name} — {ex.sets}x{ex.reps ?? `${ex.duration_seconds}s`}
                            </p>
                          ))}
                          {wd.exercises.length > 4 && (
                            <p className="text-[0.6rem] text-text-secondary font-mono">
                              +{wd.exercises.length - 4} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action area */}
                    {isComplete ? (
                      <div className="mt-4 flex items-center justify-center gap-2 py-2 text-green-light">
                        <Check size={16} /> <span className="text-xs font-heading uppercase tracking-wider">TARGET NEUTRALIZED</span>
                      </div>
                    ) : wd.is_activity ? (
                      /* Activity — one-tap CONFIRM MISSION button right on the card */
                      <button
                        className="mt-4 w-full py-2.5 bg-green-primary text-text-primary font-heading
                                   text-xs uppercase tracking-widest font-bold hover:bg-green-light
                                   active:scale-[0.98] transition-all min-h-[44px]"
                        disabled={completingActivity}
                        onClick={(e) => {
                          e.stopPropagation();
                          completeActivity(selectedWorkout);
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Trophy size={14} /> {completingActivity ? "CONFIRMING..." : "MISSION COMPLETE"}
                        </span>
                      </button>
                    ) : (
                      <div className="mt-4 flex items-center justify-center gap-2 py-2 text-green-primary">
                        <Play size={14} /> <span className="text-xs font-heading uppercase tracking-wider">TAP TO ENGAGE</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>
          ) : (
            /* Day has a workout in programme but no workout record yet */
            <Card tag="SCHEDULED" tagVariant="default">
              <div className="text-center py-4">
                <Swords size={24} className="text-text-secondary mx-auto mb-2" />
                <p className="text-xs text-text-secondary">
                  {selectedDayData.workout?.name ?? "Workout scheduled"} — {selectedDayData.workout?.type?.replace("_", " ")}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick links — always visible */}
      <div className="space-y-2 pt-2">
        <Card onClick={() => router.push("/missions/run")} className="press-scale">
          <div className="flex items-center gap-3">
            <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
              <MapPin size={18} className="text-green-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-heading uppercase tracking-wider text-sand">Combat Run Tracker</h4>
              <p className="text-xs text-text-secondary">GPS-tracked assault routes. Crush 'em.</p>
            </div>
            <Play size={16} className="text-green-primary" />
          </div>
        </Card>

        <Card onClick={() => router.push("/missions/builder")} className="press-scale">
          <div className="flex items-center gap-3">
            <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
              <Wrench size={18} className="text-green-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-heading uppercase tracking-wider text-sand">Assemble Your Loadout</h4>
              <p className="text-xs text-text-secondary">Build your custom assault from the arsenal</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="pt-1">
        <button onClick={() => router.push("/missions/library")}
          className="text-xs text-green-light font-mono uppercase tracking-wider hover:text-green-primary transition-colors">
          BROWSE EXERCISE LIBRARY →
        </button>
      </div>
    </div>
  );
}
