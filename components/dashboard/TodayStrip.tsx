/* ============================================
   TodayStrip
   A single compact card showing the two most
   important "today" signals side-by-side:

     LEFT  column: today's scheduled workout
     RIGHT column: today's calorie pill

   Replaces the separate TodayMission + TodayRations
   cards from the old HQ. Each column deep-links to
   the relevant screen on tap. Tight by design -- one
   glance, one tap, nothing more.
   ============================================ */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { Swords, Check, Utensils, Clock } from "lucide-react";
import type { Workout, WorkoutData } from "@/types";

// ---------- Types ----------
interface StripData {
  workout: Workout | null;
  caloriesLogged: number;
  calorieTarget: number;
}

// ---------- Component ----------
export default function TodayStrip() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<StripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [workoutRes, profileRes, diaryRes] = await Promise.all([
        supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .eq("scheduled_date", today)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("calorie_target")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("food_diary")
          .select("calories")
          .eq("user_id", user.id)
          .gte("logged_at", todayStart.toISOString())
          .lte("logged_at", todayEnd.toISOString()),
      ]);

      const caloriesLogged = (diaryRes.data ?? []).reduce(
        (sum, e) => sum + (e.calories ?? 0),
        0,
      );

      setData({
        workout: (workoutRes.data as Workout | null) ?? null,
        caloriesLogged: Math.round(caloriesLogged),
        calorieTarget: profileRes.data?.calorie_target ?? 2000,
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className="skeleton h-24 w-full" />;

  const workout = data?.workout ?? null;
  const wd = (workout?.workout_data as WorkoutData | undefined) ?? null;
  const isComplete = workout?.status === "complete";
  const calories = data?.caloriesLogged ?? 0;
  const target = data?.calorieTarget ?? 2000;
  const caloriePct = target > 0 ? Math.min(100, Math.round((calories / target) * 100)) : 0;

  function goToWorkout() {
    if (!workout) {
      router.push("/missions");
      return;
    }
    router.push(
      isComplete
        ? `/missions/${workout.id}`
        : `/missions/player/${workout.id}`,
    );
  }

  return (
    <Card tag="TODAY" tagVariant="active" className="press-scale">
      <div className="grid grid-cols-2 gap-3">
        {/* ---------- LEFT: today's workout ---------- */}
        <button
          type="button"
          onClick={goToWorkout}
          className="flex items-start gap-2 text-left active:opacity-80 transition-opacity"
          aria-label={wd ? `Open workout: ${wd.name}` : "Go to missions"}
        >
          <div className="min-w-[32px] min-h-[32px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
            {isComplete ? (
              <Check size={16} className="text-green-light" />
            ) : (
              <Swords size={16} className="text-green-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
              Workout
            </p>
            <p className="text-sm font-heading uppercase tracking-wider text-sand truncate">
              {wd?.name ?? "No orders"}
            </p>
            {wd ? (
              <p className="flex items-center gap-1 text-[0.6rem] font-mono text-text-secondary mt-0.5">
                <Clock size={10} />
                {wd.duration_minutes} min
                {isComplete ? " · done" : ` · +${wd.xp_value} XP`}
              </p>
            ) : (
              <p className="text-[0.6rem] font-mono text-text-secondary mt-0.5">
                Tap to build
              </p>
            )}
          </div>
        </button>

        {/* ---------- RIGHT: calorie pill ---------- */}
        <button
          type="button"
          onClick={() => router.push("/rations")}
          className="flex items-start gap-2 text-left active:opacity-80 transition-opacity border-l border-green-dark pl-3"
          aria-label="Open rations"
        >
          <div className="min-w-[32px] min-h-[32px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
            <Utensils size={16} className="text-green-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
              Calories
            </p>
            <p className="text-sm font-heading uppercase tracking-wider text-sand tabular-nums">
              {calories.toLocaleString()}
              <span className="text-text-secondary"> / {target.toLocaleString()}</span>
            </p>
            {/* Thin progress bar */}
            <div className="mt-1 h-1 bg-bg-input w-full overflow-hidden">
              <div
                className="h-full bg-green-primary transition-all duration-500"
                style={{ width: `${caloriePct}%` }}
              />
            </div>
          </div>
        </button>
      </div>
    </Card>
  );
}
