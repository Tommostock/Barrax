/* ============================================
   Food Lookup API Route
   Proxies requests to Open Food Facts API to
   avoid CORS issues. Supports barcode lookup
   and text search. 100% free, no API key needed.
   ============================================ */

import { NextResponse } from "next/server";

const OFF_BASE = "https://world.openfoodfacts.org";

// Normalise nutrition data from Open Food Facts response
function extractNutrition(product: Record<string, unknown>) {
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
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  const query = searchParams.get("query");

  try {
    // Barcode lookup — returns a single product
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
        product: extractNutrition(data.product),
      });
    }

    // Text search — returns multiple products
    if (query) {
      const res = await fetch(
        `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=true&page_size=15&fields=product_name,brands,code,nutriments,serving_size,image_front_small_url`,
        { headers: { "User-Agent": "BARRAX-App/1.0" } }
      );

      if (!res.ok) {
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
      }

      const data = await res.json();
      const products = ((data.products || []) as Record<string, unknown>[])
        .filter((p) => p.product_name) // Only include products with a name
        .map(extractNutrition);

      return NextResponse.json({ products });
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
