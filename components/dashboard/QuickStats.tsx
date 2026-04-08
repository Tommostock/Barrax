/* ============================================
   QuickStats Component
   Row of stat boxes showing key weekly metrics.
   All queries run in parallel for speed.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Zap, Utensils } from "lucide-react";

export default function QuickStats() {
  const supabase = createClient();

  const [weekWorkouts, setWeekWorkouts] = useState(0);
  const [weekXP, setWeekXP] = useState(0);
  const [mealsToday, setMealsToday] = useState("0/4");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = new Date();
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
      weekStart.setHours(0, 0, 0, 0);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Run all 3 queries in parallel instead of sequentially
      const [countResult, xpResult, mealsResult] = await Promise.all([
        supabase.from("workouts").select("*", { count: "exact", head: true })
          .eq("user_id", user.id).eq("status", "complete").gte("completed_at", weekStart.toISOString()),
        supabase.from("workouts").select("xp_earned")
          .eq("user_id", user.id).eq("status", "complete").gte("completed_at", weekStart.toISOString()),
        supabase.from("food_diary").select("*", { count: "exact", head: true })
          .eq("user_id", user.id).gte("logged_at", todayStart.toISOString()).lte("logged_at", todayEnd.toISOString()),
      ]);

      setWeekWorkouts(countResult.count ?? 0);
      setWeekXP(xpResult.data?.reduce((sum, w) => sum + (w.xp_earned || 0), 0) ?? 0);
      setMealsToday(`${mealsResult.count ?? 0}/4`);
    }
    load();
  }, [supabase]);

  const stats = [
    { label: "MISSIONS", value: String(weekWorkouts), icon: Target },
    { label: "XP THIS WEEK", value: String(weekXP), icon: Zap },
    { label: "MEALS TODAY", value: mealsToday, icon: Utensils },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-bg-panel border border-green-dark p-3 text-center">
            <Icon size={16} className="text-green-primary mx-auto mb-1" />
            <p className="text-lg font-bold font-mono text-text-primary">{stat.value}</p>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
