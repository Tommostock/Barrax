/* ============================================
   AddFoodSheet Component
   Bottom sheet with 3 ways to add food:
   1. Scan barcode
   2. Search Open Food Facts
   3. Manual entry
   ============================================ */

"use client";

import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import BarcodeScanner from "@/components/nutrition/BarcodeScanner";
import { Scan, Search, PenLine, Plus, Loader2 } from "lucide-react";
import type { FoodLookupResult, MealType } from "@/types";

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
    source: "manual" | "barcode" | "search";
  }) => void;
}

type Tab = "scan" | "search" | "manual";

export default function AddFoodSheet({ isOpen, onClose, mealType, onAddFood }: AddFoodSheetProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [showScanner, setShowScanner] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodLookupResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Barcode lookup state
  const [scannedProduct, setScannedProduct] = useState<FoodLookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  // Manual entry state
  const [manual, setManual] = useState({ food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });

  // Search Open Food Facts
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/food-lookup?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  // Barcode scan callback
  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false);
    setLookingUp(true);
    try {
      const res = await fetch(`/api/food-lookup?barcode=${barcode}`);
      const data = await res.json();
      if (data.product) {
        setScannedProduct(data.product);
      } else {
        setScannedProduct(null);
        alert("Product not found. Try manual entry.");
      }
    } catch {
      alert("Lookup failed. Try manual entry.");
    } finally {
      setLookingUp(false);
    }
  }

  // Add a food from search results or barcode
  function addFromResult(food: FoodLookupResult, source: "barcode" | "search") {
    onAddFood({
      food_name: food.food_name,
      brand: food.brand,
      barcode: food.barcode,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      serving_size: food.serving_size,
      source,
    });
    onClose();
    resetState();
  }

  // Add manual entry
  function addManual() {
    if (!manual.food_name.trim()) return;
    onAddFood({
      food_name: manual.food_name,
      calories: Number(manual.calories) || 0,
      protein_g: Number(manual.protein_g) || 0,
      carbs_g: Number(manual.carbs_g) || 0,
      fat_g: Number(manual.fat_g) || 0,
      source: "manual",
    });
    onClose();
    resetState();
  }

  function resetState() {
    setSearchQuery("");
    setSearchResults([]);
    setScannedProduct(null);
    setManual({ food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
  }

  // Show full-screen barcode scanner
  if (showScanner) {
    return <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />;
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`ADD TO ${mealType.toUpperCase()}`}>
      {/* Tab selector */}
      <div className="flex border border-green-dark mb-4">
        {([
          { key: "search" as Tab, icon: Search, label: "SEARCH" },
          { key: "scan" as Tab, icon: Scan, label: "SCAN" },
          { key: "manual" as Tab, icon: PenLine, label: "MANUAL" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[0.6rem] font-mono uppercase tracking-wider transition-colors
              ${tab === key ? "bg-green-primary text-text-primary" : "bg-bg-panel text-text-secondary"}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* SEARCH TAB */}
      {tab === "search" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search foods..."
              className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                         focus:border-green-primary focus:outline-none text-sm"
            />
            <Button onClick={handleSearch} disabled={searching} className="px-4">
              {searching ? <Loader2 size={16} className="animate-spin" /> : "GO"}
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {searchResults.map((food, i) => (
              <button
                key={i}
                onClick={() => addFromResult(food, "search")}
                className="w-full flex items-center justify-between p-3 bg-bg-panel border border-green-dark/50
                           text-left hover:bg-bg-panel-alt transition-colors min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{food.food_name}</p>
                  {food.brand && <p className="text-[0.6rem] text-text-secondary">{food.brand}</p>}
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-sm font-mono font-bold text-text-primary">{food.calories}</p>
                  <p className="text-[0.5rem] font-mono text-text-secondary">kcal</p>
                </div>
              </button>
            ))}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-xs text-text-secondary text-center py-4">No results. Try a different search term.</p>
            )}
          </div>
        </div>
      )}

      {/* SCAN TAB */}
      {tab === "scan" && (
        <div className="space-y-3">
          {lookingUp ? (
            <div className="text-center py-8">
              <Loader2 size={24} className="text-green-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-text-secondary">Looking up product...</p>
            </div>
          ) : scannedProduct ? (
            <div className="space-y-3">
              <div className="bg-bg-panel-alt border border-green-dark p-3">
                <p className="text-sm font-heading uppercase text-sand">{scannedProduct.food_name}</p>
                {scannedProduct.brand && <p className="text-xs text-text-secondary">{scannedProduct.brand}</p>}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-sm font-mono font-bold text-text-primary">{scannedProduct.calories}</p>
                    <p className="text-[0.5rem] font-mono text-text-secondary">KCAL</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-mono font-bold text-green-light">{scannedProduct.protein_g}g</p>
                    <p className="text-[0.5rem] font-mono text-text-secondary">PROTEIN</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-mono font-bold text-xp-gold">{scannedProduct.carbs_g}g</p>
                    <p className="text-[0.5rem] font-mono text-text-secondary">CARBS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-mono font-bold text-khaki">{scannedProduct.fat_g}g</p>
                    <p className="text-[0.5rem] font-mono text-text-secondary">FAT</p>
                  </div>
                </div>
                <p className="text-[0.55rem] font-mono text-text-secondary mt-2">Per {scannedProduct.serving_size}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addFromResult(scannedProduct, "barcode")} fullWidth>
                  <span className="flex items-center justify-center gap-2"><Plus size={14} /> ADD</span>
                </Button>
                <Button variant="secondary" onClick={() => { setScannedProduct(null); setShowScanner(true); }} fullWidth>
                  RESCAN
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Scan size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-xs text-text-secondary mb-4">
                Point your camera at a barcode on any food product.
              </p>
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
          <input
            type="text"
            value={manual.food_name}
            onChange={(e) => setManual({ ...manual, food_name: e.target.value })}
            placeholder="Food name"
            className="w-full px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                       focus:border-green-primary focus:outline-none text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Calories</label>
              <input type="number" value={manual.calories}
                onChange={(e) => setManual({ ...manual, calories: e.target.value })}
                placeholder="kcal"
                className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Protein (g)</label>
              <input type="number" value={manual.protein_g}
                onChange={(e) => setManual({ ...manual, protein_g: e.target.value })}
                placeholder="g"
                className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Carbs (g)</label>
              <input type="number" value={manual.carbs_g}
                onChange={(e) => setManual({ ...manual, carbs_g: e.target.value })}
                placeholder="g"
                className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[0.55rem] font-mono text-text-secondary uppercase mb-1">Fat (g)</label>
              <input type="number" value={manual.fat_g}
                onChange={(e) => setManual({ ...manual, fat_g: e.target.value })}
                placeholder="g"
                className="w-full px-3 py-2 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm" />
            </div>
          </div>
          <Button onClick={addManual} disabled={!manual.food_name.trim()} fullWidth>
            <span className="flex items-center justify-center gap-2"><Plus size={14} /> ADD FOOD</span>
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
