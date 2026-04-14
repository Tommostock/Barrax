/* ============================================
   QuickActionsBar
   Compact icon-only row of the four most-used
   daily actions: Run · Food · Supps · Weight.

   Dropped the labels from the older QuickActions
   component -- the icons are unambiguous and we
   need the vertical space on the HQ screen. This
   is the "one row of shortcuts under the rank
   strip" from the HQ redesign plan.

   Keeps the existing Supps one-tap logging
   behaviour with its tri-state button:
   - null    : still loading (neutral)
   - false   : not yet logged today (amber pulse)
   - true    : already logged (green check)
   ============================================ */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Route, Utensils, Scale, FlaskConical, Check } from "lucide-react";
import AddFoodSheet from "@/components/nutrition/AddFoodSheet";
import { createClient } from "@/lib/supabase/client";
import type { MealType } from "@/types";
import {
  hasLoggedSuppsToday,
  logSuppsStack,
  SUPPS_XP,
} from "@/lib/supps";
import { awardXPAndNotify } from "@/lib/award-and-notify";
import { awardProteinTargetIfHit } from "@/lib/protein-xp";

export default function QuickActionsBar() {
  const router = useRouter();
  const supabase = createClient();

  // Food logging bottom sheet
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [foodMealType, setFoodMealType] = useState<MealType>("lunch");

  // Supps button state: null while loading, false = pending, true = done
  const [suppsLogged, setSuppsLogged] = useState<boolean | null>(null);
  const [loggingSupps, setLoggingSupps] = useState(false);

  const refreshSuppsState = useCallback(async () => {
    const logged = await hasLoggedSuppsToday();
    setSuppsLogged(logged);
  }, []);

  useEffect(() => {
    refreshSuppsState();
  }, [refreshSuppsState]);

  // Pick the most likely meal type based on time of day
  function currentMealType(): MealType {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
  }

  function openFoodSheet() {
    setFoodMealType(currentMealType());
    setFoodSheetOpen(true);
  }

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Close the sheet FIRST so the user gets instant feedback, then
    // fire the insert + HQ cache invalidation in the background.
    setFoodSheetOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("meal-logged"));
    }

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

    awardProteinTargetIfHit();
  }

  async function handleLogSupps() {
    if (loggingSupps || suppsLogged) return;

    // OPTIMISTIC UI: flip the button to green before awaiting the
    // server so the user sees instant feedback. Roll back on failure.
    setLoggingSupps(true);
    setSuppsLogged(true);
    try {
      const ok = await logSuppsStack();
      if (!ok) {
        setSuppsLogged(false);
        return;
      }
      // Supps count as food rows -- invalidate HQ calorie pill.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("meal-logged"));
      }
      await awardXPAndNotify(SUPPS_XP, "supps_logged");
      awardProteinTargetIfHit();
    } catch {
      setSuppsLogged(false);
    } finally {
      setLoggingSupps(false);
    }
  }

  // Shared button shell for consistency and compactness
  const btnBase =
    "flex items-center justify-center h-12 min-w-[44px] border transition-colors active:scale-[0.97]";
  const btnIdle = "bg-bg-panel border-green-dark hover:bg-bg-panel-alt";

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {/* Run */}
        <button
          type="button"
          onClick={() => router.push("/missions/run")}
          aria-label="Start run"
          className={`${btnBase} ${btnIdle}`}
        >
          <Route size={18} className="text-green-primary" />
        </button>

        {/* Food */}
        <button
          type="button"
          onClick={openFoodSheet}
          aria-label="Log food"
          className={`${btnBase} ${btnIdle}`}
        >
          <Utensils size={18} className="text-green-primary" />
        </button>

        {/* Supps (tri-state) */}
        <button
          type="button"
          onClick={handleLogSupps}
          disabled={loggingSupps || suppsLogged === true}
          aria-label={suppsLogged ? "Supps logged" : "Log supps"}
          className={`${btnBase} disabled:cursor-default ${
            suppsLogged === true
              ? "bg-green-primary/20 border-green-primary"
              : suppsLogged === false
                ? "bg-bg-panel border-xp-gold hover:bg-bg-panel-alt animate-pulse-gold"
                : "bg-bg-panel border-green-dark"
          }`}
        >
          {suppsLogged === true ? (
            <Check size={18} className="text-green-light" />
          ) : (
            <FlaskConical
              size={18}
              className={
                suppsLogged === false ? "text-xp-gold" : "text-green-primary"
              }
            />
          )}
        </button>

        {/* Weight (deep-link to body tracking page) */}
        <button
          type="button"
          onClick={() => router.push("/intel/body")}
          aria-label="Body tracking"
          className={`${btnBase} ${btnIdle}`}
        >
          <Scale size={18} className="text-green-primary" />
        </button>
      </div>

      <AddFoodSheet
        isOpen={foodSheetOpen}
        onClose={() => setFoodSheetOpen(false)}
        mealType={foodMealType}
        onAddFood={handleAddFood}
      />
    </>
  );
}
