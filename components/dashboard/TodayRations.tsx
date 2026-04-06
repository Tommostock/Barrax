/* ============================================
   TodayRations Component
   Compact view of today's meals from the active
   meal plan. Shows meal names with eaten status.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { Utensils, Check } from "lucide-react";

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

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function TodayRations() {
  const router = useRouter();
  const supabase = createClient();

  const [todayMeals, setTodayMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get the latest meal plan
      const { data: plan } = await supabase
        .from("meal_plans")
        .select("plan_data")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      if (plan?.plan_data) {
        setHasPlan(true);
        const days = plan.plan_data as PlanDay[];
        const todayName = DAY_NAMES[new Date().getDay()];
        const today = days.find((d) => d.day === todayName);
        if (today?.meals) setTodayMeals(today.meals);
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
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={16} className="text-green-primary" />
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Today&apos;s Rations</h3>
      </div>
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
