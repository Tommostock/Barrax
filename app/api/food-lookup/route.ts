/* ============================================
   Food Lookup API Route
   Proxies requests to:
   1. Open Food Facts UK (uk.openfoodfacts.org) — UK supermarket products
   2. Open Food Facts World — global fallback
   3. USDA FoodData Central — generic foods (chicken, rice, etc.)
   All APIs are 100% free, no paid keys needed.
   ============================================ */

import { NextResponse } from "next/server";

// UK-specific endpoint finds Tesco, Asda, Aldi, Lidl products better
const OFF_UK = "https://uk.openfoodfacts.org";
const OFF_WORLD = "https://world.openfoodfacts.org";

// USDA FoodData Central — free API for generic foods
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

// ──────────────────────────────────────────────
// Extract nutrition from an Open Food Facts product
// ──────────────────────────────────────────────

function extractFromOFF(product: Record<string, unknown>) {
  const nutriments = (product.nutriments || {}) as Record<string, number>;

  // Try per-serving first, fall back to per-100g
  const servingCal = nutriments["energy-kcal_serving"];
  const per100Cal = nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0;
  const useServing = servingCal && servingCal > 0;

  const suffix = useServing ? "_serving" : "_100g";

  return {
    food_name: (product.product_name as string) || (product.product_name_en as string) || "Unknown Product",
    brand: (product.brands as string) || "",
    barcode: (product.code as string) || "",
    image_url: (product.image_front_small_url as string) || (product.image_url as string) || "",
    serving_size: useServing
      ? (product.serving_size as string) || "1 serving"
      : "100g",
    calories: Math.round(nutriments[`energy-kcal${suffix}`] || per100Cal),
    protein_g: Math.round((nutriments[`proteins${suffix}`] || nutriments["proteins_100g"] || 0) * 10) / 10,
    carbs_g: Math.round((nutriments[`carbohydrates${suffix}`] || nutriments["carbohydrates_100g"] || 0) * 10) / 10,
    fat_g: Math.round((nutriments[`fat${suffix}`] || nutriments["fat_100g"] || 0) * 10) / 10,
    fibre_g: Math.round((nutriments[`fiber${suffix}`] || nutriments["fiber_100g"] || 0) * 10) / 10,
    sugar_g: Math.round((nutriments[`sugars${suffix}`] || nutriments["sugars_100g"] || 0) * 10) / 10,
    salt_g: Math.round((nutriments[`salt${suffix}`] || nutriments["salt_100g"] || 0) * 10) / 10,
    source: "openfoodfacts" as const,
  };
}

// ──────────────────────────────────────────────
// Extract nutrition from a USDA food
// ──────────────────────────────────────────────

interface USDANutrient { nutrientId: number; value: number; }

function extractFromUSDA(food: Record<string, unknown>) {
  const nutrients = (food.foodNutrients || []) as USDANutrient[];

  function getNutrient(id: number): number {
    const n = nutrients.find((n) => n.nutrientId === id);
    return n ? Math.round(n.value * 10) / 10 : 0;
  }

  return {
    food_name: (food.description as string) || "Unknown Food",
    brand: (food.brandOwner as string) || (food.brandName as string) || "",
    barcode: (food.gtinUpc as string) || "",
    image_url: "",
    serving_size: (food.servingSize as number)
      ? `${food.servingSize}${(food.servingSizeUnit as string) || "g"}`
      : "100g",
    calories: Math.round(getNutrient(1008)),
    protein_g: getNutrient(1003),
    carbs_g: getNutrient(1005),
    fat_g: getNutrient(1004),
    fibre_g: getNutrient(1079),
    sugar_g: getNutrient(1063),
    salt_g: Math.round(getNutrient(1093) * 2.5 / 1000 * 10) / 10,
    source: "usda" as const,
  };
}

// ──────────────────────────────────────────────
// Search USDA FoodData Central
// ──────────────────────────────────────────────

async function searchUSDA(query: string) {
  try {
    const res = await fetch(
      `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)&api_key=${USDA_API_KEY}`,
      { headers: { "User-Agent": "BARRAX-App/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.foods || []) as Record<string, unknown>[])
      .filter((f) => f.description)
      .map(extractFromUSDA)
      .filter((f) => f.calories > 0);
  } catch { return []; }
}

// ──────────────────────────────────────────────
// Search Open Food Facts (UK first, then world)
// ──────────────────────────────────────────────

async function searchOFF(query: string) {
  const fields = "product_name,product_name_en,brands,code,nutriments,serving_size,image_front_small_url";

  // Search UK endpoint first (better for Tesco, Asda, Aldi, etc.)
  try {
    const ukRes = await fetch(
      `${OFF_UK}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=true&page_size=10&fields=${fields}&cc=uk&lc=en`,
      { headers: { "User-Agent": "BARRAX-App/1.0 (contact: barrax@app.com)" } }
    );

    let products: ReturnType<typeof extractFromOFF>[] = [];

    if (ukRes.ok) {
      const ukData = await ukRes.json();
      products = ((ukData.products || []) as Record<string, unknown>[])
        .filter((p) => p.product_name || p.product_name_en)
        .map(extractFromOFF)
        .filter((p) => p.calories > 0);
    }

    // If UK search found enough results, return them
    if (products.length >= 5) return products;

    // Otherwise supplement with world search
    const worldRes = await fetch(
      `${OFF_WORLD}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=true&page_size=10&fields=${fields}`,
      { headers: { "User-Agent": "BARRAX-App/1.0 (contact: barrax@app.com)" } }
    );

    if (worldRes.ok) {
      const worldData = await worldRes.json();
      const worldProducts = ((worldData.products || []) as Record<string, unknown>[])
        .filter((p) => p.product_name || p.product_name_en)
        .map(extractFromOFF)
        .filter((p) => p.calories > 0);

      // Deduplicate by barcode
      const existingBarcodes = new Set(products.map((p) => p.barcode));
      for (const p of worldProducts) {
        if (!existingBarcodes.has(p.barcode)) {
          products.push(p);
        }
      }
    }

    return products;
  } catch { return []; }
}

// ──────────────────────────────────────────────
// Barcode lookup — try UK endpoint, then world
// ──────────────────────────────────────────────

async function lookupBarcode(barcode: string) {
  // Try UK endpoint first (faster for UK products)
  for (const base of [OFF_UK, OFF_WORLD]) {
    try {
      const res = await fetch(`${base}/api/v2/product/${barcode}.json`, {
        headers: { "User-Agent": "BARRAX-App/1.0 (contact: barrax@app.com)" },
      });

      if (!res.ok) continue;
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const product = extractFromOFF(data.product);
        // Only return if we got meaningful data
        if (product.food_name !== "Unknown Product" || product.calories > 0) {
          return product;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const query = searchParams.get("query");

  try {
    // ── Barcode lookup ──
    if (barcode) {
      const product = await lookupBarcode(barcode);
      if (product) {
        return NextResponse.json({ product });
      }
      return NextResponse.json(
        { error: `Product not found for barcode ${barcode}. Try searching by name instead.` },
        { status: 404 }
      );
    }

    // ── Text search — UK Open Food Facts + USDA combined ──
    if (query) {
      // Run both searches in parallel
      const [offProducts, usdaProducts] = await Promise.all([
        searchOFF(query),
        searchUSDA(query),
      ]);

      // Combine: OFF (UK branded products) first, then USDA (generic foods)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const combined: any[] = [...offProducts];
      const offNames = new Set(offProducts.map((p) => p.food_name.toLowerCase()));

      for (const p of usdaProducts) {
        if (!offNames.has(p.food_name.toLowerCase())) {
          combined.push(p);
        }
      }

      return NextResponse.json({ products: combined.slice(0, 20) });
    }

    return NextResponse.json({ error: "Provide barcode or query parameter" }, { status: 400 });

  } catch (error) {
    console.error("Food lookup error:", error);
    return NextResponse.json({ error: "Failed to look up food" }, { status: 500 });
  }
}
