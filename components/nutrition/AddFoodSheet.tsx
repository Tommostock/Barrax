/* ============================================
   AddFoodSheet Component
   Bottom sheet with 4 ways to add food:
   1. My Foods (saved personal food library)
   2. Search Open Food Facts
   3. Scan barcode
   4. Manual entry
   All methods go through a quantity confirmation
   step before adding to the diary.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import BarcodeScanner from "@/components/nutrition/BarcodeScanner";
import { Scan, Search, PenLine, Plus, Loader2, Star, Minus, Heart, Trash2 } from "lucide-react";
import type { FoodLookupResult, MealType, SavedFood } from "@/types";

interface AddFoodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  onAddFood: (food: {
    food_name: string;
    brand?: string;
    barcode?: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
    quantity: number;
    source: "manual" | "barcode" | "search";
  }) => void;
}

// The food being confirmed before adding (with quantity)
interface PendingFood {
  food_name: string;
  brand?: string;
  barcode?: string;
  calories: number;   // per single serving
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  source: "manual" | "barcode" | "search";
}

type Tab = "my_foods" | "search" | "scan" | "manual";

export default function AddFoodSheet({ isOpen, onClose, mealType, onAddFood }: AddFoodSheetProps) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("my_foods");
  const [showScanner, setShowScanner] = useState(false);

  // Quantity confirmation step
  const [pendingFood, setPendingFood] = useState<PendingFood | null>(null);
  const [quantity, setQuantity] = useState(1);

  // My foods state
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodLookupResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Barcode state
  const [scannedProduct, setScannedProduct] = useState<FoodLookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  // Manual state
  const [manual, setManual] = useState({ food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });

  // Barcode fallback message (shown when barcode not found)
  const [barcodeFallback, setBarcodeFallback] = useState<string | null>(null);

  // Load saved foods when sheet opens
  useEffect(() => {
    if (!isOpen) return;
    async function loadSaved() {
      setSavedLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSavedLoading(false); return; }
      const { data } = await supabase
        .from("saved_foods").select("*").eq("user_id", user.id).order("food_name", { ascending: true });
      if (data) setSavedFoods(data as SavedFood[]);
      setSavedLoading(false);
    }
    loadSaved();
  }, [isOpen, supabase]);

  // Select a food to confirm quantity before adding
  function selectFood(food: PendingFood) {
    setPendingFood(food);
    setQuantity(1);
  }

  // Confirm and add with quantity
  function confirmAdd() {
    if (!pendingFood) return;
    onAddFood({
      ...pendingFood,
      calories: pendingFood.calories * quantity,
      protein_g: pendingFood.protein_g * quantity,
      carbs_g: pendingFood.carbs_g * quantity,
      fat_g: pendingFood.fat_g * quantity,
      quantity,
    });
    onClose();
    resetState();
  }

  // Save the pending food to "My Foods" library
  async function saveToMyFoods() {
    if (!pendingFood) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("saved_foods").insert({
      user_id: user.id,
      food_name: pendingFood.food_name,
      brand: pendingFood.brand ?? null,
      barcode: pendingFood.barcode ?? null,
      calories: pendingFood.calories,
      protein_g: pendingFood.protein_g,
      carbs_g: pendingFood.carbs_g,
      fat_g: pendingFood.fat_g,
      serving_size: pendingFood.serving_size ?? null,
    }).select().single();
    if (data) setSavedFoods(prev => [...prev, data as SavedFood]);
    navigator.vibrate?.(50);
  }

  // Delete a saved food
  async function deleteSavedFood(id: string) {
    await supabase.from("saved_foods").delete().eq("id", id);
    setSavedFoods(prev => prev.filter(f => f.id !== id));
  }

  // Search
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

  // Barcode
  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/food-lookup?barcode=${barcode}`);
      const data = await res.json();
      if (data.product) {
        setScannedProduct(data.product);
      } else {
        // Product not in database — switch to search tab with barcode as hint
        setTab("search");
        setSearchQuery(barcode);
        setBarcodeFallback(`Barcode ${barcode} not found in the database. Try searching by product name instead.`);
      }
    } catch {
      setTab("search");
      setBarcodeFallback("Lookup failed. Try searching by name instead.");
    }
    finally { setLookingUp(false); }
  }

  function resetState() {
    setPendingFood(null);
    setQuantity(1);
    setSearchQuery("");
    setSearchResults([]);
    setScannedProduct(null);
    setManual({ food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
    setBarcodeFallback(null);
  }

  if (showScanner) {
    return <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />;
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { onClose(); resetState(); }} title={`ADD TO ${mealType.toUpperCase()}`}>

      {/* ===== QUANTITY CONFIRMATION STEP ===== */}
      {pendingFood ? (
        <div className="space-y-4">
          {/* Food info */}
          <div className="bg-bg-panel-alt border border-green-dark p-3">
            <p className="text-sm font-heading uppercase text-sand">{pendingFood.food_name}</p>
            {pendingFood.brand && <p className="text-[0.6rem] text-text-secondary">{pendingFood.brand}</p>}
            <p className="text-[0.55rem] font-mono text-text-secondary mt-1">Per serving: {pendingFood.calories} kcal | P: {pendingFood.protein_g}g | C: {pendingFood.carbs_g}g | F: {pendingFood.fat_g}g</p>
          </div>

          {/* Quantity selector */}
          <div>
            <p className="text-[0.6rem] font-mono text-text-secondary uppercase mb-2">Quantity</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                className="w-12 h-12 bg-bg-panel border border-green-dark flex items-center justify-center hover:bg-bg-panel-alt">
                <Minus size={18} className="text-text-primary" />
              </button>
              <div className="text-center min-w-[80px]">
                <p className="text-3xl font-bold font-mono text-text-primary">{quantity}</p>
                <p className="text-[0.5rem] font-mono text-text-secondary">{quantity === 1 ? "SERVING" : "SERVINGS"}</p>
              </div>
              <button onClick={() => setQuantity(quantity + 0.5)}
                className="w-12 h-12 bg-bg-panel border border-green-dark flex items-center justify-center hover:bg-bg-panel-alt">
                <Plus size={18} className="text-text-primary" />
              </button>
            </div>
            {/* Quick quantity buttons */}
            <div className="flex justify-center gap-2 mt-2">
              {[0.5, 1, 1.5, 2, 3].map(q => (
                <button key={q} onClick={() => setQuantity(q)}
                  className={`px-3 py-1 text-[0.6rem] font-mono border transition-colors
                    ${quantity === q ? "bg-green-primary border-green-primary text-text-primary" : "border-green-dark text-text-secondary"}`}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Total with quantity applied */}
          <div className="grid grid-cols-4 gap-2 bg-bg-panel border border-green-dark p-3">
            <div className="text-center">
              <p className="text-sm font-mono font-bold text-text-primary">{Math.round(pendingFood.calories * quantity)}</p>
              <p className="text-[0.45rem] font-mono text-text-secondary">KCAL</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono font-bold text-green-light">{Math.round(pendingFood.protein_g * quantity * 10) / 10}g</p>
              <p className="text-[0.45rem] font-mono text-text-secondary">PROTEIN</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono font-bold text-xp-gold">{Math.round(pendingFood.carbs_g * quantity * 10) / 10}g</p>
              <p className="text-[0.45rem] font-mono text-text-secondary">CARBS</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-mono font-bold text-khaki">{Math.round(pendingFood.fat_g * quantity * 10) / 10}g</p>
              <p className="text-[0.45rem] font-mono text-text-secondary">FAT</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={confirmAdd} fullWidth>
              <span className="flex items-center justify-center gap-2">
                <Plus size={14} /> ADD {quantity !== 1 ? `x${quantity}` : ""}
              </span>
            </Button>
          </div>
          <div className="flex gap-2">
            <button onClick={saveToMyFoods}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-green-dark text-xs font-mono uppercase text-text-secondary hover:text-green-light min-h-[44px]">
              <Heart size={14} /> SAVE TO MY FOODS
            </button>
            <button onClick={() => setPendingFood(null)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-green-dark text-xs font-mono uppercase text-text-secondary hover:text-text-primary min-h-[44px]">
              BACK
            </button>
          </div>
        </div>
      ) : (
        /* ===== TAB CONTENT ===== */
        <>
          {/* Tab selector */}
          <div className="flex border border-green-dark mb-4">
            {([
              { key: "my_foods" as Tab, icon: Star, label: "MY FOODS" },
              { key: "search" as Tab, icon: Search, label: "SEARCH" },
              { key: "scan" as Tab, icon: Scan, label: "SCAN" },
              { key: "manual" as Tab, icon: PenLine, label: "MANUAL" },
            ]).map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1 text-[0.55rem] font-mono uppercase tracking-wider transition-colors
                  ${tab === key ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* MY FOODS TAB */}
          {tab === "my_foods" && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedLoading ? (
                <div className="text-center py-4"><Loader2 size={20} className="text-green-primary animate-spin mx-auto" /></div>
              ) : savedFoods.length === 0 ? (
                <div className="text-center py-6">
                  <Star size={24} className="text-text-secondary mx-auto mb-2" />
                  <p className="text-xs text-text-secondary">No saved foods yet.</p>
                  <p className="text-[0.6rem] text-text-secondary mt-1">Search or scan a food, then tap &quot;SAVE TO MY FOODS&quot;.</p>
                </div>
              ) : (
                savedFoods.map((food) => (
                  <div key={food.id} className="flex items-center gap-2">
                    <button onClick={() => selectFood({
                      food_name: food.food_name, brand: food.brand ?? undefined, barcode: food.barcode ?? undefined,
                      calories: food.calories, protein_g: food.protein_g, carbs_g: food.carbs_g, fat_g: food.fat_g,
                      serving_size: food.serving_size ?? undefined, source: "manual",
                    })}
                      className="flex-1 flex items-center justify-between p-3 bg-bg-panel border border-green-dark/50 text-left hover:bg-bg-panel-alt transition-colors min-h-[44px]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{food.food_name}</p>
                        {food.brand && <p className="text-[0.6rem] text-text-secondary">{food.brand}</p>}
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-mono font-bold text-text-primary">{food.calories}</p>
                        <p className="text-[0.45rem] font-mono text-text-secondary">kcal</p>
                      </div>
                    </button>
                    <button onClick={() => deleteSavedFood(food.id)}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center text-text-secondary hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SEARCH TAB */}
          {tab === "search" && (
            <div className="space-y-3">
              {/* Barcode fallback message */}
              {barcodeFallback && (
                <div className="bg-bg-panel-alt border border-xp-gold/50 p-2">
                  <p className="text-xs text-xp-gold font-mono">{barcodeFallback}</p>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search foods..."
                  className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
                <Button onClick={handleSearch} disabled={searching} className="px-4">
                  {searching ? <Loader2 size={16} className="animate-spin" /> : "GO"}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {searchResults.map((food, i) => (
                  <button key={i} onClick={() => selectFood({
                    food_name: food.food_name, brand: food.brand, barcode: food.barcode,
                    calories: food.calories, protein_g: food.protein_g, carbs_g: food.carbs_g, fat_g: food.fat_g,
                    serving_size: food.serving_size, source: "search",
                  })}
                    className="w-full flex items-center justify-between p-3 bg-bg-panel border border-green-dark/50 text-left hover:bg-bg-panel-alt transition-colors min-h-[44px]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{food.food_name}</p>
                      {food.brand && <p className="text-[0.6rem] text-text-secondary">{food.brand}</p>}
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-mono font-bold text-text-primary">{food.calories}</p>
                      <p className="text-[0.45rem] font-mono text-text-secondary">kcal</p>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-xs text-text-secondary text-center py-4">No results.</p>
                )}
              </div>
            </div>
          )}

          {/* SCAN TAB */}
          {tab === "scan" && (
            <div className="space-y-3">
              {lookingUp ? (
                <div className="text-center py-8"><Loader2 size={24} className="text-green-primary animate-spin mx-auto mb-2" /><p className="text-xs text-text-secondary">Looking up...</p></div>
              ) : scannedProduct ? (
                <div className="space-y-3">
                  <div className="bg-bg-panel-alt border border-green-dark p-3">
                    <p className="text-sm font-heading uppercase text-sand">{scannedProduct.food_name}</p>
                    {scannedProduct.brand && <p className="text-xs text-text-secondary">{scannedProduct.brand}</p>}
                    <p className="text-[0.55rem] font-mono text-text-secondary mt-1">{scannedProduct.calories} kcal | P: {scannedProduct.protein_g}g | C: {scannedProduct.carbs_g}g | F: {scannedProduct.fat_g}g</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { selectFood({
                      food_name: scannedProduct.food_name, brand: scannedProduct.brand, barcode: scannedProduct.barcode,
                      calories: scannedProduct.calories, protein_g: scannedProduct.protein_g, carbs_g: scannedProduct.carbs_g, fat_g: scannedProduct.fat_g,
                      serving_size: scannedProduct.serving_size, source: "barcode",
                    }); setScannedProduct(null); }} fullWidth>
                      <span className="flex items-center justify-center gap-2"><Plus size={14} /> SELECT</span>
                    </Button>
                    <Button variant="secondary" onClick={() => { setScannedProduct(null); setShowScanner(true); }} fullWidth>RESCAN</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Scan size={40} className="text-text-secondary mx-auto mb-3" />
                  <p className="text-xs text-text-secondary mb-4">Point your camera at a barcode.</p>
                  <Button onClick={() => setShowScanner(true)}>
                    <span className="flex items-center gap-2"><Scan size={16} /> OPEN SCANNER</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* MANUAL TAB */}
          {tab === "manual" && (
            <div className="space-y-3">
              <input type="text" value={manual.food_name} onChange={(e) => setManual({ ...manual, food_name: e.target.value })}
                placeholder="Food name" className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Calories</label>
                  <input type="number" value={manual.calories} onChange={(e) => setManual({ ...manual, calories: e.target.value })} placeholder="kcal"
                    className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" /></div>
                <div><label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Protein (g)</label>
                  <input type="number" value={manual.protein_g} onChange={(e) => setManual({ ...manual, protein_g: e.target.value })} placeholder="g"
                    className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" /></div>
                <div><label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Carbs (g)</label>
                  <input type="number" value={manual.carbs_g} onChange={(e) => setManual({ ...manual, carbs_g: e.target.value })} placeholder="g"
                    className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" /></div>
                <div><label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Fat (g)</label>
                  <input type="number" value={manual.fat_g} onChange={(e) => setManual({ ...manual, fat_g: e.target.value })} placeholder="g"
                    className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" /></div>
              </div>
              <Button onClick={() => { if (!manual.food_name.trim()) return; selectFood({
                food_name: manual.food_name, calories: Number(manual.calories) || 0,
                protein_g: Number(manual.protein_g) || 0, carbs_g: Number(manual.carbs_g) || 0, fat_g: Number(manual.fat_g) || 0, source: "manual",
              }); }} disabled={!manual.food_name.trim()} fullWidth>
                <span className="flex items-center justify-center gap-2"><Plus size={14} /> NEXT</span>
              </Button>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
