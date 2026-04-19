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
import BottomSheet from "@/components/ui/BottomSheet";
import Tag from "@/components/ui/Tag";
import { loadFitnessTestSummaries, hasOverdueTest } from "@/lib/fitness/tests";
import { SkeletonCard } from "@/components/ui/Skeleton";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { Swords, Plus, Play, Check, Clock, Zap, MapPin, Loader2, Wrench, Flame, Moon, Route, Trophy, ArrowLeftRight, Target } from "lucide-react";
import { estimateCaloriesBurned } from "@/lib/calories";
import type { Workout, WorkoutData, TrainingSchedule } from "@/types";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

interface ProgrammeDay {
  day: string;
  is_rest_day: boolean;
  workout: { type: string; focus: string; name: string } | null;
  // Per-programme day-type override. When present, this wins over the
  // user's recurring training_schedule for THIS week only. Set by the
  // day-swap API so users can temporarily reshuffle the week without
  // touching their long-term schedule.
  schedule_type?: "workout" | "rest" | "run" | "activity";
}

// Derive a short label and colour from a workout's focus/type field
function getWorkoutLabel(focus: string): { label: string; color: string } {
  const f = focus.toLowerCase();
  if (f.includes("upper") || f.includes("push") || f.includes("chest") || f.includes("arm") || f.includes("shoulder"))
    return { label: "UPPER", color: "text-green-light" };
  if (f.includes("lower") || f.includes("leg") || f.includes("squat") || f.includes("glute"))
    return { label: "LEGS", color: "text-xp-gold" };
  if (f.includes("full") || f.includes("total"))
    return { label: "FULL", color: "text-sand" };
  if (f.includes("core") || f.includes("abs"))
    return { label: "CORE", color: "text-sand" };
  if (f.includes("cardio") || f.includes("hiit") || f.includes("conditioning"))
    return { label: "CARDIO", color: "text-danger" };
  if (f.includes("pull") || f.includes("back"))
    return { label: "PULL", color: "text-green-light" };
  // "General fitness" / mixed / unmatched focus → "ALL"
  if (f.includes("general") || f.includes("mixed") || f.includes("all"))
    return { label: "ALL", color: "text-sand" };
  return { label: "ALL", color: "text-text-secondary" };
}

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [programme, setProgramme] = useState<{ id: string; programme_data: ProgrammeDay[] } | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  // Set of YYYY-MM-DD dates in this week on which the user has a
  // completed run. Run-type days don't generate a workout row, so we
  // use this to tick them off on the calendar when a run is logged.
  const [completedRunDates, setCompletedRunDates] = useState<Set<string>>(new Set());
  const [trainingSchedule, setTrainingSchedule] = useState<TrainingSchedule>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingActivity, setCompletingActivity] = useState(false);

  // --- Swap-day state ---
  // When the user can't do a workout on its scheduled day (e.g. work),
  // they can bump it to another rest day later in the week. The bottom
  // sheet lists the eligible target days, and `swapping` disables the
  // UI while the API call is in flight.
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapping, setSwapping] = useState(false);

  // --- PFT overdue flag ---
  // Drives the OVERDUE tag on the Physical Assessment quick-link
  // card. Uses the same helpers as PFTReminder / the fitness-test
  // hub, so "overdue" means any of the three benchmarks is 90+
  // days old or has never been recorded.
  const [pftOverdue, setPftOverdue] = useState(false);

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

    // Fetch the set of dates this week that have at least one
    // completed run, so run-type days on the calendar can be marked
    // complete even though they don't have a workout row.
    const currentWeekStart = new Date();
    currentWeekStart.setHours(0, 0, 0, 0);
    const dow = currentWeekStart.getDay();
    const offsetToMonday = dow === 0 ? 6 : dow - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - offsetToMonday);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 7);

    const { data: runData } = await supabase
      .from("runs")
      .select("completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", currentWeekStart.toISOString())
      .lt("completed_at", weekEnd.toISOString());

    if (runData) {
      const dates = new Set<string>();
      for (const row of runData as { completed_at: string | null }[]) {
        if (!row.completed_at) continue;
        // Convert to local YYYY-MM-DD so we match against the
        // local calendar cell the user is looking at.
        const d = new Date(row.completed_at);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dates.add(`${y}-${m}-${day}`);
      }
      setCompletedRunDates(dates);
    } else {
      setCompletedRunDates(new Set());
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProgramme(); }, [loadProgramme]);

  // Check PFT status on mount so the Physical Assessment card can
  // flag itself as OVERDUE when any of the three benchmarks is 90+
  // days old. Cheap enough to re-run on every mount — it's the same
  // query the fitness-test hub itself runs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const summaries = await loadFitnessTestSummaries(user.id);
      if (!cancelled) setPftOverdue(hasOverdueTest(summaries));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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

      const { awardXPAndNotify } = await import("@/lib/award-and-notify");
      await awardXPAndNotify(xp, "workout_complete");

      // Refresh the data so the UI updates
      await loadProgramme();
    } catch (err) {
      console.error("Failed to complete activity:", err);
    } finally {
      setCompletingActivity(false);
    }
  }

  // Compute week start (Monday) so we can tell if a day is in the past
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayDOW = todayDate.getDay(); // 0=Sun…6=Sat
  const daysFromMonday = todayDOW === 0 ? 6 : todayDOW - 1;
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - daysFromMonday);

  // Move the currently selected workout from its day onto a rest day.
  // The API handles the actual swap on programme_data + workouts table.
  async function swapWorkoutDay(targetDay: string) {
    if (!programme) return;
    setSwapping(true);
    try {
      const response = await fetch("/api/swap-workout-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeId: programme.id,
          fromDay: selectedDay,
          toDay: targetDay,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to swap day");
      }

      // Close the sheet, follow the workout to its new day,
      // and refresh so the calendar reflects the change.
      setSwapSheetOpen(false);
      setSelectedDay(targetDay);
      await loadProgramme();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to swap day");
    } finally {
      setSwapping(false);
    }
  }

  // Resolve the effective "type" of a given day for THIS week.
  // The per-programme override takes precedence so that day swaps
  // stick for the current week without modifying the user's
  // recurring training_schedule. Falls back to the recurring rule.
  function getEffectiveDayType(dayName: string): string | undefined {
    const dayData = programme?.programme_data?.find((d) => d.day === dayName);
    if (dayData?.schedule_type) return dayData.schedule_type;
    return trainingSchedule[dayName as keyof TrainingSchedule]?.type;
  }

  // Format a Date as the local YYYY-MM-DD string we use as keys in
  // the completedRunDates set. Keeping this local (not UTC) so it
  // matches how the user thinks about "today".
  function localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // True when the given weekday is a run day AND the user logged
  // at least one run on that date this week. Lets us tick off run
  // days on the Battle Plan calendar even though run days don't
  // have a row in the workouts table.
  function isRunDayComplete(dayName: string): boolean {
    if (getEffectiveDayType(dayName) !== "run") return false;
    const idx = DAY_NAMES.indexOf(dayName);
    if (idx < 0) return false;
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + idx);
    return completedRunDates.has(localDateKey(dayDate));
  }

  // Summarise what's on a day in one short word for the swap picker
  // (so the user can tell at a glance what they're swapping into).
  function describeDay(dayName: string): { label: string; icon: typeof Swords } {
    const dayData = programme?.programme_data?.find((d) => d.day === dayName);
    const type = getEffectiveDayType(dayName);
    const workout = workouts.find((w) => {
      const wd = new Date(w.scheduled_date);
      return DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1] === dayName;
    });

    if (workout?.status === "complete") return { label: "COMPLETE", icon: Check };
    if (type === "run" && isRunDayComplete(dayName)) {
      return { label: "COMPLETE", icon: Check };
    }
    if (type === "run") return { label: "RUN", icon: Route };
    if (type === "activity") {
      const wd = workout?.workout_data as WorkoutData | undefined;
      return { label: (wd?.name ?? "ACTIVITY").toUpperCase(), icon: Trophy };
    }
    if (dayData?.workout && !dayData.is_rest_day) {
      return { label: getWorkoutLabel(dayData.workout.focus).label, icon: Swords };
    }
    return { label: "REST", icon: Moon };
  }

  // Which days in the current week are valid swap targets? Rules:
  //  - can't target the day you're already on
  //  - must not be in the past (can't bump work into yesterday)
  //  - must not have a completed workout (already locked in)
  // Any day type is fair game — workout, rest, run, or activity.
  function getEligibleSwapDays(): { day: string; label: string; date: Date }[] {
    if (!programme) return [];
    const eligible: { day: string; label: string; date: Date }[] = [];

    for (let i = 0; i < DAY_NAMES.length; i++) {
      const dayName = DAY_NAMES[i];
      if (dayName === selectedDay) continue;

      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      if (dayDate < todayDate) continue;

      // Skip days whose workout is already ticked off — moving a
      // completed mission would be confusing.
      const workout = workouts.find((w) => {
        const wd = new Date(w.scheduled_date);
        return DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1] === dayName;
      });
      if (workout?.status === "complete") continue;

      eligible.push({ day: dayName, label: DAY_LABELS[i], date: dayDate });
    }

    return eligible;
  }

  // Is the currently-selected day swappable at all?
  //  - must not be in the past
  //  - must not already be complete
  //  - there must be at least one valid target day
  function canSwapSelectedDay(): boolean {
    const selectedIdx = DAY_NAMES.indexOf(selectedDay);
    const selectedDate = new Date(weekStart);
    selectedDate.setDate(weekStart.getDate() + selectedIdx);
    if (selectedDate < todayDate) return false;
    if (selectedWorkout?.status === "complete") return false;
    return getEligibleSwapDays().length > 0;
  }

  // Get the programme data and workout for the selected day
  const selectedDayData = programme?.programme_data?.find((d) => d.day === selectedDay);
  const selectedWorkout = workouts.find((w) => {
    const wd = new Date(w.scheduled_date);
    return DAY_NAMES[wd.getDay() === 0 ? 6 : wd.getDay() - 1] === selectedDay;
  });

  // Pull-to-refresh: re-run the programme load (which also refreshes
  // the workouts + PFT flag). Consistent gesture across the whole app.
  const { pullDistance, refreshing } = usePullToRefresh({
    onRefresh: loadProgramme,
  });

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-8 w-20" />
        </div>
        <div className="grid grid-cols-7 gap-1">{DAY_LABELS.map((d) => <div key={d} className="skeleton h-16" />)}</div>
        <SkeletonCard />
        <div className="skeleton h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
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
            // A run day is considered complete when a run was logged
            // on that date, even though there's no workout row.
            const runComplete = isRunDayComplete(dayName);
            const isComplete = workout?.status === "complete" || runComplete;

            // Missed = past workout day that was not completed.
            // Run days are only "missed" if the date is past AND no
            // run was logged.
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const effectiveType = getEffectiveDayType(dayName);
            const isRunDay = effectiveType === "run";
            const isMissed =
              dayDate < todayDate &&
              !isComplete &&
              ((dayData !== undefined && !isRest) || isRunDay);

            return (
              <div key={dayName} className="flex flex-col">
                <button
                  onClick={() => setSelectedDay(dayName)}
                  className={`p-2 text-center border transition-all min-h-[64px]
                    ${isSelected ? "border-green-primary bg-green-primary/15 scale-[1.02]"
                      : isComplete ? "border-xp-gold/60 bg-xp-gold/10"
                      : isMissed ? "border-danger/60 bg-danger/10"
                      : isToday ? "border-white/60 bg-bg-panel"
                      : "border-green-dark bg-bg-panel hover:bg-bg-panel-alt"}`}
                >
                  <p className={`text-[0.55rem] font-mono ${isSelected ? "text-green-light font-bold" : isComplete ? "text-xp-gold font-bold" : isMissed ? "text-danger font-bold" : isToday ? "text-white font-bold" : "text-text-secondary"}`}>
                    {DAY_LABELS[i]}
                  </p>
                  <div className="w-6 h-6 mx-auto mt-1 flex items-center justify-center">
                    {(() => {
                      // Effective type honours per-week swap overrides
                      // before falling back to the recurring schedule.
                      const effectiveType = getEffectiveDayType(dayName);
                      const activeColor = isSelected || isToday ? "text-green-primary" : "text-text-secondary";

                      if (isComplete) return <Check size={14} className="text-xp-gold" />;
                      if (effectiveType === "run") return <Route size={12} className={activeColor} />;
                      if (effectiveType === "activity") return <Trophy size={12} className={isSelected || isToday ? "text-sand" : "text-text-secondary"} />;
                      if (isRest) return <Moon size={11} className="text-text-secondary" />;
                      return <Swords size={12} className={activeColor} />;
                    })()}
                  </div>
                  {/* Muscle group / workout type label — colour follows the day state */}
                  {(() => {
                    const labelColor = isSelected ? "text-green-light"
                      : isComplete ? "text-xp-gold"
                      : isMissed ? "text-danger"
                      : isToday ? "text-white"
                      : "text-text-secondary";
                    return (
                      <p className={`text-[0.6rem] font-mono font-bold mt-1 truncate ${dayData?.workout?.focus && !isRest ? labelColor : "invisible"}`}>
                        {dayData?.workout?.focus && !isRest ? getWorkoutLabel(dayData.workout.focus).label : "X"}
                      </p>
                    );
                  })()}
                </button>
                {/* Today indicator — upward-pointing triangle beneath the day card */}
                <div className="h-3 flex justify-center items-center">
                  {isToday && (
                    <div
                      className="w-0 h-0"
                      style={{
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderBottom: "7px solid white",
                      }}
                      aria-label="Today"
                    />
                  )}
                </div>
              </div>
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
              // Use the effective type so per-week swap overrides win
              const effectiveType = getEffectiveDayType(selectedDay);

              // Run day — if a run was logged today, tick the day
              // off on the Battle Plan. Otherwise, prompt the user
              // to go to the run tracker.
              if (effectiveType === "run") {
                if (isRunDayComplete(selectedDay)) {
                  return (
                    <Card tag="COMPLETE" tagVariant="complete">
                      <div className="text-center py-6">
                        <Check size={28} className="text-xp-gold mx-auto mb-3" />
                        <h4 className="text-sm font-heading uppercase tracking-wider text-sand mb-1">
                          Combat Run Complete
                        </h4>
                        <p className="text-xs text-text-secondary mb-4">
                          Run logged. Mission accomplished, soldier.
                        </p>
                        <Button onClick={() => router.push("/intel/runs")}>
                          <span className="flex items-center gap-2">
                            <Route size={14} /> VIEW RUN HISTORY
                          </span>
                        </Button>
                      </div>
                    </Card>
                  );
                }

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
                      <span className="flex items-center gap-1 text-[0.65rem] font-mono text-sand">
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
                      <button
                        className="mt-4 w-full py-3 bg-green-primary text-text-primary font-heading
                                   text-sm uppercase tracking-widest font-bold hover:bg-green-light
                                   active:scale-[0.98] transition-all min-h-[48px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/missions/player/${selectedWorkout.id}`);
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Play size={18} /> START WORKOUT
                        </span>
                      </button>
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

          {/* SWAP DAY — one unified button that works for any day type
              (workout, rest, run, or activity). Hidden on past and
              completed days, or when there's nowhere to swap to. */}
          {canSwapSelectedDay() && (
            <button
              className="w-full py-2 border border-green-dark bg-bg-panel-alt
                         text-green-light font-heading text-[0.7rem] uppercase
                         tracking-widest hover:bg-bg-panel active:scale-[0.98]
                         transition-all min-h-[44px]"
              onClick={() => setSwapSheetOpen(true)}
            >
              <span className="flex items-center justify-center gap-2">
                <ArrowLeftRight size={12} /> SWAP DAY
              </span>
            </button>
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
              <p className="text-xs text-text-secondary">GPS-tracked assault routes. Crush &apos;em.</p>
            </div>
            <Play size={16} className="text-green-primary" />
          </div>
        </Card>

        {/* Physical Assessment — moved here from the Debrief (Intel) page
            so the user's quarterly PFT benchmarks sit alongside their
            other active mission shortcuts. Shows an OVERDUE tag in
            the top-right whenever any of the three benchmarks is 90+
            days old (same rule as the fitness-test hub header). */}
        <Card onClick={() => router.push("/intel/fitness-test")} className="press-scale">
          <div className="flex items-center gap-3">
            <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
              <Target size={18} className="text-green-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-heading uppercase tracking-wider text-sand">Physical Assessment</h4>
              <p className="text-xs text-text-secondary">Quarterly fitness benchmarks (PFT)</p>
            </div>
            {pftOverdue && <Tag variant="danger">OVERDUE</Tag>}
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

      {/* Swap-day picker — lists every non-past, non-completed day in
          the week so the user can swap the currently selected day with
          any other. Workout, rest, run and activity days are all fair
          game; contents (and any matching workout rows) swap both ways. */}
      <BottomSheet
        isOpen={swapSheetOpen}
        onClose={() => !swapping && setSwapSheetOpen(false)}
        title="SWAP DAY"
      >
        <p className="text-xs text-text-secondary mb-4">
          Pick a day to swap with {DAY_LABELS[DAY_NAMES.indexOf(selectedDay)]}. Whatever&apos;s
          on each day will swap places — your recurring schedule stays the same, only
          this week is affected.
        </p>

        <div className="space-y-2">
          {getEligibleSwapDays().map(({ day, label, date }) => {
            const dateLabel = date.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            const { label: contentLabel, icon: DayIcon } = describeDay(day);
            return (
              <button
                key={day}
                disabled={swapping}
                onClick={() => swapWorkoutDay(day)}
                className="w-full flex items-center justify-between p-3
                           border border-green-dark bg-bg-panel-alt
                           hover:bg-bg-panel hover:border-green-primary
                           active:scale-[0.98] transition-all
                           min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <DayIcon size={14} className="text-green-light shrink-0" />
                  <span className="text-sm font-heading uppercase tracking-wider text-sand">
                    {label}
                  </span>
                  <span className="text-[0.6rem] font-mono text-text-secondary shrink-0">
                    {dateLabel}
                  </span>
                  <span className="text-[0.65rem] font-mono text-text-secondary truncate">
                    — {contentLabel}
                  </span>
                </span>
                <span className="text-[0.65rem] font-mono text-green-light uppercase tracking-wider shrink-0 ml-2">
                  {swapping ? "SWAPPING..." : "SWAP"}
                </span>
              </button>
            );
          })}

          {getEligibleSwapDays().length === 0 && (
            <p className="text-xs text-text-secondary text-center py-4">
              No other days available to swap with this week.
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
