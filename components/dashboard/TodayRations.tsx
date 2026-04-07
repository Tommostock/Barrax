/* ============================================
   TodayRations Component
   Compact view of today's meals from the active
   meal plan. Shows meal names with eaten status
   and mini macro rings in the header area.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { Utensils } from "lucide-react";

interface MealData {
  meal_type: string;
  name: string;
  calories: number;
  is_maybe_food: boolean;
}

interface PlanDay {
  day: string;
  meals: MealData[];
}

/** Macro totals from the food diary */
interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Targets derived from the user's calorie goal */
interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// ──────────────────────────────────────────────
// MiniRing — tiny SVG circular progress indicator
// Used in the rations header to show macro progress
// ──────────────────────────────────────────────

function MiniRing({
  value,
  max,
  size,
  strokeWidth,
  color,
  label,
}: {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-panel-alt)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Centre value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[0.5rem] font-bold font-mono text-text-primary leading-none">
            {Math.round(value)}
          </span>
        </div>
      </div>
      <p className="text-[0.45rem] font-mono text-text-secondary uppercase mt-0.5 leading-none">
        {label}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

export default function TodayRations() {
  const router = useRouter();
  const supabase = createClient();

  const [todayMeals, setTodayMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  // Macro data for the mini rings (from food diary)
  const [macros, setMacros] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets, setTargets] = useState<MacroTargets>({ calories: 2000, protein: 150, carbs: 200, fat: 67 });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // --- Fetch meal plan and food diary in parallel ---
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [planResult, profileResult, diaryResult] = await Promise.all([
        // Get the latest meal plan
        supabase
          .from("meal_plans")
          .select("plan_data")
          .eq("user_id", user.id)
          .order("week_start", { ascending: false })
          .limit(1)
          .single(),
        // Get calorie target from profile
        supabase
          .from("profiles")
          .select("calorie_target")
          .eq("id", user.id)
          .single(),
        // Get today's food diary entries for macro totals
        supabase
          .from("food_diary")
          .select("calories, protein_g, carbs_g, fat_g")
          .eq("user_id", user.id)
          .gte("logged_at", todayStart.toISOString())
          .lte("logged_at", todayEnd.toISOString()),
      ]);

      // Process meal plan
      if (planResult.data?.plan_data) {
        setHasPlan(true);
        const days = planResult.data.plan_data as PlanDay[];
        const todayName = DAY_NAMES[new Date().getDay()];
        const today = days.find((d) => d.day === todayName);
        if (today?.meals) setTodayMeals(today.meals);
      }

      // Process calorie target into macro targets
      const calTarget = profileResult.data?.calorie_target ?? 2000;
      setTargets({
        calories: calTarget,
        protein: Math.round(calTarget * 0.3 / 4),   // 30% protein
        carbs: Math.round(calTarget * 0.4 / 4),      // 40% carbs
        fat: Math.round(calTarget * 0.3 / 9),         // 30% fat
      });

      // Process food diary entries into macro totals
      const entries = diaryResult.data;
      if (entries && entries.length > 0) {
        setMacros({
          calories: entries.reduce((sum, e) => sum + (e.calories || 0), 0),
          protein: entries.reduce((sum, e) => sum + (e.protein_g || 0), 0),
          carbs: entries.reduce((sum, e) => sum + (e.carbs_g || 0), 0),
          fat: entries.reduce((sum, e) => sum + (e.fat_g || 0), 0),
        });
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className="skeleton h-28 w-full" />;

  if (!hasPlan) {
    return (
      <Card tag="RATIONS" tagVariant="default" onClick={() => router.push("/rations")}>
        <div className="flex items-center gap-2 mb-2">
          <Utensils size={16} className="text-text-secondary" />
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Today&apos;s Rations</h3>
        </div>
        <p className="text-xs text-text-secondary">Generate a meal plan to see your rations here.</p>
      </Card>
    );
  }

  return (
    <Card tag="RATIONS" tagVariant="active" onClick={() => router.push("/rations")} className="press-scale">
      {/* Header row: title on the left, mini macro rings on the right */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Utensils size={16} className="text-green-primary" />
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Today&apos;s Rations</h3>
        </div>

        {/* Mini macro rings — always visible, empty rings show targets at a glance */}
        <div className="flex items-center gap-2">
          <MiniRing
            value={macros.protein}
            max={targets.protein}
            size={32}
            strokeWidth={3}
            color="var(--green-light)"
            label="P"
          />
          <MiniRing
            value={macros.carbs}
            max={targets.carbs}
            size={32}
            strokeWidth={3}
            color="var(--xp-gold)"
            label="C"
          />
          <MiniRing
            value={macros.fat}
            max={targets.fat}
            size={32}
            strokeWidth={3}
            color="var(--khaki)"
            label="F"
          />
        </div>
      </div>

      {/* Meal rows */}
      <div className="space-y-2">
        {todayMeals.length > 0 ? todayMeals.map((meal) => (
          <div key={meal.meal_type}
            className="flex items-center justify-between py-1 border-b border-green-dark/50 last:border-0">
            <span className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider">
              {meal.meal_type}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-primary truncate max-w-[160px]">{meal.name}</span>
              <span className="text-[0.55rem] font-mono text-text-secondary">{meal.calories} kcal</span>
            </div>
          </div>
        )) : (
          <p className="text-xs text-text-secondary">No meals for today.</p>
        )}
      </div>
    </Card>
  );
}
