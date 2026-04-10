/* ============================================
   RecentFoods Component
   Shows recently logged and frequently logged foods
   for quick re-adding to the food diary.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Clock, Star } from "lucide-react";

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
  onQuickAdd: (food: {
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    brand?: string;
    source: "manual";
  }) => void;
}

export default function RecentFoods({ onQuickAdd }: RecentFoodsProps) {
  const supabase = createClient();
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);

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
        {recentFoods.map((food, i) => (
          <button
            key={i}
            onClick={() => onQuickAdd({
              food_name: food.food_name,
              calories: food.calories,
              protein_g: food.protein_g,
              carbs_g: food.carbs_g,
              fat_g: food.fat_g,
              brand: food.brand ?? undefined,
              source: "manual",
            })}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-bg-panel border border-green-dark/50
                       hover:border-green-primary transition-colors min-h-[40px]"
          >
            <Plus size={12} className="text-green-primary" />
            <div className="text-left">
              <p className="text-xs text-text-primary whitespace-nowrap">{food.food_name}</p>
              <p className="text-[0.5rem] font-mono text-text-secondary">{food.calories} kcal</p>
            </div>
            {food.count >= 3 && <Star size={10} className="text-xp-gold" />}
          </button>
        ))}
      </div>
    </div>
  );
}
