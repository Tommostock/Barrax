/* ============================================
   QuickActions Component
   One-tap shortcuts for the most common daily
   actions on the HQ page:

     Run · Food · Supps · Weight

   Supps is a same-tap "log today's creatine +
   whey stack" button. It reads red until pressed
   and flips to green-with-tick once today's stack
   is logged, then resets at midnight.
   ============================================ */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import { Route, Utensils, Scale, FlaskConical, Check } from "lucide-react";
import type { MealType } from "@/types";
import {
  hasLoggedSuppsToday,
  logSuppsStack,
  SUPPS_XP,
} from "@/lib/supps";
import { awardXPAndNotify } from "@/lib/award-and-notify";
import { awardProteinTargetIfHit } from "@/lib/protein-xp";

export default function QuickActions() {
  const router = useRouter();
  const supabase = createClient();

  // --- Food logging state ---
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodMealType, setFoodMealType] = useState<MealType>("lunch");

  // --- Supps state ---
  // null while we're still looking up "has the user logged today?"
  const [suppsLogged, setSuppsLogged] = useState<boolean | null>(null);
  const [loggingSupps, setLoggingSupps] = useState(false);

  // Hydrate the supps button state from the diary on mount so the
  // colour is correct on first paint (prevents a flash of red for
  // users who already logged their stack today).
  const refreshSuppsState = useCallback(async () => {
    const logged = await hasLoggedSuppsToday();
    setSuppsLogged(logged);
  }, []);

  useEffect(() => {
    refreshSuppsState();
  }, [refreshSuppsState]);

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

    // Check if the user just crossed their daily protein target
    // — if so, award the small XP bonus (idempotent, once per day).
    awardProteinTargetIfHit();
  }

  // One-tap daily supps log. Writes both rows (creatine + whey)
  // into food_diary under the "supplement" meal category, awards
  // a small XP bonus, then flips the button to green.
  async function handleLogSupps() {
    if (loggingSupps || suppsLogged) return;

    setLoggingSupps(true);
    try {
      const ok = await logSuppsStack();
      if (!ok) return;

      // Small XP nudge for consistency. Uses a distinct source so
      // we can chart supplement adherence in Intel later.
      await awardXPAndNotify(SUPPS_XP, "supps_logged");

      // Whey contains ~23g protein, so the daily protein target
      // check may cross over at this point — run it here too.
      awardProteinTargetIfHit();

      setSuppsLogged(true);
    } finally {
      setLoggingSupps(false);
    }
  }

  return (
    <>
      {/* Four-button action bar */}
      <div className="grid grid-cols-4 gap-2">
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
            Food
          </span>
        </button>

        {/* Daily Supps Stack — red until logged, green with tick once done.
            State is queried from food_diary on mount so it hydrates
            correctly after an app reload or a new day rollover. */}
        <button
          onClick={handleLogSupps}
          disabled={loggingSupps || suppsLogged === true}
          className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[64px]
                      border transition-all active:scale-[0.97]
                      disabled:cursor-default
                      ${
                        suppsLogged === true
                          ? "bg-green-primary/20 border-green-primary"
                          : suppsLogged === false
                          ? "bg-danger/15 border-danger hover:bg-danger/25"
                          : "bg-bg-panel border-green-dark"
                      }`}
          aria-label={suppsLogged ? "Supps logged" : "Log supps"}
        >
          {suppsLogged === true ? (
            <Check size={18} className="text-green-light" />
          ) : (
            <FlaskConical
              size={18}
              className={suppsLogged === false ? "text-danger" : "text-green-primary"}
            />
          )}
          <span
            className={`text-[0.55rem] font-mono uppercase tracking-wider ${
              suppsLogged === true
                ? "text-green-light"
                : suppsLogged === false
                ? "text-danger"
                : "text-text-secondary"
            }`}
          >
            {loggingSupps ? "..." : "Supps"}
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
