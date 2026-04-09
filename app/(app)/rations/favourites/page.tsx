/* ============================================
   My Food Page
   Browse saved foods AND search/scan for new ones.
   Two tabs: MY FOODS (saved library) and
   FIND FOOD (search + barcode scanner).
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import nextDynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ArrowLeft, Heart, Search, Trash2, Scan, Loader2, Plus } from "lucide-react";
import type { SavedFood, FoodLookupResult } from "@/types";

// Dynamic import for barcode scanner (needs camera API)
const BarcodeScanner = nextDynamic(() => import("@/components/nutrition/BarcodeScanner"), { ssr: false });

type Tab = "saved" | "find";

export default function MyFoodPage() {
  const router = useRouter();
  const supabase = createClient();

  // Tab state
  const [tab, setTab] = useState<Tab>("saved");

  // Saved foods state
  const [foods, setFoods] = useState<SavedFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedFilter, setSavedFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Find food state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodLookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<FoodLookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Track saved food names so we can show which results are already saved
  const savedNames = new Set(foods.map((f) => f.food_name.toLowerCase()));

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

  // Remove a saved food
  async function removeFood(id: string) {
    const { error } = await supabase.from("saved_foods").delete().eq("id", id);
    if (error) { alert(`Failed to remove: ${error.message}`); return; }
    setFoods((prev) => prev.filter((f) => f.id !== id));
    navigator.vibrate?.(30);
  }

  // Save a food from search/scan results to My Food
  async function saveFood(food: FoodLookupResult) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(food.food_name);
    const { data, error } = await supabase.from("saved_foods").insert({
      user_id: user.id,
      food_name: food.food_name,
      brand: food.brand || null,
      barcode: food.barcode || null,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      serving_size: food.serving_size || null,
    }).select().single();

    if (error) {
      alert(`Failed to save: ${error.message}`);
    } else if (data) {
      setFoods((prev) => [data as SavedFood, ...prev]);
      navigator.vibrate?.(50);
    }
    setSaving(null);
  }

  // Search Open Food Facts + USDA
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/food-lookup?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }

  // Barcode lookup
  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/food-lookup?barcode=${barcode}`);
      const data = await res.json();
      if (data.product) {
        setScannedProduct(data.product);
      } else {
        setSearchQuery(barcode);
        setTab("find");
        alert("Barcode not found. Try searching by product name.");
      }
    } catch {
      alert("Lookup failed. Try searching by name.");
    }
    finally { setLookingUp(false); }
  }

  // Filter saved foods
  const filtered = foods.filter((food) =>
    food.food_name.toLowerCase().includes(savedFilter.toLowerCase()) ||
    (food.brand && food.brand.toLowerCase().includes(savedFilter.toLowerCase()))
  );

  if (showScanner) {
    return <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />;
  }

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><div className="skeleton h-12 w-full" /><div className="skeleton h-16 w-full" /><div className="skeleton h-16 w-full" /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/rations")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Rations</span>
      </button>

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">My Food</h2>

      {/* Tab selector */}
      <div className="flex border border-green-dark">
        <button onClick={() => setTab("saved")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 text-[0.6rem] font-mono uppercase tracking-wider transition-colors
            ${tab === "saved" ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}>
          <Heart size={12} /> SAVED ({foods.length})
        </button>
        <button onClick={() => setTab("find")}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 text-[0.6rem] font-mono uppercase tracking-wider transition-colors
            ${tab === "find" ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}>
          <Plus size={12} /> FIND FOOD
        </button>
      </div>

      {/* ===== SAVED TAB ===== */}
      {tab === "saved" && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" value={savedFilter} onChange={(e) => setSavedFilter(e.target.value)}
              placeholder="Filter saved foods..."
              className="w-full pl-10 pr-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
          </div>

          {filtered.length === 0 ? (
            <Card tag="EMPTY" tagVariant="default">
              <div className="text-center py-6">
                <Heart size={32} className="text-text-secondary mx-auto mb-3" />
                <p className="text-xs text-text-secondary">
                  {savedFilter ? "No matches found." : "No saved foods yet. Use the FIND FOOD tab to search and save."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-1">
              {filtered.map((food) => (
                <div key={food.id} className="flex items-center gap-2 p-3 bg-bg-panel border border-green-dark/50 min-h-[44px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{food.food_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {food.brand && <span className="text-[0.55rem] text-text-secondary truncate">{food.brand}</span>}
                      <span className="text-[0.55rem] font-mono text-text-secondary">P:{food.protein_g}g C:{food.carbs_g}g F:{food.fat_g}g</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-1">
                    <p className="text-sm font-mono font-bold text-text-primary">{food.calories}</p>
                    <p className="text-[0.5rem] font-mono text-text-secondary">kcal</p>
                  </div>
                  <button onClick={() => setDeleteTarget({ id: food.id, name: food.food_name })}
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] text-text-secondary hover:text-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <p className="text-[0.6rem] font-mono text-text-secondary text-center pt-2">
                {filtered.length} {filtered.length === 1 ? "FOOD" : "FOODS"} SAVED
              </p>
            </div>
          )}
        </>
      )}

      {/* ===== FIND FOOD TAB ===== */}
      {tab === "find" && (
        <div className="space-y-3">
          {/* Search bar + scan button */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search foods..."
                className="w-full pl-10 pr-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="px-4">
              {searching ? <Loader2 size={16} className="animate-spin" /> : "GO"}
            </Button>
          </div>

          {/* Scan barcode button */}
          <Button variant="secondary" fullWidth onClick={() => setShowScanner(true)}>
            <span className="flex items-center justify-center gap-2"><Scan size={16} /> SCAN BARCODE</span>
          </Button>

          {/* Barcode lookup loading */}
          {lookingUp && (
            <div className="text-center py-4">
              <Loader2 size={20} className="text-green-primary animate-spin mx-auto" />
              <p className="text-xs text-text-secondary mt-2">Looking up barcode...</p>
            </div>
          )}

          {/* Scanned product result */}
          {scannedProduct && (
            <div className="bg-bg-panel border border-green-dark p-3 space-y-2">
              <p className="text-sm font-heading uppercase text-sand">{scannedProduct.food_name}</p>
              {scannedProduct.brand && <p className="text-[0.6rem] text-text-secondary">{scannedProduct.brand}</p>}
              <p className="text-[0.55rem] font-mono text-text-secondary">
                {scannedProduct.calories} kcal | P:{scannedProduct.protein_g}g | C:{scannedProduct.carbs_g}g | F:{scannedProduct.fat_g}g
              </p>
              <div className="flex gap-2">
                <Button onClick={() => { saveFood(scannedProduct); setScannedProduct(null); }} fullWidth
                  disabled={savedNames.has(scannedProduct.food_name.toLowerCase())}>
                  {savedNames.has(scannedProduct.food_name.toLowerCase()) ? "ALREADY SAVED" : "SAVE TO MY FOOD"}
                </Button>
                <Button variant="secondary" onClick={() => { setScannedProduct(null); setShowScanner(true); }} fullWidth>
                  RESCAN
                </Button>
              </div>
            </div>
          )}

          {/* Search results */}
          <div className="space-y-1 max-h-[50vh] overflow-y-auto">
            {searchResults.map((food, i) => {
              const alreadySaved = savedNames.has(food.food_name.toLowerCase());
              return (
                <div key={i} className="flex items-center gap-2 p-3 bg-bg-panel border border-green-dark/50 min-h-[44px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{food.food_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {food.brand && <span className="text-[0.55rem] text-text-secondary truncate">{food.brand}</span>}
                      <span className="text-[0.55rem] font-mono text-text-secondary">
                        P:{food.protein_g}g C:{food.carbs_g}g F:{food.fat_g}g
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-bold text-text-primary">{food.calories}</p>
                    <p className="text-[0.5rem] font-mono text-text-secondary">kcal</p>
                  </div>
                  <button onClick={() => saveFood(food)}
                    disabled={alreadySaved || saving === food.food_name}
                    className={`flex items-center justify-center min-h-[44px] min-w-[44px] transition-colors
                      ${alreadySaved ? "text-green-light" : "text-text-secondary hover:text-green-light"}`}>
                    {saving === food.food_name ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Heart size={16} fill={alreadySaved ? "currentColor" : "none"} />
                    )}
                  </button>
                </div>
              );
            })}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-xs text-text-secondary text-center py-4">No results. Try a different search term.</p>
            )}
          </div>
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
