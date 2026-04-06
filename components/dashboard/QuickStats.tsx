/* ============================================
   QuickStats Component
   Row of stat boxes showing key weekly metrics.
   Pulls real data from the database.
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

      // This week's completed workouts
      const weekStart = new Date();
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
      weekStart.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "complete")
        .gte("completed_at", weekStart.toISOString());

      setWeekWorkouts(count ?? 0);

      // Calculate weekly XP from workouts completed this week
      const { data: weeklyWorkouts } = await supabase
        .from("workouts")
        .select("xp_earned")
        .eq("user_id", user.id)
        .eq("status", "complete")
        .gte("completed_at", weekStart.toISOString());

      const totalXP = weeklyWorkouts?.reduce((sum, w) => sum + (w.xp_earned || 0), 0) ?? 0;
      setWeekXP(totalXP);

      // Today's meals eaten
      const today = new Date().toISOString().split("T")[0];
      const { count: eatenCount } = await supabase
        .from("meal_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("day", today)
        .eq("eaten", true);

      setMealsToday(`${eatenCount ?? 0}/4`);
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
