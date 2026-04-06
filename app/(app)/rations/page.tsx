/* ============================================
   RATIONS Page
   Weekly meal plan viewer. Shows 7-day expandable
   cards with meals, ingredients, and method steps.
   Generate new plans via AI, mark meals as eaten,
   save favourites.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  Utensils, Plus, ChevronDown, ChevronUp, Heart,
  Check, Clock, Flame, Droplets, ShoppingCart, Loader2, PieChart,
} from "lucide-react";

interface MealIngredient { name: string; quantity: string; checked: boolean; }
interface Meal {
  meal_type: string;
  name: string;
  ingredients: MealIngredient[];
  method: string[];
  prep_time_minutes: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_maybe_food: boolean;
}
interface PlanDay { day: string; meals: Meal[]; }

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

export default function RationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [plan, setPlan] = useState<{ id: string; plan_data: PlanDay[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Auto-expand today's meals by default
  const todayAutoExpand = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
  const [expandedDay, setExpandedDay] = useState<string | null>(todayAutoExpand);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());

  const loadPlan = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("meal_plans")
      .select("id, plan_data")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    if (data) setPlan(data as { id: string; plan_data: PlanDay[] });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  // Generate a new meal plan
  async function generatePlan() {
    setGenerating(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch food preferences
      const { data: prefs } = await supabase
        .from("food_preferences")
        .select("food_name, category")
        .eq("user_id", user.id);

      const noGo = prefs?.filter(p => p.category === "no_go").map(p => p.food_name) ?? [];
      const approved = prefs?.filter(p => p.category === "approved").map(p => p.food_name) ?? [];
      const maybe = prefs?.filter(p => p.category === "maybe").map(p => p.food_name) ?? [];

      // Get calorie target
      const { data: profile } = await supabase
        .from("profiles")
        .select("calorie_target")
        .eq("id", user.id)
        .single();

      const response = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noGoFoods: noGo,
          approvedFoods: approved,
          maybeFoods: maybe,
          calorieTarget: profile?.calorie_target ?? 2000,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate meal plan");
      }

      await loadPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  // Save a meal to favourites
  async function saveFavourite(meal: Meal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("favourite_meals").insert({
      user_id: user.id,
      meal_data: meal,
    });

    setSavedMeals(prev => new Set(prev).add(meal.name));
  }

  // Get today's day name for highlighting
  const todayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = todayNames[new Date().getDay()];

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-40" />
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* Food diary quick link */}
      <button onClick={() => router.push("/rations/diary")}
        className="w-full flex items-center gap-3 p-3 bg-green-primary/10 border border-green-primary
                   hover:bg-green-primary/20 transition-colors min-h-[44px]">
        <PieChart size={18} className="text-green-primary" />
        <div className="flex-1 text-left">
          <span className="text-sm font-heading uppercase tracking-wider text-sand">Food Diary</span>
          <p className="text-[0.6rem] text-text-secondary">Track macros, scan barcodes, log food</p>
        </div>
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Weekly Rations</h2>
        <Button onClick={generatePlan} disabled={generating} className="text-xs px-3 py-2">
          <span className="flex items-center gap-1">
            <Plus size={14} />{generating ? "GENERATING..." : "NEW PLAN"}
          </span>
        </Button>
      </div>

      {/* Loading overlay when generating */}
      {generating && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-green-primary animate-spin mb-4" />
          <p className="text-sm font-heading uppercase tracking-wider text-sand">Generating Meal Plan</p>
          <p className="text-xs text-text-secondary mt-1">AI is planning your rations...</p>
        </div>
      )}

      {error && <p className="text-danger text-sm font-mono">{error}</p>}

      {/* No plan state */}
      {!plan && !generating && (
        <Card tag="NO PLAN" tagVariant="default">
          <div className="text-center py-6">
            <Utensils size={32} className="text-text-secondary mx-auto mb-3" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">No Active Meal Plan</h3>
            <p className="text-xs text-text-secondary mb-4">
              Generate a weekly meal plan based on your food preferences and calorie target.
            </p>
            <Button onClick={generatePlan} disabled={generating}>
              <span className="flex items-center gap-2">
                <Plus size={16} />{generating ? "GENERATING..." : "GENERATE MEAL PLAN"}
              </span>
            </Button>
          </div>
        </Card>
      )}

      {/* Day cards */}
      {plan && DAY_ORDER.map((dayName) => {
        const dayData = plan.plan_data?.find(d => d.day === dayName);
        if (!dayData) return null;

        const isToday = dayName === todayName;
        const isExpanded = expandedDay === dayName;

        return (
          <div key={dayName}>
            {/* Day header — click to expand */}
            <button
              onClick={() => setExpandedDay(isExpanded ? null : dayName)}
              className={`w-full flex items-center justify-between p-3 border transition-colors
                ${isToday ? "bg-bg-panel-alt border-green-primary" : "bg-bg-panel border-green-dark"}
                min-h-[44px]`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading uppercase tracking-wider text-sand">
                  {DAY_LABELS[dayName]}
                </span>
                {isToday && <Tag variant="active">TODAY</Tag>}
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-text-secondary" />
                : <ChevronDown size={16} className="text-text-secondary" />}
            </button>

            {/* Expanded meal list */}
            {isExpanded && (
              <div className="border border-t-0 border-green-dark bg-bg-primary space-y-1 p-2">
                {dayData.meals.map((meal) => {
                  const mealKey = `${dayName}-${meal.meal_type}`;
                  const isMealExpanded = expandedMeal === mealKey;
                  const isSaved = savedMeals.has(meal.name);

                  return (
                    <div key={meal.meal_type} className="bg-bg-panel border border-green-dark/50">
                      {/* Meal summary */}
                      <button
                        onClick={() => setExpandedMeal(isMealExpanded ? null : mealKey)}
                        className="w-full p-3 text-left min-h-[44px]"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
                              {meal.meal_type}
                            </span>
                            {meal.is_maybe_food && (
                              <Tag variant="gold" className="ml-2">TRY SOMETHING NEW</Tag>
                            )}
                            <p className="text-sm text-text-primary mt-0.5">{meal.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[0.6rem] font-mono text-text-secondary">
                            <span className="flex items-center gap-0.5"><Flame size={10} /> {meal.calories}</span>
                            <span className="flex items-center gap-0.5"><Clock size={10} /> {meal.prep_time_minutes}m</span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded meal detail */}
                      {isMealExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-green-dark/30 pt-3">
                          {/* Macros */}
                          <div className="flex gap-2">
                            <Tag variant="default">{`P: ${meal.protein_g}g`}</Tag>
                            <Tag variant="default">{`C: ${meal.carbs_g}g`}</Tag>
                            <Tag variant="default">{`F: ${meal.fat_g}g`}</Tag>
                          </div>

                          {/* Ingredients */}
                          <div>
                            <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Ingredients</p>
                            {meal.ingredients?.map((ing, i) => (
                              <p key={i} className="text-xs text-text-primary py-0.5">
                                {ing.quantity} {ing.name}
                              </p>
                            ))}
                          </div>

                          {/* Method */}
                          <div>
                            <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Method</p>
                            {meal.method?.map((step, i) => (
                              <p key={i} className="text-xs text-text-primary py-0.5">
                                {i + 1}. {step}
                              </p>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => saveFavourite(meal)}
                              disabled={isSaved}
                              className={`flex items-center gap-1 px-3 py-2 border text-xs font-mono uppercase min-h-[44px]
                                ${isSaved ? "border-green-primary text-green-light" : "border-green-dark text-text-secondary hover:text-green-light"}`}
                            >
                              <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
                              {isSaved ? "SAVED" : "SAVE"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Quick links */}
      {plan && (
        <div className="space-y-2 pt-2">
          <button onClick={() => router.push("/rations/shopping")}
            className="w-full flex items-center gap-2 p-3 bg-bg-panel border border-green-dark hover:bg-bg-panel-alt transition-colors min-h-[44px]">
            <ShoppingCart size={16} className="text-green-primary" />
            <span className="text-sm text-text-primary">Shopping List</span>
          </button>
          <button onClick={() => router.push("/rations/favourites")}
            className="w-full flex items-center gap-2 p-3 bg-bg-panel border border-green-dark hover:bg-bg-panel-alt transition-colors min-h-[44px]">
            <Heart size={16} className="text-green-primary" />
            <span className="text-sm text-text-primary">Favourite Meals</span>
          </button>
          <button onClick={() => router.push("/rations/water")}
            className="w-full flex items-center gap-2 p-3 bg-bg-panel border border-green-dark hover:bg-bg-panel-alt transition-colors min-h-[44px]">
            <Droplets size={16} className="text-green-primary" />
            <span className="text-sm text-text-primary">Water Tracker</span>
          </button>
        </div>
      )}
    </div>
  );
}
