/* ============================================
   QuickActions Component
   One-tap shortcuts for the most common daily
   actions: start a run, log food, and log weight.
   Sits near the top of the Command page.
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import { Route, Utensils, Scale } from "lucide-react";
import type { MealType } from "@/types";

export default function QuickActions() {
  const router = useRouter();
  const supabase = createClient();

  // --- Food logging state ---
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodMealType, setFoodMealType] = useState<MealType>("lunch");

  // --- Weight logging state ---
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  // Determine the most likely meal type based on the time of day
  function currentMealType(): MealType {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
  }

  // Open the food sheet with the current meal type pre-selected
  function openFoodSheet() {
    setFoodMealType(currentMealType());
    setFoodSheetOpen(true);
  }

  // Save food entry to the food diary
  async function handleAddFood(food: {
    food_name: string;
    brand?: string;
    barcode?: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
    source: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("food_diary").insert({
      user_id: user.id,
      food_name: food.food_name,
      brand: food.brand ?? null,
      barcode: food.barcode ?? null,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      serving_size: food.serving_size ?? null,
      meal_type: foodMealType,
      source: food.source,
      logged_at: new Date().toISOString(),
    });

    setFoodSheetOpen(false);
  }

  // Save weight log
  async function handleLogWeight() {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    setWeightSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setWeightSaving(false); return; }

    await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: weight,
    });

    const { awardXPAndNotify } = await import("@/lib/award-and-notify");
    await awardXPAndNotify(10, "weight_logged");

    setWeightSaving(false);
    setWeightSaved(true);
    setNewWeight("");
    // Auto-close after a short delay so the user sees the confirmation
    setTimeout(() => {
      setWeightSheetOpen(false);
      setWeightSaved(false);
    }, 1200);
  }

  return (
    <>
      {/* Three-button action bar */}
      <div className="grid grid-cols-3 gap-2">
        {/* Start Run */}
        <button
          onClick={() => router.push("/missions/run")}
          className="flex flex-col items-center justify-center gap-1 py-3 min-h-[64px]
                     bg-bg-panel border border-green-dark hover:bg-bg-panel-alt
                     active:scale-[0.97] transition-all"
        >
          <Route size={18} className="text-green-primary" />
          <span className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            Run
          </span>
        </button>

        {/* Log Food */}
        <button
          onClick={openFoodSheet}
          className="flex flex-col items-center justify-center gap-1 py-3 min-h-[64px]
                     bg-bg-panel border border-green-dark hover:bg-bg-panel-alt
                     active:scale-[0.97] transition-all"
        >
          <Utensils size={18} className="text-green-primary" />
          <span className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            Log Food
          </span>
        </button>

        {/* Log Weight */}
        <button
          onClick={() => { setWeightSheetOpen(true); setWeightSaved(false); }}
          className="flex flex-col items-center justify-center gap-1 py-3 min-h-[64px]
                     bg-bg-panel border border-green-dark hover:bg-bg-panel-alt
                     active:scale-[0.97] transition-all"
        >
          <Scale size={18} className="text-green-primary" />
          <span className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            Weight
          </span>
        </button>
      </div>

      {/* Food logging bottom sheet — reuses the existing AddFoodSheet */}
      <AddFoodSheet
        isOpen={foodSheetOpen}
        onClose={() => setFoodSheetOpen(false)}
        mealType={foodMealType}
        onAddFood={handleAddFood}
      />

      {/* Weight logging bottom sheet — minimal inline input */}
      <BottomSheet
        isOpen={weightSheetOpen}
        onClose={() => setWeightSheetOpen(false)}
        title="Record Your Stats"
      >
        <div className="space-y-3">
          {weightSaved ? (
            <div className="text-center py-4">
              <p className="text-sm font-heading uppercase tracking-wider text-green-light">
                Weight recorded, soldier. (+10 XP)
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-secondary mb-1 font-mono">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogWeight()}
                  placeholder="e.g. 75.5"
                  className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                             focus:border-green-primary focus:outline-none text-lg font-mono"
                  autoFocus
                />
              </div>
              <Button
                fullWidth
                onClick={handleLogWeight}
                disabled={weightSaving || !newWeight}
              >
                {weightSaving ? "RECORDING..." : "RECORD STATS"}
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
