/* ============================================
   TodayStrip
   Single compact card showing today's workout on
   the left and today's calorie pill on the right,
   divided by a thin border. Reads from HQDataProvider
   (no fetch on mount -- the context already has the
   data cached at the layout level).
   ============================================ */

"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { Swords, Check, Utensils, Clock } from "lucide-react";
import type { WorkoutData } from "@/types";
import { useHQData } from "@/components/providers/HQDataProvider";

export default function TodayStrip() {
  const router = useRouter();
  const { data, loading } = useHQData();

  // First-paint skeleton only. On tab-switch re-renders we already
  // have `data` from the provider, so no skeleton flash.
  if (loading && !data) return <div className="skeleton h-24 w-full" />;

  const workout = data?.todayWorkout ?? null;
  const wd = (workout?.workout_data as WorkoutData | undefined) ?? null;
  const isComplete = workout?.status === "complete";
  const calories = data?.caloriesToday ?? 0;
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
