/* ============================================
   Food Lookup API Route
   Proxies requests to:
   1. Open Food Facts (v2 API) — UK + global products, sorted by popularity
   2. USDA FoodData Central — generic foods (chicken, rice, etc.)
   All APIs are 100% free, no paid keys needed.

   v2 improvements:
   - Uses OFF v2 search API (better results than legacy cgi/search.pl)
   - Popularity sorting: most-scanned products appear first
   - UK and global searches run in parallel (not sequentially)
   - Better deduplication (barcode OR normalised name+brand)
   - More results per source (20 instead of 10)
   ============================================ */

import { NextResponse } from "next/server";
import { searchRestaurantMeals, type RestaurantMeal } from "@/data/restaurant-meals";

// Open Food Facts v2 API base URL
// The v2 search endpoint has better relevance and supports popularity sorting
const OFF_BASE = "https://world.openfoodfacts.org";

// USDA FoodData Central — free API for generic foods
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

// Fields to request from OFF — only asking for what we use keeps responses fast
const OFF_FIELDS = [
  "product_name",
  "product_name_en",
  "brands",
  "code",
  "nutriments",
  "serving_size",
  "image_front_small_url",
  "unique_scans_n",   // Popularity signal — how many times this barcode has been scanned worldwide
].join(",");

// Standard browser-like User-Agent so OFF doesn't rate-limit us
const OFF_HEADERS = { "User-Agent": "BARRAX-App/1.0 (contact: barrax@app.com)" };

// ──────────────────────────────────────────────
// Normalise a food name for deduplication
// Converts to lowercase and collapses whitespace so
// "TESCO Whole Milk  " and "tesco whole milk" are treated as the same product
// ──────────────────────────────────────────────

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

// ──────────────────────────────────────────────
// Extract nutrition from an Open Food Facts product object
// Prefers per-serving values over per-100g when available
// ──────────────────────────────────────────────

function extractFromOFF(product: Record<string, unknown>) {
  const nutriments = (product.nutriments || {}) as Record<string, number>;

  // Try per-serving first (e.g. "30g serving of cereal"), fall back to per-100g
  const servingCal = nutriments["energy-kcal_serving"];
  const per100Cal  = nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0;
  const useServing = servingCal && servingCal > 0;
  const suffix     = useServing ? "_serving" : "_100g";

  // Build a human-readable serving label shown in the results list
  const servingSize = useServing
    ? (product.serving_size as string) || "1 serving"
    : "100g";

  return {
    food_name:  (product.product_name as string) || (product.product_name_en as string) || "",
    brand:      (product.brands as string) || "",
    barcode:    (product.code as string) || "",
    image_url:  (product.image_front_small_url as string) || "",
    serving_size: servingSize,
    calories:  Math.round(nutriments[`energy-kcal${suffix}`] || per100Cal),
    protein_g: Math.round((nutriments[`proteins${suffix}`]       || nutriments["proteins_100g"]       || 0) * 10) / 10,
    carbs_g:   Math.round((nutriments[`carbohydrates${suffix}`]  || nutriments["carbohydrates_100g"]  || 0) * 10) / 10,
    fat_g:     Math.round((nutriments[`fat${suffix}`]            || nutriments["fat_100g"]            || 0) * 10) / 10,
    fibre_g:   Math.round((nutriments[`fiber${suffix}`]          || nutriments["fiber_100g"]          || 0) * 10) / 10,
    sugar_g:   Math.round((nutriments[`sugars${suffix}`]         || nutriments["sugars_100g"]         || 0) * 10) / 10,
    salt_g:    Math.round((nutriments[`salt${suffix}`]           || nutriments["salt_100g"]           || 0) * 10) / 10,
    // Popularity score — higher = scanned more = usually a better/more accurate product entry
    popularity: (product.unique_scans_n as number) || 0,
    source: "openfoodfacts" as const,
  };
}

// ──────────────────────────────────────────────
// Extract nutrition from a USDA food entry
// ──────────────────────────────────────────────

interface USDANutrient { nutrientId: number; value: number; }

function extractFromUSDA(food: Record<string, unknown>) {
  const nutrients = (food.foodNutrients || []) as USDANutrient[];

  // Look up a specific nutrient by its USDA ID number
  function getNutrient(id: number): number {
    const n = nutrients.find((n) => n.nutrientId === id);
    return n ? Math.round(n.value * 10) / 10 : 0;
  }

  return {
    food_name:   (food.description as string) || "",
    brand:       (food.brandOwner as string) || (food.brandName as string) || "",
    barcode:     (food.gtinUpc as string) || "",
    image_url:   "",
    serving_size: (food.servingSize as number)
      ? `${food.servingSize}${(food.servingSizeUnit as string) || "g"}`
      : "100g",
    calories:  Math.round(getNutrient(1008)),            // Energy (kcal)
    protein_g: getNutrient(1003),                        // Protein
    carbs_g:   getNutrient(1005),                        // Carbohydrates
    fat_g:     getNutrient(1004),                        // Total fat
    fibre_g:   getNutrient(1079),                        // Dietary fibre
    sugar_g:   getNutrient(1063),                        // Total sugars
    // Sodium (1093) is in mg, convert to salt in grams: salt = sodium × 2.5 ÷ 1000
    salt_g:    Math.round(getNutrient(1093) * 2.5 / 1000 * 10) / 10,
    popularity: 0,
    source: "usda" as const,
  };
}

// ──────────────────────────────────────────────
// Convert a curated RestaurantMeal into the same shape as OFF/USDA results
// so they can sit side-by-side in the search results list.
// Restaurant meals get a big synthetic popularity score so they rise to the
// top when a user searches for a chain name (e.g. "nandos").
// ──────────────────────────────────────────────

function extractFromRestaurant(meal: RestaurantMeal) {
  return {
    food_name:    meal.food_name,
    brand:        meal.brand,
    barcode:      "",
    image_url:    "",
    serving_size: meal.serving_size,
    calories:     meal.calories,
    protein_g:    meal.protein_g,
    carbs_g:      meal.carbs_g,
    fat_g:        meal.fat_g,
    fibre_g:      meal.fibre_g ?? 0,
    sugar_g:      meal.sugar_g ?? 0,
    salt_g:       meal.salt_g ?? 0,
    // Synthetic popularity — beats any OFF score so these show at the top
    // for queries that match a chain ("mcdonalds", "big mac", etc.)
    popularity:   10_000,
    source:       "restaurant" as const,
  };
}

// ──────────────────────────────────────────────
// Search USDA FoodData Central
// Best for generic/unbranded foods: "chicken breast", "oats", "brown rice"
// ──────────────────────────────────────────────

async function searchUSDA(query: string) {
  try {
    // Foundation + SR Legacy + Survey: these are the most complete datasets
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)&api_key=${USDA_API_KEY}`;
    const res = await fetch(url, { headers: { "User-Agent": "BARRAX-App/1.0" } });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.foods || []) as Record<string, unknown>[])
      .filter((f) => f.description)
      .map(extractFromUSDA)
      .filter((f) => f.calories > 0 && f.food_name !== "");
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Search Open Food Facts using the v2 API
//
// Key upgrade over the old cgi/search.pl:
//   - sort_by=unique_scans_n → popular products (e.g. Weetabix, Belvita) rank first
//   - Runs UK-only and global searches IN PARALLEL (old code waited for UK first)
//   - 20 results per source instead of 10
// ──────────────────────────────────────────────

async function searchOFF(query: string) {

  // Build a v2 search URL — optionally filtered to a specific country
  function buildUrl(countriesTag?: string) {
    const params = new URLSearchParams({
      search_terms: query,
      fields:       OFF_FIELDS,
      sort_by:      "unique_scans_n",  // Most-scanned = most popular and usually most accurate
      page_size:    "20",
      json:         "1",
    });
    // Filtering to UK surfaces Tesco / Asda / Aldi / Lidl products before US ones
    if (countriesTag) params.set("countries_tags", countriesTag);
    return `${OFF_BASE}/api/v2/search?${params.toString()}`;
  }

  try {
    // Fire UK-filtered and global searches AT THE SAME TIME so we're not waiting
    // for one to finish before starting the other
    const [ukResult, globalResult] = await Promise.allSettled([
      fetch(buildUrl("en:united-kingdom"), { headers: OFF_HEADERS }),
      fetch(buildUrl(),                    { headers: OFF_HEADERS }),
    ]);

    // Parse whichever requests succeeded — a failed request returns an empty array
    async function parseResult(result: PromiseSettledResult<Response>) {
      if (result.status !== "fulfilled" || !result.value.ok) return [];
      const data = await result.value.json();
      return ((data.products || []) as Record<string, unknown>[])
        // Skip entries with no product name at all
        .filter((p) => (p.product_name as string)?.trim() || (p.product_name_en as string)?.trim())
        .map(extractFromOFF)
        // Skip entries with 0 calories or empty name (low-quality/incomplete entries)
        .filter((p) => p.calories > 0 && p.food_name !== "");
    }

    const [ukProducts, globalProducts] = await Promise.all([
      parseResult(ukResult),
      parseResult(globalResult),
    ]);

    // Merge UK results first (they're more relevant for this user), then global.
    // Deduplicate using barcode (most reliable) or normalised name + brand as a fallback.
    const seen    = new Set<string>();
    const merged: typeof ukProducts = [];

    for (const p of [...ukProducts, ...globalProducts]) {
      // A barcode uniquely identifies a product; if no barcode, use name+brand combo
      const key = p.barcode
        ? `barcode:${p.barcode}`
        : `name:${normaliseName(p.food_name)}|brand:${normaliseName(p.brand)}`;

      if (!seen.has(key)) {
        seen.add(key);
        merged.push(p);
      }
    }

    // The v2 API already sorted each batch by unique_scans_n, and we merged UK first,
    // so the combined list naturally prioritises popular UK products
    return merged;

  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Barcode lookup — returns a single product by EAN/UPC
// ──────────────────────────────────────────────

async function lookupBarcode(barcode: string) {
  for (const base of [OFF_BASE, "https://uk.openfoodfacts.org"]) {
    try {
      const res = await fetch(`${base}/api/v2/product/${barcode}.json`, { headers: OFF_HEADERS });
      if (!res.ok) continue;
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const product = extractFromOFF(data.product);
        // Return if we got a real product name or at least some calorie data
        if (product.food_name !== "" || product.calories > 0) {
          return product;
        }
      }
    } catch {
      continue; // Try next endpoint if this one failed
    }
  }
  return null; // Product not found in any database
}

// ──────────────────────────────────────────────
// Main GET handler — called by the app's food search and barcode scan
// ──────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const query   = searchParams.get("query");

  try {

    // ── Barcode lookup (from the scanner tab) ──
    if (barcode) {
      const product = await lookupBarcode(barcode);
      if (product) {
        return NextResponse.json({ product });
      }
      return NextResponse.json(
        { error: `Barcode ${barcode} not found. Try searching by product name instead.` },
        { status: 404 }
      );
    }

    // ── Text search (from the search tab) ──
    if (query) {
      // Restaurant meals are a local dataset (no network) so the search is instant —
      // we run it synchronously alongside the two network calls without slowing things down.
      // Pass limit=100 so brand-name searches like "Nando's" return the full menu
      // (the searchRestaurantMeals function itself uncaps brand-match queries anyway).
      const restaurantMeals = searchRestaurantMeals(query, 100).map(extractFromRestaurant);

      // Run Open Food Facts and USDA searches in parallel for speed
      const [offProducts, usdaProducts] = await Promise.all([
        searchOFF(query),
        searchUSDA(query),
      ]);

      // Order of preference:
      //   1. Restaurant meals (McDonald's, Nando's, etc.) — usually what the user means
      //      when typing "big mac" or "nandos chicken"
      //   2. Open Food Facts — branded UK grocery products
      //   3. USDA — generic/unbranded foods (fills in anything still missing)
      //
      // Deduplication: we don't want the same item appearing twice from different
      // sources, so we track seen names and skip duplicates.
      //
      // The explicit union type is needed because each source returns a different
      // `source` literal ("restaurant" | "openfoodfacts" | "usda") — without it,
      // TypeScript narrows `combined` to the shape of `restaurantMeals` alone and
      // refuses the later `.push(...)` calls for OFF and USDA items.
      type CombinedResult =
        | ReturnType<typeof extractFromRestaurant>
        | ReturnType<typeof extractFromOFF>
        | ReturnType<typeof extractFromUSDA>;
      const combined: CombinedResult[] = [...restaurantMeals];
      const seenNames = new Set(restaurantMeals.map((p) => normaliseName(p.food_name)));

      for (const p of offProducts) {
        if (!seenNames.has(normaliseName(p.food_name))) {
          seenNames.add(normaliseName(p.food_name));
          combined.push(p);
        }
      }

      for (const p of usdaProducts) {
        if (!seenNames.has(normaliseName(p.food_name))) {
          seenNames.add(normaliseName(p.food_name));
          combined.push(p);
        }
      }

      // Cap at 60 results total. Big enough to show a full chain menu
      // (the biggest brand currently has ~50 items), small enough to
      // still feel responsive when scrolling on mobile.
      return NextResponse.json({ products: combined.slice(0, 60) });
    }

    return NextResponse.json({ error: "Provide barcode or query parameter" }, { status: 400 });

  } catch (error) {
    console.error("Food lookup error:", error);
    return NextResponse.json({ error: "Failed to look up food" }, { status: 500 });
  }
}
