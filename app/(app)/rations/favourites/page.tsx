/* ============================================
   Favourite Meals Page
   Browse and search saved meals.
   Meals can be removed from favourites.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ArrowLeft, Heart, Search, Clock, Flame, Trash2 } from "lucide-react";
import type { FavouriteMeal, Meal } from "@/types";

export default function FavouriteMealsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [favourites, setFavourites] = useState<FavouriteMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFavourites = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("favourite_meals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setFavourites(data as FavouriteMeal[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadFavourites(); }, [loadFavourites]);

  async function removeFavourite(id: string) {
    await supabase.from("favourite_meals").delete().eq("id", id);
    setFavourites((prev) => prev.filter((f) => f.id !== id));
  }

  // Filter by search term
  const filtered = favourites.filter((fav) => {
    const meal = fav.meal_data as Meal;
    return meal.name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/rations")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Rations</span>
      </button>

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Favourite Meals</h2>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved meals..."
          className="w-full pl-10 pr-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <Card tag="NO FAVOURITES" tagVariant="default">
          <div className="text-center py-6">
            <Heart size={32} className="text-text-secondary mx-auto mb-3" />
            <p className="text-xs text-text-secondary">
              {search ? "No meals match your search." : "Save meals from your meal plan to see them here."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((fav) => {
            const meal = fav.meal_data as Meal;
            const isExpanded = expandedId === fav.id;

            return (
              <Card key={fav.id} className="press-scale">
                <div onClick={() => setExpandedId(isExpanded ? null : fav.id)} className="cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-heading uppercase tracking-wider text-sand">{meal.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary">
                          <Flame size={11} /> {meal.calories} kcal
                        </span>
                        <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary">
                          <Clock size={11} /> {meal.prep_time_minutes} min
                        </span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFavourite(fav.id); }}
                      className="text-danger min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-green-dark/50 space-y-3">
                      {/* Macros */}
                      <div className="flex gap-3">
                        <Tag variant="default">{`P: ${meal.protein_g}g`}</Tag>
                        <Tag variant="default">{`C: ${meal.carbs_g}g`}</Tag>
                        <Tag variant="default">{`F: ${meal.fat_g}g`}</Tag>
                      </div>

                      {/* Ingredients */}
                      <div>
                        <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Ingredients</p>
                        {meal.ingredients?.map((ing, i) => (
                          <p key={i} className="text-xs text-text-primary py-0.5">
                            {ing.quantity} {ing.name}
                          </p>
                        ))}
                      </div>

                      {/* Method */}
                      <div>
                        <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-1">Method</p>
                        {meal.method?.map((step, i) => (
                          <p key={i} className="text-xs text-text-primary py-0.5">
                            {i + 1}. {step}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
