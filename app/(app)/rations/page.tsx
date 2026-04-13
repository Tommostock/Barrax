/* ============================================
   RATIONS Page
   Integrated view: macro tracker at the top,
   meal plan below. Food diary is built into
   this page, not a separate route.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MacroRings from "@/components/nutrition/MacroRings";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import RecentFoods from "@/components/nutrition/RecentFoods";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { SkeletonCard } from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Utensils, Plus, ChevronDown, ChevronUp, Heart, RefreshCw,
  Check, Clock, Flame, Droplets, ShoppingCart, Loader2,
  CircleCheck, Trash2,
} from "lucide-react";
import type { FoodDiaryEntry, MealType } from "@/types";
import { calculateMacroTargets } from "@/lib/macros";

interface MealIngredient { name: string; quantity: string; checked: boolean; }
interface Meal {
  meal_type: string; name: string; description?: string; ingredients: MealIngredient[];
  method: string[]; prep_time_minutes: number; calories: number;
  protein_g: number; carbs_g: number; fat_g: number; is_maybe_food: boolean;
}
interface PlanDay { day: string; meals: Meal[]; }

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<string, string> = { breakfast: "BREAKFAST", lunch: "LUNCH", dinner: "DINNER", snack: "SNACK", supplement: "SUPPLEMENT" };

export default function RationsPage() {
  const router = useRouter();
  const supabase = createClient();

  // Meal plan state
  const [plan, setPlan] = useState<{ id: string; week_start: string; plan_data: PlanDay[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
  const [expandedDay, setExpandedDay] = useState<string | null>(todayName);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());
  const [eatenMeals, setEatenMeals] = useState<Set<string>>(new Set());
  const [swapping, setSwapping] = useState<string | null>(null);

  // Food diary state (today's entries)
  const [diaryEntries, setDiaryEntries] = useState<FoodDiaryEntry[]>([]);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  // Macro split % — defaults to balanced 30/40/30, overridden from profile
  const [macroSplit, setMacroSplit] = useState({ protein: 30, carbs: 40, fat: 30 });
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  // Smart default: pick meal type based on time of day
  const hour = new Date().getHours();
  const defaultMealType: MealType = hour < 10 ? "breakfast" : hour < 14 ? "lunch" : hour < 17 ? "snack" : "dinner";
  const [addFoodMealType, setAddFoodMealType] = useState<MealType>(defaultMealType);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [portionScale, setPortionScale] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [planResult, diaryResult, profileResult, savedResult] = await Promise.all([
      supabase.from("meal_plans").select("id, week_start, plan_data").eq("user_id", user.id).order("week_start", { ascending: false }).limit(1).single(),
      supabase.from("food_diary").select("*").eq("user_id", user.id).gte("logged_at", todayStart.toISOString()).lte("logged_at", todayEnd.toISOString()).order("logged_at", { ascending: true }),
      supabase.from("profiles").select("calorie_target, rest_day_calorie_target, training_schedule, protein_pct, carb_pct, fat_pct").eq("id", user.id).single(),
      supabase.from("saved_foods").select("food_name").eq("user_id", user.id),
    ]);

    if (planResult.data) setPlan(planResult.data as { id: string; week_start: string; plan_data: PlanDay[] });
    if (diaryResult.data) setDiaryEntries(diaryResult.data as FoodDiaryEntry[]);
    if (profileResult.data) {
      const schedule = (profileResult.data.training_schedule ?? {}) as Record<string, { type: string }>;
      const isRestDay = schedule[todayName]?.type === "rest";
      setCalorieTarget(
        isRestDay && profileResult.data.rest_day_calorie_target
          ? profileResult.data.rest_day_calorie_target
          : profileResult.data.calorie_target ?? 2000
      );
      setMacroSplit({
        protein: profileResult.data.protein_pct ?? 30,
        carbs: profileResult.data.carb_pct ?? 40,
        fat: profileResult.data.fat_pct ?? 30,
      });
    }
    if (savedResult.data) setSavedMeals(new Set(savedResult.data.map((s: { food_name: string }) => s.food_name)));

    setLoading(false);
  }, [supabase, todayName]);

  useEffect(() => { loadData(); }, [loadData]);

  // Macro targets derived from the user's calorie target + their
  // chosen split. Defaults to balanced 30/40/30 until the profile loads.
  const macroTargets = calculateMacroTargets(
    calorieTarget,
    macroSplit.protein,
    macroSplit.carbs,
    macroSplit.fat,
  );
  const proteinTarget = macroTargets.protein;
  const carbsTarget = macroTargets.carbs;
  const fatTarget = macroTargets.fat;

  // Today's totals from diary entries
  const todayTotals = diaryEntries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein_g || 0),
    carbs: acc.carbs + (e.carbs_g || 0),
    fat: acc.fat + (e.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Add food to diary (with quantity support)
  // IMPORTANT: build an EXPLICIT payload — do not spread `food`. The
  // payload must only contain columns that exist on the food_diary
  // table. Migration 009 adds fibre_g/sugar_g/salt_g columns so the
  // micronutrient data from Open Food Facts can be stored.
  async function addToDiary(food: {
    food_name: string; brand?: string; barcode?: string; calories: number;
    protein_g: number; carbs_g: number; fat_g: number;
    fibre_g?: number; sugar_g?: number; salt_g?: number;
    serving_size?: string;
    quantity?: number; source: "manual" | "barcode" | "search" | "meal_plan";
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not signed in");
    }

    const toNum = (v: unknown): number => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
    };

    const payload = {
      user_id: user.id,
      food_name: String(food.food_name ?? "").trim(),
      brand: food.brand ? String(food.brand) : null,
      barcode: food.barcode ? String(food.barcode) : null,
      calories: toNum(food.calories),
      protein_g: toNum(food.protein_g),
      carbs_g: toNum(food.carbs_g),
      fat_g: toNum(food.fat_g),
      fibre_g: toNum(food.fibre_g),
      sugar_g: toNum(food.sugar_g),
      salt_g: toNum(food.salt_g),
      serving_size: food.serving_size ? String(food.serving_size) : null,
      quantity: toNum(food.quantity ?? 1) || 1,
      meal_type: addFoodMealType,
      source: food.source,
    };

    if (!payload.food_name) {
      throw new Error("Food name is required");
    }

    const { data, error } = await supabase
      .from("food_diary")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Failed to log food:", error, "payload:", payload);
      const detail = [error.message, error.details, error.hint].filter(Boolean).join(" — ");
      throw new Error(detail || "Database insert failed");
    }
    if (data) setDiaryEntries(prev => [...prev, data as FoodDiaryEntry]);
    navigator.vibrate?.(50);

    // Fire-and-forget daily protein-target check — idempotent.
    import("@/lib/protein-xp")
      .then(({ awardProteinTargetIfHit }) => awardProteinTargetIfHit())
      .catch(() => {});
  }

  // Delete diary entry
  async function deleteDiaryEntry(id: string) {
    const { error } = await supabase.from("food_diary").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    setDiaryEntries(prev => prev.filter(e => e.id !== id));
  }

  // Generate meal plan
  // If there's an existing plan for the CURRENT week, rebuild only the
  // days from today onwards (keeping the earlier days untouched). If
  // there's no current-week plan, do a full 7-day generation.
  async function generatePlan() {
    setGenerating(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: prefs } = await supabase.from("food_preferences").select("food_name, category").eq("user_id", user.id);
      const noGo = prefs?.filter(p => p.category === "no_go").map(p => p.food_name) ?? [];
      const approved = prefs?.filter(p => p.category === "approved").map(p => p.food_name) ?? [];
      const maybe = prefs?.filter(p => p.category === "maybe").map(p => p.food_name) ?? [];

      // Compute this week's Monday (YYYY-MM-DD) to check if the existing
      // plan is still the active week.
      const now = new Date();
      const dow = now.getDay(); // 0=Sun...6=Sat
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const thisWeekMonday = new Date(now);
      thisWeekMonday.setDate(now.getDate() + mondayOffset);
      const thisWeekMondayStr = thisWeekMonday.toISOString().split("T")[0];

      const isPartialRebuild =
        plan !== null && plan.week_start === thisWeekMondayStr;

      const body: Record<string, unknown> = {
        noGoFoods: noGo,
        approvedFoods: approved,
        maybeFoods: maybe,
        calorieTarget,
      };
      if (isPartialRebuild && plan) {
        body.fromDay = todayName;
        body.existingPlanId = plan.id;
        body.existingPlanData = plan.plan_data;
      }

      const response = await fetch("/api/generate-meals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Failed"); }
      await loadData();
      // Notify that meal plan is ready
      const { notifyMealPlanReady } = await import("@/lib/notifications");
      notifyMealPlanReady();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setGenerating(false); }
  }

  // Save a meal to the saved_foods table (My Food)
  async function saveFavourite(meal: Meal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("saved_foods").insert({
      user_id: user.id,
      food_name: meal.name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      serving_size: `${meal.prep_time_minutes} min prep`,
    });
    if (error) {
      console.error("Failed to save food:", error);
      alert(`Failed to save food: ${error.message}`);
      return;
    }
    setSavedMeals(prev => new Set(prev).add(meal.name));
    navigator.vibrate?.(50);
  }

  // Mark meal as eaten (auto-log to food_diary)
  async function markAsEaten(meal: Meal, dayName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const mealKey = `${dayName}-${meal.meal_type}`;
    if (eatenMeals.has(mealKey)) {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("food_diary").delete().eq("user_id", user.id).eq("food_name", meal.name).eq("source", "meal_plan")
        .gte("logged_at", `${today}T00:00:00`).lte("logged_at", `${today}T23:59:59`);
      setEatenMeals(prev => { const s = new Set(prev); s.delete(mealKey); return s; });
      setDiaryEntries(prev => prev.filter(e => !(e.food_name === meal.name && e.source === "meal_plan")));
    } else {
      const { data } = await supabase.from("food_diary").insert({
        user_id: user.id, food_name: meal.name, calories: meal.calories,
        protein_g: meal.protein_g, carbs_g: meal.carbs_g, fat_g: meal.fat_g,
        meal_type: meal.meal_type, source: "meal_plan",
      }).select().single();
      setEatenMeals(prev => new Set(prev).add(mealKey));
      if (data) setDiaryEntries(prev => [...prev, data as FoodDiaryEntry]);
      navigator.vibrate?.(50);

      // Check if all 4 meals eaten today — award XP
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
      const { count: mealCount } = await supabase.from("food_diary")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("source", "meal_plan")
        .gte("logged_at", todayStart.toISOString())
        .lte("logged_at", todayEnd.toISOString());
      if (mealCount && mealCount >= 4) {
        const { awardXPAndNotify } = await import("@/lib/award-and-notify");
        await awardXPAndNotify(20, "meal_plan_followed");
      }
    }
  }

  // Swap meal
  async function swapMeal(meal: Meal, dayName: string) {
    const mealKey = `${dayName}-${meal.meal_type}`;
    setSwapping(mealKey);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch food preferences for the AI
      const { data: prefs } = await supabase.from("food_preferences").select("food_name, category").eq("user_id", user.id);
      const noGo = prefs?.filter(p => p.category === "no_go").map(p => p.food_name) ?? [];
      const approved = prefs?.filter(p => p.category === "approved").map(p => p.food_name) ?? [];

      // Calorie split per meal type — snacks are much smaller than main meals
      const mealCalorieRatios: Record<string, number> = {
        breakfast: 0.25,
        lunch: 0.30,
        dinner: 0.30,
        snack: 0.15,
      };
      const ratio = mealCalorieRatios[meal.meal_type] ?? 0.25;
      const targetCalories = Math.round(calorieTarget * ratio);

      // Call the server-side swap API (Gemini needs server-side API key)
      const res = await fetch("/api/swap-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: meal.meal_type,
          currentMealName: meal.name,
          targetCalories,
          noGoFoods: noGo,
          approvedFoods: approved,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.meal) {
        alert(`Swap failed: ${data.error || "Could not generate replacement"}`);
        return;
      }

      const newMeal = data.meal;

      // Update the meal plan in the database and local state
      if (plan) {
        const updatedDays = plan.plan_data.map(d => {
          if (d.day !== dayName) return d;
          return { ...d, meals: d.meals.map(m => m.meal_type === meal.meal_type ? { ...newMeal, meal_type: meal.meal_type, is_maybe_food: false } : m) };
        });
        const { error } = await supabase.from("meal_plans").update({ plan_data: updatedDays }).eq("id", plan.id);
        if (error) {
          alert(`Failed to save swap: ${error.message}`);
          return;
        }
        setPlan({ ...plan, plan_data: updatedDays });
        navigator.vibrate?.(50);
      }
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed. Please try again.");
    }
    finally { setSwapping(null); }
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        {/* Macro rings skeleton */}
        <div className="skeleton h-48 w-full" />
        {/* Meal type pills skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-8 flex-1" />)}
        </div>
        {/* Food diary items skeleton */}
        <SkeletonCard />
        <SkeletonCard />
        {/* Meal plan header skeleton */}
        <div className="skeleton h-6 w-40" />
        {/* Day cards skeleton */}
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">

      {/* ========== TODAY'S MACRO TRACKER (integrated at top) ========== */}
      <MacroRings
        calories={todayTotals.calories} calorieTarget={calorieTarget}
        protein={todayTotals.protein} proteinTarget={proteinTarget}
        carbs={todayTotals.carbs} carbsTarget={carbsTarget}
        fat={todayTotals.fat} fatTarget={fatTarget}
      />

      {/* Today's logged foods — compact inline list */}
      {diaryEntries.length > 0 && (
        <div className="bg-bg-panel border border-green-dark p-3 cursor-pointer hover:bg-bg-panel-alt transition-colors"
          onClick={() => router.push("/rations/diary")}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
              Today&apos;s Consumption ({diaryEntries.length} items)
            </p>
            <span className="text-[0.6rem] font-mono text-green-light">
              VIEW ALL →
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
            {diaryEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-text-primary truncate block">
                    {entry.food_name}{(entry.quantity ?? 1) > 1 ? ` x${entry.quantity}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-mono text-text-secondary">{Math.round(entry.calories)} kcal</span>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: entry.id, name: entry.food_name }); }}
                    className="text-text-secondary hover:text-danger min-w-[28px] min-h-[28px] flex items-center justify-center">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {MEAL_TYPES.map((type) => (
          <button key={type} onClick={() => { setAddFoodMealType(type); setAddFoodOpen(true); }}
            className="bg-bg-panel border border-green-dark p-2 text-center hover:bg-bg-panel-alt transition-colors min-h-[44px]">
            <Plus size={14} className="text-green-primary mx-auto mb-0.5" />
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">{MEAL_LABELS[type]}</p>
          </button>
        ))}
      </div>

      {/* Recent foods for quick re-add */}
      <RecentFoods onQuickAdd={(food) => addToDiary({ ...food, source: "manual" })} />

      {/* ========== WEEKLY MEAL PLAN ========== */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Weekly Arsenal</h2>
        <Button onClick={generatePlan} disabled={generating} className="text-xs px-3 py-2">
          <span className="flex items-center gap-1"><Plus size={14} />{generating ? "DEPLOYING..." : "REBUILD"}</span>
        </Button>
      </div>

      {generating && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-green-primary animate-spin mb-4" />
          <p className="text-sm font-heading uppercase tracking-wider text-sand">Assembling Rations</p>
          <p className="text-xs text-text-secondary mt-1">AI is building your meal arsenal...</p>
        </div>
      )}

      {error && <p className="text-danger text-sm font-mono">{error}</p>}

      {!plan && !generating && (
        <Card tag="NO RATIONS" tagVariant="default">
          <div className="text-center py-6">
            <Utensils size={32} className="text-text-secondary mx-auto mb-3 empty-state-icon" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-2">No Meal Arsenal</h3>
            <p className="text-xs text-text-secondary mb-4">Build your weekly meal arsenal based on YOUR food preferences. Get to it.</p>
            <Button onClick={generatePlan} disabled={generating}>
              <span className="flex items-center gap-2"><Plus size={16} />{generating ? "DEPLOYING..." : "ASSEMBLE RATIONS"}</span>
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
            <button onClick={() => setExpandedDay(isExpanded ? null : dayName)}
              className={`w-full flex items-center justify-between p-3 border transition-colors
                ${isToday ? "bg-bg-panel-alt border-green-primary" : "bg-bg-panel border-green-dark"} min-h-[44px]`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading uppercase tracking-wider text-sand">{DAY_LABELS[dayName]}</span>
                {isToday && <Tag variant="active">TODAY</Tag>}
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
            </button>

            {isExpanded && (
              <div className="border border-t-0 border-green-dark bg-bg-primary space-y-1 p-2">
                {dayData.meals.map((meal) => {
                  const mealKey = `${dayName}-${meal.meal_type}`;
                  const isMealExpanded = expandedMeal === mealKey;
                  const isSaved = savedMeals.has(meal.name);

                  return (
                    <div key={meal.meal_type} className="bg-bg-panel border border-green-dark/50">
                      <button onClick={() => setExpandedMeal(isMealExpanded ? null : mealKey)} className="w-full p-3 text-left min-h-[44px]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">{meal.meal_type}</span>
                            {meal.is_maybe_food && <Tag variant="gold" className="ml-2">TRY SOMETHING NEW</Tag>}
                            <p className="text-sm text-text-primary mt-0.5">{meal.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[0.6rem] font-mono text-text-secondary">
                            {eatenMeals.has(mealKey) && <Check size={12} className="text-green-light" />}
                            <span className="flex items-center gap-0.5"><Flame size={10} /> {meal.calories}</span>
                            <span className="flex items-center gap-0.5"><Clock size={10} /> {meal.prep_time_minutes}m</span>
                          </div>
                        </div>
                      </button>

                      {isMealExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-green-dark/30 pt-3">
                          {/* Meal description */}
                          {meal.description && (
                            <p className="text-xs text-text-secondary italic">{meal.description}</p>
                          )}
                          {/* Portion scaler */}
                          <div className="flex items-center gap-2">
                            <span className="text-[0.55rem] font-mono text-text-secondary uppercase">Portions:</span>
                            {[0.5, 1, 1.5, 2, 3].map((s) => (
                              <button key={s} onClick={(e) => { e.stopPropagation(); setPortionScale(s); }}
                                className={`px-2 py-1 text-[0.6rem] font-mono border transition-colors
                                  ${portionScale === s ? "bg-green-primary border-green-primary text-text-primary" : "border-green-dark text-text-secondary"}`}>
                                {s === 1 ? "1x" : `${s}x`}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Tag variant="default">{`P: ${Math.round(meal.protein_g * portionScale)}g`}</Tag>
                            <Tag variant="default">{`C: ${Math.round(meal.carbs_g * portionScale)}g`}</Tag>
                            <Tag variant="default">{`F: ${Math.round(meal.fat_g * portionScale)}g`}</Tag>
                            <Tag variant="default">{`${Math.round(meal.calories * portionScale)} kcal`}</Tag>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Ingredients {portionScale !== 1 ? `(x${portionScale})` : ""}</p>
                            {meal.ingredients?.map((ing, i) => {
                              // Try to scale numeric quantities (e.g. "200g" -> "400g" at 2x)
                              let displayQty = ing.quantity;
                              if (portionScale !== 1) {
                                const match = ing.quantity.match(/^([\d.]+)\s*(.*)/);
                                if (match) {
                                  const scaled = (parseFloat(match[1]) * portionScale);
                                  displayQty = `${scaled % 1 === 0 ? scaled : scaled.toFixed(1)} ${match[2]}`;
                                }
                              }
                              return <p key={i} className="text-xs text-text-primary py-0.5">{displayQty} {ing.name}</p>;
                            })}
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Method</p>
                            {meal.method?.map((step, i) => (
                              <p key={i} className="text-xs text-text-primary py-0.5">{i + 1}. {step}</p>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1 flex-wrap">
                            <button onClick={(e) => { e.stopPropagation(); markAsEaten(meal, dayName); }}
                              className={`flex items-center gap-1 px-3 py-2 border text-xs font-mono uppercase min-h-[44px]
                                ${eatenMeals.has(mealKey) ? "border-green-primary bg-green-primary/20 text-green-light" : "border-green-dark text-text-secondary hover:text-green-light"}`}>
                              <CircleCheck size={14} fill={eatenMeals.has(mealKey) ? "currentColor" : "none"} />
                              {eatenMeals.has(mealKey) ? "CONSUMED" : "DOWN THE HATCH"}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); saveFavourite(meal); }} disabled={isSaved}
                              className={`flex items-center gap-1 px-3 py-2 border text-xs font-mono uppercase min-h-[44px]
                                ${isSaved ? "border-green-primary text-green-light" : "border-green-dark text-text-secondary hover:text-green-light"}`}>
                              <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
                              {isSaved ? "SAVED" : "SAVE"}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); swapMeal(meal, dayName); }} disabled={swapping === mealKey}
                              className="flex items-center gap-1 px-3 py-2 border border-green-dark text-xs font-mono uppercase text-text-secondary hover:text-green-light min-h-[44px]">
                              <RefreshCw size={14} className={swapping === mealKey ? "animate-spin" : ""} />
                              {swapping === mealKey ? "SWAPPING..." : "SWAP"}
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
            <span className="text-sm text-text-primary">Saved Foods</span>
          </button>
          <button onClick={() => router.push("/rations/water")}
            className="w-full flex items-center gap-2 p-3 bg-bg-panel border border-green-dark hover:bg-bg-panel-alt transition-colors min-h-[44px]">
            <Droplets size={16} className="text-green-primary" />
            <span className="text-sm text-text-primary">Water Tracker</span>
          </button>
        </div>
      )}

      {/* Add food bottom sheet */}
      <AddFoodSheet
        isOpen={addFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        mealType={addFoodMealType}
        onAddFood={(food) => addToDiary(food)}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="DELETE FOOD"
        message={`Remove ${deleteTarget?.name ?? "this item"} from your diary?`}
        confirmLabel="DELETE"
        onConfirm={() => {
          if (deleteTarget) deleteDiaryEntry(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
