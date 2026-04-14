/* ============================================
   NUTRITION TRENDS Page
   Shows calorie and macro trends over the last
   30 days using Recharts bar and line charts.
   Data is fetched from the food_diary table.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";

/* ------------------------------------------
   TYPES
   Daily totals computed from food_diary entries.
   ------------------------------------------ */
interface DailyTotal {
  date: string;       // Display label like "Mon 6"
  fullDate: string;   // Full YYYY-MM-DD for sorting
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/* ------------------------------------------
   CHART COLOUR CONSTANTS
   Using the BARRAX military colour palette.
   ------------------------------------------ */
const COLOURS = {
  calories: "#4A6B3A",      // green-primary
  protein: "#6B8F5A",       // green-light
  carbs: "#B8A04A",         // xp-gold
  fat: "#C4B090",           // sand
  target: "#7A7A6E",        // text-secondary
};

/* ------------------------------------------
   CUSTOM TOOLTIP
   Dark-themed tooltip matching the BARRAX design system.
   Declared outside the component so it isn't recreated on each render.
   ------------------------------------------ */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-bg-panel border border-green-dark p-2">
      <p className="text-[0.6rem] font-mono text-text-secondary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[0.6rem] font-mono" style={{ color: entry.color }}>
          {entry.name}: {Math.round(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ==============================================
   MAIN COMPONENT
   ============================================== */
export default function NutritionTrendsPage() {
  const router = useRouter();
  const supabase = createClient();

  // ---- State ----
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------
     FETCH DATA
     Pull the last 30 days of food_diary entries
     and the user's calorie target from profiles.
     ------------------------------------------ */
  const loadData = useCallback(async () => {
    setLoading(true);

    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Calculate the date 30 days ago (YYYY-MM-DD format)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    // 3. Fetch food diary entries for the last 30 days
    const { data: entries } = await supabase
      .from("food_diary")
      .select("calories, protein_g, carbs_g, fat_g, logged_at")
      .eq("user_id", user.id)
      .gte("logged_at", startDate)
      .order("logged_at", { ascending: true });

    // 4. Fetch the user's calorie target from their profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("calorie_target")
      .eq("id", user.id)
      .single();

    if (profile?.calorie_target) {
      setCalorieTarget(profile.calorie_target);
    }

    // 5. Group entries by day and calculate daily totals
    if (entries && entries.length > 0) {
      const grouped: Record<string, DailyTotal> = {};

      entries.forEach((entry) => {
        // Extract the date part (YYYY-MM-DD) from the timestamp
        const dateKey = entry.logged_at.split("T")[0];

        // Create a new entry for this day if it doesn't exist yet
        if (!grouped[dateKey]) {
          // Format the date as a short label like "Mon 6"
          const dateObj = new Date(dateKey + "T00:00:00");
          const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "short" });
          const dayNum = dateObj.getDate();

          grouped[dateKey] = {
            date: `${dayName} ${dayNum}`,
            fullDate: dateKey,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          };
        }

        // Add this entry's macros to the day's running totals
        grouped[dateKey].calories += entry.calories || 0;
        grouped[dateKey].protein += entry.protein_g || 0;
        grouped[dateKey].carbs += entry.carbs_g || 0;
        grouped[dateKey].fat += entry.fat_g || 0;
      });

      // Convert to an array sorted by date
      const sorted = Object.values(grouped).sort(
        (a, b) => a.fullDate.localeCompare(b.fullDate)
      );

      setDailyTotals(sorted);
    }

    setLoading(false);
  }, [supabase]);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ------------------------------------------
     COMPUTED STATS
     Calculate averages and best/worst days
     from the last 14 days of data.
     ------------------------------------------ */

  // Use the last 14 days for chart display
  const recentDays = dailyTotals.slice(-14);

  // Average daily calories (across all 30 days of data)
  const avgCalories = dailyTotals.length > 0
    ? Math.round(dailyTotals.reduce((sum, d) => sum + d.calories, 0) / dailyTotals.length)
    : 0;

  // Average daily protein
  const avgProtein = dailyTotals.length > 0
    ? Math.round(dailyTotals.reduce((sum, d) => sum + d.protein, 0) / dailyTotals.length)
    : 0;

  // Best day = highest calorie day closest to target
  const bestDay = dailyTotals.length > 0
    ? dailyTotals.reduce((best, d) =>
        Math.abs(d.calories - calorieTarget) < Math.abs(best.calories - calorieTarget) ? d : best
      )
    : null;

  // Worst day = furthest from target
  const worstDay = dailyTotals.length > 0
    ? dailyTotals.reduce((worst, d) =>
        Math.abs(d.calories - calorieTarget) > Math.abs(worst.calories - calorieTarget) ? d : worst
      )
    : null;

  /* ==============================================
     LOADING STATE
     ============================================== */
  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  /* ==============================================
     RENDER
     ============================================== */
  return (
    <div className="px-4 py-4 space-y-6 pb-24">
      {/* ---- BACK BUTTON ---- */}
      <button
        onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      {/* ---- PAGE TITLE ---- */}
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Nutrition Trends
      </h2>

      {/* ---- SUMMARY STATS ---- */}
      <div className="grid grid-cols-2 gap-3">
        {/* Average daily calories */}
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Avg Daily Calories
          </p>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {avgCalories.toLocaleString()}
          </p>
          <p className="text-[0.5rem] font-mono text-text-secondary mt-1">
            Target: {calorieTarget.toLocaleString()}
          </p>
        </div>

        {/* Average daily protein */}
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Avg Daily Protein
          </p>
          <p className="text-2xl font-bold font-mono text-green-light">
            {avgProtein}g
          </p>
        </div>

        {/* Best day (closest to target) */}
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Best Day
          </p>
          <p className="text-sm font-bold font-mono text-green-primary">
            {bestDay ? bestDay.date : "---"}
          </p>
          <p className="text-[0.5rem] font-mono text-text-secondary mt-1">
            {bestDay ? `${bestDay.calories.toLocaleString()} kcal` : "No data"}
          </p>
        </div>

        {/* Worst day (furthest from target) */}
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
            Worst Day
          </p>
          <p className="text-sm font-bold font-mono text-danger">
            {worstDay ? worstDay.date : "---"}
          </p>
          <p className="text-[0.5rem] font-mono text-text-secondary mt-1">
            {worstDay ? `${worstDay.calories.toLocaleString()} kcal` : "No data"}
          </p>
        </div>
      </div>

      {/* ---- CHART 1: Daily Calorie Bar Chart ---- */}
      <div className="bg-bg-panel border border-green-dark p-4">
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-4">
          Daily Calories (Last 14 Days)
        </h3>

        {recentDays.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recentDays}>
              {/* X axis: date labels */}
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#7A7A6E", fontFamily: "monospace" }}
                axisLine={{ stroke: "#2D4220" }}
                tickLine={false}
                interval={1}
              />
              {/* Y axis: calorie values */}
              <YAxis
                tick={{ fontSize: 9, fill: "#7A7A6E", fontFamily: "monospace" }}
                axisLine={{ stroke: "#2D4220" }}
                tickLine={false}
                width={40}
              />
              {/* Hover tooltip */}
              <Tooltip content={<CustomTooltip />} />
              {/* Horizontal target line */}
              <ReferenceLine
                y={calorieTarget}
                stroke={COLOURS.target}
                strokeDasharray="4 4"
                label={{
                  value: "TARGET",
                  position: "insideTopRight",
                  style: { fontSize: 8, fill: "#7A7A6E", fontFamily: "monospace" },
                }}
              />
              {/* Calorie bars */}
              <Bar
                dataKey="calories"
                name="Calories"
                fill={COLOURS.calories}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* Empty state when no data exists */
          <div className="text-center py-8">
            <p className="text-sm font-mono text-text-secondary">
              No nutrition data for the last 30 days.
            </p>
            <p className="text-xs font-mono text-text-secondary mt-1">
              Log meals to see your trends here.
            </p>
          </div>
        )}
      </div>

      {/* ---- CHART 2: Macro Breakdown Line Chart ---- */}
      <div className="bg-bg-panel border border-green-dark p-4">
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-4">
          Macro Breakdown (Last 14 Days)
        </h3>

        {recentDays.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recentDays}>
              {/* X axis: date labels */}
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#7A7A6E", fontFamily: "monospace" }}
                axisLine={{ stroke: "#2D4220" }}
                tickLine={false}
                interval={1}
              />
              {/* Y axis: grams */}
              <YAxis
                tick={{ fontSize: 9, fill: "#7A7A6E", fontFamily: "monospace" }}
                axisLine={{ stroke: "#2D4220" }}
                tickLine={false}
                width={35}
              />
              {/* Hover tooltip */}
              <Tooltip content={<CustomTooltip />} />
              {/* Protein line (green-light) */}
              <Line
                type="monotone"
                dataKey="protein"
                name="Protein"
                stroke={COLOURS.protein}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COLOURS.protein }}
              />
              {/* Carbs line (xp-gold) */}
              <Line
                type="monotone"
                dataKey="carbs"
                name="Carbs"
                stroke={COLOURS.carbs}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COLOURS.carbs }}
              />
              {/* Fat line (sand) */}
              <Line
                type="monotone"
                dataKey="fat"
                name="Fat"
                stroke={COLOURS.fat}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COLOURS.fat }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* Empty state */
          <div className="text-center py-8">
            <p className="text-sm font-mono text-text-secondary">
              No macro data available yet.
            </p>
          </div>
        )}

        {/* Chart legend */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-green-dark/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-[2px]" style={{ backgroundColor: COLOURS.protein }} />
            <span className="text-[0.55rem] font-mono text-text-secondary">Protein</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-[2px]" style={{ backgroundColor: COLOURS.carbs }} />
            <span className="text-[0.55rem] font-mono text-text-secondary">Carbs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-[2px]" style={{ backgroundColor: COLOURS.fat }} />
            <span className="text-[0.55rem] font-mono text-text-secondary">Fat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
