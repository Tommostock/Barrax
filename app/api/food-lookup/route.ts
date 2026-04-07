/* ============================================
   Food Lookup API Route
   Proxies requests to Open Food Facts (packaged
   products) and USDA FoodData Central (generic
   foods) to provide broad food search coverage.
   Both APIs are 100% free, no paid keys needed.
   ============================================ */

import { NextResponse } from "next/server";

const OFF_BASE = "https://world.openfoodfacts.org";

// USDA FoodData Central — free API.
// DEMO_KEY works out of the box (30 req/hour).
// For higher limits, get a free key at https://api.data.gov/signup/
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

// ──────────────────────────────────────────────
// Extract nutrition from an Open Food Facts product
// ──────────────────────────────────────────────

function extractFromOFF(product: Record<string, unknown>) {
  const nutriments = (product.nutriments || {}) as Record<string, number>;

  return {
    food_name: (product.product_name as string) || "Unknown Product",
    brand: (product.brands as string) || "",
    barcode: (product.code as string) || "",
    image_url: (product.image_front_small_url as string) || "",
    serving_size: (product.serving_size as string) || "100g",
    calories: Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0),
    protein_g: Math.round((nutriments["proteins_100g"] || nutriments["proteins"] || 0) * 10) / 10,
    carbs_g: Math.round((nutriments["carbohydrates_100g"] || nutriments["carbohydrates"] || 0) * 10) / 10,
    fat_g: Math.round((nutriments["fat_100g"] || nutriments["fat"] || 0) * 10) / 10,
    fibre_g: Math.round((nutriments["fiber_100g"] || nutriments["fiber"] || 0) * 10) / 10,
    sugar_g: Math.round((nutriments["sugars_100g"] || nutriments["sugars"] || 0) * 10) / 10,
    salt_g: Math.round((nutriments["salt_100g"] || nutriments["salt"] || 0) * 10) / 10,
    source: "openfoodfacts" as const,
  };
}

// ──────────────────────────────────────────────
// Extract nutrition from a USDA FoodData Central food
// ──────────────────────────────────────────────

interface USDANutrient {
  nutrientId: number;
  value: number;
}

function extractFromUSDA(food: Record<string, unknown>) {
  const nutrients = (food.foodNutrients || []) as USDANutrient[];

  // USDA nutrient IDs:
  // 1008 = Energy (kcal), 1003 = Protein, 1005 = Carbs, 1004 = Fat
  // 1079 = Fibre, 1063 = Sugars, 1093 = Sodium
  function getNutrient(id: number): number {
    const n = nutrients.find((n) => n.nutrientId === id);
    return n ? Math.round(n.value * 10) / 10 : 0;
  }

  const brandOwner = (food.brandOwner as string) || (food.brandName as string) || "";

  return {
    food_name: (food.description as string) || "Unknown Food",
    brand: brandOwner,
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
    salt_g: Math.round(getNutrient(1093) * 2.5 / 1000 * 10) / 10, // sodium mg → salt g
    source: "usda" as const,
  };
}

// ──────────────────────────────────────────────
// Search USDA FoodData Central
// Prefers "Foundation" and "SR Legacy" data types
// (generic foods like "chicken breast", "banana")
// ──────────────────────────────────────────────

async function searchUSDA(query: string) {
  try {
    const res = await fetch(
      `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)&api_key=${USDA_API_KEY}`,
      { headers: { "User-Agent": "BARRAX-App/1.0" } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const foods = ((data.foods || []) as Record<string, unknown>[])
      .filter((f) => f.description)
      .map(extractFromUSDA)
      // Only include foods that have at least calorie data
      .filter((f) => f.calories > 0);

    return foods;
  } catch (err) {
    console.error("USDA search error:", err);
    return [];
  }
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const query = searchParams.get("query");

  try {
    // ── Barcode lookup — Open Food Facts only (barcodes are product-specific) ──
    if (barcode) {
      const res = await fetch(`${OFF_BASE}/api/v2/product/${barcode}.json`, {
        headers: { "User-Agent": "BARRAX-App/1.0" },
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const data = await res.json();

      if (data.status === 0 || !data.product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({
        product: extractFromOFF(data.product),
      });
    }

    // ── Text search — try Open Food Facts first, then USDA as fallback ──
    if (query) {
      // 1. Search Open Food Facts (packaged/branded products)
      const offRes = await fetch(
        `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=true&page_size=10&fields=product_name,brands,code,nutriments,serving_size,image_front_small_url`,
        { headers: { "User-Agent": "BARRAX-App/1.0" } }
      );

      let offProducts: ReturnType<typeof extractFromOFF>[] = [];
      if (offRes.ok) {
        const offData = await offRes.json();
        offProducts = ((offData.products || []) as Record<string, unknown>[])
          .filter((p) => p.product_name)
          .map(extractFromOFF);
      }

      // 2. Search USDA (generic foods — chicken breast, rice, banana, etc.)
      const usdaProducts = await searchUSDA(query);

      // 3. Combine results: USDA first (generic foods are usually more
      //    relevant for a fitness app), then Open Food Facts (branded).
      //    Deduplicate by checking for similar names.
      const combined: Array<ReturnType<typeof extractFromOFF> | ReturnType<typeof extractFromUSDA>> = [...usdaProducts];
      const usdaNames = new Set(usdaProducts.map((p) => p.food_name.toLowerCase()));

      for (const p of offProducts) {
        // Skip if a USDA result already has a very similar name
        if (!usdaNames.has(p.food_name.toLowerCase())) {
          combined.push(p);
        }
      }

      return NextResponse.json({ products: combined.slice(0, 15) });
    }

    return NextResponse.json({ error: "Provide barcode or query parameter" }, { status: 400 });

  } catch (error) {
    console.error("Food lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up food" },
      { status: 500 }
    );
  }
}
