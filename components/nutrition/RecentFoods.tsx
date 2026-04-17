/* ============================================
   RecentFoods Component
   Shows recently logged and frequently logged foods
   for quick re-adding to the food diary.
   ============================================ */

"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Clock, Star, Check } from "lucide-react";

interface RecentFood {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  brand: string | null;
  count: number; // How many times this food has been logged
}

interface RecentFoodsProps {
  // Parent may return a Promise so we can await the insert and only show
  // the "logged" confirmation once the save actually succeeded.
  onQuickAdd: (food: {
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    brand?: string;
    source: "manual";
  }) => void | Promise<void>;
}

export default function RecentFoods({ onQuickAdd }: RecentFoodsProps) {
  const supabase = createClient();
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks which button is currently "pending" (mid-save) or "logged"
  // (showing the confirmation tick). Keyed by list index so duplicate
  // food names in different positions don't collide.
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [loggedIndex, setLoggedIndex] = useState<number | null>(null);
  // Hold the revert timeout so we can clear it if the component unmounts
  // before the confirmation animation finishes (prevents state updates
  // on an unmounted component).
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
    };
  }, []);

  // Handles a quick-add tap: marks the button as pending, awaits the
  // parent insert, then flashes a "LOGGED" tick for ~1.2s so the user
  // gets clear visual feedback that the food was saved.
  async function handleQuickAdd(food: RecentFood, index: number) {
    // Guard against double-taps while the previous save is in flight or
    // while the confirmation tick is still showing.
    if (pendingIndex !== null || loggedIndex === index) return;

    setPendingIndex(index);
    try {
      await onQuickAdd({
        food_name: food.food_name,
        calories: food.calories,
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        brand: food.brand ?? undefined,
        source: "manual",
      });
      setLoggedIndex(index);
      if (revertTimer.current) clearTimeout(revertTimer.current);
      revertTimer.current = setTimeout(() => setLoggedIndex(null), 1200);
    } catch {
      // Parent surfaces its own error message; just clear local state so
      // the user can retry the tap.
    } finally {
      setPendingIndex(null);
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get the last 50 food diary entries for this user
      const { data } = await supabase
        .from("food_diary")
        .select("food_name, calories, protein_g, carbs_g, fat_g, brand")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        // Count frequency and deduplicate by food_name
        const foodMap = new Map<string, RecentFood>();
        for (const entry of data) {
          const existing = foodMap.get(entry.food_name);
          if (existing) {
            existing.count++;
          } else {
            foodMap.set(entry.food_name, {
              food_name: entry.food_name,
              calories: entry.calories,
              protein_g: entry.protein_g,
              carbs_g: entry.carbs_g,
              fat_g: entry.fat_g,
              brand: entry.brand,
              count: 1,
            });
          }
        }

        // Sort: most frequent first, then most recent
        const sorted = Array.from(foodMap.values()).sort((a, b) => b.count - a.count);
        setRecentFoods(sorted.slice(0, 10));
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading || recentFoods.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
        <Clock size={10} /> RECENT & FREQUENT
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {recentFoods.map((food, i) => {
          // "isLogged" shows the post-save confirmation tick + green flash.
          // "isPending" covers the brief window while the insert is in
          // flight so the user can't double-tap and double-log.
          const isLogged = loggedIndex === i;
          const isPending = pendingIndex === i;
          const isBusy = isLogged || isPending;
          return (
            <button
              key={i}
              onClick={() => handleQuickAdd(food, i)}
              disabled={isBusy}
              aria-label={
                isLogged
                  ? `${food.food_name} logged`
                  : `Add ${food.food_name} to diary`
              }
              className={
                "flex-shrink-0 flex items-center gap-2 px-3 py-2 border transition-colors min-h-[40px] " +
                (isLogged
                  ? "bg-green-primary/15 border-green-primary"
                  : "bg-bg-panel border-green-dark/50 hover:border-green-primary")
              }
            >
              {isLogged ? (
                <Check size={12} className="text-green-primary" />
              ) : (
                <Plus
                  size={12}
                  className={
                    "text-green-primary " + (isPending ? "opacity-50" : "")
                  }
                />
              )}
              <div className="text-left">
                <p className="text-xs text-text-primary whitespace-nowrap">{food.food_name}</p>
                <p
                  className={
                    "text-[0.5rem] font-mono whitespace-nowrap " +
                    (isLogged ? "text-green-primary" : "text-text-secondary")
                  }
                >
                  {isLogged ? "LOGGED" : `${food.calories} kcal`}
                </p>
              </div>
              {food.count >= 3 && !isLogged && (
                <Star size={10} className="text-xp-gold" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
