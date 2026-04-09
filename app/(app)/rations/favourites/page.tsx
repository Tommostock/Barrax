/* ============================================
   My Food Page
   Browse and search saved foods. All foods saved
   from diary, barcode scans, or meal plans end up
   here. Foods can also be removed.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ArrowLeft, Heart, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { SavedFood } from "@/types";

export default function MyFoodPage() {
  const router = useRouter();
  const supabase = createClient();

  const [foods, setFoods] = useState<SavedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const loadFoods = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_foods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setFoods(data as SavedFood[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadFoods(); }, [loadFoods]);

  async function removeFood(id: string) {
    await supabase.from("saved_foods").delete().eq("id", id);
    setFoods((prev) => prev.filter((f) => f.id !== id));
    navigator.vibrate?.(30);
  }

  // Filter by search term
  const filtered = foods.filter((food) =>
    food.food_name.toLowerCase().includes(search.toLowerCase()) ||
    (food.brand && food.brand.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/rations")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Rations</span>
      </button>

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">My Food</h2>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search saved foods..."
          className="w-full pl-10 pr-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <Card tag="EMPTY" tagVariant="default">
          <div className="text-center py-6">
            <Heart size={32} className="text-text-secondary mx-auto mb-3" />
            <p className="text-xs text-text-secondary">
              {search ? "No matches found." : "No saved foods yet. Tap the heart on any food to save it here."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-1">
          {filtered.map((food) => (
            <div key={food.id}
              className="flex items-center gap-2 p-3 bg-bg-panel border border-green-dark/50 min-h-[44px]">
              {/* Food info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{food.food_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {food.brand && (
                    <span className="text-[0.55rem] text-text-secondary truncate">{food.brand}</span>
                  )}
                  <span className="text-[0.55rem] font-mono text-text-secondary">
                    P:{food.protein_g}g C:{food.carbs_g}g F:{food.fat_g}g
                  </span>
                </div>
              </div>

              {/* Calories */}
              <div className="text-right flex-shrink-0 mr-1">
                <p className="text-sm font-mono font-bold text-text-primary">{food.calories}</p>
                <p className="text-[0.5rem] font-mono text-text-secondary">kcal</p>
              </div>

              {/* Delete */}
              <button
                onClick={() => setDeleteTarget({ id: food.id, name: food.food_name })}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-text-secondary hover:text-danger transition-colors"
                aria-label={`Remove ${food.food_name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {/* Total count */}
          <p className="text-[0.6rem] font-mono text-text-secondary text-center pt-2">
            {filtered.length} {filtered.length === 1 ? "FOOD" : "FOODS"} SAVED
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="REMOVE FOOD"
        message={`Remove ${deleteTarget?.name ?? "this item"} from My Food?`}
        confirmLabel="REMOVE"
        onConfirm={() => {
          if (deleteTarget) removeFood(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
