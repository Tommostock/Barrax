/* ============================================
   TodayStrip
   One card, two columns:

     LEFT  - Today's workout: codename, focus line,
             duration + XP badge
     RIGHT - Today's calories: big number vs target,
             progress bar, three mini macro rings

   Both columns are tappable -- workout -> player,
   calories -> rations diary. Reads from the HQ
   data cache so tab switches are instant.

   Everything XP-related (badge, +N XP labels) is
   rendered in --xp-gold to stay visually consistent
   with the rest of the app.
   ============================================ */

"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { Swords, Check, Utensils, Clock, Zap } from "lucide-react";
import type { WorkoutData } from "@/types";
import { useHQData } from "@/components/providers/HQDataProvider";

// ---------- Mini macro ring ----------
// Tiny SVG circle showing value / target as a 360-degree arc. Small
// enough to fit three across the right-hand column without blowing
// the single-screen budget. Colours match the rest of the app's
// macro palette: protein=green-light, carbs=gold, fat=sand.
function MacroRing({
  value,
  target,
  colour,
  label,
}: {
  value: number;
  target: number;
  colour: string;
  label: string;
}) {
  const size = 30;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-input)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colour}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[0.5rem] font-bold font-mono text-text-primary leading-none tabular-nums">
            {Math.round(value)}
          </span>
        </div>
      </div>
      <p className="text-[0.45rem] font-mono text-text-secondary uppercase mt-0.5 leading-none tracking-wider">
        {label}
      </p>
    </div>
  );
}

// ---------- Component ----------
export default function TodayStrip() {
  const router = useRouter();
  const { data, loading } = useHQData();

  if (loading && !data) return <div className="skeleton h-44 w-full" />;

  const workout = data?.todayWorkout ?? null;
  const wd = (workout?.workout_data as WorkoutData | undefined) ?? null;
  const isComplete = workout?.status === "complete";

  const calories = data?.caloriesToday ?? 0;
  const target = data?.calorieTarget ?? 2000;
  const caloriePct =
    target > 0 ? Math.min(100, Math.round((calories / target) * 100)) : 0;

  // Short focus line for the workout column. Falls back to the
  // capitalised `type` field if the programme generator didn't
  // include a `focus` string.
  const focusLine =
    wd?.focus?.trim() ||
    (wd?.type ? wd.type.replace(/_/g, " ").toUpperCase() : null) ||
    (wd ? "No focus set" : null);

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
          className="flex flex-col items-start gap-1 text-left active:opacity-80 transition-opacity min-w-0"
          aria-label={wd ? `Open workout: ${wd.name}` : "Go to missions"}
        >
          {/* Top row: icon + "Workout" label */}
          <div className="flex items-center gap-2">
            <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
              {isComplete ? (
                <Check size={14} className="text-green-light" />
              ) : (
                <Swords size={14} className="text-green-primary" />
              )}
            </div>
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
              Workout
            </p>
          </div>

          {/* Operation codename */}
          <p className="text-sm font-heading uppercase tracking-wider text-sand truncate w-full">
            {wd?.name ?? "No orders"}
          </p>

          {/* Focus / type / fallback description, 2 lines max */}
          {focusLine ? (
            <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider line-clamp-2 leading-snug">
              {focusLine}
            </p>
          ) : (
            <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
              Tap to build
            </p>
          )}

          {/* Footer row: duration + XP badge (gold) */}
          {wd && (
            <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
              <span className="flex items-center gap-1 text-[0.6rem] font-mono text-text-secondary">
                <Clock size={10} />
                {wd.duration_minutes} min
              </span>
              {isComplete ? (
                <span className="flex items-center gap-1 text-[0.6rem] font-mono text-green-light uppercase tracking-wider">
                  <Check size={10} /> done
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[0.6rem] font-mono text-xp-gold uppercase tracking-wider">
                  <Zap size={10} /> +{wd.xp_value} XP
                </span>
              )}
            </div>
          )}
        </button>

        {/* ---------- RIGHT: calories + macros ---------- */}
        <button
          type="button"
          onClick={() => router.push("/rations")}
          className="flex flex-col items-start gap-1 text-left active:opacity-80 transition-opacity border-l border-green-dark pl-3 min-w-0"
          aria-label="Open rations"
        >
          {/* Top row: icon + "Calories" label */}
          <div className="flex items-center gap-2">
            <div className="min-w-[28px] min-h-[28px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
              <Utensils size={14} className="text-green-primary" />
            </div>
            <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
              Calories
            </p>
          </div>

          {/* Big number / target */}
          <p className="text-sm font-heading uppercase tracking-wider text-sand tabular-nums">
            {calories.toLocaleString()}
            <span className="text-text-secondary">
              {" "}
              / {target.toLocaleString()}
            </span>
          </p>

          {/* Progress bar */}
          <div className="h-1 bg-bg-input w-full overflow-hidden">
            <div
              className="h-full bg-green-primary transition-all duration-500"
              style={{ width: `${caloriePct}%` }}
            />
          </div>

          {/* Macro rings row -- fills the remaining vertical space */}
          <div className="flex items-center justify-around w-full mt-auto pt-1">
            <MacroRing
              value={data?.proteinToday ?? 0}
              target={data?.proteinTarget ?? 150}
              colour="var(--green-light)"
              label="P"
            />
            <MacroRing
              value={data?.carbsToday ?? 0}
              target={data?.carbsTarget ?? 200}
              colour="var(--xp-gold)"
              label="C"
            />
            <MacroRing
              value={data?.fatToday ?? 0}
              target={data?.fatTarget ?? 67}
              colour="var(--sand)"
              label="F"
            />
          </div>
        </button>
      </div>
    </Card>
  );
}
