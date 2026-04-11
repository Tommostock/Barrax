/* ============================================
   QuickActions Component
   One-tap shortcuts for the most common daily
   actions: start a run, log food, and go to the
   body tracking page (weight + progress photos).
   Sits near the top of the Command page.
   ============================================ */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import { Route, Utensils, Scale } from "lucide-react";
import type { MealType } from "@/types";

export default function QuickActions() {
  const router = useRouter();
  const supabase = createClient();

  // --- Food logging state ---
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodMealType, setFoodMealType] = useState<MealType>("lunch");

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

        {/* Weight / Body Tracking -- redirects to the full body page
            so the user can log weight, upload a progress photo, and
            see their weight trend in one place instead of a cramped
            bottom sheet. */}
        <button
          onClick={() => router.push("/intel/body")}
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
    </>
  );
}
