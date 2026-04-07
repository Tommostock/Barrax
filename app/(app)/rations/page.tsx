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
import ProgressBar from "@/components/ui/ProgressBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  Utensils, Plus, ChevronDown, ChevronUp, Heart, RefreshCw,
  Check, Clock, Flame, Droplets, ShoppingCart, Loader2,
  CircleCheck, Trash2, Scan, PenLine, Search,
} from "lucide-react";
import type { FoodDiaryEntry, MealType } from "@/types";

interface MealIngredient { name: string; quantity: string; checked: boolean; }
interface Meal {
  meal_type: string; name: string; ingredients: MealIngredient[];
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
const MEAL_LABELS: Record<string, string> = { breakfast: "BREAKFAST", lunch: "LUNCH", dinner: "DINNER", snack: "SNACK" };

export default function RationsPage() {
  const router = useRouter();
  const supabase = createClient();

  // Meal plan state
  const [plan, setPlan] = useState<{ id: string; plan_data: PlanDay[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayAutoExpand = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
  const [expandedDay, setExpandedDay] = useState<string | null>(todayAutoExpand);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<string>>(new Set());
  const [eatenMeals, setEatenMeals] = useState<Set<string>>(new Set());
  const [swapping, setSwapping] = useState<string | null>(null);

  // Food diary state (today's entries)
  const [diaryEntries, setDiaryEntries] = useState<FoodDiaryEntry[]>([]);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addFoodMealType, setAddFoodMealType] = useState<MealType>("snack");

  const todayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = todayNames[new Date().getDay()];

  // Load meal plan + today's diary entries + profile
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Load meal plan
    const { data: planData } = await supabase
      .from("meal_plans").select("id, plan_data")
      .eq("user_id", user.id).order("week_start", { ascending: false }).limit(1).single();
    if (planData) setPlan(planData as { id: string; plan_data: PlanDay[] });

    // Load today's food diary
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const { data: diary } = await supabase.from("food_diary").select("*")
      .eq("user_id", user.id)
      .gte("logged_at", todayStart.toISOString())
      .lte("logged_at", todayEnd.toISOString())
      .order("logged_at", { ascending: true });
    if (diary) setDiaryEntries(diary as FoodDiaryEntry[]);

    // Load calorie target
    const { data: profile } = await supabase.from("profiles").select("calorie_target").eq("id", user.id).single();
    if (profile?.calorie_target) setCalorieTarget(profile.calorie_target);

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // Macro targets from calorie target (30% P, 40% C, 30% F)
  const proteinTarget = Math.round(calorieTarget * 0.3 / 4);
  const carbsTarget = Math.round(calorieTarget * 0.4 / 4);
  const fatTarget = Math.round(calorieTarget * 0.3 / 9);

  // Today's totals from diary entries
  const todayTotals = diaryEntries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein_g || 0),
    carbs: acc.carbs + (e.carbs_g || 0),
    fat: acc.fat + (e.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Add food to diary
  async function addToDiary(food: {
    food_name: string; brand?: string; barcode?: string; calories: number;
    protein_g: number; carbs_g: number; fat_g: number; serving_size?: string;
    source: "manual" | "barcode" | "search" | "meal_plan";
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("food_diary").insert({
      user_id: user.id, ...food, meal_type: addFoodMealType,
    }).select().single();
    if (data) setDiaryEntries(prev => [...prev, data as FoodDiaryEntry]);
    navigator.vibrate?.(50);
  }

  // Delete diary entry
  async function deleteDiaryEntry(id: string) {
    await supabase.from("food_diary").delete().eq("id", id);
    setDiaryEntries(prev => prev.filter(e => e.id !== id));
  }

  // Generate meal plan
  async function generatePlan() {
    setGenerating(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: prefs } = await supabase.from("food_preferences").select("food_name, category").eq("user_id", user.id);
      const noGo = prefs?.filter(p => p.category === "no_go").map(p => p.food_name) ?? [];
      const approved = prefs?.filter(p => p.category === "approved").map(p => p.food_name) ?? [];
      const maybe = prefs?.filter(p => p.category === "maybe").map(p => p.food_name) ?? [];
      const response = await fetch("/api/generate-meals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noGoFoods: noGo, approvedFoods: approved, maybeFoods: maybe, calorieTarget }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Failed"); }
      await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setGenerating(false); }
  }

  // Save favourite
  async function saveFavourite(meal: Meal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("favourite_meals").insert({ user_id: user.id, meal_data: meal });
    setSavedMeals(prev => new Set(prev).add(meal.name));
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
    }
  }

  // Swap meal
  async function swapMeal(meal: Meal, dayName: string) {
    const mealKey = `${dayName}-${meal.meal_type}`;
    setSwapping(mealKey);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prefs } = await supabase.from("food_preferences").select("food_name, category").eq("user_id", user.id);
      const noGo = prefs?.filter(p => p.category === "no_go").map(p => p.food_name) ?? [];
      const approved = prefs?.filter(p => p.category === "approved").map(p => p.food_name) ?? [];
      const { data: profile } = await supabase.from("profiles").select("calorie_target").eq("id", user.id).single();
      const { callGemini } = await import("@/lib/gemini");
      const newMeal = await callGemini<Meal>({
        systemPrompt: `You are a nutritionist. Generate a single ${meal.meal_type} meal replacement. Respond ONLY in valid JSON matching: { "meal_type": string, "name": string, "ingredients": [{"name": string, "quantity": string}], "method": [string], "prep_time_minutes": number, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "is_maybe_food": false }. UK ingredients, budget-friendly, max 30 min prep. NEVER use these foods: ${noGo.join(", ")}. Prefer these: ${approved.join(", ")}.`,
        userPrompt: `Replace this ${meal.meal_type}: "${meal.name}". Generate a different meal for ~${Math.round((profile?.calorie_target ?? 2000) / 4)} calories. Do NOT suggest the same meal.`,
      });
      if (plan && newMeal) {
        const updatedDays = plan.plan_data.map(d => {
          if (d.day !== dayName) return d;
          return { ...d, meals: d.meals.map(m => m.meal_type === meal.meal_type ? { ...newMeal, meal_type: meal.meal_type, is_maybe_food: false } : m) };
        });
        await supabase.from("meal_plans").update({ plan_data: updatedDays }).eq("id", plan.id);
        setPlan({ ...plan, plan_data: updatedDays });
      }
    } catch (err) { console.error("Swap failed:", err); }
    finally { setSwapping(null); }
  }

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-32 w-full" /><SkeletonCard /><SkeletonCard /></div>;
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
        <div className="bg-bg-panel border border-green-dark p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider">
              Today&apos;s Consumption ({diaryEntries.length} items)
            </p>
            <button onClick={() => router.push("/rations/diary")}
              className="text-[0.6rem] font-mono text-green-light hover:text-green-primary">
              FULL DIARY →
            </button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
            {diaryEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-text-primary truncate block">{entry.food_name}</span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-mono text-text-secondary">{Math.round(entry.calories)} kcal</span>
                  <button onClick={() => deleteDiaryEntry(entry.id)}
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
      <RecentFoods mealType={addFoodMealType} onQuickAdd={(food) => addToDiary({ ...food, source: "manual" })} />

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
                          <div className="flex gap-2">
                            <Tag variant="default">{`P: ${meal.protein_g}g`}</Tag>
                            <Tag variant="default">{`C: ${meal.carbs_g}g`}</Tag>
                            <Tag variant="default">{`F: ${meal.fat_g}g`}</Tag>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Ingredients</p>
                            {meal.ingredients?.map((ing, i) => (
                              <p key={i} className="text-xs text-text-primary py-0.5">{ing.quantity} {ing.name}</p>
                            ))}
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
            <span className="text-sm text-text-primary">Favourite Meals</span>
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
    </div>
  );
}
