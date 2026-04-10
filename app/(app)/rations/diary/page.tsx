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
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/ui/PullToRefresh";
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
import { calculateMacroTargets } from "@/lib/macros";
import { queueOrExecute } from "@/lib/offline/queue";

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
  // Macro split % from profile — defaults to balanced 30/40/30
  const [macroSplit, setMacroSplit] = useState({ protein: 30, carbs: 40, fat: 30 });
  const [loading, setLoading] = useState(true);

  // Track which foods have been saved to My Foods (by food_name)
  const [savedFoodNames, setSavedFoodNames] = useState<Set<string>>(new Set());

  // Which meal sections are expanded (all open by default)
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(
    new Set(["breakfast", "lunch", "dinner", "snack"])
  );

  // AddFoodSheet state — which meal type is being added to
  const [addingMealType, setAddingMealType] = useState<MealType | null>(null);

  // Edit food state
  const [editEntry, setEditEntry] = useState<FoodDiaryEntry | null>(null);
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Derived macro targets ──────────────────
  // Uses the user's chosen P/C/F split from the profile (or balanced
  // 30/40/30 defaults). Gram conversion is P/C = 4 kcal/g, F = 9 kcal/g.
  const macroTargets = calculateMacroTargets(
    calorieTarget,
    macroSplit.protein,
    macroSplit.carbs,
    macroSplit.fat,
  );
  const proteinTarget = macroTargets.protein;
  const carbsTarget = macroTargets.carbs;
  const fatTarget = macroTargets.fat;

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

    // Load calorie target + macro split from profile (simple re-fetch)
    const { data: profile } = await supabase
      .from("profiles")
      .select("calorie_target, protein_pct, carb_pct, fat_pct")
      .eq("id", user.id)
      .single();

    if (profile?.calorie_target) {
      setCalorieTarget(profile.calorie_target);
    }
    if (profile) {
      setMacroSplit({
        protein: profile.protein_pct ?? 30,
        carbs: profile.carb_pct ?? 40,
        fat: profile.fat_pct ?? 30,
      });
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

  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: loadEntries });

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
    fibre_g?: number;
    sugar_g?: number;
    salt_g?: number;
    serving_size?: string;
    quantity?: number;
    source: "manual" | "barcode" | "search";
  }) {
    if (!addingMealType) {
      throw new Error("No meal type selected");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not signed in");
    }

    // Haptic feedback on add
    navigator.vibrate?.(50);

    // Build the logged_at timestamp — use the selected date at noon
    // so it clearly falls within the day bounds
    const logDate = new Date(selectedDate);
    logDate.setHours(12, 0, 0, 0);

    // Coerce numeric fields to valid numbers. Supabase DECIMAL columns can
    // come back as strings and multiplication (quantity) can yield long
    // floats that postgres will reject — round to 2 dp to be safe.
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
      meal_type: addingMealType,
      source: food.source,
      logged_at: logDate.toISOString(),
    };

    if (!payload.food_name) {
      throw new Error("Food name is required");
    }

    // Wrap the insert in queueOrExecute so offline logs still work.
    // When offline (or on a transient error) the payload is persisted
    // to IndexedDB and replayed on the next `online` event.
    const result = await queueOrExecute(
      async () => {
        const { error } = await supabase.from("food_diary").insert(payload);
        return { error };
      },
      { table: "food_diary", operation: "insert", payload },
    );

    if (!result.success) {
      throw new Error("Failed to save food — IndexedDB unavailable");
    }

    if (result.queued) {
      // Optimistically append to local state so the entry appears
      // immediately even though it hasn't hit the server yet.
      // Use a temporary UUID — the real row will arrive on next refresh.
      const tempEntry: FoodDiaryEntry = {
        id: `pending_${Date.now()}`,
        user_id: user.id,
        food_name: payload.food_name,
        brand: payload.brand,
        barcode: payload.barcode,
        calories: payload.calories,
        protein_g: payload.protein_g,
        carbs_g: payload.carbs_g,
        fat_g: payload.fat_g,
        quantity: food.quantity ?? 1,
        serving_size: payload.serving_size,
        meal_type: payload.meal_type,
        source: payload.source,
        logged_at: payload.logged_at,
      };
      setEntries((prev) => [...prev, tempEntry]);
    } else {
      // Online path: reload to get the real row with its server ID.
      await loadEntries();
    }
  }

  // ──────────────────────────────────────────
  // Delete a food entry by ID
  // ──────────────────────────────────────────
  async function handleDeleteEntry(entryId: string) {
    // Haptic feedback on delete
    navigator.vibrate?.(30);

    const { error } = await supabase.from("food_diary").delete().eq("id", entryId);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }

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
  // Open the edit sheet for a food entry
  // ──────────────────────────────────────────
  function openEditSheet(entry: FoodDiaryEntry) {
    setEditEntry(entry);
    setEditCalories(String(entry.calories));
    setEditProtein(String(entry.protein_g));
    setEditCarbs(String(entry.carbs_g));
    setEditFat(String(entry.fat_g));
  }

  // Save edited food entry
  async function saveEdit() {
    if (!editEntry) return;
    const { error } = await supabase.from("food_diary").update({
      calories: Number(editCalories) || 0,
      protein_g: Number(editProtein) || 0,
      carbs_g: Number(editCarbs) || 0,
      fat_g: Number(editFat) || 0,
    }).eq("id", editEntry.id);

    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }

    setEditEntry(null);
    await loadEntries();
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
    <div className="bg-bg-primary min-h-screen pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
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

        {/* Current date display — tap to pick a date */}
        <label className="text-sm font-heading uppercase tracking-wider text-sand cursor-pointer hover:text-green-light transition-colors relative">
          {formatDateDisplay(selectedDate)}
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(new Date(e.target.value + "T12:00:00"));
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

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
                            {/* Food name + macro detail — tap to edit */}
                            <button onClick={() => openEditSheet(entry)} className="flex-1 min-w-0 text-left">
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
                            </button>

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
                              onClick={() => setDeleteTarget({ id: entry.id, name: entry.food_name })}
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
                      <p className="text-[0.55rem] text-text-secondary mt-1">Tap ADD FOOD to scan, search, or enter manually.</p>
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

      {/* Confirm delete dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="DELETE FOOD"
        message={`Remove ${deleteTarget?.name ?? "this item"} from your diary?`}
        confirmLabel="DELETE"
        onConfirm={() => {
          if (deleteTarget) handleDeleteEntry(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit food entry sheet */}
      <BottomSheet isOpen={editEntry !== null} onClose={() => setEditEntry(null)} title="EDIT FOOD">
        {editEntry && (
          <div className="space-y-3">
            <p className="text-sm font-heading uppercase text-sand">{editEntry.food_name}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Calories</label>
                <input type="number" value={editCalories} onChange={(e) => setEditCalories(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Protein (g)</label>
                <input type="number" value={editProtein} onChange={(e) => setEditProtein(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Carbs (g)</label>
                <input type="number" value={editCarbs} onChange={(e) => setEditCarbs(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Fat (g)</label>
                <input type="number" value={editFat} onChange={(e) => setEditFat(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
              </div>
            </div>
            <Button onClick={saveEdit} fullWidth>SAVE CHANGES</Button>
          </div>
        )}
      </BottomSheet>

    </div>
  );
}
