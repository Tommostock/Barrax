/* ============================================
   Food Diary Page
   Daily macro counter and food logging. Shows a
   date selector, macro rings, collapsible meal
   sections (Breakfast/Lunch/Dinner/Snack), and a
   sticky bottom bar with daily totals.

   Users add food via barcode scan, search, or
   manual entry. Each entry can be deleted.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MacroRings from "@/components/nutrition/MacroRings";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
  Utensils,
  ChevronDown,
  ChevronUp,
  Heart,
} from "lucide-react";
import type { FoodDiaryEntry, MealType } from "@/types";

// ──────────────────────────────────────────────
// Helper: format a Date as "06 APR 2026"
// ──────────────────────────────────────────────
function formatDateDisplay(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// ──────────────────────────────────────────────
// Helper: get the start and end of a day (local)
// Used to query Supabase for entries on a single day.
// ──────────────────────────────────────────────
function getDayBounds(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// ──────────────────────────────────────────────
// Meal sections in display order
// ──────────────────────────────────────────────
const MEAL_SECTIONS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snack" },
];

// ──────────────────────────────────────────────
// Map FoodSource values to display labels and Tag variants.
// "barcode" -> [SCAN], "search" -> [SEARCH],
// "meal_plan" -> [PLAN], "manual" -> [MANUAL]
// ──────────────────────────────────────────────
function getSourceTag(source: string): { label: string; variant: "active" | "default" | "gold" } {
  switch (source) {
    case "barcode":
      return { label: "SCAN", variant: "active" };   // green
    case "search":
      return { label: "SEARCH", variant: "default" };
    case "meal_plan":
      return { label: "PLAN", variant: "gold" };
    case "manual":
    default:
      return { label: "MANUAL", variant: "default" };
  }
}

// ====================================================
// Main Page Component
// ====================================================
export default function FoodDiaryPage() {
  const supabase = createClient();

  // ── State ──────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());   // defaults to today
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);         // food diary rows for the day
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);     // from profile
  const [loading, setLoading] = useState(true);

  // Track which foods have been saved to My Foods (by food_name)
  const [savedFoodNames, setSavedFoodNames] = useState<Set<string>>(new Set());

  // Which meal sections are expanded (all open by default)
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(
    new Set(["breakfast", "lunch", "dinner", "snack"])
  );

  // AddFoodSheet state — which meal type is being added to
  const [addingMealType, setAddingMealType] = useState<MealType | null>(null);

  // ── Derived macro targets ──────────────────
  // protein  = 30% of calories / 4 cal per gram
  // carbs    = 40% of calories / 4 cal per gram
  // fat      = 30% of calories / 9 cal per gram
  const proteinTarget = Math.round((calorieTarget * 0.3) / 4);
  const carbsTarget = Math.round((calorieTarget * 0.4) / 4);
  const fatTarget = Math.round((calorieTarget * 0.3) / 9);

  // ── Derived daily totals ───────────────────
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein_g, 0);
  const totalCarbs = entries.reduce((sum, e) => sum + e.carbs_g, 0);
  const totalFat = entries.reduce((sum, e) => sum + e.fat_g, 0);

  // ──────────────────────────────────────────
  // Load diary entries for the selected date
  // ──────────────────────────────────────────
  const loadEntries = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load calorie target from profile (only need once but simple to re-fetch)
    const { data: profile } = await supabase
      .from("profiles")
      .select("calorie_target")
      .eq("id", user.id)
      .single();

    if (profile?.calorie_target) {
      setCalorieTarget(profile.calorie_target);
    }

    // Fetch diary entries for the selected date range
    const { start, end } = getDayBounds(selectedDate);

    const { data } = await supabase
      .from("food_diary")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", start)
      .lte("logged_at", end)
      .order("logged_at", { ascending: true });

    setEntries((data as FoodDiaryEntry[]) ?? []);

    // Load names of all saved foods so we can show which are already saved
    const { data: saved } = await supabase
      .from("saved_foods")
      .select("food_name")
      .eq("user_id", user.id);
    if (saved) {
      setSavedFoodNames(new Set(saved.map((s: { food_name: string }) => s.food_name)));
    }

    setLoading(false);
  }, [supabase, selectedDate]);

  // Re-fetch whenever the selected date changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ──────────────────────────────────────────
  // Navigate date forward / backward by 1 day
  // ──────────────────────────────────────────
  function goToPreviousDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }

  function goToNextDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  }

  // ──────────────────────────────────────────
  // Toggle a meal section open / closed
  // ──────────────────────────────────────────
  function toggleMealSection(mealType: MealType) {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(mealType)) {
        next.delete(mealType);
      } else {
        next.add(mealType);
      }
      return next;
    });
  }

  // ──────────────────────────────────────────
  // Add a food entry to Supabase
  // Called by AddFoodSheet when the user picks or enters food.
  // Returns a promise so the sheet can await it before closing.
  // ──────────────────────────────────────────
  async function handleAddFood(food: {
    food_name: string;
    brand?: string;
    barcode?: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
    quantity?: number;
    source: "manual" | "barcode" | "search";
  }) {
    if (!addingMealType) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Haptic feedback on add
    navigator.vibrate?.(50);

    // Build the logged_at timestamp — use the selected date at noon
    // so it clearly falls within the day bounds
    const logDate = new Date(selectedDate);
    logDate.setHours(12, 0, 0, 0);

    const { error } = await supabase.from("food_diary").insert({
      user_id: user.id,
      food_name: food.food_name,
      brand: food.brand ?? null,
      barcode: food.barcode ?? null,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      serving_size: food.serving_size ?? null,
      meal_type: addingMealType,
      source: food.source,
      logged_at: logDate.toISOString(),
    });

    // If the insert failed, throw so the caller (AddFoodSheet) knows
    if (error) {
      console.error("Failed to log food:", error);
      throw new Error(error.message);
    }

    // Refresh entries from the database
    await loadEntries();
  }

  // ──────────────────────────────────────────
  // Delete a food entry by ID
  // ──────────────────────────────────────────
  async function handleDeleteEntry(entryId: string) {
    // Haptic feedback on delete
    navigator.vibrate?.(30);

    await supabase.from("food_diary").delete().eq("id", entryId);

    // Remove from local state immediately for snappy UI
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  // ──────────────────────────────────────────
  // Save a diary entry to My Foods (favourites)
  // ──────────────────────────────────────────
  async function saveToMyFoods(entry: FoodDiaryEntry) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("saved_foods").insert({
      user_id: user.id,
      food_name: entry.food_name,
      brand: entry.brand ?? null,
      barcode: entry.barcode ?? null,
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
      serving_size: entry.serving_size ?? null,
    });

    if (error) {
      alert(`Failed to save: ${error.message}`);
      return;
    }

    // Update local state so the heart fills in immediately
    setSavedFoodNames((prev) => new Set(prev).add(entry.food_name));
    navigator.vibrate?.(50);
  }

  // ──────────────────────────────────────────
  // Filter entries by meal type
  // ──────────────────────────────────────────
  function getEntriesForMeal(mealType: MealType): FoodDiaryEntry[] {
    return entries.filter((e) => e.meal_type === mealType);
  }

  // ====================================================
  // Render
  // ====================================================
  return (
    <div className="bg-bg-primary min-h-screen pb-36">
      {/* ── Back link to /rations ── */}
      <div className="px-4 pt-4">
        <Link
          href="/rations"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-mono uppercase">Rations</span>
        </Link>
      </div>

      {/* ── Date Selector ── */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left arrow — go to previous day */}
        <button
          onClick={goToPreviousDay}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] text-green-light"
          aria-label="Previous day"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Current date display */}
        <span className="text-sm font-heading uppercase tracking-wider text-sand">
          {formatDateDisplay(selectedDate)}
        </span>

        {/* Right arrow — go to next day */}
        <button
          onClick={goToNextDay}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] text-green-light"
          aria-label="Next day"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ── Macro Rings (daily progress vs targets) ── */}
      <div className="px-4 mb-4">
        <MacroRings
          calories={totalCalories}
          calorieTarget={calorieTarget}
          protein={totalProtein}
          proteinTarget={proteinTarget}
          carbs={totalCarbs}
          carbsTarget={carbsTarget}
          fat={totalFat}
          fatTarget={fatTarget}
        />
      </div>

      {/* ── Meal Sections ── */}
      <div className="px-4 space-y-3">
        {MEAL_SECTIONS.map(({ type, label }) => {
          const mealEntries = getEntriesForMeal(type);
          const isExpanded = expandedMeals.has(type);

          // Calculate subtotals for this meal section
          const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0);

          return (
            <div key={type}>
              {/* ── Section Header (click to expand/collapse) ── */}
              <button
                onClick={() => toggleMealSection(type)}
                className="w-full flex items-center justify-between p-3 bg-bg-panel border border-green-dark min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Utensils size={14} className="text-green-primary" />
                  <span className="text-sm font-heading uppercase tracking-wider text-sand">
                    {label}
                  </span>
                  {/* Show item count when collapsed */}
                  {!isExpanded && mealEntries.length > 0 && (
                    <span className="text-[0.6rem] font-mono text-text-secondary">
                      ({mealEntries.length})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Meal calorie subtotal */}
                  {mealCals > 0 && (
                    <span className="text-xs font-mono text-text-secondary">
                      {mealCals} kcal
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-text-secondary" />
                  ) : (
                    <ChevronDown size={16} className="text-text-secondary" />
                  )}
                </div>
              </button>

              {/* ── Expanded: food entries + add button ── */}
              {isExpanded && (
                <div className="border border-t-0 border-green-dark bg-bg-primary">
                  {/* Loading skeleton */}
                  {loading && (
                    <div className="p-3">
                      <div className="skeleton h-10 w-full mb-2" />
                      <div className="skeleton h-10 w-full" />
                    </div>
                  )}

                  {/* Food entries for this meal */}
                  {!loading && mealEntries.length > 0 && (
                    <div className="divide-y divide-green-dark/30">
                      {mealEntries.map((entry) => {
                        const sourceTag = getSourceTag(entry.source);

                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-2 p-3 min-h-[44px]"
                          >
                            {/* Food name + macro detail + source tag */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary truncate">
                                {entry.food_name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {/* P / C / F in small mono text */}
                                <span className="text-[0.55rem] font-mono text-text-secondary">
                                  P:{entry.protein_g}g C:{entry.carbs_g}g F:{entry.fat_g}g
                                </span>
                                {/* Source tag */}
                                <Tag variant={sourceTag.variant}>{sourceTag.label}</Tag>
                              </div>
                            </div>

                            {/* Calories (right-aligned) */}
                            <div className="text-right flex-shrink-0 mr-1">
                              <p className="text-sm font-mono font-bold text-text-primary">
                                {entry.calories}
                              </p>
                              <p className="text-[0.5rem] font-mono text-text-secondary">kcal</p>
                            </div>

                            {/* Save to My Foods (heart icon) */}
                            <button
                              onClick={() => saveToMyFoods(entry)}
                              disabled={savedFoodNames.has(entry.food_name)}
                              className={`flex items-center justify-center min-h-[44px] min-w-[44px] transition-colors
                                ${savedFoodNames.has(entry.food_name) ? "text-green-light" : "text-text-secondary hover:text-green-light"}`}
                              aria-label={`Save ${entry.food_name} to My Foods`}
                            >
                              <Heart size={16} fill={savedFoodNames.has(entry.food_name) ? "currentColor" : "none"} />
                            </button>

                            {/* Delete button (trash icon) */}
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="flex items-center justify-center min-h-[44px] min-w-[44px] text-text-secondary hover:text-danger transition-colors"
                              aria-label={`Delete ${entry.food_name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state when no entries for this meal */}
                  {!loading && mealEntries.length === 0 && (
                    <div className="py-4 text-center">
                      <p className="text-xs text-text-secondary font-mono">No food logged</p>
                    </div>
                  )}

                  {/* ADD FOOD button for this meal */}
                  <div className="p-2">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setAddingMealType(type)}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={14} /> ADD FOOD
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── AddFoodSheet (bottom sheet overlay) ── */}
      {/* Opens when addingMealType is set, closes when cleared */}
      <AddFoodSheet
        isOpen={addingMealType !== null}
        onClose={() => setAddingMealType(null)}
        mealType={addingMealType ?? "breakfast"}
        onAddFood={handleAddFood}
      />

      {/* ── Sticky Bottom Bar: daily totals ── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-bg-panel border-t border-green-dark">
        <div className="grid grid-cols-4 py-2 px-4">
          {/* Calories */}
          <div className="text-center">
            <p className="text-sm font-mono font-bold text-text-primary">{totalCalories}</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Cal</p>
          </div>
          {/* Protein */}
          <div className="text-center">
            <p className="text-sm font-mono font-bold text-green-light">{Math.round(totalProtein)}g</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Protein</p>
          </div>
          {/* Carbs */}
          <div className="text-center">
            <p className="text-sm font-mono font-bold text-xp-gold">{Math.round(totalCarbs)}g</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Carbs</p>
          </div>
          {/* Fat */}
          <div className="text-center">
            <p className="text-sm font-mono font-bold text-khaki">{Math.round(totalFat)}g</p>
            <p className="text-[0.5rem] font-mono text-text-secondary uppercase">Fat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
