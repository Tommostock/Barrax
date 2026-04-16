/* ============================================
   TodayCaloriesCard
   Half-width HQ card showing today's calorie total,
   progress bar, and three mini macro rings. Paired
   with TodayWorkoutCard in a two-column grid.

   Reads from HQDataProvider. Tap to navigate to
   the FUEL UP tab.
   ============================================ */

"use client";

import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { useHQData } from "@/components/providers/HQDataProvider";

// ---------- Mini macro ring ----------
// Tiny SVG circle. Small enough to fit three across a half-width
// card without breaking the layout.
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
  const size = 34;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const offset = circumference - pct * circumference;
  const remaining = Math.max(0, Math.round(target - value));

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
      <p className="text-[0.45rem] font-mono text-text-secondary uppercase leading-none tabular-nums">
        {remaining}g LEFT
      </p>
    </div>
  );
}

// ---------- Component ----------
export default function TodayCaloriesCard() {
  const router = useRouter();
  const { data, loading } = useHQData();

  if (loading && !data) return <div className="skeleton h-full w-full" />;

  const calories = data?.caloriesToday ?? 0;
  const target = data?.calorieTarget ?? 2000;
  const caloriePct =
    target > 0 ? Math.min(100, Math.round((calories / target) * 100)) : 0;
  const remaining = Math.max(0, target - calories);
  const over = calories > target;

  return (
    <Card
      tag="FUEL"
      tagVariant="active"
      onClick={() => router.push("/rations")}
      hudFrame
    >
      <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
        {/* Label (icon removed — was taking up valuable space) */}
        <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
          Calories · today
        </p>

        {/* Big number / target */}
        <p className="text-sm font-heading uppercase tracking-wider text-sand tabular-nums">
          {calories.toLocaleString()}
          <span className="text-text-secondary">
            {" "}
            / {target.toLocaleString()}
          </span>
        </p>

        {/* Remaining or over-budget readout */}
        <p className="text-[0.6rem] font-mono uppercase tracking-wider tabular-nums">
          {over ? (
            <>
              <span className="text-danger">
                +{(calories - target).toLocaleString()}
              </span>
              <span className="text-text-secondary"> over target</span>
            </>
          ) : (
            <>
              <span className="text-green-light">
                {remaining.toLocaleString()}
              </span>
              <span className="text-text-secondary"> kcal left</span>
            </>
          )}
        </p>

        {/* Progress bar */}
        <div className="h-1 bg-bg-input w-full overflow-hidden mt-1">
          <div
            className={`h-full transition-all duration-500 ${
              over ? "bg-danger" : "bg-green-primary"
            }`}
            style={{ width: `${caloriePct}%` }}
          />
        </div>

        {/* Macros header */}
        <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary mt-auto pt-2">
          Macros
        </p>

        {/* Macro rings row */}
        <div className="flex items-start justify-around w-full pt-1">
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
      </div>
    </Card>
  );
}
