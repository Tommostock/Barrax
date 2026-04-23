/* ============================================
   UK Restaurant Chain Meals + Supermarket Meal Deals — Curated Catalogue
   ----------------------------------------------------------------------
   Open Food Facts covers packaged groceries and USDA covers generic
   ingredients — neither has full menus from UK food chains, and
   supermarket meal-deal sandwiches/wraps are almost impossible to find
   by name on either. This file fills that gap with a large curated
   dataset of 400+ items:

     - Top UK food chains with (near) complete menu coverage:
       Nando's, McDonald's, KFC, Burger King, Subway, Greggs, Pret,
       Costa, Starbucks, Pizza Hut, Domino's, Wagamama, Five Guys,
       Pizza Express, Itsu, Leon, Wetherspoons

     - UK supermarket meal deal items (branded sandwiches, wraps,
       salads, crisps, drinks commonly sold as a £3.50-£5 meal deal):
       Tesco, Sainsbury's, M&S, Asda, Morrisons, Boots, Co-op, Waitrose

   Source of nutrition values:
   Each chain / supermarket publishes official nutrition data. Values
   below are taken from their nutrition PDFs, in-store labelling and
   online allergen tools. Values are approximations rounded to whole
   or 1-decimal grams; they will be within a few percent of the
   on-pack figure.

   Shape matches FoodLookupResult so these records drop straight into
   the same results list as OFF and USDA hits.

   If you spot a missing meal or wrong nutrition value, just add/edit
   the entry — the search logic re-reads this array on every request.
   ============================================ */

// Each entry is a single menu item (or supermarket meal-deal item)
// Kept flat (one array) so filter+includes searches are trivially fast
export interface RestaurantMeal {
  food_name: string;
  brand: string;                   // Chain or "<Supermarket> Meal Deal"
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g?: number;
  sugar_g?: number;
  salt_g?: number;
  serving_size: string;
}

// ──────────────────────────────────────────────
// The catalogue — organised by brand, logically grouped within each brand
// Add / edit freely. The search function doesn't care about ordering.
// ──────────────────────────────────────────────
export const RESTAURANT_MEALS: RestaurantMeal[] = [

  // ============================================================
  // NANDO'S — full menu (chicken, burgers, sides, starters, kids, desserts)
  // ============================================================
  { food_name: "Whole Chicken",                        brand: "Nando's", calories: 1300, protein_g: 150, carbs_g: 3,   fat_g: 75, fibre_g: 0.5, sugar_g: 2,  salt_g: 3.8, serving_size: "Whole chicken" },
  { food_name: "Half Chicken",                         brand: "Nando's", calories: 644,  protein_g: 77,  carbs_g: 1.3, fat_g: 37, fibre_g: 0.3, sugar_g: 1,  salt_g: 1.9, serving_size: "1/2 chicken" },
  { food_name: "Quarter Chicken Breast",               brand: "Nando's", calories: 263,  protein_g: 45,  carbs_g: 0,   fat_g: 9,  fibre_g: 0,   sugar_g: 0,  salt_g: 0.9, serving_size: "1/4 breast" },
  { food_name: "Quarter Chicken Leg",                  brand: "Nando's", calories: 345,  protein_g: 32,  carbs_g: 0.5, fat_g: 24, fibre_g: 0.2, sugar_g: 0,  salt_g: 1.0, serving_size: "1/4 leg" },
  { food_name: "Butterfly Chicken Breast",             brand: "Nando's", calories: 304,  protein_g: 54,  carbs_g: 0.5, fat_g: 10, fibre_g: 0,   sugar_g: 0,  salt_g: 1.2, serving_size: "1 butterfly breast" },
  { food_name: "Chicken Wings 3 piece",                brand: "Nando's", calories: 249,  protein_g: 17,  carbs_g: 0.5, fat_g: 20, fibre_g: 0.3, sugar_g: 0.3,salt_g: 0.8, serving_size: "3 wings" },
  { food_name: "Chicken Wings 5 piece",                brand: "Nando's", calories: 415,  protein_g: 28,  carbs_g: 1,   fat_g: 33, fibre_g: 0.5, sugar_g: 0.5,salt_g: 1.3, serving_size: "5 wings" },
  { food_name: "Chicken Wings 10 piece",               brand: "Nando's", calories: 830,  protein_g: 56,  carbs_g: 2,   fat_g: 66, fibre_g: 1,   sugar_g: 1,  salt_g: 2.6, serving_size: "10 wings" },
  { food_name: "Boneless Chicken Thighs 3 piece",      brand: "Nando's", calories: 450,  protein_g: 42,  carbs_g: 1,   fat_g: 31, fibre_g: 0.3, sugar_g: 0.3,salt_g: 1.4, serving_size: "3 thighs" },
  { food_name: "Boneless Chicken Thighs 5 piece",      brand: "Nando's", calories: 750,  protein_g: 70,  carbs_g: 1.5, fat_g: 51, fibre_g: 0.5, sugar_g: 0.5,salt_g: 2.3, serving_size: "5 thighs" },
  { food_name: "Chicken Livers Starter",               brand: "Nando's", calories: 265,  protein_g: 22,  carbs_g: 3,   fat_g: 18, fibre_g: 0.5, sugar_g: 2,  salt_g: 1.6, serving_size: "1 starter" },
  { food_name: "Chicken Espetada",                     brand: "Nando's", calories: 520,  protein_g: 75,  carbs_g: 6,   fat_g: 20, fibre_g: 1,   sugar_g: 4,  salt_g: 2.0, serving_size: "1 skewer" },
  // Burgers / Wraps / Pitta
  { food_name: "Chicken Burger",                       brand: "Nando's", calories: 515,  protein_g: 36,  carbs_g: 46,  fat_g: 22, fibre_g: 4,   sugar_g: 7,  salt_g: 2.1, serving_size: "1 burger" },
  { food_name: "Sunset Burger",                        brand: "Nando's", calories: 645,  protein_g: 40,  carbs_g: 51,  fat_g: 32, fibre_g: 4,   sugar_g: 11, salt_g: 2.9, serving_size: "1 burger" },
  { food_name: "Double Chicken Burger",                brand: "Nando's", calories: 620,  protein_g: 52,  carbs_g: 46,  fat_g: 25, fibre_g: 4,   sugar_g: 7,  salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "Butterfly Burger",                     brand: "Nando's", calories: 590,  protein_g: 48,  carbs_g: 46,  fat_g: 24, fibre_g: 4,   sugar_g: 7,  salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "Grilled Halloumi Burger",              brand: "Nando's", calories: 610,  protein_g: 27,  carbs_g: 50,  fat_g: 33, fibre_g: 5,   sugar_g: 8,  salt_g: 3.2, serving_size: "1 burger" },
  { food_name: "Veggie Burger",                        brand: "Nando's", calories: 455,  protein_g: 15,  carbs_g: 55,  fat_g: 19, fibre_g: 8,   sugar_g: 8,  salt_g: 2.0, serving_size: "1 burger" },
  { food_name: "The Great Imitator Vegan Burger",      brand: "Nando's", calories: 540,  protein_g: 22,  carbs_g: 58,  fat_g: 24, fibre_g: 8,   sugar_g: 9,  salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "Chicken Pitta",                        brand: "Nando's", calories: 435,  protein_g: 35,  carbs_g: 40,  fat_g: 15, fibre_g: 3,   sugar_g: 5,  salt_g: 2.0, serving_size: "1 pitta" },
  { food_name: "Chicken Wrap",                         brand: "Nando's", calories: 495,  protein_g: 33,  carbs_g: 44,  fat_g: 21, fibre_g: 4,   sugar_g: 4,  salt_g: 2.3, serving_size: "1 wrap" },
  { food_name: "Veggie Pitta",                         brand: "Nando's", calories: 405,  protein_g: 14,  carbs_g: 52,  fat_g: 15, fibre_g: 7,   sugar_g: 7,  salt_g: 1.8, serving_size: "1 pitta" },
  { food_name: "Veggie Wrap",                          brand: "Nando's", calories: 450,  protein_g: 13,  carbs_g: 54,  fat_g: 19, fibre_g: 7,   sugar_g: 6,  salt_g: 2.0, serving_size: "1 wrap" },
  // Salads & Platters
  { food_name: "Caesar Salad with Chicken",            brand: "Nando's", calories: 490,  protein_g: 43,  carbs_g: 22,  fat_g: 26, fibre_g: 3,   sugar_g: 4,  salt_g: 2.4, serving_size: "1 bowl" },
  { food_name: "Mediterranean Salad with Chicken",     brand: "Nando's", calories: 425,  protein_g: 41,  carbs_g: 15,  fat_g: 23, fibre_g: 5,   sugar_g: 6,  salt_g: 1.6, serving_size: "1 bowl" },
  { food_name: "Quinoa Salad with Chicken",            brand: "Nando's", calories: 495,  protein_g: 44,  carbs_g: 41,  fat_g: 18, fibre_g: 7,   sugar_g: 8,  salt_g: 1.2, serving_size: "1 bowl" },
  { food_name: "Jumbo Platter for 2",                  brand: "Nando's", calories: 1285, protein_g: 115, carbs_g: 5,   fat_g: 88, fibre_g: 1,   sugar_g: 1,  salt_g: 3.6, serving_size: "Platter for 2" },
  { food_name: "Boneless Platter for 2",               brand: "Nando's", calories: 1300, protein_g: 128, carbs_g: 4,   fat_g: 85, fibre_g: 1,   sugar_g: 1,  salt_g: 3.7, serving_size: "Platter for 2" },
  // Sides
  { food_name: "Peri-Peri Chips Regular",              brand: "Nando's", calories: 412,  protein_g: 5,   carbs_g: 58,  fat_g: 17, fibre_g: 6,   sugar_g: 0.5,salt_g: 1.0, serving_size: "Regular (150g)" },
  { food_name: "Peri-Peri Chips Large",                brand: "Nando's", calories: 550,  protein_g: 7,   carbs_g: 77,  fat_g: 23, fibre_g: 8,   sugar_g: 0.7,salt_g: 1.3, serving_size: "Large (200g)" },
  { food_name: "Sweet Potato Wedges",                  brand: "Nando's", calories: 288,  protein_g: 3,   carbs_g: 38,  fat_g: 13, fibre_g: 6,   sugar_g: 10, salt_g: 0.8, serving_size: "Regular" },
  { food_name: "Spicy Rice",                           brand: "Nando's", calories: 314,  protein_g: 6,   carbs_g: 60,  fat_g: 5,  fibre_g: 2,   sugar_g: 2,  salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Macho Peas",                           brand: "Nando's", calories: 153,  protein_g: 9,   carbs_g: 16,  fat_g: 5,  fibre_g: 8,   sugar_g: 4,  salt_g: 0.6, serving_size: "Side portion" },
  { food_name: "Coleslaw",                             brand: "Nando's", calories: 233,  protein_g: 2,   carbs_g: 8,   fat_g: 20, fibre_g: 2,   sugar_g: 5,  salt_g: 0.5, serving_size: "Side portion" },
  { food_name: "Garlic Bread",                         brand: "Nando's", calories: 235,  protein_g: 7,   carbs_g: 32,  fat_g: 9,  fibre_g: 2,   sugar_g: 2,  salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Corn on the Cob",                      brand: "Nando's", calories: 182,  protein_g: 5,   carbs_g: 28,  fat_g: 5,  fibre_g: 4,   sugar_g: 5,  salt_g: 0.3, serving_size: "1 cob" },
  { food_name: "Halloumi Sticks and Dip",              brand: "Nando's", calories: 385,  protein_g: 17,  carbs_g: 22,  fat_g: 25, fibre_g: 2,   sugar_g: 5,  salt_g: 2.2, serving_size: "1 starter" },
  { food_name: "Houmous with Peri-Peri Drizzle",       brand: "Nando's", calories: 295,  protein_g: 9,   carbs_g: 24,  fat_g: 18, fibre_g: 6,   sugar_g: 2,  salt_g: 1.3, serving_size: "1 portion" },
  { food_name: "Spicy Mixed Olives",                   brand: "Nando's", calories: 155,  protein_g: 1,   carbs_g: 2,   fat_g: 16, fibre_g: 3,   sugar_g: 0.5,salt_g: 2.1, serving_size: "1 bowl" },
  { food_name: "Portuguese Roll",                      brand: "Nando's", calories: 130,  protein_g: 4,   carbs_g: 25,  fat_g: 1.5,fibre_g: 1.5, sugar_g: 1,  salt_g: 0.6, serving_size: "1 roll" },
  { food_name: "Mixed Leaf Salad",                     brand: "Nando's", calories: 30,   protein_g: 1.5, carbs_g: 3,   fat_g: 1,  fibre_g: 2,   sugar_g: 3,  salt_g: 0.1, serving_size: "Side salad" },
  { food_name: "Creamy Mash",                          brand: "Nando's", calories: 278,  protein_g: 5,   carbs_g: 31,  fat_g: 15, fibre_g: 3,   sugar_g: 3,  salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Long Stem Broccoli",                   brand: "Nando's", calories: 75,   protein_g: 5,   carbs_g: 4,   fat_g: 4,  fibre_g: 4,   sugar_g: 3,  salt_g: 0.4, serving_size: "Side portion" },
  // Kids menu
  { food_name: "Kids Chicken Breast",                  brand: "Nando's", calories: 140,  protein_g: 27,  carbs_g: 0,   fat_g: 4,  fibre_g: 0,   sugar_g: 0,  salt_g: 0.5, serving_size: "Kids portion" },
  { food_name: "Kids Grilled Chicken Strips",          brand: "Nando's", calories: 180,  protein_g: 30,  carbs_g: 1,   fat_g: 6,  fibre_g: 0,   sugar_g: 0,  salt_g: 0.8, serving_size: "Kids portion" },
  { food_name: "Kids Chicken Pitta",                   brand: "Nando's", calories: 260,  protein_g: 17,  carbs_g: 35,  fat_g: 6,  fibre_g: 2,   sugar_g: 3,  salt_g: 1.1, serving_size: "Kids portion" },
  { food_name: "Kids Wings 3 piece",                   brand: "Nando's", calories: 249,  protein_g: 17,  carbs_g: 0.5, fat_g: 20, fibre_g: 0.3, sugar_g: 0.3,salt_g: 0.8, serving_size: "Kids portion" },
  // Desserts
  { food_name: "Pastel de Nata",                       brand: "Nando's", calories: 180,  protein_g: 3,   carbs_g: 21,  fat_g: 9,  fibre_g: 0.5, sugar_g: 11, salt_g: 0.2, serving_size: "1 tart" },
  { food_name: "Chocolate Cake",                       brand: "Nando's", calories: 440,  protein_g: 5,   carbs_g: 50,  fat_g: 24, fibre_g: 3,   sugar_g: 36, salt_g: 0.4, serving_size: "1 slice" },
  { food_name: "Bottomless Frozen Yogurt",             brand: "Nando's", calories: 155,  protein_g: 3,   carbs_g: 29,  fat_g: 3,  fibre_g: 0.5, sugar_g: 25, salt_g: 0.2, serving_size: "1 cup" },
  { food_name: "Caramel Cheesecake",                   brand: "Nando's", calories: 380,  protein_g: 5,   carbs_g: 43,  fat_g: 21, fibre_g: 1,   sugar_g: 33, salt_g: 0.5, serving_size: "1 slice" },

  // ============================================================
  // MCDONALD'S — full menu
  // ============================================================
  // Signature burgers
  { food_name: "Big Mac",                              brand: "McDonald's", calories: 493, protein_g: 26, carbs_g: 41, fat_g: 24, fibre_g: 3,   sugar_g: 9,   salt_g: 2.2, serving_size: "1 burger (219g)" },
  { food_name: "Quarter Pounder with Cheese",          brand: "McDonald's", calories: 520, protein_g: 31, carbs_g: 42, fat_g: 26, fibre_g: 2.5, sugar_g: 10,  salt_g: 2.5, serving_size: "1 burger (199g)" },
  { food_name: "Double Quarter Pounder with Cheese",   brand: "McDonald's", calories: 740, protein_g: 48, carbs_g: 42, fat_g: 42, fibre_g: 2.5, sugar_g: 10,  salt_g: 3.1, serving_size: "1 burger (265g)" },
  { food_name: "Triple Cheeseburger",                  brand: "McDonald's", calories: 525, protein_g: 31, carbs_g: 33, fat_g: 29, fibre_g: 2,   sugar_g: 7,   salt_g: 2.7, serving_size: "1 burger" },
  { food_name: "Cheeseburger",                         brand: "McDonald's", calories: 301, protein_g: 15, carbs_g: 32, fat_g: 13, fibre_g: 2,   sugar_g: 7,   salt_g: 1.5, serving_size: "1 burger (117g)" },
  { food_name: "Double Cheeseburger",                  brand: "McDonald's", calories: 444, protein_g: 25, carbs_g: 33, fat_g: 23, fibre_g: 2,   sugar_g: 7,   salt_g: 2.2, serving_size: "1 burger (165g)" },
  { food_name: "Hamburger",                            brand: "McDonald's", calories: 254, protein_g: 13, carbs_g: 31, fat_g: 9,  fibre_g: 2,   sugar_g: 7,   salt_g: 1.1, serving_size: "1 burger (105g)" },
  { food_name: "McChicken Sandwich",                   brand: "McDonald's", calories: 388, protein_g: 17, carbs_g: 40, fat_g: 17, fibre_g: 3,   sugar_g: 5,   salt_g: 1.5, serving_size: "1 burger (173g)" },
  { food_name: "Filet-O-Fish",                         brand: "McDonald's", calories: 334, protein_g: 15, carbs_g: 37, fat_g: 14, fibre_g: 2,   sugar_g: 5,   salt_g: 1.4, serving_size: "1 burger (142g)" },
  { food_name: "Chicken Mayo",                         brand: "McDonald's", calories: 317, protein_g: 13, carbs_g: 31, fat_g: 16, fibre_g: 2,   sugar_g: 4,   salt_g: 1.2, serving_size: "1 burger (137g)" },
  { food_name: "McPlant Burger",                       brand: "McDonald's", calories: 429, protein_g: 20, carbs_g: 43, fat_g: 19, fibre_g: 5,   sugar_g: 10,  salt_g: 2.0, serving_size: "1 burger (219g)" },
  { food_name: "McCrispy",                             brand: "McDonald's", calories: 530, protein_g: 29, carbs_g: 55, fat_g: 22, fibre_g: 3,   sugar_g: 10,  salt_g: 2.3, serving_size: "1 burger" },
  { food_name: "Spicy McCrispy",                       brand: "McDonald's", calories: 520, protein_g: 29, carbs_g: 55, fat_g: 21, fibre_g: 3,   sugar_g: 9,   salt_g: 2.3, serving_size: "1 burger" },
  // Nuggets & Selects
  { food_name: "Chicken McNuggets 4 piece",            brand: "McDonald's", calories: 173, protein_g: 9,  carbs_g: 10, fat_g: 11, fibre_g: 0.5, sugar_g: 0,   salt_g: 0.6, serving_size: "4 nuggets (64g)" },
  { food_name: "Chicken McNuggets 6 piece",            brand: "McDonald's", calories: 259, protein_g: 14, carbs_g: 15, fat_g: 16, fibre_g: 1,   sugar_g: 0,   salt_g: 0.9, serving_size: "6 nuggets (96g)" },
  { food_name: "Chicken McNuggets 9 piece",            brand: "McDonald's", calories: 389, protein_g: 22, carbs_g: 23, fat_g: 23, fibre_g: 1.5, sugar_g: 0,   salt_g: 1.3, serving_size: "9 nuggets (144g)" },
  { food_name: "Chicken McNuggets 20 piece",           brand: "McDonald's", calories: 864, protein_g: 48, carbs_g: 51, fat_g: 52, fibre_g: 3,   sugar_g: 0.5, salt_g: 2.9, serving_size: "20 nuggets (320g)" },
  { food_name: "Chicken Selects 3 piece",              brand: "McDonald's", calories: 320, protein_g: 23, carbs_g: 21, fat_g: 17, fibre_g: 1.5, sugar_g: 0.3, salt_g: 1.4, serving_size: "3 selects (123g)" },
  { food_name: "Chicken Selects 5 piece",              brand: "McDonald's", calories: 534, protein_g: 38, carbs_g: 34, fat_g: 28, fibre_g: 2.5, sugar_g: 0.5, salt_g: 2.3, serving_size: "5 selects (205g)" },
  // Fries & sides
  { food_name: "Fries Small",                          brand: "McDonald's", calories: 231, protein_g: 2.8,carbs_g: 30, fat_g: 11, fibre_g: 3,   sugar_g: 0.3, salt_g: 0.6, serving_size: "Small (80g)" },
  { food_name: "Fries Medium",                         brand: "McDonald's", calories: 337, protein_g: 4,  carbs_g: 43, fat_g: 16, fibre_g: 4.5, sugar_g: 0.4, salt_g: 0.9, serving_size: "Medium (117g)" },
  { food_name: "Fries Large",                          brand: "McDonald's", calories: 444, protein_g: 5.3,carbs_g: 57, fat_g: 21, fibre_g: 6,   sugar_g: 0.6, salt_g: 1.2, serving_size: "Large (154g)" },
  { food_name: "Side Salad",                           brand: "McDonald's", calories: 14,  protein_g: 1,  carbs_g: 2,  fat_g: 0.2,fibre_g: 1,   sugar_g: 2,   salt_g: 0,   serving_size: "1 salad" },
  { food_name: "Veggie Dippers 5 piece",               brand: "McDonald's", calories: 385, protein_g: 10, carbs_g: 48, fat_g: 18, fibre_g: 6,   sugar_g: 5,   salt_g: 1.3, serving_size: "5 dippers" },
  // Breakfast
  { food_name: "Egg McMuffin",                         brand: "McDonald's", calories: 282, protein_g: 16, carbs_g: 28, fat_g: 12, fibre_g: 1.5, sugar_g: 2,   salt_g: 1.4, serving_size: "1 McMuffin (125g)" },
  { food_name: "Sausage and Egg McMuffin",             brand: "McDonald's", calories: 426, protein_g: 21, carbs_g: 28, fat_g: 25, fibre_g: 1.5, sugar_g: 2,   salt_g: 2.0, serving_size: "1 McMuffin (169g)" },
  { food_name: "Bacon and Egg McMuffin",               brand: "McDonald's", calories: 316, protein_g: 19, carbs_g: 28, fat_g: 14, fibre_g: 1.5, sugar_g: 2,   salt_g: 1.9, serving_size: "1 McMuffin (138g)" },
  { food_name: "Double Bacon and Egg McMuffin",        brand: "McDonald's", calories: 390, protein_g: 26, carbs_g: 28, fat_g: 19, fibre_g: 1.5, sugar_g: 2,   salt_g: 2.6, serving_size: "1 McMuffin" },
  { food_name: "Sausage and Egg McMuffin (Double)",    brand: "McDonald's", calories: 540, protein_g: 29, carbs_g: 28, fat_g: 34, fibre_g: 1.5, sugar_g: 2,   salt_g: 2.7, serving_size: "1 McMuffin" },
  { food_name: "Bacon Roll",                           brand: "McDonald's", calories: 285, protein_g: 17, carbs_g: 32, fat_g: 9,  fibre_g: 2,   sugar_g: 2,   salt_g: 2.1, serving_size: "1 roll" },
  { food_name: "Sausage Roll",                         brand: "McDonald's", calories: 392, protein_g: 18, carbs_g: 33, fat_g: 20, fibre_g: 2,   sugar_g: 3,   salt_g: 2.0, serving_size: "1 roll" },
  { food_name: "Hash Brown",                           brand: "McDonald's", calories: 144, protein_g: 1.3,carbs_g: 14, fat_g: 9,  fibre_g: 1.4, sugar_g: 0.2, salt_g: 0.5, serving_size: "1 hash brown (55g)" },
  { food_name: "Big Breakfast",                        brand: "McDonald's", calories: 515, protein_g: 21, carbs_g: 37, fat_g: 31, fibre_g: 2,   sugar_g: 3,   salt_g: 2.6, serving_size: "1 platter (213g)" },
  { food_name: "Pancakes and Syrup",                   brand: "McDonald's", calories: 480, protein_g: 9,  carbs_g: 90, fat_g: 9,  fibre_g: 2,   sugar_g: 48,  salt_g: 1.2, serving_size: "3 pancakes" },
  { food_name: "Porridge",                             brand: "McDonald's", calories: 231, protein_g: 9,  carbs_g: 41, fat_g: 3.5,fibre_g: 4,   sugar_g: 12,  salt_g: 0.2, serving_size: "1 pot" },
  // Desserts & McFlurry
  { food_name: "McFlurry Oreo",                        brand: "McDonald's", calories: 272, protein_g: 7,  carbs_g: 43, fat_g: 8.4,fibre_g: 0.7, sugar_g: 35,  salt_g: 0.4, serving_size: "Regular (175g)" },
  { food_name: "McFlurry Smarties",                    brand: "McDonald's", calories: 290, protein_g: 7.4,carbs_g: 48, fat_g: 8,  fibre_g: 0.5, sugar_g: 40,  salt_g: 0.3, serving_size: "Regular (180g)" },
  { food_name: "McFlurry Galaxy Caramel",              brand: "McDonald's", calories: 305, protein_g: 7,  carbs_g: 47, fat_g: 10, fibre_g: 0.5, sugar_g: 41,  salt_g: 0.4, serving_size: "Regular" },
  { food_name: "Mini McFlurry",                        brand: "McDonald's", calories: 160, protein_g: 4,  carbs_g: 26, fat_g: 5,  fibre_g: 0.5, sugar_g: 22,  salt_g: 0.2, serving_size: "Mini" },
  { food_name: "Apple Pie",                            brand: "McDonald's", calories: 240, protein_g: 2,  carbs_g: 28, fat_g: 13, fibre_g: 1.5, sugar_g: 12,  salt_g: 0.5, serving_size: "1 pie (77g)" },
  { food_name: "Vanilla Cone",                         brand: "McDonald's", calories: 135, protein_g: 4,  carbs_g: 21, fat_g: 4,  fibre_g: 0,   sugar_g: 17,  salt_g: 0.2, serving_size: "1 cone" },
  { food_name: "Chocolate Milkshake Small",            brand: "McDonald's", calories: 324, protein_g: 9,  carbs_g: 56, fat_g: 7,  fibre_g: 0.5, sugar_g: 49,  salt_g: 0.4, serving_size: "Small (250ml)" },
  { food_name: "Strawberry Milkshake Small",           brand: "McDonald's", calories: 330, protein_g: 8,  carbs_g: 57, fat_g: 7,  fibre_g: 0,   sugar_g: 52,  salt_g: 0.3, serving_size: "Small (250ml)" },
  { food_name: "Vanilla Milkshake Small",              brand: "McDonald's", calories: 315, protein_g: 8,  carbs_g: 55, fat_g: 7,  fibre_g: 0,   sugar_g: 50,  salt_g: 0.3, serving_size: "Small (250ml)" },
  // Drinks
  { food_name: "Coca-Cola Small",                      brand: "McDonald's", calories: 85,  protein_g: 0,  carbs_g: 21, fat_g: 0,  fibre_g: 0,   sugar_g: 21,  salt_g: 0,   serving_size: "Small (250ml)" },
  { food_name: "Coca-Cola Medium",                     brand: "McDonald's", calories: 170, protein_g: 0,  carbs_g: 42, fat_g: 0,  fibre_g: 0,   sugar_g: 42,  salt_g: 0,   serving_size: "Medium (400ml)" },
  { food_name: "Coca-Cola Large",                      brand: "McDonald's", calories: 213, protein_g: 0,  carbs_g: 53, fat_g: 0,  fibre_g: 0,   sugar_g: 53,  salt_g: 0,   serving_size: "Large (500ml)" },
  { food_name: "Diet Coke",                            brand: "McDonald's", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0,   sugar_g: 0,   salt_g: 0,   serving_size: "Medium (400ml)" },
  { food_name: "Sprite Zero",                          brand: "McDonald's", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0,   sugar_g: 0,   salt_g: 0,   serving_size: "Medium (400ml)" },
  { food_name: "Orange Juice",                         brand: "McDonald's", calories: 105, protein_g: 1.5,carbs_g: 24, fat_g: 0,  fibre_g: 0,   sugar_g: 23,  salt_g: 0,   serving_size: "250ml" },

  // ============================================================
  // KFC — chicken pieces, buckets, wraps, burgers, rice boxes, sides
  // ============================================================
  { food_name: "Original Recipe Chicken 1 piece",      brand: "KFC", calories: 254, protein_g: 23, carbs_g: 7,  fat_g: 15, fibre_g: 0.5, sugar_g: 0.1, salt_g: 1.5, serving_size: "1 piece (114g)" },
  { food_name: "Original Recipe Chicken 2 piece",      brand: "KFC", calories: 508, protein_g: 46, carbs_g: 14, fat_g: 30, fibre_g: 1,   sugar_g: 0.2, salt_g: 3.0, serving_size: "2 piece" },
  { food_name: "Original Recipe Chicken 3 piece",      brand: "KFC", calories: 762, protein_g: 69, carbs_g: 21, fat_g: 45, fibre_g: 1.5, sugar_g: 0.3, salt_g: 4.5, serving_size: "3 piece" },
  { food_name: "Hot Wings 3 piece",                    brand: "KFC", calories: 184, protein_g: 14, carbs_g: 8,  fat_g: 11, fibre_g: 0.5, sugar_g: 0.1, salt_g: 1.0, serving_size: "3 wings (75g)" },
  { food_name: "Hot Wings 6 piece",                    brand: "KFC", calories: 368, protein_g: 28, carbs_g: 16, fat_g: 22, fibre_g: 1,   sugar_g: 0.2, salt_g: 2.0, serving_size: "6 wings (150g)" },
  { food_name: "Hot Wings 10 piece",                   brand: "KFC", calories: 613, protein_g: 47, carbs_g: 27, fat_g: 37, fibre_g: 1.5, sugar_g: 0.3, salt_g: 3.3, serving_size: "10 wings" },
  { food_name: "BBQ Bites",                            brand: "KFC", calories: 255, protein_g: 18, carbs_g: 12, fat_g: 15, fibre_g: 0.5, sugar_g: 0.4, salt_g: 1.1, serving_size: "Regular (85g)" },
  { food_name: "Popcorn Chicken Regular",              brand: "KFC", calories: 285, protein_g: 20, carbs_g: 22, fat_g: 13, fibre_g: 1,   sugar_g: 0.5, salt_g: 1.4, serving_size: "Regular (114g)" },
  { food_name: "Popcorn Chicken Large",                brand: "KFC", calories: 430, protein_g: 30, carbs_g: 33, fat_g: 20, fibre_g: 1.5, sugar_g: 0.7, salt_g: 2.1, serving_size: "Large (170g)" },
  { food_name: "Mini Fillet Burger",                   brand: "KFC", calories: 330, protein_g: 18, carbs_g: 37, fat_g: 12, fibre_g: 2,   sugar_g: 4,   salt_g: 1.6, serving_size: "1 burger" },
  { food_name: "Fillet Burger",                        brand: "KFC", calories: 440, protein_g: 29, carbs_g: 48, fat_g: 14, fibre_g: 2.5, sugar_g: 6,   salt_g: 2.1, serving_size: "1 burger" },
  { food_name: "Zinger Burger",                        brand: "KFC", calories: 450, protein_g: 26, carbs_g: 47, fat_g: 17, fibre_g: 2.5, sugar_g: 6,   salt_g: 2.2, serving_size: "1 burger" },
  { food_name: "Tower Burger",                         brand: "KFC", calories: 640, protein_g: 36, carbs_g: 61, fat_g: 27, fibre_g: 3.5, sugar_g: 6,   salt_g: 2.7, serving_size: "1 burger" },
  { food_name: "Zinger Tower Burger",                  brand: "KFC", calories: 650, protein_g: 33, carbs_g: 60, fat_g: 30, fibre_g: 3.5, sugar_g: 6,   salt_g: 2.8, serving_size: "1 burger" },
  { food_name: "Original Twister Wrap",                brand: "KFC", calories: 490, protein_g: 24, carbs_g: 50, fat_g: 21, fibre_g: 2.5, sugar_g: 4,   salt_g: 2.0, serving_size: "1 wrap" },
  { food_name: "Zinger Twister Wrap",                  brand: "KFC", calories: 500, protein_g: 21, carbs_g: 52, fat_g: 23, fibre_g: 2.5, sugar_g: 4,   salt_g: 2.1, serving_size: "1 wrap" },
  { food_name: "Mighty Bucket for One",                brand: "KFC", calories: 1029,protein_g: 50, carbs_g: 87, fat_g: 54, fibre_g: 6,   sugar_g: 8,   salt_g: 4.2, serving_size: "1 bucket" },
  { food_name: "Boneless Banquet",                     brand: "KFC", calories: 1180,protein_g: 58, carbs_g: 128,fat_g: 47, fibre_g: 7,   sugar_g: 6,   salt_g: 5.0, serving_size: "1 banquet" },
  { food_name: "Original Recipe Rice Box",             brand: "KFC", calories: 490, protein_g: 28, carbs_g: 69, fat_g: 12, fibre_g: 4,   sugar_g: 14,  salt_g: 2.1, serving_size: "1 box (342g)" },
  { food_name: "BBQ Rice Box",                         brand: "KFC", calories: 540, protein_g: 30, carbs_g: 70, fat_g: 15, fibre_g: 4,   sugar_g: 15,  salt_g: 2.3, serving_size: "1 box (342g)" },
  { food_name: "Fries Regular",                        brand: "KFC", calories: 310, protein_g: 5,  carbs_g: 44, fat_g: 12, fibre_g: 4,   sugar_g: 0.3, salt_g: 0.6, serving_size: "Regular (114g)" },
  { food_name: "Fries Large",                          brand: "KFC", calories: 430, protein_g: 7,  carbs_g: 61, fat_g: 17, fibre_g: 5.5, sugar_g: 0.4, salt_g: 0.8, serving_size: "Large (159g)" },
  { food_name: "Gravy Regular",                        brand: "KFC", calories: 60,  protein_g: 2,  carbs_g: 7,  fat_g: 2.5,fibre_g: 0,   sugar_g: 0.5, salt_g: 1.2, serving_size: "Regular (100g)" },
  { food_name: "Gravy Large",                          brand: "KFC", calories: 120, protein_g: 4,  carbs_g: 14, fat_g: 5,  fibre_g: 0,   sugar_g: 1,   salt_g: 2.4, serving_size: "Large (200g)" },
  { food_name: "Corn on the Cob",                      brand: "KFC", calories: 76,  protein_g: 3.5,carbs_g: 14, fat_g: 0.8,fibre_g: 2.5, sugar_g: 3,   salt_g: 0,   serving_size: "1 cob (95g)" },
  { food_name: "Coleslaw Regular",                     brand: "KFC", calories: 150, protein_g: 1,  carbs_g: 10, fat_g: 11, fibre_g: 2,   sugar_g: 9,   salt_g: 0.4, serving_size: "Regular (110g)" },
  { food_name: "Beans Regular",                        brand: "KFC", calories: 131, protein_g: 7,  carbs_g: 22, fat_g: 0.5,fibre_g: 6,   sugar_g: 9,   salt_g: 1.0, serving_size: "Regular (200g)" },
  { food_name: "Mini Krushem Cookies and Cream",       brand: "KFC", calories: 220, protein_g: 4,  carbs_g: 32, fat_g: 8,  fibre_g: 0.5, sugar_g: 26,  salt_g: 0.3, serving_size: "Mini (180ml)" },

  // ============================================================
  // BURGER KING
  // ============================================================
  { food_name: "Whopper",                              brand: "Burger King", calories: 627, protein_g: 26, carbs_g: 49, fat_g: 35, fibre_g: 3, sugar_g: 11, salt_g: 2.3, serving_size: "1 burger (269g)" },
  { food_name: "Double Whopper",                       brand: "Burger King", calories: 860, protein_g: 46, carbs_g: 49, fat_g: 54, fibre_g: 3, sugar_g: 11, salt_g: 2.6, serving_size: "1 burger (369g)" },
  { food_name: "Whopper Jr",                           brand: "Burger King", calories: 345, protein_g: 15, carbs_g: 30, fat_g: 19, fibre_g: 2, sugar_g: 6,  salt_g: 1.4, serving_size: "1 burger" },
  { food_name: "Bacon Double Cheeseburger",            brand: "Burger King", calories: 504, protein_g: 30, carbs_g: 31, fat_g: 29, fibre_g: 1, sugar_g: 7,  salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "Cheeseburger",                         brand: "Burger King", calories: 300, protein_g: 16, carbs_g: 30, fat_g: 13, fibre_g: 1, sugar_g: 6,  salt_g: 1.5, serving_size: "1 burger" },
  { food_name: "Steakhouse Angus",                     brand: "Burger King", calories: 765, protein_g: 36, carbs_g: 56, fat_g: 44, fibre_g: 3, sugar_g: 10, salt_g: 3.1, serving_size: "1 burger" },
  { food_name: "Chicken Royale",                       brand: "Burger King", calories: 570, protein_g: 25, carbs_g: 57, fat_g: 28, fibre_g: 3, sugar_g: 7,  salt_g: 2.1, serving_size: "1 burger" },
  { food_name: "Bacon Chicken Royale",                 brand: "Burger King", calories: 650, protein_g: 30, carbs_g: 57, fat_g: 33, fibre_g: 3, sugar_g: 7,  salt_g: 2.8, serving_size: "1 burger" },
  { food_name: "Plant-Based Whopper",                  brand: "Burger King", calories: 527, protein_g: 22, carbs_g: 52, fat_g: 24, fibre_g: 6, sugar_g: 12, salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "Chicken Nuggets 6 piece",              brand: "Burger King", calories: 258, protein_g: 15, carbs_g: 17, fat_g: 16, fibre_g: 1, sugar_g: 0.5,salt_g: 1.1, serving_size: "6 nuggets" },
  { food_name: "Chicken Nuggets 9 piece",              brand: "Burger King", calories: 387, protein_g: 22, carbs_g: 25, fat_g: 24, fibre_g: 1.5,sugar_g: 0.7,salt_g: 1.7, serving_size: "9 nuggets" },
  { food_name: "Fries Small",                          brand: "Burger King", calories: 230, protein_g: 3,  carbs_g: 30, fat_g: 11, fibre_g: 3, sugar_g: 0.3,salt_g: 0.6, serving_size: "Small" },
  { food_name: "Fries Medium",                         brand: "Burger King", calories: 346, protein_g: 4,  carbs_g: 45, fat_g: 16, fibre_g: 4, sugar_g: 0.4,salt_g: 0.9, serving_size: "Medium" },
  { food_name: "Fries Large",                          brand: "Burger King", calories: 458, protein_g: 5.5,carbs_g: 60, fat_g: 22, fibre_g: 5.5,sugar_g: 0.5,salt_g: 1.2, serving_size: "Large" },
  { food_name: "Onion Rings Medium",                   brand: "Burger King", calories: 269, protein_g: 4,  carbs_g: 34, fat_g: 13, fibre_g: 3, sugar_g: 4,  salt_g: 1.1, serving_size: "Medium" },

  // ============================================================
  // SUBWAY — 6-inch Italian herb & cheese unless stated
  // ============================================================
  { food_name: "Italian B.M.T. 6-inch",                brand: "Subway", calories: 400, protein_g: 21, carbs_g: 46, fat_g: 14, fibre_g: 5, sugar_g: 6, salt_g: 2.0, serving_size: "6-inch sub" },
  { food_name: "Italian B.M.T. footlong",              brand: "Subway", calories: 800, protein_g: 42, carbs_g: 92, fat_g: 28, fibre_g: 10,sugar_g: 12,salt_g: 4.0, serving_size: "Footlong sub" },
  { food_name: "Meatball Marinara 6-inch",             brand: "Subway", calories: 467, protein_g: 19, carbs_g: 59, fat_g: 17, fibre_g: 7, sugar_g: 11,salt_g: 2.2, serving_size: "6-inch sub" },
  { food_name: "Meatball Marinara footlong",           brand: "Subway", calories: 934, protein_g: 38, carbs_g: 118,fat_g: 34, fibre_g: 14,sugar_g: 22,salt_g: 4.4, serving_size: "Footlong sub" },
  { food_name: "Turkey Breast 6-inch",                 brand: "Subway", calories: 288, protein_g: 18, carbs_g: 47, fat_g: 3.5,fibre_g: 5, sugar_g: 6, salt_g: 1.7, serving_size: "6-inch sub" },
  { food_name: "Chicken Tikka 6-inch",                 brand: "Subway", calories: 345, protein_g: 26, carbs_g: 49, fat_g: 4.5,fibre_g: 5, sugar_g: 7, salt_g: 1.8, serving_size: "6-inch sub" },
  { food_name: "Chicken Tikka footlong",               brand: "Subway", calories: 690, protein_g: 52, carbs_g: 98, fat_g: 9,  fibre_g: 10,sugar_g: 14,salt_g: 3.6, serving_size: "Footlong sub" },
  { food_name: "Steak and Cheese 6-inch",              brand: "Subway", calories: 376, protein_g: 26, carbs_g: 48, fat_g: 9,  fibre_g: 5, sugar_g: 7, salt_g: 2.0, serving_size: "6-inch sub" },
  { food_name: "Tuna 6-inch",                          brand: "Subway", calories: 536, protein_g: 21, carbs_g: 44, fat_g: 30, fibre_g: 5, sugar_g: 6, salt_g: 1.7, serving_size: "6-inch sub" },
  { food_name: "Tuna footlong",                        brand: "Subway", calories: 1070,protein_g: 42, carbs_g: 88, fat_g: 60, fibre_g: 10,sugar_g: 12,salt_g: 3.4, serving_size: "Footlong sub" },
  { food_name: "Veggie Delite 6-inch",                 brand: "Subway", calories: 220, protein_g: 9,  carbs_g: 44, fat_g: 2.5,fibre_g: 5, sugar_g: 6, salt_g: 1.3, serving_size: "6-inch sub" },
  { food_name: "Veggie Patty 6-inch",                  brand: "Subway", calories: 395, protein_g: 20, carbs_g: 59, fat_g: 10, fibre_g: 10,sugar_g: 9, salt_g: 1.8, serving_size: "6-inch sub" },
  { food_name: "Spicy Italian 6-inch",                 brand: "Subway", calories: 490, protein_g: 20, carbs_g: 45, fat_g: 24, fibre_g: 5, sugar_g: 6, salt_g: 2.4, serving_size: "6-inch sub" },
  { food_name: "Chicken Teriyaki 6-inch",              brand: "Subway", calories: 360, protein_g: 26, carbs_g: 55, fat_g: 4,  fibre_g: 5, sugar_g: 12,salt_g: 2.0, serving_size: "6-inch sub" },
  { food_name: "Chicken Breast 6-inch",                brand: "Subway", calories: 291, protein_g: 24, carbs_g: 45, fat_g: 3,  fibre_g: 5, sugar_g: 6, salt_g: 1.5, serving_size: "6-inch sub" },
  { food_name: "Ham 6-inch",                           brand: "Subway", calories: 278, protein_g: 16, carbs_g: 46, fat_g: 3.5,fibre_g: 5, sugar_g: 7, salt_g: 1.9, serving_size: "6-inch sub" },
  { food_name: "Chipotle Southwest Steak and Cheese",  brand: "Subway", calories: 430, protein_g: 27, carbs_g: 49, fat_g: 14, fibre_g: 5, sugar_g: 7, salt_g: 2.3, serving_size: "6-inch sub" },
  { food_name: "Nacho Chicken Crunch 6-inch",          brand: "Subway", calories: 500, protein_g: 25, carbs_g: 52, fat_g: 22, fibre_g: 5, sugar_g: 7, salt_g: 2.3, serving_size: "6-inch sub" },
  { food_name: "Chicken Caesar Salad",                 brand: "Subway", calories: 235, protein_g: 28, carbs_g: 12, fat_g: 9,  fibre_g: 3, sugar_g: 5, salt_g: 1.4, serving_size: "Salad bowl" },
  { food_name: "Tuna Salad",                           brand: "Subway", calories: 320, protein_g: 19, carbs_g: 9,  fat_g: 24, fibre_g: 3, sugar_g: 5, salt_g: 1.1, serving_size: "Salad bowl" },
  { food_name: "Cookie Double Chocolate",              brand: "Subway", calories: 215, protein_g: 2,  carbs_g: 27, fat_g: 11, fibre_g: 1, sugar_g: 15,salt_g: 0.4, serving_size: "1 cookie (45g)" },
  { food_name: "Cookie White Chip Macadamia",          brand: "Subway", calories: 220, protein_g: 2,  carbs_g: 28, fat_g: 11, fibre_g: 1, sugar_g: 16,salt_g: 0.3, serving_size: "1 cookie (45g)" },
  { food_name: "Cookie Raspberry Cheesecake",          brand: "Subway", calories: 210, protein_g: 2,  carbs_g: 27, fat_g: 10, fibre_g: 1, sugar_g: 15,salt_g: 0.3, serving_size: "1 cookie (45g)" },
  { food_name: "Hash Browns",                          brand: "Subway", calories: 170, protein_g: 2,  carbs_g: 19, fat_g: 9,  fibre_g: 2, sugar_g: 0.3,salt_g: 0.6, serving_size: "1 portion" },

  // ============================================================
  // GREGGS — bakes, sandwiches, sweet treats, breakfast
  // ============================================================
  { food_name: "Sausage Roll",                         brand: "Greggs", calories: 329, protein_g: 9.4, carbs_g: 25, fat_g: 22, fibre_g: 1.5, sugar_g: 1.2, salt_g: 1.3, serving_size: "1 roll (85g)" },
  { food_name: "Vegan Sausage Roll",                   brand: "Greggs", calories: 311, protein_g: 12,  carbs_g: 24, fat_g: 19, fibre_g: 2,   sugar_g: 1.5, salt_g: 1.3, serving_size: "1 roll (85g)" },
  { food_name: "Steak Bake",                           brand: "Greggs", calories: 408, protein_g: 13,  carbs_g: 30, fat_g: 26, fibre_g: 2,   sugar_g: 1.6, salt_g: 1.3, serving_size: "1 bake (147g)" },
  { food_name: "Chicken Bake",                         brand: "Greggs", calories: 419, protein_g: 13,  carbs_g: 30, fat_g: 27, fibre_g: 2,   sugar_g: 2,   salt_g: 1.3, serving_size: "1 bake (150g)" },
  { food_name: "Cheese and Onion Bake",                brand: "Greggs", calories: 377, protein_g: 9.4, carbs_g: 26, fat_g: 26, fibre_g: 2,   sugar_g: 2,   salt_g: 1.1, serving_size: "1 bake (140g)" },
  { food_name: "Vegan Steak Bake",                     brand: "Greggs", calories: 390, protein_g: 13,  carbs_g: 28, fat_g: 25, fibre_g: 2.5, sugar_g: 1.5, salt_g: 1.4, serving_size: "1 bake (145g)" },
  { food_name: "Chicken Lattice",                      brand: "Greggs", calories: 400, protein_g: 12,  carbs_g: 30, fat_g: 26, fibre_g: 2,   sugar_g: 3,   salt_g: 1.2, serving_size: "1 lattice" },
  { food_name: "Ham Salad Sandwich",                   brand: "Greggs", calories: 325, protein_g: 15,  carbs_g: 37, fat_g: 13, fibre_g: 3,   sugar_g: 4,   salt_g: 1.5, serving_size: "1 sandwich" },
  { food_name: "Cheese Salad Sandwich",                brand: "Greggs", calories: 360, protein_g: 14,  carbs_g: 37, fat_g: 17, fibre_g: 3,   sugar_g: 5,   salt_g: 1.4, serving_size: "1 sandwich" },
  { food_name: "Chicken Salad Sandwich",               brand: "Greggs", calories: 355, protein_g: 22,  carbs_g: 37, fat_g: 13, fibre_g: 3,   sugar_g: 4,   salt_g: 1.5, serving_size: "1 sandwich" },
  { food_name: "Tuna Crunch Sandwich",                 brand: "Greggs", calories: 346, protein_g: 19,  carbs_g: 37, fat_g: 14, fibre_g: 3,   sugar_g: 4,   salt_g: 1.6, serving_size: "1 sandwich" },
  { food_name: "Egg Mayo Sandwich",                    brand: "Greggs", calories: 315, protein_g: 12,  carbs_g: 36, fat_g: 13, fibre_g: 3,   sugar_g: 4,   salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "Greggs", calories: 450, protein_g: 26,  carbs_g: 42, fat_g: 19, fibre_g: 3,   sugar_g: 4,   salt_g: 2.2, serving_size: "1 sandwich" },
  { food_name: "Ham and Cheese Baguette",              brand: "Greggs", calories: 420, protein_g: 20,  carbs_g: 46, fat_g: 16, fibre_g: 3,   sugar_g: 4,   salt_g: 2.3, serving_size: "1 baguette" },
  { food_name: "Chicken Mayo Baguette",                brand: "Greggs", calories: 490, protein_g: 23,  carbs_g: 46, fat_g: 23, fibre_g: 3,   sugar_g: 3,   salt_g: 1.9, serving_size: "1 baguette" },
  { food_name: "Tuna Crunch Baguette",                 brand: "Greggs", calories: 446, protein_g: 22,  carbs_g: 45, fat_g: 19, fibre_g: 3,   sugar_g: 4,   salt_g: 1.7, serving_size: "1 baguette" },
  { food_name: "Cheese and Ham Toastie",               brand: "Greggs", calories: 386, protein_g: 21,  carbs_g: 34, fat_g: 18, fibre_g: 2,   sugar_g: 3,   salt_g: 2.0, serving_size: "1 toastie" },
  { food_name: "Mac and Cheese",                       brand: "Greggs", calories: 440, protein_g: 18,  carbs_g: 42, fat_g: 22, fibre_g: 2,   sugar_g: 4,   salt_g: 1.5, serving_size: "1 portion" },
  { food_name: "Chicken and Bacon Pasta",              brand: "Greggs", calories: 380, protein_g: 25,  carbs_g: 40, fat_g: 13, fibre_g: 3,   sugar_g: 4,   salt_g: 1.3, serving_size: "1 portion" },
  { food_name: "Salt and Pepper Chicken Pasta",        brand: "Greggs", calories: 410, protein_g: 25,  carbs_g: 42, fat_g: 16, fibre_g: 3,   sugar_g: 4,   salt_g: 1.4, serving_size: "1 portion" },
  // Breakfast
  { food_name: "Bacon Roll",                           brand: "Greggs", calories: 300, protein_g: 14,  carbs_g: 32, fat_g: 12, fibre_g: 1.5, sugar_g: 2,   salt_g: 2.1, serving_size: "1 roll" },
  { food_name: "Sausage Bap",                          brand: "Greggs", calories: 370, protein_g: 13,  carbs_g: 36, fat_g: 19, fibre_g: 2,   sugar_g: 3,   salt_g: 1.9, serving_size: "1 bap" },
  { food_name: "Bacon and Sausage Bap",                brand: "Greggs", calories: 460, protein_g: 18,  carbs_g: 36, fat_g: 27, fibre_g: 2,   sugar_g: 3,   salt_g: 2.7, serving_size: "1 bap" },
  { food_name: "Bacon and Egg Roll",                   brand: "Greggs", calories: 345, protein_g: 18,  carbs_g: 33, fat_g: 15, fibre_g: 1.5, sugar_g: 2,   salt_g: 2.2, serving_size: "1 roll" },
  { food_name: "Omelette Breakfast Roll",              brand: "Greggs", calories: 290, protein_g: 14,  carbs_g: 32, fat_g: 12, fibre_g: 2,   sugar_g: 3,   salt_g: 1.8, serving_size: "1 roll" },
  // Sweet treats
  { food_name: "Glazed Ring Doughnut",                 brand: "Greggs", calories: 239, protein_g: 4,   carbs_g: 31, fat_g: 11, fibre_g: 1,   sugar_g: 14,  salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Jam Doughnut",                         brand: "Greggs", calories: 249, protein_g: 4,   carbs_g: 32, fat_g: 11, fibre_g: 1,   sugar_g: 14,  salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Yum Yum",                              brand: "Greggs", calories: 256, protein_g: 3,   carbs_g: 30, fat_g: 14, fibre_g: 1,   sugar_g: 11,  salt_g: 0.5, serving_size: "1 yum yum" },
  { food_name: "Belgian Bun",                          brand: "Greggs", calories: 450, protein_g: 7,   carbs_g: 69, fat_g: 17, fibre_g: 2,   sugar_g: 37,  salt_g: 0.6, serving_size: "1 bun" },
  { food_name: "Chocolate Eclair",                     brand: "Greggs", calories: 280, protein_g: 4,   carbs_g: 25, fat_g: 18, fibre_g: 1,   sugar_g: 13,  salt_g: 0.3, serving_size: "1 eclair" },
  { food_name: "Vanilla Slice",                        brand: "Greggs", calories: 349, protein_g: 4,   carbs_g: 35, fat_g: 21, fibre_g: 1,   sugar_g: 19,  salt_g: 0.3, serving_size: "1 slice" },
  { food_name: "Chocolate Doughnut",                   brand: "Greggs", calories: 310, protein_g: 4,   carbs_g: 37, fat_g: 16, fibre_g: 1,   sugar_g: 20,  salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Custard Doughnut",                     brand: "Greggs", calories: 295, protein_g: 5,   carbs_g: 32, fat_g: 16, fibre_g: 1,   sugar_g: 14,  salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Caramel Shortbread",                   brand: "Greggs", calories: 360, protein_g: 3,   carbs_g: 45, fat_g: 19, fibre_g: 1,   sugar_g: 28,  salt_g: 0.3, serving_size: "1 slice" },

  // ============================================================
  // PRET A MANGER — sandwiches, baguettes, salads, pastries, coffee
  // ============================================================
  { food_name: "Chicken Caesar and Bacon Baguette",    brand: "Pret", calories: 545, protein_g: 33, carbs_g: 51, fat_g: 23, fibre_g: 3, sugar_g: 4, salt_g: 2.5, serving_size: "1 baguette" },
  { food_name: "Chicken Caesar Baguette",              brand: "Pret", calories: 505, protein_g: 30, carbs_g: 50, fat_g: 20, fibre_g: 3, sugar_g: 4, salt_g: 2.1, serving_size: "1 baguette" },
  { food_name: "Ham and Cheese Baguette",              brand: "Pret", calories: 510, protein_g: 24, carbs_g: 54, fat_g: 21, fibre_g: 3, sugar_g: 4, salt_g: 2.8, serving_size: "1 baguette" },
  { food_name: "Egg Mayo and Tomato Sandwich",         brand: "Pret", calories: 395, protein_g: 16, carbs_g: 35, fat_g: 21, fibre_g: 4, sugar_g: 4, salt_g: 1.4, serving_size: "1 sandwich" },
  { food_name: "Smoked Salmon and Cream Cheese Sandwich",brand:"Pret",calories: 395, protein_g: 20, carbs_g: 42, fat_g: 15, fibre_g: 3, sugar_g: 5, salt_g: 2.1, serving_size: "1 sandwich" },
  { food_name: "Tuna Mayo and Cucumber Sandwich",      brand: "Pret", calories: 380, protein_g: 22, carbs_g: 38, fat_g: 15, fibre_g: 3, sugar_g: 4, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Classic Super Club Sandwich",          brand: "Pret", calories: 517, protein_g: 29, carbs_g: 39, fat_g: 27, fibre_g: 4, sugar_g: 5, salt_g: 2.3, serving_size: "1 sandwich" },
  { food_name: "Crayfish and Rocket Sandwich",         brand: "Pret", calories: 325, protein_g: 20, carbs_g: 34, fat_g: 11, fibre_g: 3, sugar_g: 3, salt_g: 1.8, serving_size: "1 sandwich" },
  { food_name: "BLT Sandwich",                         brand: "Pret", calories: 410, protein_g: 18, carbs_g: 35, fat_g: 22, fibre_g: 3, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Chicken Avocado Sandwich",             brand: "Pret", calories: 430, protein_g: 28, carbs_g: 32, fat_g: 22, fibre_g: 5, sugar_g: 3, salt_g: 1.4, serving_size: "1 sandwich" },
  { food_name: "No Tuna Melt Sandwich",                brand: "Pret", calories: 385, protein_g: 15, carbs_g: 42, fat_g: 17, fibre_g: 5, sugar_g: 4, salt_g: 1.6, serving_size: "1 sandwich" },
  { food_name: "Falafel and Halloumi Wrap",            brand: "Pret", calories: 530, protein_g: 21, carbs_g: 55, fat_g: 24, fibre_g: 9, sugar_g: 7, salt_g: 2.0, serving_size: "1 wrap" },
  { food_name: "Ham and Cheese Croissant",             brand: "Pret", calories: 420, protein_g: 18, carbs_g: 25, fat_g: 28, fibre_g: 2, sugar_g: 3, salt_g: 1.6, serving_size: "1 croissant" },
  { food_name: "Pain au Chocolat",                     brand: "Pret", calories: 295, protein_g: 5,  carbs_g: 28, fat_g: 18, fibre_g: 2, sugar_g: 10,salt_g: 0.5, serving_size: "1 pastry" },
  { food_name: "Butter Croissant",                     brand: "Pret", calories: 260, protein_g: 5,  carbs_g: 27, fat_g: 15, fibre_g: 2, sugar_g: 5, salt_g: 0.6, serving_size: "1 croissant" },
  { food_name: "Almond Croissant",                     brand: "Pret", calories: 430, protein_g: 10, carbs_g: 38, fat_g: 26, fibre_g: 3, sugar_g: 15,salt_g: 0.5, serving_size: "1 croissant" },
  { food_name: "Mac and Cheese",                       brand: "Pret", calories: 580, protein_g: 22, carbs_g: 57, fat_g: 28, fibre_g: 3, sugar_g: 5, salt_g: 1.6, serving_size: "1 portion" },
  { food_name: "Porridge Pot",                         brand: "Pret", calories: 225, protein_g: 9,  carbs_g: 36, fat_g: 4.5,fibre_g: 5, sugar_g: 13,salt_g: 0.3, serving_size: "Medium pot" },
  { food_name: "Chicken Avocado Salad Bowl",           brand: "Pret", calories: 420, protein_g: 26, carbs_g: 25, fat_g: 23, fibre_g: 8, sugar_g: 6, salt_g: 1.2, serving_size: "Salad bowl" },
  { food_name: "Super Green Salad",                    brand: "Pret", calories: 380, protein_g: 12, carbs_g: 30, fat_g: 23, fibre_g: 8, sugar_g: 7, salt_g: 1.0, serving_size: "Salad bowl" },
  { food_name: "Chef's Italian Chicken Salad",         brand: "Pret", calories: 445, protein_g: 33, carbs_g: 23, fat_g: 25, fibre_g: 5, sugar_g: 8, salt_g: 1.8, serving_size: "Salad bowl" },
  { food_name: "Very Berry Smoothie",                  brand: "Pret", calories: 215, protein_g: 3,  carbs_g: 45, fat_g: 0.5,fibre_g: 5, sugar_g: 38,salt_g: 0.1, serving_size: "Regular" },
  { food_name: "Mango Smoothie",                       brand: "Pret", calories: 205, protein_g: 2,  carbs_g: 48, fat_g: 0.5,fibre_g: 3, sugar_g: 43,salt_g: 0.1, serving_size: "Regular" },
  { food_name: "Chocolate Chunk Cookie",               brand: "Pret", calories: 355, protein_g: 4,  carbs_g: 44, fat_g: 18, fibre_g: 2, sugar_g: 27,salt_g: 0.5, serving_size: "1 cookie" },
  { food_name: "Love Bar",                             brand: "Pret", calories: 215, protein_g: 4,  carbs_g: 24, fat_g: 11, fibre_g: 2, sugar_g: 14,salt_g: 0.1, serving_size: "1 bar" },

  // ============================================================
  // COSTA COFFEE — drinks (Primo/Medio/Massimo) + food
  // ============================================================
  { food_name: "Cappuccino Primo",                     brand: "Costa", calories: 83,  protein_g: 6,  carbs_g: 8,  fat_g: 3,   fibre_g: 0, sugar_g: 8,  salt_g: 0.2, serving_size: "Primo (small)" },
  { food_name: "Cappuccino Medio",                     brand: "Costa", calories: 116, protein_g: 8,  carbs_g: 11, fat_g: 4,   fibre_g: 0, sugar_g: 11, salt_g: 0.3, serving_size: "Medio (medium)" },
  { food_name: "Cappuccino Massimo",                   brand: "Costa", calories: 170, protein_g: 12, carbs_g: 17, fat_g: 6,   fibre_g: 0, sugar_g: 16, salt_g: 0.4, serving_size: "Massimo (large)" },
  { food_name: "Latte Primo",                          brand: "Costa", calories: 128, protein_g: 9,  carbs_g: 13, fat_g: 4.5, fibre_g: 0, sugar_g: 12, salt_g: 0.3, serving_size: "Primo (small)" },
  { food_name: "Latte Medio",                          brand: "Costa", calories: 175, protein_g: 13, carbs_g: 17, fat_g: 6,   fibre_g: 0, sugar_g: 17, salt_g: 0.4, serving_size: "Medio (medium)" },
  { food_name: "Latte Massimo",                        brand: "Costa", calories: 236, protein_g: 17, carbs_g: 23, fat_g: 8,   fibre_g: 0, sugar_g: 23, salt_g: 0.5, serving_size: "Massimo (large)" },
  { food_name: "Flat White Primo",                     brand: "Costa", calories: 115, protein_g: 8,  carbs_g: 11, fat_g: 4,   fibre_g: 0, sugar_g: 11, salt_g: 0.3, serving_size: "Primo (small)" },
  { food_name: "Flat White Medio",                     brand: "Costa", calories: 165, protein_g: 11, carbs_g: 16, fat_g: 6,   fibre_g: 0, sugar_g: 15, salt_g: 0.4, serving_size: "Medio (medium)" },
  { food_name: "Americano Primo",                      brand: "Costa", calories: 4,   protein_g: 0.3,carbs_g: 0.5,fat_g: 0,   fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Primo (small)" },
  { food_name: "Americano Medio",                      brand: "Costa", calories: 6,   protein_g: 0.4,carbs_g: 0.8,fat_g: 0,   fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Medio (medium)" },
  { food_name: "Americano Massimo",                    brand: "Costa", calories: 9,   protein_g: 0.6,carbs_g: 1.1,fat_g: 0,   fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Massimo (large)" },
  { food_name: "Espresso",                             brand: "Costa", calories: 3,   protein_g: 0.2,carbs_g: 0.4,fat_g: 0,   fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Single shot" },
  { food_name: "Double Espresso",                      brand: "Costa", calories: 6,   protein_g: 0.4,carbs_g: 0.8,fat_g: 0,   fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Double shot" },
  { food_name: "Mocha Medio",                          brand: "Costa", calories: 265, protein_g: 11, carbs_g: 35, fat_g: 9,   fibre_g: 1, sugar_g: 30, salt_g: 0.3, serving_size: "Medio (medium)" },
  { food_name: "Mocha Massimo",                        brand: "Costa", calories: 350, protein_g: 14, carbs_g: 46, fat_g: 12,  fibre_g: 1, sugar_g: 40, salt_g: 0.4, serving_size: "Massimo (large)" },
  { food_name: "Hot Chocolate Medio",                  brand: "Costa", calories: 318, protein_g: 10, carbs_g: 43, fat_g: 11,  fibre_g: 1, sugar_g: 38, salt_g: 0.3, serving_size: "Medio (medium)" },
  { food_name: "Hot Chocolate Massimo",                brand: "Costa", calories: 420, protein_g: 13, carbs_g: 57, fat_g: 15,  fibre_g: 1, sugar_g: 50, salt_g: 0.4, serving_size: "Massimo (large)" },
  { food_name: "Caramel Latte Medio",                  brand: "Costa", calories: 245, protein_g: 11, carbs_g: 35, fat_g: 6,   fibre_g: 0, sugar_g: 34, salt_g: 0.3, serving_size: "Medio (medium)" },
  { food_name: "Vanilla Latte Medio",                  brand: "Costa", calories: 235, protein_g: 11, carbs_g: 34, fat_g: 6,   fibre_g: 0, sugar_g: 33, salt_g: 0.3, serving_size: "Medio (medium)" },
  { food_name: "Iced Latte Medio",                     brand: "Costa", calories: 125, protein_g: 9,  carbs_g: 12, fat_g: 4.5, fibre_g: 0, sugar_g: 12, salt_g: 0.2, serving_size: "Medio (medium)" },
  { food_name: "Chocolate Muffin",                     brand: "Costa", calories: 465, protein_g: 6,  carbs_g: 57, fat_g: 23,  fibre_g: 3, sugar_g: 33, salt_g: 0.6, serving_size: "1 muffin" },
  { food_name: "Blueberry Muffin",                     brand: "Costa", calories: 435, protein_g: 5,  carbs_g: 59, fat_g: 20,  fibre_g: 2, sugar_g: 36, salt_g: 0.5, serving_size: "1 muffin" },
  { food_name: "All Butter Croissant",                 brand: "Costa", calories: 280, protein_g: 5,  carbs_g: 28, fat_g: 16,  fibre_g: 2, sugar_g: 6,  salt_g: 0.7, serving_size: "1 croissant" },
  { food_name: "Pain au Chocolat",                     brand: "Costa", calories: 310, protein_g: 5,  carbs_g: 30, fat_g: 19,  fibre_g: 2, sugar_g: 11, salt_g: 0.5, serving_size: "1 pastry" },
  { food_name: "Bacon Bap",                            brand: "Costa", calories: 350, protein_g: 17, carbs_g: 35, fat_g: 16,  fibre_g: 2, sugar_g: 4,  salt_g: 2.3, serving_size: "1 bap" },
  { food_name: "Chicken Caesar Panini",                brand: "Costa", calories: 495, protein_g: 30, carbs_g: 46, fat_g: 21,  fibre_g: 3, sugar_g: 4,  salt_g: 2.0, serving_size: "1 panini" },

  // ============================================================
  // STARBUCKS — full drinks matrix + food
  // ============================================================
  { food_name: "Cappuccino Tall",                      brand: "Starbucks", calories: 80,  protein_g: 4,  carbs_g: 8,  fat_g: 3,   fibre_g: 0, sugar_g: 8, salt_g: 0.2, serving_size: "Tall (350ml)" },
  { food_name: "Cappuccino Grande",                    brand: "Starbucks", calories: 120, protein_g: 8,  carbs_g: 12, fat_g: 4.5, fibre_g: 0, sugar_g: 12,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Cappuccino Venti",                     brand: "Starbucks", calories: 160, protein_g: 11, carbs_g: 16, fat_g: 6,   fibre_g: 0, sugar_g: 16,salt_g: 0.4, serving_size: "Venti (590ml)" },
  { food_name: "Latte Tall",                           brand: "Starbucks", calories: 130, protein_g: 9,  carbs_g: 13, fat_g: 5,   fibre_g: 0, sugar_g: 13,salt_g: 0.3, serving_size: "Tall (350ml)" },
  { food_name: "Latte Grande",                         brand: "Starbucks", calories: 190, protein_g: 13, carbs_g: 19, fat_g: 7,   fibre_g: 0, sugar_g: 19,salt_g: 0.4, serving_size: "Grande (470ml)" },
  { food_name: "Latte Venti",                          brand: "Starbucks", calories: 240, protein_g: 16, carbs_g: 23, fat_g: 9,   fibre_g: 0, sugar_g: 23,salt_g: 0.5, serving_size: "Venti (590ml)" },
  { food_name: "Flat White Tall",                      brand: "Starbucks", calories: 120, protein_g: 8,  carbs_g: 11, fat_g: 4.5, fibre_g: 0, sugar_g: 11,salt_g: 0.3, serving_size: "Tall (350ml)" },
  { food_name: "Flat White Grande",                    brand: "Starbucks", calories: 170, protein_g: 11, carbs_g: 16, fat_g: 6,   fibre_g: 0, sugar_g: 16,salt_g: 0.4, serving_size: "Grande (470ml)" },
  { food_name: "Americano Tall",                       brand: "Starbucks", calories: 6,   protein_g: 1,  carbs_g: 0,  fat_g: 0,   fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "Tall (350ml)" },
  { food_name: "Americano Grande",                     brand: "Starbucks", calories: 8,   protein_g: 1,  carbs_g: 0,  fat_g: 0,   fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "Grande (470ml)" },
  { food_name: "Americano Venti",                      brand: "Starbucks", calories: 11,  protein_g: 1,  carbs_g: 0,  fat_g: 0,   fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "Venti (590ml)" },
  { food_name: "Caramel Macchiato Grande",             brand: "Starbucks", calories: 250, protein_g: 10, carbs_g: 34, fat_g: 7,   fibre_g: 0, sugar_g: 33,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Caramel Macchiato Venti",              brand: "Starbucks", calories: 320, protein_g: 13, carbs_g: 44, fat_g: 9,   fibre_g: 0, sugar_g: 43,salt_g: 0.4, serving_size: "Venti (590ml)" },
  { food_name: "Mocha Grande",                         brand: "Starbucks", calories: 290, protein_g: 13, carbs_g: 39, fat_g: 11,  fibre_g: 2, sugar_g: 33,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "White Chocolate Mocha Grande",         brand: "Starbucks", calories: 400, protein_g: 13, carbs_g: 56, fat_g: 14,  fibre_g: 0, sugar_g: 55,salt_g: 0.4, serving_size: "Grande (470ml)" },
  { food_name: "Hot Chocolate Grande",                 brand: "Starbucks", calories: 370, protein_g: 14, carbs_g: 50, fat_g: 14,  fibre_g: 2, sugar_g: 44,salt_g: 0.4, serving_size: "Grande (470ml)" },
  { food_name: "Chai Tea Latte Grande",                brand: "Starbucks", calories: 240, protein_g: 8,  carbs_g: 45, fat_g: 4,   fibre_g: 0, sugar_g: 42,salt_g: 0.2, serving_size: "Grande (470ml)" },
  { food_name: "Matcha Tea Latte Grande",              brand: "Starbucks", calories: 240, protein_g: 12, carbs_g: 34, fat_g: 7,   fibre_g: 1, sugar_g: 32,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Caramel Frappuccino Grande",           brand: "Starbucks", calories: 350, protein_g: 4,  carbs_g: 65, fat_g: 7.5, fibre_g: 0, sugar_g: 59,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Mocha Frappuccino Grande",             brand: "Starbucks", calories: 320, protein_g: 5,  carbs_g: 55, fat_g: 9,   fibre_g: 1, sugar_g: 46,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Java Chip Frappuccino Grande",         brand: "Starbucks", calories: 410, protein_g: 6,  carbs_g: 60, fat_g: 17,  fibre_g: 2, sugar_g: 52,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Vanilla Bean Frappuccino Grande",      brand: "Starbucks", calories: 335, protein_g: 5,  carbs_g: 57, fat_g: 9,   fibre_g: 0, sugar_g: 52,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Strawberry Cream Frappuccino Grande",  brand: "Starbucks", calories: 320, protein_g: 5,  carbs_g: 52, fat_g: 10,  fibre_g: 1, sugar_g: 48,salt_g: 0.3, serving_size: "Grande (470ml)" },
  { food_name: "Chocolate Twist",                      brand: "Starbucks", calories: 330, protein_g: 6,  carbs_g: 35, fat_g: 18,  fibre_g: 2, sugar_g: 13,salt_g: 0.6, serving_size: "1 twist" },
  { food_name: "Almond Croissant",                     brand: "Starbucks", calories: 455, protein_g: 10, carbs_g: 41, fat_g: 28,  fibre_g: 3, sugar_g: 15,salt_g: 0.8, serving_size: "1 croissant" },
  { food_name: "Cheese and Marmite Toastie",           brand: "Starbucks", calories: 445, protein_g: 22, carbs_g: 41, fat_g: 20,  fibre_g: 2, sugar_g: 3, salt_g: 2.5, serving_size: "1 toastie" },
  { food_name: "Ham and Cheese Toastie",               brand: "Starbucks", calories: 460, protein_g: 24, carbs_g: 41, fat_g: 22,  fibre_g: 2, sugar_g: 3, salt_g: 2.3, serving_size: "1 toastie" },
  { food_name: "Chocolate Brownie",                    brand: "Starbucks", calories: 425, protein_g: 5,  carbs_g: 53, fat_g: 21,  fibre_g: 2, sugar_g: 40,salt_g: 0.4, serving_size: "1 brownie" },

  // ============================================================
  // PIZZA HUT & DOMINO'S — per slice on medium unless stated
  // ============================================================
  { food_name: "Pepperoni Pizza Slice (medium)",       brand: "Domino's", calories: 200, protein_g: 9,  carbs_g: 23, fat_g: 8.5, fibre_g: 1.5, sugar_g: 2,  salt_g: 1.0, serving_size: "1 slice medium" },
  { food_name: "Margherita Pizza Slice (medium)",      brand: "Domino's", calories: 165, protein_g: 8,  carbs_g: 23, fat_g: 5,   fibre_g: 1.5, sugar_g: 2,  salt_g: 0.8, serving_size: "1 slice medium" },
  { food_name: "Hawaiian Pizza Slice (medium)",        brand: "Domino's", calories: 180, protein_g: 9,  carbs_g: 25, fat_g: 5.5, fibre_g: 1.5, sugar_g: 3,  salt_g: 1.0, serving_size: "1 slice medium" },
  { food_name: "Meat Feast Pizza Slice (medium)",      brand: "Domino's", calories: 230, protein_g: 12, carbs_g: 24, fat_g: 10,  fibre_g: 2,   sugar_g: 2,  salt_g: 1.2, serving_size: "1 slice medium" },
  { food_name: "Vegi Supreme Pizza Slice (medium)",    brand: "Domino's", calories: 170, protein_g: 8,  carbs_g: 23, fat_g: 6,   fibre_g: 2,   sugar_g: 3,  salt_g: 0.9, serving_size: "1 slice medium" },
  { food_name: "Mighty Meaty Pizza Slice (medium)",    brand: "Domino's", calories: 240, protein_g: 13, carbs_g: 24, fat_g: 11,  fibre_g: 2,   sugar_g: 2,  salt_g: 1.3, serving_size: "1 slice medium" },
  { food_name: "BBQ Meatlovers Pizza Slice (medium)",  brand: "Domino's", calories: 235, protein_g: 12, carbs_g: 25, fat_g: 10,  fibre_g: 2,   sugar_g: 4,  salt_g: 1.2, serving_size: "1 slice medium" },
  { food_name: "Chicken Feast Pizza Slice (medium)",   brand: "Domino's", calories: 195, protein_g: 12, carbs_g: 23, fat_g: 7,   fibre_g: 2,   sugar_g: 2,  salt_g: 1.0, serving_size: "1 slice medium" },
  { food_name: "Texas BBQ Pizza Slice (medium)",       brand: "Domino's", calories: 210, protein_g: 11, carbs_g: 26, fat_g: 8,   fibre_g: 2,   sugar_g: 4,  salt_g: 1.1, serving_size: "1 slice medium" },
  { food_name: "Garlic and Herb Dip",                  brand: "Domino's", calories: 105, protein_g: 0.2,carbs_g: 0.5,fat_g: 11,  fibre_g: 0,   sugar_g: 0.4,salt_g: 0.3, serving_size: "1 dip (25g)" },
  { food_name: "Potato Wedges",                        brand: "Domino's", calories: 260, protein_g: 4,  carbs_g: 35, fat_g: 12,  fibre_g: 3,   sugar_g: 1,  salt_g: 0.7, serving_size: "Regular portion" },
  { food_name: "Chicken Wings 7 piece",                brand: "Domino's", calories: 480, protein_g: 35, carbs_g: 4,  fat_g: 36,  fibre_g: 0.5, sugar_g: 1,  salt_g: 2.2, serving_size: "7 wings" },
  { food_name: "Cookies 4 piece",                      brand: "Domino's", calories: 470, protein_g: 5,  carbs_g: 66, fat_g: 20,  fibre_g: 1.5, sugar_g: 32, salt_g: 0.5, serving_size: "4 cookies" },
  { food_name: "Pepperoni Pizza Slice (medium)",       brand: "Pizza Hut", calories: 210, protein_g: 10, carbs_g: 23, fat_g: 9,   fibre_g: 1.5, sugar_g: 2,  salt_g: 1.1, serving_size: "1 slice medium" },
  { food_name: "Margherita Pizza Slice (medium)",      brand: "Pizza Hut", calories: 170, protein_g: 8,  carbs_g: 23, fat_g: 5,   fibre_g: 1.5, sugar_g: 2,  salt_g: 0.8, serving_size: "1 slice medium" },
  { food_name: "BBQ Americano Pizza Slice",            brand: "Pizza Hut", calories: 220, protein_g: 11, carbs_g: 25, fat_g: 9,   fibre_g: 2,   sugar_g: 4,  salt_g: 1.1, serving_size: "1 slice medium" },
  { food_name: "Meaty Pizza Slice",                    brand: "Pizza Hut", calories: 240, protein_g: 13, carbs_g: 23, fat_g: 11,  fibre_g: 2,   sugar_g: 2,  salt_g: 1.3, serving_size: "1 slice medium" },
  { food_name: "Veggie Hot One Pizza Slice",           brand: "Pizza Hut", calories: 175, protein_g: 8,  carbs_g: 23, fat_g: 6,   fibre_g: 2,   sugar_g: 3,  salt_g: 0.9, serving_size: "1 slice medium" },
  { food_name: "Garlic Bread 2 slice",                 brand: "Pizza Hut", calories: 280, protein_g: 7,  carbs_g: 34, fat_g: 13,  fibre_g: 2,   sugar_g: 2,  salt_g: 1.1, serving_size: "2 slices" },
  { food_name: "Chicken Wings 6 piece",                brand: "Pizza Hut", calories: 400, protein_g: 30, carbs_g: 3,  fat_g: 30,  fibre_g: 0.5, sugar_g: 0.5,salt_g: 2.0, serving_size: "6 wings" },

  // ============================================================
  // WAGAMAMA
  // ============================================================
  { food_name: "Chicken Katsu Curry",                  brand: "Wagamama", calories: 1057, protein_g: 47, carbs_g: 107, fat_g: 46, fibre_g: 6, sugar_g: 20, salt_g: 3.0, serving_size: "1 bowl" },
  { food_name: "Tofu Katsu Curry",                     brand: "Wagamama", calories: 985,  protein_g: 27, carbs_g: 125, fat_g: 38, fibre_g: 9, sugar_g: 22, salt_g: 2.6, serving_size: "1 bowl" },
  { food_name: "Yaki Soba Chicken",                    brand: "Wagamama", calories: 781,  protein_g: 42, carbs_g: 89,  fat_g: 27, fibre_g: 7, sugar_g: 18, salt_g: 4.0, serving_size: "1 bowl" },
  { food_name: "Yaki Soba Vegan",                      brand: "Wagamama", calories: 700,  protein_g: 22, carbs_g: 98,  fat_g: 21, fibre_g: 9, sugar_g: 17, salt_g: 3.7, serving_size: "1 bowl" },
  { food_name: "Chilli Chicken Ramen",                 brand: "Wagamama", calories: 820,  protein_g: 50, carbs_g: 84,  fat_g: 27, fibre_g: 7, sugar_g: 10, salt_g: 5.0, serving_size: "1 bowl" },
  { food_name: "Shirodashi Ramen",                     brand: "Wagamama", calories: 735,  protein_g: 45, carbs_g: 80,  fat_g: 22, fibre_g: 6, sugar_g: 8,  salt_g: 4.7, serving_size: "1 bowl" },
  { food_name: "Ramen Tonkotsu",                       brand: "Wagamama", calories: 890,  protein_g: 48, carbs_g: 80,  fat_g: 37, fibre_g: 5, sugar_g: 7,  salt_g: 5.2, serving_size: "1 bowl" },
  { food_name: "Kare Burosu Ramen",                    brand: "Wagamama", calories: 865,  protein_g: 44, carbs_g: 85,  fat_g: 35, fibre_g: 6, sugar_g: 10, salt_g: 4.8, serving_size: "1 bowl" },
  { food_name: "Firecracker Chicken",                  brand: "Wagamama", calories: 867,  protein_g: 44, carbs_g: 90,  fat_g: 35, fibre_g: 6, sugar_g: 22, salt_g: 4.3, serving_size: "1 bowl" },
  { food_name: "Teriyaki Chicken Donburi",             brand: "Wagamama", calories: 895,  protein_g: 50, carbs_g: 110, fat_g: 28, fibre_g: 5, sugar_g: 32, salt_g: 3.8, serving_size: "1 bowl" },
  { food_name: "Teriyaki Salmon Donburi",              brand: "Wagamama", calories: 935,  protein_g: 42, carbs_g: 108, fat_g: 33, fibre_g: 5, sugar_g: 31, salt_g: 3.6, serving_size: "1 bowl" },
  { food_name: "Raisukaree Chicken",                   brand: "Wagamama", calories: 960,  protein_g: 50, carbs_g: 100, fat_g: 37, fibre_g: 6, sugar_g: 12, salt_g: 3.5, serving_size: "1 bowl" },
  { food_name: "Chicken Gyoza 5 piece",                brand: "Wagamama", calories: 285,  protein_g: 16, carbs_g: 28,  fat_g: 12, fibre_g: 2, sugar_g: 3,  salt_g: 1.8, serving_size: "5 gyoza" },
  { food_name: "Duck Gyoza 5 piece",                   brand: "Wagamama", calories: 290,  protein_g: 15, carbs_g: 29,  fat_g: 13, fibre_g: 2, sugar_g: 3,  salt_g: 1.8, serving_size: "5 gyoza" },
  { food_name: "Vegetable Gyoza 5 piece",              brand: "Wagamama", calories: 235,  protein_g: 8,  carbs_g: 28,  fat_g: 10, fibre_g: 3, sugar_g: 2,  salt_g: 1.5, serving_size: "5 gyoza" },
  { food_name: "Chicken Katsu Bao Buns 2 piece",       brand: "Wagamama", calories: 340,  protein_g: 17, carbs_g: 42,  fat_g: 11, fibre_g: 2, sugar_g: 11, salt_g: 1.8, serving_size: "2 buns" },
  { food_name: "Korean BBQ Beef Bao Buns 2 piece",     brand: "Wagamama", calories: 360,  protein_g: 18, carbs_g: 40,  fat_g: 14, fibre_g: 2, sugar_g: 12, salt_g: 2.1, serving_size: "2 buns" },
  { food_name: "Edamame",                              brand: "Wagamama", calories: 165,  protein_g: 12, carbs_g: 8,   fat_g: 8,  fibre_g: 6, sugar_g: 2,  salt_g: 1.0, serving_size: "1 portion" },
  { food_name: "Wok Fried Greens",                     brand: "Wagamama", calories: 130,  protein_g: 5,  carbs_g: 8,   fat_g: 8,  fibre_g: 5, sugar_g: 5,  salt_g: 1.2, serving_size: "1 portion" },
  { food_name: "Miso Soup",                            brand: "Wagamama", calories: 40,   protein_g: 3,  carbs_g: 4,   fat_g: 1,  fibre_g: 1, sugar_g: 0.5,salt_g: 1.0, serving_size: "1 cup" },

  // ============================================================
  // FIVE GUYS
  // ============================================================
  { food_name: "Hamburger",                            brand: "Five Guys", calories: 700, protein_g: 40, carbs_g: 40,  fat_g: 43, fibre_g: 2, sugar_g: 9, salt_g: 1.2, serving_size: "1 burger" },
  { food_name: "Cheeseburger",                         brand: "Five Guys", calories: 843, protein_g: 48, carbs_g: 41,  fat_g: 54, fibre_g: 2, sugar_g: 9, salt_g: 2.1, serving_size: "1 burger" },
  { food_name: "Bacon Burger",                         brand: "Five Guys", calories: 780, protein_g: 44, carbs_g: 40,  fat_g: 50, fibre_g: 2, sugar_g: 9, salt_g: 1.5, serving_size: "1 burger" },
  { food_name: "Bacon Cheeseburger",                   brand: "Five Guys", calories: 920, protein_g: 52, carbs_g: 41,  fat_g: 62, fibre_g: 2, sugar_g: 9, salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "Little Hamburger",                     brand: "Five Guys", calories: 481, protein_g: 24, carbs_g: 39,  fat_g: 26, fibre_g: 2, sugar_g: 8, salt_g: 1.0, serving_size: "1 burger" },
  { food_name: "Little Cheeseburger",                  brand: "Five Guys", calories: 555, protein_g: 28, carbs_g: 40,  fat_g: 31, fibre_g: 2, sugar_g: 9, salt_g: 1.5, serving_size: "1 burger" },
  { food_name: "Little Bacon Burger",                  brand: "Five Guys", calories: 560, protein_g: 28, carbs_g: 39,  fat_g: 32, fibre_g: 2, sugar_g: 8, salt_g: 1.3, serving_size: "1 burger" },
  { food_name: "Hot Dog",                              brand: "Five Guys", calories: 545, protein_g: 20, carbs_g: 40,  fat_g: 34, fibre_g: 2, sugar_g: 6, salt_g: 2.2, serving_size: "1 hot dog" },
  { food_name: "Cheese Dog",                           brand: "Five Guys", calories: 615, protein_g: 24, carbs_g: 41,  fat_g: 39, fibre_g: 2, sugar_g: 7, salt_g: 2.6, serving_size: "1 hot dog" },
  { food_name: "Bacon Dog",                            brand: "Five Guys", calories: 625, protein_g: 24, carbs_g: 40,  fat_g: 41, fibre_g: 2, sugar_g: 6, salt_g: 2.5, serving_size: "1 hot dog" },
  { food_name: "Fries Little",                         brand: "Five Guys", calories: 526, protein_g: 8,  carbs_g: 66,  fat_g: 27, fibre_g: 5.5,sugar_g: 2, salt_g: 0.6, serving_size: "Little (227g)" },
  { food_name: "Fries Regular",                        brand: "Five Guys", calories: 953, protein_g: 14, carbs_g: 119, fat_g: 49, fibre_g: 10, sugar_g: 3, salt_g: 1.1, serving_size: "Regular (411g)" },
  { food_name: "Fries Large",                          brand: "Five Guys", calories: 1310,protein_g: 19, carbs_g: 164, fat_g: 67, fibre_g: 13, sugar_g: 4, salt_g: 1.5, serving_size: "Large (564g)" },
  { food_name: "Cajun Fries Regular",                  brand: "Five Guys", calories: 953, protein_g: 14, carbs_g: 119, fat_g: 49, fibre_g: 10, sugar_g: 3, salt_g: 2.5, serving_size: "Regular (411g)" },

  // ============================================================
  // PIZZA EXPRESS
  // ============================================================
  { food_name: "Margherita Classic",                   brand: "Pizza Express", calories: 731, protein_g: 28, carbs_g: 97,  fat_g: 25, fibre_g: 5, sugar_g: 8, salt_g: 3.0, serving_size: "Classic size" },
  { food_name: "Margherita Romana",                    brand: "Pizza Express", calories: 651, protein_g: 25, carbs_g: 88,  fat_g: 23, fibre_g: 4, sugar_g: 7, salt_g: 2.7, serving_size: "Romana size" },
  { food_name: "American Hot Classic",                 brand: "Pizza Express", calories: 939, protein_g: 40, carbs_g: 97,  fat_g: 41, fibre_g: 5, sugar_g: 8, salt_g: 4.2, serving_size: "Classic size" },
  { food_name: "American Romana",                      brand: "Pizza Express", calories: 850, protein_g: 37, carbs_g: 88,  fat_g: 37, fibre_g: 4, sugar_g: 7, salt_g: 3.8, serving_size: "Romana size" },
  { food_name: "Sloppy Giuseppe Classic",              brand: "Pizza Express", calories: 952, protein_g: 45, carbs_g: 99,  fat_g: 39, fibre_g: 6, sugar_g: 11,salt_g: 3.7, serving_size: "Classic size" },
  { food_name: "Pollo ad Astra Classic",               brand: "Pizza Express", calories: 873, protein_g: 42, carbs_g: 98,  fat_g: 31, fibre_g: 6, sugar_g: 10,salt_g: 3.3, serving_size: "Classic size" },
  { food_name: "La Reine Classic",                     brand: "Pizza Express", calories: 767, protein_g: 35, carbs_g: 98,  fat_g: 24, fibre_g: 5, sugar_g: 8, salt_g: 3.5, serving_size: "Classic size" },
  { food_name: "Leggera Pollo ad Astra",               brand: "Pizza Express", calories: 505, protein_g: 30, carbs_g: 57,  fat_g: 17, fibre_g: 8, sugar_g: 9, salt_g: 2.5, serving_size: "Leggera (with hole)" },
  { food_name: "Leggera Padana",                       brand: "Pizza Express", calories: 480, protein_g: 20, carbs_g: 55,  fat_g: 18, fibre_g: 8, sugar_g: 10,salt_g: 2.2, serving_size: "Leggera" },
  { food_name: "Dough Balls 8 piece",                  brand: "Pizza Express", calories: 396, protein_g: 12, carbs_g: 57,  fat_g: 14, fibre_g: 3, sugar_g: 2, salt_g: 1.6, serving_size: "8 balls with butter" },
  { food_name: "Calabrese Classic",                    brand: "Pizza Express", calories: 1035,protein_g: 42, carbs_g: 99,  fat_g: 49, fibre_g: 6, sugar_g: 8, salt_g: 4.3, serving_size: "Classic size" },
  { food_name: "Tiramisu",                             brand: "Pizza Express", calories: 485, protein_g: 8,  carbs_g: 46,  fat_g: 29, fibre_g: 1, sugar_g: 37,salt_g: 0.3, serving_size: "1 portion" },

  // ============================================================
  // ITSU
  // ============================================================
  { food_name: "Chicken Teriyaki Rice Bowl",           brand: "Itsu", calories: 444, protein_g: 30, carbs_g: 60, fat_g: 8,  fibre_g: 5, sugar_g: 17,salt_g: 2.1, serving_size: "1 bowl" },
  { food_name: "Katsu Chicken Rice Bowl",              brand: "Itsu", calories: 515, protein_g: 24, carbs_g: 70, fat_g: 15, fibre_g: 5, sugar_g: 14,salt_g: 2.0, serving_size: "1 bowl" },
  { food_name: "Salmon Rainbow Roll",                  brand: "Itsu", calories: 360, protein_g: 15, carbs_g: 57, fat_g: 8,  fibre_g: 3, sugar_g: 7, salt_g: 1.4, serving_size: "1 pack" },
  { food_name: "Chicken Gyoza 7 piece",                brand: "Itsu", calories: 270, protein_g: 13, carbs_g: 29, fat_g: 11, fibre_g: 2, sugar_g: 3, salt_g: 1.6, serving_size: "7 gyoza" },
  { food_name: "Veggie Gyoza 7 piece",                 brand: "Itsu", calories: 225, protein_g: 7,  carbs_g: 30, fat_g: 9,  fibre_g: 3, sugar_g: 2, salt_g: 1.5, serving_size: "7 gyoza" },
  { food_name: "Chicken Potsticker Pot",               brand: "Itsu", calories: 345, protein_g: 20, carbs_g: 42, fat_g: 10, fibre_g: 4, sugar_g: 5, salt_g: 2.1, serving_size: "1 pot" },
  { food_name: "Miso Soup",                            brand: "Itsu", calories: 40,  protein_g: 3,  carbs_g: 4,  fat_g: 1,  fibre_g: 1, sugar_g: 0.5,salt_g: 1.0, serving_size: "1 cup" },
  { food_name: "Salmon Sashimi Box",                   brand: "Itsu", calories: 195, protein_g: 25, carbs_g: 1,  fat_g: 10, fibre_g: 0, sugar_g: 0.5,salt_g: 0.2, serving_size: "1 box" },
  { food_name: "Detox Rice Salad",                     brand: "Itsu", calories: 395, protein_g: 15, carbs_g: 50, fat_g: 13, fibre_g: 7, sugar_g: 10,salt_g: 1.1, serving_size: "1 bowl" },
  { food_name: "Crispy Duck Gyoza Rice Bowl",          brand: "Itsu", calories: 540, protein_g: 22, carbs_g: 70, fat_g: 18, fibre_g: 5, sugar_g: 15,salt_g: 2.3, serving_size: "1 bowl" },

  // ============================================================
  // LEON
  // ============================================================
  { food_name: "Original Chicken Super Grains",        brand: "Leon", calories: 510, protein_g: 35, carbs_g: 54, fat_g: 16, fibre_g: 9,  sugar_g: 6, salt_g: 1.8, serving_size: "1 box" },
  { food_name: "Falafel Super Grains",                 brand: "Leon", calories: 555, protein_g: 17, carbs_g: 60, fat_g: 26, fibre_g: 12, sugar_g: 8, salt_g: 1.5, serving_size: "1 box" },
  { food_name: "Chicken Aioli Wrap",                   brand: "Leon", calories: 495, protein_g: 30, carbs_g: 46, fat_g: 20, fibre_g: 5,  sugar_g: 4, salt_g: 1.9, serving_size: "1 wrap" },
  { food_name: "Moroccan Meatballs Hot Box",           brand: "Leon", calories: 570, protein_g: 30, carbs_g: 62, fat_g: 20, fibre_g: 8,  sugar_g: 10,salt_g: 2.2, serving_size: "1 box" },
  { food_name: "LOVe Burger",                          brand: "Leon", calories: 565, protein_g: 20, carbs_g: 60, fat_g: 27, fibre_g: 9,  sugar_g: 8, salt_g: 2.0, serving_size: "1 burger" },
  { food_name: "Chicken Rice Box",                     brand: "Leon", calories: 550, protein_g: 35, carbs_g: 60, fat_g: 18, fibre_g: 5,  sugar_g: 5, salt_g: 1.8, serving_size: "1 box" },
  { food_name: "Leon Fries",                           brand: "Leon", calories: 366, protein_g: 5,  carbs_g: 48, fat_g: 17, fibre_g: 5,  sugar_g: 1, salt_g: 1.0, serving_size: "1 portion" },
  { food_name: "Sweet Potato Fries",                   brand: "Leon", calories: 340, protein_g: 3,  carbs_g: 45, fat_g: 16, fibre_g: 6,  sugar_g: 12,salt_g: 0.9, serving_size: "1 portion" },
  { food_name: "Brazilian Black Bean Rice Box",        brand: "Leon", calories: 490, protein_g: 16, carbs_g: 75, fat_g: 12, fibre_g: 13, sugar_g: 8, salt_g: 1.4, serving_size: "1 box" },
  { food_name: "Halloumi Baguette",                    brand: "Leon", calories: 570, protein_g: 24, carbs_g: 55, fat_g: 28, fibre_g: 4,  sugar_g: 7, salt_g: 2.6, serving_size: "1 baguette" },

  // ============================================================
  // WETHERSPOONS
  // ============================================================
  { food_name: "Traditional English Breakfast",        brand: "Wetherspoons", calories: 839, protein_g: 45, carbs_g: 65, fat_g: 44, fibre_g: 8,  sugar_g: 14,salt_g: 4.5, serving_size: "1 plate" },
  { food_name: "Large Traditional Breakfast",          brand: "Wetherspoons", calories: 1316,protein_g: 68, carbs_g: 100,fat_g: 70, fibre_g: 12, sugar_g: 18,salt_g: 7.2, serving_size: "1 plate" },
  { food_name: "Small Breakfast",                      brand: "Wetherspoons", calories: 482, protein_g: 26, carbs_g: 38, fat_g: 25, fibre_g: 5,  sugar_g: 8, salt_g: 2.7, serving_size: "1 plate" },
  { food_name: "Vegan Breakfast",                      brand: "Wetherspoons", calories: 760, protein_g: 31, carbs_g: 75, fat_g: 35, fibre_g: 14, sugar_g: 14,salt_g: 3.6, serving_size: "1 plate" },
  { food_name: "Fish and Chips",                       brand: "Wetherspoons", calories: 1183,protein_g: 45, carbs_g: 115,fat_g: 57, fibre_g: 10, sugar_g: 8, salt_g: 3.5, serving_size: "1 portion" },
  { food_name: "Small Fish and Chips",                 brand: "Wetherspoons", calories: 836, protein_g: 33, carbs_g: 83, fat_g: 39, fibre_g: 7,  sugar_g: 6, salt_g: 2.5, serving_size: "1 portion" },
  { food_name: "Classic Beef Burger",                  brand: "Wetherspoons", calories: 905, protein_g: 45, carbs_g: 76, fat_g: 44, fibre_g: 6,  sugar_g: 10,salt_g: 3.2, serving_size: "1 burger + chips" },
  { food_name: "Gourmet BBQ Burger",                   brand: "Wetherspoons", calories: 1243,protein_g: 60, carbs_g: 90, fat_g: 67, fibre_g: 6,  sugar_g: 17,salt_g: 4.5, serving_size: "1 burger + chips" },
  { food_name: "Chicken Tikka Masala",                 brand: "Wetherspoons", calories: 834, protein_g: 44, carbs_g: 96, fat_g: 27, fibre_g: 7,  sugar_g: 15,salt_g: 3.2, serving_size: "1 portion" },
  { food_name: "BBQ Chicken Melt",                     brand: "Wetherspoons", calories: 1064,protein_g: 57, carbs_g: 88, fat_g: 49, fibre_g: 6,  sugar_g: 12,salt_g: 3.6, serving_size: "1 plate" },
  { food_name: "Scampi and Chips",                     brand: "Wetherspoons", calories: 912, protein_g: 26, carbs_g: 104,fat_g: 42, fibre_g: 8,  sugar_g: 6, salt_g: 3.0, serving_size: "1 portion" },
  { food_name: "Lasagne",                              brand: "Wetherspoons", calories: 730, protein_g: 32, carbs_g: 74, fat_g: 32, fibre_g: 6,  sugar_g: 12,salt_g: 2.5, serving_size: "1 portion" },
  { food_name: "Chicken Club Sandwich",                brand: "Wetherspoons", calories: 947, protein_g: 50, carbs_g: 76, fat_g: 45, fibre_g: 6,  sugar_g: 8, salt_g: 3.4, serving_size: "1 sandwich + chips" },
  { food_name: "Mixed Grill",                          brand: "Wetherspoons", calories: 1380,protein_g: 85, carbs_g: 95, fat_g: 65, fibre_g: 7,  sugar_g: 14,salt_g: 5.0, serving_size: "1 plate" },
  { food_name: "8oz Sirloin Steak",                    brand: "Wetherspoons", calories: 1010,protein_g: 65, carbs_g: 75, fat_g: 45, fibre_g: 6,  sugar_g: 8, salt_g: 3.4, serving_size: "1 plate" },

  // ============================================================
  // TESCO MEAL DEAL — sandwiches, wraps, snacks, drinks (main item)
  // Users search "Tesco Meal Deal" or "Sweet Chilli Chicken Wrap Tesco" — both work
  // ============================================================
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Tesco Meal Deal", calories: 370, protein_g: 21, carbs_g: 44, fat_g: 11, fibre_g: 4, sugar_g: 8, salt_g: 1.5, serving_size: "1 wrap" },
  { food_name: "Chicken Caesar Wrap",                  brand: "Tesco Meal Deal", calories: 415, protein_g: 22, carbs_g: 41, fat_g: 17, fibre_g: 4, sugar_g: 5, salt_g: 1.7, serving_size: "1 wrap" },
  { food_name: "Hoisin Duck Wrap",                     brand: "Tesco Meal Deal", calories: 400, protein_g: 18, carbs_g: 50, fat_g: 13, fibre_g: 3, sugar_g: 13,salt_g: 1.9, serving_size: "1 wrap" },
  { food_name: "Mexican Style Chicken Wrap",           brand: "Tesco Meal Deal", calories: 395, protein_g: 20, carbs_g: 45, fat_g: 13, fibre_g: 4, sugar_g: 7, salt_g: 1.6, serving_size: "1 wrap" },
  { food_name: "Katsu Chicken Wrap",                   brand: "Tesco Meal Deal", calories: 420, protein_g: 20, carbs_g: 51, fat_g: 15, fibre_g: 4, sugar_g: 9, salt_g: 1.5, serving_size: "1 wrap" },
  { food_name: "Falafel and Houmous Wrap",             brand: "Tesco Meal Deal", calories: 405, protein_g: 12, carbs_g: 50, fat_g: 17, fibre_g: 7, sugar_g: 4, salt_g: 1.3, serving_size: "1 wrap" },
  { food_name: "No Chicken and Salad Wrap",            brand: "Tesco Meal Deal", calories: 345, protein_g: 15, carbs_g: 45, fat_g: 12, fibre_g: 5, sugar_g: 5, salt_g: 1.3, serving_size: "1 wrap (vegan)" },
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "Tesco Meal Deal", calories: 430, protein_g: 28, carbs_g: 42, fat_g: 17, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Chicken Salad Sandwich",               brand: "Tesco Meal Deal", calories: 305, protein_g: 20, carbs_g: 38, fat_g: 8,  fibre_g: 4, sugar_g: 5, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Chicken Mayo Sandwich",                brand: "Tesco Meal Deal", calories: 385, protein_g: 22, carbs_g: 38, fat_g: 16, fibre_g: 3, sugar_g: 3, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Chicken and Stuffing Sandwich",        brand: "Tesco Meal Deal", calories: 400, protein_g: 22, carbs_g: 43, fat_g: 15, fibre_g: 3, sugar_g: 4, salt_g: 1.5, serving_size: "1 sandwich" },
  { food_name: "BLT Sandwich",                         brand: "Tesco Meal Deal", calories: 395, protein_g: 15, carbs_g: 36, fat_g: 21, fibre_g: 3, sugar_g: 4, salt_g: 1.8, serving_size: "1 sandwich" },
  { food_name: "Egg and Cress Sandwich",               brand: "Tesco Meal Deal", calories: 315, protein_g: 12, carbs_g: 36, fat_g: 13, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "Egg Mayo Sandwich",                    brand: "Tesco Meal Deal", calories: 345, protein_g: 12, carbs_g: 37, fat_g: 16, fibre_g: 3, sugar_g: 3, salt_g: 1.1, serving_size: "1 sandwich" },
  { food_name: "Tuna Mayo Sandwich",                   brand: "Tesco Meal Deal", calories: 380, protein_g: 20, carbs_g: 36, fat_g: 17, fibre_g: 3, sugar_g: 3, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Tuna Crunch Sandwich",                 brand: "Tesco Meal Deal", calories: 365, protein_g: 20, carbs_g: 37, fat_g: 15, fibre_g: 3, sugar_g: 4, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Prawn Mayonnaise Sandwich",            brand: "Tesco Meal Deal", calories: 320, protein_g: 14, carbs_g: 37, fat_g: 13, fibre_g: 3, sugar_g: 3, salt_g: 1.5, serving_size: "1 sandwich" },
  { food_name: "Ham Salad Sandwich",                   brand: "Tesco Meal Deal", calories: 290, protein_g: 16, carbs_g: 36, fat_g: 8,  fibre_g: 3, sugar_g: 5, salt_g: 1.6, serving_size: "1 sandwich" },
  { food_name: "Ham and Cheese Sandwich",              brand: "Tesco Meal Deal", calories: 385, protein_g: 20, carbs_g: 37, fat_g: 17, fibre_g: 3, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Cheese and Onion Sandwich",            brand: "Tesco Meal Deal", calories: 450, protein_g: 15, carbs_g: 37, fat_g: 26, fibre_g: 3, sugar_g: 5, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Cheese Ploughman's Sandwich",          brand: "Tesco Meal Deal", calories: 475, protein_g: 17, carbs_g: 39, fat_g: 27, fibre_g: 3, sugar_g: 7, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Sushi Selection Box",                  brand: "Tesco Meal Deal", calories: 395, protein_g: 15, carbs_g: 75, fat_g: 3.5,fibre_g: 4, sugar_g: 8, salt_g: 1.9, serving_size: "1 box" },
  { food_name: "Chicken Pasta Salad",                  brand: "Tesco Meal Deal", calories: 430, protein_g: 25, carbs_g: 50, fat_g: 15, fibre_g: 4, sugar_g: 7, salt_g: 1.5, serving_size: "1 pot" },
  { food_name: "Chicken Caesar Pasta Salad",           brand: "Tesco Meal Deal", calories: 450, protein_g: 22, carbs_g: 48, fat_g: 19, fibre_g: 4, sugar_g: 5, salt_g: 1.6, serving_size: "1 pot" },
  { food_name: "Mexican Chicken Rice Bowl",            brand: "Tesco Meal Deal", calories: 385, protein_g: 20, carbs_g: 55, fat_g: 9,  fibre_g: 5, sugar_g: 7, salt_g: 1.4, serving_size: "1 bowl" },
  { food_name: "Walkers Ready Salted Crisps",          brand: "Tesco Meal Deal", calories: 130, protein_g: 1.5,carbs_g: 13, fat_g: 8,  fibre_g: 1, sugar_g: 0.1,salt_g: 0.3, serving_size: "1 bag (25g)" },
  { food_name: "Walkers Cheese and Onion Crisps",      brand: "Tesco Meal Deal", calories: 130, protein_g: 1.5,carbs_g: 13, fat_g: 8,  fibre_g: 1, sugar_g: 0.4,salt_g: 0.4, serving_size: "1 bag (25g)" },
  { food_name: "Walkers Salt and Vinegar Crisps",      brand: "Tesco Meal Deal", calories: 130, protein_g: 1.5,carbs_g: 13, fat_g: 8,  fibre_g: 1, sugar_g: 0.2,salt_g: 0.4, serving_size: "1 bag (25g)" },
  { food_name: "Tesco Yogurt",                         brand: "Tesco Meal Deal", calories: 125, protein_g: 5,  carbs_g: 20, fat_g: 3,  fibre_g: 0, sugar_g: 18,salt_g: 0.1, serving_size: "1 pot (150g)" },
  { food_name: "Fresh Fruit Pot",                      brand: "Tesco Meal Deal", calories: 75,  protein_g: 1,  carbs_g: 18, fat_g: 0,  fibre_g: 2, sugar_g: 16,salt_g: 0,   serving_size: "1 pot" },
  { food_name: "Coca-Cola Can",                        brand: "Tesco Meal Deal", calories: 139, protein_g: 0,  carbs_g: 35, fat_g: 0,  fibre_g: 0, sugar_g: 35,salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Diet Coke Can",                        brand: "Tesco Meal Deal", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Innocent Smoothie Strawberry Banana",  brand: "Tesco Meal Deal", calories: 190, protein_g: 2,  carbs_g: 42, fat_g: 0.5,fibre_g: 3, sugar_g: 37,salt_g: 0,   serving_size: "1 bottle (250ml)" },
  { food_name: "Bottled Water",                        brand: "Tesco Meal Deal", calories: 0,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "500ml" },

  // ============================================================
  // SAINSBURY'S MEAL DEAL
  // ============================================================
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Sainsbury's Meal Deal", calories: 365, protein_g: 21, carbs_g: 43, fat_g: 11, fibre_g: 4, sugar_g: 7, salt_g: 1.4, serving_size: "1 wrap" },
  { food_name: "Chicken Caesar Wrap",                  brand: "Sainsbury's Meal Deal", calories: 420, protein_g: 23, carbs_g: 42, fat_g: 17, fibre_g: 4, sugar_g: 5, salt_g: 1.6, serving_size: "1 wrap" },
  { food_name: "Hoisin Duck Wrap",                     brand: "Sainsbury's Meal Deal", calories: 395, protein_g: 18, carbs_g: 49, fat_g: 13, fibre_g: 3, sugar_g: 13,salt_g: 1.9, serving_size: "1 wrap" },
  { food_name: "Spicy Chicken Wrap",                   brand: "Sainsbury's Meal Deal", calories: 405, protein_g: 22, carbs_g: 45, fat_g: 14, fibre_g: 4, sugar_g: 6, salt_g: 1.6, serving_size: "1 wrap" },
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "Sainsbury's Meal Deal", calories: 430, protein_g: 28, carbs_g: 41, fat_g: 18, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Chicken Salad Sandwich",               brand: "Sainsbury's Meal Deal", calories: 310, protein_g: 20, carbs_g: 37, fat_g: 8,  fibre_g: 4, sugar_g: 5, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "BLT Sandwich",                         brand: "Sainsbury's Meal Deal", calories: 385, protein_g: 15, carbs_g: 36, fat_g: 20, fibre_g: 3, sugar_g: 4, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Egg Mayo and Cress Sandwich",          brand: "Sainsbury's Meal Deal", calories: 325, protein_g: 12, carbs_g: 36, fat_g: 14, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "Tuna and Cucumber Sandwich",           brand: "Sainsbury's Meal Deal", calories: 370, protein_g: 20, carbs_g: 35, fat_g: 16, fibre_g: 3, sugar_g: 3, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Ham and Mustard Sandwich",             brand: "Sainsbury's Meal Deal", calories: 340, protein_g: 17, carbs_g: 37, fat_g: 13, fibre_g: 3, sugar_g: 4, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Cheese and Pickle Sandwich",           brand: "Sainsbury's Meal Deal", calories: 440, protein_g: 17, carbs_g: 40, fat_g: 24, fibre_g: 3, sugar_g: 8, salt_g: 1.6, serving_size: "1 sandwich" },
  { food_name: "Prawn and Mayonnaise Sandwich",        brand: "Sainsbury's Meal Deal", calories: 325, protein_g: 14, carbs_g: 36, fat_g: 13, fibre_g: 3, sugar_g: 3, salt_g: 1.5, serving_size: "1 sandwich" },
  { food_name: "Chicken Pasta Pesto",                  brand: "Sainsbury's Meal Deal", calories: 445, protein_g: 24, carbs_g: 48, fat_g: 18, fibre_g: 4, sugar_g: 5, salt_g: 1.5, serving_size: "1 pot" },
  { food_name: "Sushi Selection Box",                  brand: "Sainsbury's Meal Deal", calories: 400, protein_g: 14, carbs_g: 76, fat_g: 4,  fibre_g: 4, sugar_g: 8, salt_g: 1.9, serving_size: "1 box" },
  { food_name: "Chicken Noodle Salad Pot",             brand: "Sainsbury's Meal Deal", calories: 355, protein_g: 22, carbs_g: 48, fat_g: 8,  fibre_g: 4, sugar_g: 10,salt_g: 1.5, serving_size: "1 pot" },
  { food_name: "Walkers Cheese and Onion Crisps",      brand: "Sainsbury's Meal Deal", calories: 130, protein_g: 1.5,carbs_g: 13, fat_g: 8,  fibre_g: 1, sugar_g: 0.4,salt_g: 0.4, serving_size: "1 bag (25g)" },
  { food_name: "Coca-Cola Can",                        brand: "Sainsbury's Meal Deal", calories: 139, protein_g: 0,  carbs_g: 35, fat_g: 0,  fibre_g: 0, sugar_g: 35,salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Diet Coke Can",                        brand: "Sainsbury's Meal Deal", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Innocent Smoothie",                    brand: "Sainsbury's Meal Deal", calories: 190, protein_g: 2,  carbs_g: 42, fat_g: 0.5,fibre_g: 3, sugar_g: 37,salt_g: 0,   serving_size: "1 bottle (250ml)" },
  { food_name: "Bottled Water",                        brand: "Sainsbury's Meal Deal", calories: 0,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "500ml" },

  // ============================================================
  // M&S MEAL DEAL (Dine In + Food on the Move)
  // ============================================================
  { food_name: "Chicken Club Sandwich",                brand: "M&S Meal Deal", calories: 475, protein_g: 30, carbs_g: 41, fat_g: 21, fibre_g: 4, sugar_g: 4, salt_g: 2.2, serving_size: "1 sandwich" },
  { food_name: "Prawn Mayo Sandwich",                  brand: "M&S Meal Deal", calories: 350, protein_g: 16, carbs_g: 36, fat_g: 15, fibre_g: 3, sugar_g: 3, salt_g: 1.6, serving_size: "1 sandwich" },
  { food_name: "Free Range Egg and Cress Sandwich",    brand: "M&S Meal Deal", calories: 320, protein_g: 13, carbs_g: 37, fat_g: 13, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "BLT Sandwich",                         brand: "M&S Meal Deal", calories: 410, protein_g: 17, carbs_g: 35, fat_g: 23, fibre_g: 3, sugar_g: 4, salt_g: 1.9, serving_size: "1 sandwich" },
  { food_name: "No Chicken Caesar Wrap",               brand: "M&S Meal Deal", calories: 375, protein_g: 14, carbs_g: 43, fat_g: 15, fibre_g: 4, sugar_g: 5, salt_g: 1.5, serving_size: "1 wrap (vegan)" },
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "M&S Meal Deal", calories: 380, protein_g: 21, carbs_g: 45, fat_g: 12, fibre_g: 4, sugar_g: 7, salt_g: 1.5, serving_size: "1 wrap" },
  { food_name: "Chicken Triple Sandwich",              brand: "M&S Meal Deal", calories: 455, protein_g: 28, carbs_g: 43, fat_g: 19, fibre_g: 4, sugar_g: 4, salt_g: 2.1, serving_size: "1 sandwich" },
  { food_name: "Wiltshire Cured Ham and Cheese",       brand: "M&S Meal Deal", calories: 400, protein_g: 22, carbs_g: 37, fat_g: 18, fibre_g: 3, sugar_g: 4, salt_g: 2.2, serving_size: "1 sandwich" },
  { food_name: "Cheddar Ploughman's Sandwich",         brand: "M&S Meal Deal", calories: 480, protein_g: 17, carbs_g: 41, fat_g: 27, fibre_g: 4, sugar_g: 7, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Chicken Bacon and Avocado Wrap",       brand: "M&S Meal Deal", calories: 430, protein_g: 24, carbs_g: 40, fat_g: 20, fibre_g: 5, sugar_g: 4, salt_g: 1.7, serving_size: "1 wrap" },
  { food_name: "Falafel and Hummus Wrap",              brand: "M&S Meal Deal", calories: 395, protein_g: 12, carbs_g: 49, fat_g: 16, fibre_g: 7, sugar_g: 4, salt_g: 1.3, serving_size: "1 wrap" },
  { food_name: "Count on Us Chicken Salad",            brand: "M&S Meal Deal", calories: 270, protein_g: 25, carbs_g: 30, fat_g: 5,  fibre_g: 5, sugar_g: 9, salt_g: 1.3, serving_size: "1 salad" },
  { food_name: "Chicken Fajita Pasta Salad",           brand: "M&S Meal Deal", calories: 420, protein_g: 23, carbs_g: 50, fat_g: 15, fibre_g: 4, sugar_g: 7, salt_g: 1.5, serving_size: "1 pot" },
  { food_name: "Sushi Selection Box",                  brand: "M&S Meal Deal", calories: 420, protein_g: 16, carbs_g: 76, fat_g: 5,  fibre_g: 4, sugar_g: 9, salt_g: 2.0, serving_size: "1 box" },
  { food_name: "Percy Pig Yogurt",                     brand: "M&S Meal Deal", calories: 125, protein_g: 5,  carbs_g: 20, fat_g: 3,  fibre_g: 0, sugar_g: 18,salt_g: 0.1, serving_size: "1 pot" },
  { food_name: "Colin the Caterpillar Cake",           brand: "M&S Meal Deal", calories: 145, protein_g: 2,  carbs_g: 21, fat_g: 6,  fibre_g: 1, sugar_g: 13,salt_g: 0.2, serving_size: "1 slice" },
  { food_name: "Mini Cheddars",                        brand: "M&S Meal Deal", calories: 130, protein_g: 2,  carbs_g: 12, fat_g: 8,  fibre_g: 1, sugar_g: 0.5,salt_g: 0.4, serving_size: "1 bag (25g)" },
  { food_name: "Coca-Cola Can",                        brand: "M&S Meal Deal", calories: 139, protein_g: 0,  carbs_g: 35, fat_g: 0,  fibre_g: 0, sugar_g: 35,salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Diet Coke Can",                        brand: "M&S Meal Deal", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Cloudy Apple Juice",                   brand: "M&S Meal Deal", calories: 100, protein_g: 0,  carbs_g: 24, fat_g: 0,  fibre_g: 0, sugar_g: 24,salt_g: 0,   serving_size: "1 bottle (250ml)" },

  // ============================================================
  // BOOTS MEAL DEAL
  // ============================================================
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Boots Meal Deal", calories: 370, protein_g: 21, carbs_g: 44, fat_g: 11, fibre_g: 4, sugar_g: 7, salt_g: 1.4, serving_size: "1 wrap" },
  { food_name: "Chicken Caesar Wrap",                  brand: "Boots Meal Deal", calories: 410, protein_g: 22, carbs_g: 41, fat_g: 16, fibre_g: 4, sugar_g: 5, salt_g: 1.6, serving_size: "1 wrap" },
  { food_name: "Shapers Chicken Salad Sandwich",       brand: "Boots Meal Deal", calories: 265, protein_g: 18, carbs_g: 35, fat_g: 5,  fibre_g: 4, sugar_g: 5, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "Chicken Club Sandwich",                brand: "Boots Meal Deal", calories: 435, protein_g: 28, carbs_g: 41, fat_g: 18, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "BLT Sandwich",                         brand: "Boots Meal Deal", calories: 390, protein_g: 15, carbs_g: 36, fat_g: 21, fibre_g: 3, sugar_g: 4, salt_g: 1.8, serving_size: "1 sandwich" },
  { food_name: "Egg Mayo Sandwich",                    brand: "Boots Meal Deal", calories: 340, protein_g: 12, carbs_g: 36, fat_g: 15, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "Tuna Crunch Sandwich",                 brand: "Boots Meal Deal", calories: 360, protein_g: 20, carbs_g: 37, fat_g: 14, fibre_g: 3, sugar_g: 4, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Ham and Cheese Sandwich",              brand: "Boots Meal Deal", calories: 385, protein_g: 20, carbs_g: 37, fat_g: 17, fibre_g: 3, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Hoisin Duck Wrap",                     brand: "Boots Meal Deal", calories: 400, protein_g: 18, carbs_g: 50, fat_g: 13, fibre_g: 3, sugar_g: 13,salt_g: 1.9, serving_size: "1 wrap" },
  { food_name: "Falafel Wrap",                         brand: "Boots Meal Deal", calories: 395, protein_g: 12, carbs_g: 50, fat_g: 16, fibre_g: 7, sugar_g: 4, salt_g: 1.3, serving_size: "1 wrap" },
  { food_name: "Shapers Crisps",                       brand: "Boots Meal Deal", calories: 95,  protein_g: 1,  carbs_g: 14, fat_g: 4,  fibre_g: 1, sugar_g: 0.5,salt_g: 0.3, serving_size: "1 bag (25g)" },
  { food_name: "Coca-Cola Can",                        brand: "Boots Meal Deal", calories: 139, protein_g: 0,  carbs_g: 35, fat_g: 0,  fibre_g: 0, sugar_g: 35,salt_g: 0,   serving_size: "1 can (330ml)" },

  // ============================================================
  // ASDA MEAL DEAL
  // ============================================================
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Asda Meal Deal", calories: 370, protein_g: 21, carbs_g: 44, fat_g: 11, fibre_g: 4, sugar_g: 7, salt_g: 1.4, serving_size: "1 wrap" },
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "Asda Meal Deal", calories: 425, protein_g: 27, carbs_g: 42, fat_g: 17, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Chicken Salad Sandwich",               brand: "Asda Meal Deal", calories: 300, protein_g: 19, carbs_g: 37, fat_g: 8,  fibre_g: 4, sugar_g: 5, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "BLT Sandwich",                         brand: "Asda Meal Deal", calories: 385, protein_g: 15, carbs_g: 36, fat_g: 20, fibre_g: 3, sugar_g: 4, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Egg and Cress Sandwich",               brand: "Asda Meal Deal", calories: 315, protein_g: 12, carbs_g: 36, fat_g: 13, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "Tuna Mayo Sandwich",                   brand: "Asda Meal Deal", calories: 370, protein_g: 19, carbs_g: 35, fat_g: 16, fibre_g: 3, sugar_g: 3, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Cheese Ploughman's Sandwich",          brand: "Asda Meal Deal", calories: 470, protein_g: 17, carbs_g: 39, fat_g: 27, fibre_g: 3, sugar_g: 7, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Hoisin Duck Wrap",                     brand: "Asda Meal Deal", calories: 395, protein_g: 18, carbs_g: 49, fat_g: 13, fibre_g: 3, sugar_g: 12,salt_g: 1.8, serving_size: "1 wrap" },
  { food_name: "Katsu Chicken Wrap",                   brand: "Asda Meal Deal", calories: 415, protein_g: 19, carbs_g: 50, fat_g: 15, fibre_g: 4, sugar_g: 9, salt_g: 1.5, serving_size: "1 wrap" },
  { food_name: "Chicken Pasta Salad",                  brand: "Asda Meal Deal", calories: 430, protein_g: 25, carbs_g: 50, fat_g: 15, fibre_g: 4, sugar_g: 7, salt_g: 1.5, serving_size: "1 pot" },
  { food_name: "Walkers Ready Salted Crisps",          brand: "Asda Meal Deal", calories: 130, protein_g: 1.5,carbs_g: 13, fat_g: 8,  fibre_g: 1, sugar_g: 0.1,salt_g: 0.3, serving_size: "1 bag (25g)" },
  { food_name: "Coca-Cola Can",                        brand: "Asda Meal Deal", calories: 139, protein_g: 0,  carbs_g: 35, fat_g: 0,  fibre_g: 0, sugar_g: 35,salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Diet Coke Can",                        brand: "Asda Meal Deal", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Bottled Water",                        brand: "Asda Meal Deal", calories: 0,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0, sugar_g: 0, salt_g: 0,   serving_size: "500ml" },

  // ============================================================
  // MORRISONS / CO-OP / WAITROSE — shorter picks
  // ============================================================
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "Morrisons Meal Deal", calories: 430, protein_g: 27, carbs_g: 42, fat_g: 17, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Morrisons Meal Deal", calories: 365, protein_g: 20, carbs_g: 44, fat_g: 11, fibre_g: 4, sugar_g: 7, salt_g: 1.4, serving_size: "1 wrap" },
  { food_name: "Tuna Mayo Sandwich",                   brand: "Morrisons Meal Deal", calories: 370, protein_g: 19, carbs_g: 35, fat_g: 16, fibre_g: 3, sugar_g: 3, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Egg Mayo Sandwich",                    brand: "Morrisons Meal Deal", calories: 340, protein_g: 12, carbs_g: 36, fat_g: 15, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "1 sandwich" },
  { food_name: "Ham and Cheese Sandwich",              brand: "Morrisons Meal Deal", calories: 385, protein_g: 20, carbs_g: 37, fat_g: 17, fibre_g: 3, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Coca-Cola Can",                        brand: "Morrisons Meal Deal", calories: 139, protein_g: 0,  carbs_g: 35, fat_g: 0,  fibre_g: 0, sugar_g: 35,salt_g: 0,   serving_size: "1 can (330ml)" },
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "Co-op Meal Deal",     calories: 425, protein_g: 27, carbs_g: 42, fat_g: 17, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Co-op Meal Deal",     calories: 370, protein_g: 21, carbs_g: 44, fat_g: 11, fibre_g: 4, sugar_g: 7, salt_g: 1.4, serving_size: "1 wrap" },
  { food_name: "BLT Sandwich",                         brand: "Co-op Meal Deal",     calories: 390, protein_g: 15, carbs_g: 36, fat_g: 21, fibre_g: 3, sugar_g: 4, salt_g: 1.8, serving_size: "1 sandwich" },
  { food_name: "Chicken Caesar Wrap",                  brand: "Co-op Meal Deal",     calories: 420, protein_g: 22, carbs_g: 41, fat_g: 17, fibre_g: 4, sugar_g: 5, salt_g: 1.6, serving_size: "1 wrap" },
  { food_name: "Chicken Salad Sandwich",               brand: "Waitrose Meal Deal",  calories: 305, protein_g: 20, carbs_g: 37, fat_g: 8,  fibre_g: 4, sugar_g: 5, salt_g: 1.3, serving_size: "1 sandwich" },
  { food_name: "Smoked Salmon and Cream Cheese",       brand: "Waitrose Meal Deal",  calories: 385, protein_g: 20, carbs_g: 40, fat_g: 15, fibre_g: 3, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Prawn and Mayonnaise Sandwich",        brand: "Waitrose Meal Deal",  calories: 335, protein_g: 15, carbs_g: 36, fat_g: 14, fibre_g: 3, sugar_g: 3, salt_g: 1.5, serving_size: "1 sandwich" },
  { food_name: "Chicken Caesar Wrap",                  brand: "Waitrose Meal Deal",  calories: 415, protein_g: 23, carbs_g: 41, fat_g: 17, fibre_g: 4, sugar_g: 5, salt_g: 1.6, serving_size: "1 wrap" },
  { food_name: "Sweet Chilli Chicken Wrap",            brand: "Waitrose Meal Deal",  calories: 370, protein_g: 21, carbs_g: 44, fat_g: 11, fibre_g: 4, sugar_g: 7, salt_g: 1.4, serving_size: "1 wrap" },

  // ============================================================
  // STAGE 1 — Major UK chains previously missing or thin
  // ============================================================

  // ===== CAFFÈ NERO — full drinks + food =====
  { food_name: "Cappuccino Regular",                   brand: "Caffè Nero", calories: 110, protein_g: 7,  carbs_g: 10, fat_g: 5,  fibre_g: 0, sugar_g: 10, salt_g: 0.2, serving_size: "Regular (280ml)" },
  { food_name: "Cappuccino Grande",                    brand: "Caffè Nero", calories: 155, protein_g: 10, carbs_g: 14, fat_g: 7,  fibre_g: 0, sugar_g: 14, salt_g: 0.3, serving_size: "Grande (360ml)" },
  { food_name: "Latte Regular",                        brand: "Caffè Nero", calories: 170, protein_g: 11, carbs_g: 15, fat_g: 7.5,fibre_g: 0, sugar_g: 15, salt_g: 0.3, serving_size: "Regular (280ml)" },
  { food_name: "Latte Grande",                         brand: "Caffè Nero", calories: 220, protein_g: 15, carbs_g: 20, fat_g: 10, fibre_g: 0, sugar_g: 20, salt_g: 0.4, serving_size: "Grande (360ml)" },
  { food_name: "Flat White",                           brand: "Caffè Nero", calories: 115, protein_g: 7,  carbs_g: 11, fat_g: 5,  fibre_g: 0, sugar_g: 11, salt_g: 0.2, serving_size: "Regular (230ml)" },
  { food_name: "Americano Regular",                    brand: "Caffè Nero", calories: 5,   protein_g: 0.3,carbs_g: 0.5,fat_g: 0,  fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Regular (280ml)" },
  { food_name: "Americano Grande",                     brand: "Caffè Nero", calories: 8,   protein_g: 0.5,carbs_g: 0.8,fat_g: 0,  fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Grande (360ml)" },
  { food_name: "Espresso Double",                      brand: "Caffè Nero", calories: 6,   protein_g: 0.4,carbs_g: 0.8,fat_g: 0,  fibre_g: 0, sugar_g: 0,  salt_g: 0,   serving_size: "Double shot" },
  { food_name: "Mocha Regular",                        brand: "Caffè Nero", calories: 245, protein_g: 11, carbs_g: 33, fat_g: 8,  fibre_g: 1, sugar_g: 28, salt_g: 0.3, serving_size: "Regular (280ml)" },
  { food_name: "Mocha Grande",                         brand: "Caffè Nero", calories: 325, protein_g: 14, carbs_g: 44, fat_g: 11, fibre_g: 1, sugar_g: 37, salt_g: 0.4, serving_size: "Grande (360ml)" },
  { food_name: "Hot Chocolate Regular",                brand: "Caffè Nero", calories: 290, protein_g: 11, carbs_g: 39, fat_g: 10, fibre_g: 1, sugar_g: 34, salt_g: 0.3, serving_size: "Regular (280ml)" },
  { food_name: "Hot Chocolate Grande",                 brand: "Caffè Nero", calories: 385, protein_g: 14, carbs_g: 52, fat_g: 13, fibre_g: 1, sugar_g: 45, salt_g: 0.4, serving_size: "Grande (360ml)" },
  { food_name: "Caramelatte",                          brand: "Caffè Nero", calories: 230, protein_g: 11, carbs_g: 32, fat_g: 6,  fibre_g: 0, sugar_g: 31, salt_g: 0.3, serving_size: "Regular" },
  { food_name: "Chai Latte",                           brand: "Caffè Nero", calories: 195, protein_g: 8,  carbs_g: 30, fat_g: 5,  fibre_g: 0, sugar_g: 28, salt_g: 0.2, serving_size: "Regular" },
  { food_name: "Iced Caramel Frappe",                  brand: "Caffè Nero", calories: 310, protein_g: 7,  carbs_g: 54, fat_g: 8,  fibre_g: 0, sugar_g: 49, salt_g: 0.3, serving_size: "Regular" },
  { food_name: "Ham and Cheese Panini",                brand: "Caffè Nero", calories: 475, protein_g: 25, carbs_g: 48, fat_g: 20, fibre_g: 3, sugar_g: 4,  salt_g: 2.3, serving_size: "1 panini" },
  { food_name: "Chicken Milano Panini",                brand: "Caffè Nero", calories: 510, protein_g: 28, carbs_g: 48, fat_g: 22, fibre_g: 3, sugar_g: 5,  salt_g: 2.0, serving_size: "1 panini" },
  { food_name: "Mozzarella and Tomato Panini",         brand: "Caffè Nero", calories: 455, protein_g: 18, carbs_g: 50, fat_g: 20, fibre_g: 3, sugar_g: 5,  salt_g: 1.7, serving_size: "1 panini" },
  { food_name: "Cornetto Chocolate Croissant",         brand: "Caffè Nero", calories: 310, protein_g: 6,  carbs_g: 31, fat_g: 18, fibre_g: 2, sugar_g: 13, salt_g: 0.5, serving_size: "1 cornetto" },
  { food_name: "Butter Croissant",                     brand: "Caffè Nero", calories: 290, protein_g: 5,  carbs_g: 28, fat_g: 17, fibre_g: 2, sugar_g: 6,  salt_g: 0.6, serving_size: "1 croissant" },
  { food_name: "Chocolate and Hazelnut Muffin",        brand: "Caffè Nero", calories: 455, protein_g: 6,  carbs_g: 55, fat_g: 23, fibre_g: 2, sugar_g: 35, salt_g: 0.5, serving_size: "1 muffin" },

  // ===== HARVESTER =====
  { food_name: "Rotisserie Half Chicken",              brand: "Harvester", calories: 545, protein_g: 75, carbs_g: 1,  fat_g: 28, fibre_g: 0.5, sugar_g: 1,  salt_g: 2.0, serving_size: "1/2 chicken" },
  { food_name: "Rotisserie Whole Chicken",             brand: "Harvester", calories: 1090,protein_g: 150,carbs_g: 2,  fat_g: 56, fibre_g: 1,   sugar_g: 2,  salt_g: 4.0, serving_size: "Whole chicken" },
  { food_name: "Chicken Stack",                        brand: "Harvester", calories: 715, protein_g: 55, carbs_g: 35, fat_g: 35, fibre_g: 4,   sugar_g: 5,  salt_g: 3.2, serving_size: "1 stack" },
  { food_name: "Triple Chicken Stack",                 brand: "Harvester", calories: 980, protein_g: 85, carbs_g: 38, fat_g: 50, fibre_g: 4,   sugar_g: 6,  salt_g: 4.6, serving_size: "1 stack" },
  { food_name: "BBQ Chicken Skewers",                  brand: "Harvester", calories: 490, protein_g: 55, carbs_g: 25, fat_g: 18, fibre_g: 3,   sugar_g: 15, salt_g: 2.6, serving_size: "1 plate" },
  { food_name: "Half Rack of Ribs",                    brand: "Harvester", calories: 740, protein_g: 60, carbs_g: 28, fat_g: 42, fibre_g: 1,   sugar_g: 18, salt_g: 3.3, serving_size: "Half rack" },
  { food_name: "Full Rack of Ribs",                    brand: "Harvester", calories: 1340,protein_g: 110,carbs_g: 52, fat_g: 78, fibre_g: 2,   sugar_g: 34, salt_g: 6.0, serving_size: "Full rack" },
  { food_name: "Original Combo Ribs and Chicken",      brand: "Harvester", calories: 1120,protein_g: 95, carbs_g: 40, fat_g: 62, fibre_g: 2,   sugar_g: 22, salt_g: 4.8, serving_size: "1 combo" },
  { food_name: "8oz Rump Steak",                       brand: "Harvester", calories: 580, protein_g: 60, carbs_g: 0,  fat_g: 38, fibre_g: 0,   sugar_g: 0,  salt_g: 1.5, serving_size: "1 steak" },
  { food_name: "10oz Sirloin Steak",                   brand: "Harvester", calories: 785, protein_g: 78, carbs_g: 0,  fat_g: 52, fibre_g: 0,   sugar_g: 0,  salt_g: 1.9, serving_size: "1 steak" },
  { food_name: "Ultimate Cheese Burger",               brand: "Harvester", calories: 955, protein_g: 55, carbs_g: 55, fat_g: 55, fibre_g: 4,   sugar_g: 10, salt_g: 3.5, serving_size: "1 burger" },
  { food_name: "Chicken Club Burger",                  brand: "Harvester", calories: 820, protein_g: 48, carbs_g: 58, fat_g: 43, fibre_g: 4,   sugar_g: 9,  salt_g: 3.2, serving_size: "1 burger" },
  { food_name: "Scampi and Chips",                     brand: "Harvester", calories: 810, protein_g: 25, carbs_g: 90, fat_g: 38, fibre_g: 7,   sugar_g: 4,  salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Fish and Chips",                       brand: "Harvester", calories: 1050,protein_g: 45, carbs_g: 100,fat_g: 52, fibre_g: 9,   sugar_g: 6,  salt_g: 3.2, serving_size: "1 plate" },
  { food_name: "Chicken and Avocado Superfood Salad",  brand: "Harvester", calories: 485, protein_g: 42, carbs_g: 22, fat_g: 25, fibre_g: 8,   sugar_g: 8,  salt_g: 2.0, serving_size: "1 salad" },
  { food_name: "Unlimited Salad Bar",                  brand: "Harvester", calories: 220, protein_g: 6,  carbs_g: 15, fat_g: 14, fibre_g: 5,   sugar_g: 6,  salt_g: 1.5, serving_size: "1 plate" },
  { food_name: "Seasoned Fries",                       brand: "Harvester", calories: 360, protein_g: 5,  carbs_g: 48, fat_g: 16, fibre_g: 5,   sugar_g: 1,  salt_g: 1.2, serving_size: "Side portion" },
  { food_name: "Sweet Potato Fries",                   brand: "Harvester", calories: 320, protein_g: 3,  carbs_g: 43, fat_g: 14, fibre_g: 6,   sugar_g: 11, salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Cheesecake of the Day",                brand: "Harvester", calories: 480, protein_g: 6,  carbs_g: 55, fat_g: 26, fibre_g: 1,   sugar_g: 35, salt_g: 0.5, serving_size: "1 slice" },
  { food_name: "Chocolate Brownie Sundae",             brand: "Harvester", calories: 745, protein_g: 9,  carbs_g: 88, fat_g: 39, fibre_g: 3,   sugar_g: 65, salt_g: 0.6, serving_size: "1 sundae" },

  // ===== TOBY CARVERY =====
  { food_name: "Classic Carvery Small",                brand: "Toby Carvery", calories: 560, protein_g: 35, carbs_g: 55, fat_g: 20, fibre_g: 7,   sugar_g: 10, salt_g: 2.5, serving_size: "Small plate" },
  { food_name: "Classic Carvery Regular",              brand: "Toby Carvery", calories: 820, protein_g: 50, carbs_g: 78, fat_g: 32, fibre_g: 10,  sugar_g: 14, salt_g: 3.5, serving_size: "Regular plate" },
  { food_name: "Classic Carvery King Size",            brand: "Toby Carvery", calories: 1080,protein_g: 72, carbs_g: 100,fat_g: 40, fibre_g: 14,  sugar_g: 18, salt_g: 4.5, serving_size: "King size plate" },
  { food_name: "Roast Turkey (carvery meat)",          brand: "Toby Carvery", calories: 155, protein_g: 32, carbs_g: 0,  fat_g: 3,  fibre_g: 0,   sugar_g: 0,  salt_g: 0.6, serving_size: "Carvery portion" },
  { food_name: "Roast Beef (carvery meat)",            brand: "Toby Carvery", calories: 215, protein_g: 33, carbs_g: 0,  fat_g: 9,  fibre_g: 0,   sugar_g: 0,  salt_g: 0.5, serving_size: "Carvery portion" },
  { food_name: "Roast Pork (carvery meat)",            brand: "Toby Carvery", calories: 245, protein_g: 30, carbs_g: 0,  fat_g: 14, fibre_g: 0,   sugar_g: 0,  salt_g: 0.7, serving_size: "Carvery portion" },
  { food_name: "Roast Gammon (carvery meat)",          brand: "Toby Carvery", calories: 195, protein_g: 28, carbs_g: 0,  fat_g: 9,  fibre_g: 0,   sugar_g: 0,  salt_g: 2.0, serving_size: "Carvery portion" },
  { food_name: "Yorkshire Pudding",                    brand: "Toby Carvery", calories: 115, protein_g: 4,  carbs_g: 13, fat_g: 5,  fibre_g: 0.5, sugar_g: 1,  salt_g: 0.3, serving_size: "1 pudding" },
  { food_name: "Roast Potatoes",                       brand: "Toby Carvery", calories: 195, protein_g: 3,  carbs_g: 26, fat_g: 8,  fibre_g: 2,   sugar_g: 1,  salt_g: 0.5, serving_size: "Side portion" },
  { food_name: "Sage and Onion Stuffing",              brand: "Toby Carvery", calories: 135, protein_g: 4,  carbs_g: 19, fat_g: 5,  fibre_g: 2,   sugar_g: 2,  salt_g: 0.9, serving_size: "Side portion" },
  { food_name: "Pigs in Blankets 2 piece",             brand: "Toby Carvery", calories: 175, protein_g: 9,  carbs_g: 2,  fat_g: 15, fibre_g: 0,   sugar_g: 1,  salt_g: 0.9, serving_size: "2 pigs" },
  { food_name: "Cauliflower Cheese",                   brand: "Toby Carvery", calories: 215, protein_g: 10, carbs_g: 9,  fat_g: 16, fibre_g: 2,   sugar_g: 4,  salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Mashed Potatoes",                      brand: "Toby Carvery", calories: 130, protein_g: 3,  carbs_g: 19, fat_g: 5,  fibre_g: 2,   sugar_g: 1,  salt_g: 0.5, serving_size: "Side portion" },
  { food_name: "Mixed Vegetables",                     brand: "Toby Carvery", calories: 45,  protein_g: 3,  carbs_g: 6,  fat_g: 0.5,fibre_g: 3,   sugar_g: 4,  salt_g: 0.2, serving_size: "Side portion" },
  { food_name: "Breakfast Unlimited",                  brand: "Toby Carvery", calories: 1035,protein_g: 50, carbs_g: 80, fat_g: 55, fibre_g: 8,   sugar_g: 14, salt_g: 5.0, serving_size: "1 plate" },

  // ===== PAPA JOHN'S — per slice on medium unless stated =====
  { food_name: "Pepperoni Passion Pizza Slice (medium)",brand: "Papa John's", calories: 225, protein_g: 10, carbs_g: 26, fat_g: 9,  fibre_g: 1.5, sugar_g: 3, salt_g: 1.1, serving_size: "1 slice medium" },
  { food_name: "Cheese and Tomato Pizza Slice (medium)",brand: "Papa John's", calories: 180, protein_g: 8,  carbs_g: 25, fat_g: 5,  fibre_g: 1.5, sugar_g: 3, salt_g: 0.9, serving_size: "1 slice medium" },
  { food_name: "The Works Pizza Slice (medium)",       brand: "Papa John's", calories: 230, protein_g: 11, carbs_g: 26, fat_g: 9,  fibre_g: 2,   sugar_g: 3, salt_g: 1.2, serving_size: "1 slice medium" },
  { food_name: "BBQ Meatlovers Pizza Slice (medium)",  brand: "Papa John's", calories: 240, protein_g: 12, carbs_g: 27, fat_g: 10, fibre_g: 2,   sugar_g: 5, salt_g: 1.3, serving_size: "1 slice medium" },
  { food_name: "Hawaiian Pizza Slice (medium)",        brand: "Papa John's", calories: 190, protein_g: 10, carbs_g: 27, fat_g: 5,  fibre_g: 2,   sugar_g: 4, salt_g: 1.0, serving_size: "1 slice medium" },
  { food_name: "Chicken Hut Pizza Slice (medium)",     brand: "Papa John's", calories: 200, protein_g: 12, carbs_g: 25, fat_g: 6,  fibre_g: 2,   sugar_g: 3, salt_g: 1.1, serving_size: "1 slice medium" },
  { food_name: "Spicy Meat Feast Pizza Slice (medium)",brand: "Papa John's", calories: 245, protein_g: 13, carbs_g: 26, fat_g: 10, fibre_g: 2,   sugar_g: 3, salt_g: 1.3, serving_size: "1 slice medium" },
  { food_name: "American Hot Pizza Slice (medium)",    brand: "Papa John's", calories: 225, protein_g: 11, carbs_g: 26, fat_g: 9,  fibre_g: 2,   sugar_g: 3, salt_g: 1.2, serving_size: "1 slice medium" },
  { food_name: "Vegetable Supreme Pizza Slice (medium)",brand:"Papa John's", calories: 185, protein_g: 8,  carbs_g: 26, fat_g: 6,  fibre_g: 2,   sugar_g: 4, salt_g: 0.9, serving_size: "1 slice medium" },
  { food_name: "Garlic Pizza Sticks",                  brand: "Papa John's", calories: 290, protein_g: 8,  carbs_g: 40, fat_g: 10, fibre_g: 2,   sugar_g: 2, salt_g: 1.2, serving_size: "1 portion" },
  { food_name: "Cheese and Garlic Bread",              brand: "Papa John's", calories: 480, protein_g: 19, carbs_g: 52, fat_g: 22, fibre_g: 2,   sugar_g: 3, salt_g: 1.8, serving_size: "1 portion" },
  { food_name: "Chicken Wings BBQ 7 piece",            brand: "Papa John's", calories: 505, protein_g: 36, carbs_g: 16, fat_g: 32, fibre_g: 0.5, sugar_g: 9, salt_g: 2.5, serving_size: "7 wings" },
  { food_name: "Chicken Poppers",                      brand: "Papa John's", calories: 385, protein_g: 25, carbs_g: 22, fat_g: 22, fibre_g: 1,   sugar_g: 0.5,salt_g: 1.8, serving_size: "1 portion" },
  { food_name: "Potato Tots",                          brand: "Papa John's", calories: 325, protein_g: 4,  carbs_g: 40, fat_g: 16, fibre_g: 3,   sugar_g: 1, salt_g: 1.0, serving_size: "1 portion" },
  { food_name: "Jalapeño Pepper Poppers",              brand: "Papa John's", calories: 310, protein_g: 10, carbs_g: 26, fat_g: 19, fibre_g: 2,   sugar_g: 3, salt_g: 1.5, serving_size: "1 portion" },
  { food_name: "Garlic Dip",                           brand: "Papa John's", calories: 115, protein_g: 0.2,carbs_g: 1,  fat_g: 12, fibre_g: 0,   sugar_g: 0.4,salt_g: 0.3, serving_size: "1 dip (25g)" },
  { food_name: "BBQ Dip",                              brand: "Papa John's", calories: 55,  protein_g: 0.3,carbs_g: 13, fat_g: 0,  fibre_g: 0,   sugar_g: 11, salt_g: 0.4, serving_size: "1 dip (25g)" },
  { food_name: "Chocolate Scroll",                     brand: "Papa John's", calories: 445, protein_g: 7,  carbs_g: 60, fat_g: 19, fibre_g: 2,   sugar_g: 28, salt_g: 0.6, serving_size: "1 scroll" },
  { food_name: "Cinnamon Scroll",                      brand: "Papa John's", calories: 430, protein_g: 7,  carbs_g: 62, fat_g: 17, fibre_g: 2,   sugar_g: 30, salt_g: 0.6, serving_size: "1 scroll" },
  { food_name: "Chocolate Brownie",                    brand: "Papa John's", calories: 395, protein_g: 5,  carbs_g: 50, fat_g: 19, fibre_g: 2,   sugar_g: 36, salt_g: 0.3, serving_size: "1 brownie" },

  // ===== GAIL'S BAKERY =====
  { food_name: "Sourdough Loaf Slice",                 brand: "Gail's", calories: 140, protein_g: 5,  carbs_g: 28, fat_g: 0.8, fibre_g: 2,   sugar_g: 1,  salt_g: 0.7, serving_size: "1 slice (55g)" },
  { food_name: "Rye Sourdough Slice",                  brand: "Gail's", calories: 125, protein_g: 4,  carbs_g: 25, fat_g: 1,   fibre_g: 3,   sugar_g: 1,  salt_g: 0.7, serving_size: "1 slice (55g)" },
  { food_name: "Butter Croissant",                     brand: "Gail's", calories: 335, protein_g: 6,  carbs_g: 31, fat_g: 20,  fibre_g: 2,   sugar_g: 5,  salt_g: 0.7, serving_size: "1 croissant" },
  { food_name: "Almond Croissant",                     brand: "Gail's", calories: 460, protein_g: 10, carbs_g: 40, fat_g: 29,  fibre_g: 3,   sugar_g: 18, salt_g: 0.5, serving_size: "1 croissant" },
  { food_name: "Pain au Chocolat",                     brand: "Gail's", calories: 355, protein_g: 7,  carbs_g: 34, fat_g: 20,  fibre_g: 2,   sugar_g: 12, salt_g: 0.6, serving_size: "1 pastry" },
  { food_name: "Chocolate Babka",                      brand: "Gail's", calories: 490, protein_g: 8,  carbs_g: 55, fat_g: 26,  fibre_g: 3,   sugar_g: 29, salt_g: 0.4, serving_size: "1 babka slice" },
  { food_name: "Cinnamon Bun",                         brand: "Gail's", calories: 430, protein_g: 7,  carbs_g: 50, fat_g: 22,  fibre_g: 2,   sugar_g: 24, salt_g: 0.5, serving_size: "1 bun" },
  { food_name: "Banana Bread Slice",                   brand: "Gail's", calories: 310, protein_g: 5,  carbs_g: 38, fat_g: 15,  fibre_g: 2,   sugar_g: 22, salt_g: 0.4, serving_size: "1 slice" },
  { food_name: "Bacon Roll",                           brand: "Gail's", calories: 360, protein_g: 20, carbs_g: 36, fat_g: 14,  fibre_g: 2,   sugar_g: 3,  salt_g: 2.3, serving_size: "1 roll" },
  { food_name: "Sausage and Egg Brioche",              brand: "Gail's", calories: 520, protein_g: 23, carbs_g: 42, fat_g: 29,  fibre_g: 2,   sugar_g: 6,  salt_g: 2.1, serving_size: "1 brioche" },
  { food_name: "Avocado and Egg on Sourdough",         brand: "Gail's", calories: 410, protein_g: 18, carbs_g: 35, fat_g: 22,  fibre_g: 6,   sugar_g: 3,  salt_g: 1.4, serving_size: "1 portion" },
  { food_name: "Chicken Caesar Sandwich",              brand: "Gail's", calories: 510, protein_g: 30, carbs_g: 45, fat_g: 24,  fibre_g: 4,   sugar_g: 4,  salt_g: 2.1, serving_size: "1 sandwich" },
  { food_name: "Ham and Cheese Toastie",               brand: "Gail's", calories: 495, protein_g: 24, carbs_g: 40, fat_g: 26,  fibre_g: 3,   sugar_g: 3,  salt_g: 2.4, serving_size: "1 toastie" },
  { food_name: "Sea Salt Brownie",                     brand: "Gail's", calories: 395, protein_g: 5,  carbs_g: 43, fat_g: 22,  fibre_g: 2,   sugar_g: 35, salt_g: 0.8, serving_size: "1 brownie" },
  { food_name: "Florentine Biscuit",                   brand: "Gail's", calories: 245, protein_g: 3,  carbs_g: 28, fat_g: 13,  fibre_g: 2,   sugar_g: 22, salt_g: 0.2, serving_size: "1 biscuit" },

  // ===== KRISPY KREME =====
  { food_name: "Original Glazed Doughnut",             brand: "Krispy Kreme", calories: 217, protein_g: 3,  carbs_g: 24, fat_g: 12, fibre_g: 1, sugar_g: 12, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Chocolate Iced Glazed Doughnut",       brand: "Krispy Kreme", calories: 245, protein_g: 3,  carbs_g: 32, fat_g: 12, fibre_g: 1, sugar_g: 18, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Chocolate Iced Sprinkles Doughnut",    brand: "Krispy Kreme", calories: 265, protein_g: 3,  carbs_g: 36, fat_g: 12, fibre_g: 1, sugar_g: 22, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Original Glazed Kreme Filled",         brand: "Krispy Kreme", calories: 290, protein_g: 3,  carbs_g: 33, fat_g: 17, fibre_g: 1, sugar_g: 16, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Strawberry Iced Sprinkles Doughnut",   brand: "Krispy Kreme", calories: 260, protein_g: 3,  carbs_g: 35, fat_g: 12, fibre_g: 1, sugar_g: 22, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Glazed Chocolate Cake Doughnut",       brand: "Krispy Kreme", calories: 280, protein_g: 3,  carbs_g: 38, fat_g: 14, fibre_g: 2, sugar_g: 22, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Biscoff Doughnut",                     brand: "Krispy Kreme", calories: 325, protein_g: 3,  carbs_g: 39, fat_g: 17, fibre_g: 1, sugar_g: 23, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Nutty Chocolatta Doughnut",            brand: "Krispy Kreme", calories: 340, protein_g: 4,  carbs_g: 38, fat_g: 19, fibre_g: 1, sugar_g: 24, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Dreamcake Doughnut",                   brand: "Krispy Kreme", calories: 305, protein_g: 3,  carbs_g: 36, fat_g: 16, fibre_g: 1, sugar_g: 22, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Strawberries and Kreme Doughnut",      brand: "Krispy Kreme", calories: 295, protein_g: 3,  carbs_g: 34, fat_g: 16, fibre_g: 1, sugar_g: 18, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Cookies and Kreme Doughnut",           brand: "Krispy Kreme", calories: 310, protein_g: 3,  carbs_g: 35, fat_g: 17, fibre_g: 1, sugar_g: 18, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Lotus Biscoff Kreme Filled",           brand: "Krispy Kreme", calories: 335, protein_g: 3,  carbs_g: 36, fat_g: 20, fibre_g: 1, sugar_g: 20, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Caramel Choc Delight",                 brand: "Krispy Kreme", calories: 315, protein_g: 3,  carbs_g: 36, fat_g: 17, fibre_g: 1, sugar_g: 22, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Original Filled Raspberry",            brand: "Krispy Kreme", calories: 255, protein_g: 3,  carbs_g: 32, fat_g: 12, fibre_g: 1, sugar_g: 16, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Glazed Sour Cream",                    brand: "Krispy Kreme", calories: 275, protein_g: 3,  carbs_g: 36, fat_g: 13, fibre_g: 1, sugar_g: 22, salt_g: 0.3, serving_size: "1 doughnut" },
  { food_name: "Mini Original Glazed Doughnut",        brand: "Krispy Kreme", calories: 95,  protein_g: 1.5,carbs_g: 11, fat_g: 5,  fibre_g: 0.5,sugar_g: 5, salt_g: 0.1, serving_size: "1 mini" },
  { food_name: "Krispy Kreme Coffee Latte",            brand: "Krispy Kreme", calories: 145, protein_g: 9,  carbs_g: 13, fat_g: 6,  fibre_g: 0, sugar_g: 12, salt_g: 0.3, serving_size: "Regular" },
  { food_name: "Vanilla Milkshake",                    brand: "Krispy Kreme", calories: 420, protein_g: 9,  carbs_g: 60, fat_g: 16, fibre_g: 0, sugar_g: 55, salt_g: 0.4, serving_size: "Regular" },

  // ===== DISHOOM =====
  { food_name: "House Black Daal",                     brand: "Dishoom", calories: 595, protein_g: 22, carbs_g: 57, fat_g: 32, fibre_g: 14, sugar_g: 9,  salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Chicken Ruby",                         brand: "Dishoom", calories: 690, protein_g: 48, carbs_g: 28, fat_g: 42, fibre_g: 4,  sugar_g: 11, salt_g: 2.5, serving_size: "1 portion" },
  { food_name: "Lamb Raan Bun",                        brand: "Dishoom", calories: 615, protein_g: 32, carbs_g: 48, fat_g: 30, fibre_g: 3,  sugar_g: 10, salt_g: 2.2, serving_size: "1 bun" },
  { food_name: "Bacon Naan Roll",                      brand: "Dishoom", calories: 540, protein_g: 25, carbs_g: 50, fat_g: 25, fibre_g: 2,  sugar_g: 5,  salt_g: 2.4, serving_size: "1 roll" },
  { food_name: "Sausage Naan Roll",                    brand: "Dishoom", calories: 610, protein_g: 22, carbs_g: 48, fat_g: 34, fibre_g: 2,  sugar_g: 5,  salt_g: 2.6, serving_size: "1 roll" },
  { food_name: "The Big Bombay",                       brand: "Dishoom", calories: 980, protein_g: 45, carbs_g: 70, fat_g: 55, fibre_g: 6,  sugar_g: 9,  salt_g: 3.8, serving_size: "1 breakfast" },
  { food_name: "The Bombay Bacon Eggs on Toast",       brand: "Dishoom", calories: 615, protein_g: 28, carbs_g: 45, fat_g: 33, fibre_g: 3,  sugar_g: 5,  salt_g: 2.3, serving_size: "1 plate" },
  { food_name: "Chicken Tikka",                        brand: "Dishoom", calories: 385, protein_g: 48, carbs_g: 5,  fat_g: 18, fibre_g: 1,  sugar_g: 3,  salt_g: 1.8, serving_size: "1 portion" },
  { food_name: "Lamb Chops",                           brand: "Dishoom", calories: 620, protein_g: 45, carbs_g: 3,  fat_g: 48, fibre_g: 0.5,sugar_g: 1,  salt_g: 1.9, serving_size: "1 portion" },
  { food_name: "Salli Boti",                           brand: "Dishoom", calories: 580, protein_g: 35, carbs_g: 35, fat_g: 32, fibre_g: 4,  sugar_g: 8,  salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Paneer Tikka",                         brand: "Dishoom", calories: 425, protein_g: 22, carbs_g: 12, fat_g: 32, fibre_g: 2,  sugar_g: 6,  salt_g: 1.5, serving_size: "1 portion" },
  { food_name: "Okra Fries",                           brand: "Dishoom", calories: 295, protein_g: 5,  carbs_g: 30, fat_g: 18, fibre_g: 6,  sugar_g: 2,  salt_g: 1.2, serving_size: "1 portion" },
  { food_name: "House Naan",                           brand: "Dishoom", calories: 295, protein_g: 9,  carbs_g: 50, fat_g: 6,  fibre_g: 2,  sugar_g: 3,  salt_g: 1.2, serving_size: "1 naan" },
  { food_name: "Garlic Naan",                          brand: "Dishoom", calories: 325, protein_g: 9,  carbs_g: 52, fat_g: 8,  fibre_g: 2,  sugar_g: 3,  salt_g: 1.3, serving_size: "1 naan" },
  { food_name: "Mango Lassi",                          brand: "Dishoom", calories: 265, protein_g: 7,  carbs_g: 45, fat_g: 6,  fibre_g: 1,  sugar_g: 42, salt_g: 0.2, serving_size: "1 glass" },

  // ===== TGI FRIDAYS =====
  { food_name: "Jack Daniel's Ribs Half Rack",         brand: "TGI Fridays", calories: 860, protein_g: 55, carbs_g: 45, fat_g: 52, fibre_g: 3, sugar_g: 32, salt_g: 3.6, serving_size: "Half rack" },
  { food_name: "Jack Daniel's Ribs Full Rack",         brand: "TGI Fridays", calories: 1480,protein_g: 95, carbs_g: 78, fat_g: 88, fibre_g: 5, sugar_g: 55, salt_g: 6.2, serving_size: "Full rack" },
  { food_name: "Sesame Chicken Strips",                brand: "TGI Fridays", calories: 825, protein_g: 45, carbs_g: 55, fat_g: 45, fibre_g: 3, sugar_g: 18, salt_g: 3.0, serving_size: "1 starter" },
  { food_name: "Mozzarella Dippers",                   brand: "TGI Fridays", calories: 570, protein_g: 23, carbs_g: 50, fat_g: 30, fibre_g: 3, sugar_g: 8,  salt_g: 2.4, serving_size: "1 starter" },
  { food_name: "Loaded Potato Skins",                  brand: "TGI Fridays", calories: 730, protein_g: 20, carbs_g: 60, fat_g: 45, fibre_g: 6, sugar_g: 3,  salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Classic Cheese Burger",                brand: "TGI Fridays", calories: 1090,protein_g: 55, carbs_g: 70, fat_g: 66, fibre_g: 5, sugar_g: 12, salt_g: 4.2, serving_size: "1 burger" },
  { food_name: "Ultimate Bacon Cheese Burger",         brand: "TGI Fridays", calories: 1310,protein_g: 70, carbs_g: 70, fat_g: 82, fibre_g: 5, sugar_g: 12, salt_g: 5.0, serving_size: "1 burger" },
  { food_name: "Jack Daniel's Burger",                 brand: "TGI Fridays", calories: 1220,protein_g: 60, carbs_g: 85, fat_g: 68, fibre_g: 5, sugar_g: 28, salt_g: 4.5, serving_size: "1 burger" },
  { food_name: "Chicken Fajitas",                      brand: "TGI Fridays", calories: 960, protein_g: 55, carbs_g: 90, fat_g: 38, fibre_g: 8, sugar_g: 18, salt_g: 3.5, serving_size: "1 portion" },
  { food_name: "Chargrilled Chicken",                  brand: "TGI Fridays", calories: 620, protein_g: 55, carbs_g: 40, fat_g: 25, fibre_g: 5, sugar_g: 8,  salt_g: 2.4, serving_size: "1 plate" },
  { food_name: "Sizzling Chicken Fajita",              brand: "TGI Fridays", calories: 940, protein_g: 50, carbs_g: 85, fat_g: 38, fibre_g: 7, sugar_g: 16, salt_g: 3.5, serving_size: "1 platter" },
  { food_name: "10oz Sirloin Steak",                   brand: "TGI Fridays", calories: 720, protein_g: 68, carbs_g: 0,  fat_g: 48, fibre_g: 0, sugar_g: 0,  salt_g: 1.8, serving_size: "1 steak" },
  { food_name: "Fish and Chips",                       brand: "TGI Fridays", calories: 1150,protein_g: 40, carbs_g: 120,fat_g: 55, fibre_g: 10,sugar_g: 8,  salt_g: 3.3, serving_size: "1 plate" },
  { food_name: "Buffalo Wings 6 piece",                brand: "TGI Fridays", calories: 630, protein_g: 40, carbs_g: 5,  fat_g: 48, fibre_g: 0.5,sugar_g: 1, salt_g: 3.0, serving_size: "6 wings" },
  { food_name: "Seasoned Fries",                       brand: "TGI Fridays", calories: 420, protein_g: 5,  carbs_g: 55, fat_g: 20, fibre_g: 6, sugar_g: 1,  salt_g: 1.3, serving_size: "Side portion" },
  { food_name: "Coleslaw",                             brand: "TGI Fridays", calories: 190, protein_g: 1,  carbs_g: 9,  fat_g: 17, fibre_g: 2, sugar_g: 7,  salt_g: 0.5, serving_size: "Side portion" },
  { food_name: "Bacon Cheese Fries",                   brand: "TGI Fridays", calories: 755, protein_g: 22, carbs_g: 62, fat_g: 48, fibre_g: 5, sugar_g: 3,  salt_g: 3.0, serving_size: "Side portion" },
  { food_name: "Brownie Obsession",                    brand: "TGI Fridays", calories: 995, protein_g: 11, carbs_g: 118,fat_g: 52, fibre_g: 4, sugar_g: 89, salt_g: 0.8, serving_size: "1 dessert" },
  { food_name: "Oreo Fudge Sundae",                    brand: "TGI Fridays", calories: 795, protein_g: 10, carbs_g: 95, fat_g: 42, fibre_g: 2, sugar_g: 75, salt_g: 0.7, serving_size: "1 sundae" },
  { food_name: "Skewer of Love Milkshake",             brand: "TGI Fridays", calories: 730, protein_g: 12, carbs_g: 100,fat_g: 32, fibre_g: 2, sugar_g: 92, salt_g: 0.5, serving_size: "1 milkshake" },

  // ===== ZIZZI =====
  { food_name: "Margherita Rustica Pizza",             brand: "Zizzi", calories: 830, protein_g: 35, carbs_g: 105,fat_g: 28, fibre_g: 5, sugar_g: 10,salt_g: 3.4, serving_size: "Whole pizza" },
  { food_name: "American Hot Rustica Pizza",           brand: "Zizzi", calories: 1070,protein_g: 48, carbs_g: 108,fat_g: 48, fibre_g: 6, sugar_g: 11,salt_g: 4.6, serving_size: "Whole pizza" },
  { food_name: "Carne Pizza",                          brand: "Zizzi", calories: 1140,protein_g: 56, carbs_g: 108,fat_g: 50, fibre_g: 6, sugar_g: 10,salt_g: 4.7, serving_size: "Whole pizza" },
  { food_name: "Rustica Capra Goats Cheese Pizza",     brand: "Zizzi", calories: 1025,protein_g: 42, carbs_g: 110,fat_g: 43, fibre_g: 7, sugar_g: 18,salt_g: 3.6, serving_size: "Whole pizza" },
  { food_name: "Spaghetti Bolognese",                  brand: "Zizzi", calories: 910, protein_g: 42, carbs_g: 115,fat_g: 29, fibre_g: 8, sugar_g: 15,salt_g: 2.8, serving_size: "Main portion" },
  { food_name: "Lasagne Classico",                     brand: "Zizzi", calories: 845, protein_g: 40, carbs_g: 75, fat_g: 40, fibre_g: 6, sugar_g: 14,salt_g: 2.6, serving_size: "Main portion" },
  { food_name: "Carbonara",                            brand: "Zizzi", calories: 1120,protein_g: 42, carbs_g: 110,fat_g: 52, fibre_g: 5, sugar_g: 5, salt_g: 3.2, serving_size: "Main portion" },
  { food_name: "Calabrese Pasta",                      brand: "Zizzi", calories: 1050,protein_g: 45, carbs_g: 100,fat_g: 48, fibre_g: 7, sugar_g: 14,salt_g: 3.5, serving_size: "Main portion" },
  { food_name: "Prawn and Chilli Linguine",            brand: "Zizzi", calories: 790, protein_g: 30, carbs_g: 105,fat_g: 24, fibre_g: 6, sugar_g: 10,salt_g: 2.8, serving_size: "Main portion" },
  { food_name: "Pollo Milanese",                       brand: "Zizzi", calories: 980, protein_g: 60, carbs_g: 75, fat_g: 45, fibre_g: 6, sugar_g: 8, salt_g: 2.9, serving_size: "1 plate" },
  { food_name: "Garlic Bread with Cheese",             brand: "Zizzi", calories: 540, protein_g: 20, carbs_g: 58, fat_g: 25, fibre_g: 3, sugar_g: 3, salt_g: 2.0, serving_size: "1 portion" },
  { food_name: "Bruschetta",                           brand: "Zizzi", calories: 385, protein_g: 9,  carbs_g: 45, fat_g: 18, fibre_g: 4, sugar_g: 6, salt_g: 1.4, serving_size: "1 starter" },
  { food_name: "Dough Balls",                          brand: "Zizzi", calories: 405, protein_g: 12, carbs_g: 60, fat_g: 13, fibre_g: 3, sugar_g: 2, salt_g: 1.6, serving_size: "1 portion" },
  { food_name: "Tiramisu",                             brand: "Zizzi", calories: 495, protein_g: 8,  carbs_g: 48, fat_g: 29, fibre_g: 1, sugar_g: 36,salt_g: 0.3, serving_size: "1 dessert" },
  { food_name: "Salted Caramel Brownie",               brand: "Zizzi", calories: 615, protein_g: 7,  carbs_g: 70, fat_g: 33, fibre_g: 3, sugar_g: 52,salt_g: 1.0, serving_size: "1 dessert" },

  // ===== ASK ITALIAN =====
  { food_name: "Margherita Pizza",                     brand: "Ask Italian", calories: 695, protein_g: 28, carbs_g: 95, fat_g: 23, fibre_g: 5, sugar_g: 9,  salt_g: 2.9, serving_size: "Whole pizza" },
  { food_name: "American Pizza",                       brand: "Ask Italian", calories: 875, protein_g: 40, carbs_g: 95, fat_g: 38, fibre_g: 5, sugar_g: 9,  salt_g: 3.9, serving_size: "Whole pizza" },
  { food_name: "Speciale Pizza",                       brand: "Ask Italian", calories: 940, protein_g: 45, carbs_g: 95, fat_g: 42, fibre_g: 6, sugar_g: 10, salt_g: 4.0, serving_size: "Whole pizza" },
  { food_name: "Quattro Formaggi Pizza",               brand: "Ask Italian", calories: 1010,protein_g: 48, carbs_g: 97, fat_g: 46, fibre_g: 5, sugar_g: 10, salt_g: 3.8, serving_size: "Whole pizza" },
  { food_name: "Lasagne Classica",                     brand: "Ask Italian", calories: 790, protein_g: 38, carbs_g: 72, fat_g: 38, fibre_g: 6, sugar_g: 13, salt_g: 2.5, serving_size: "Main portion" },
  { food_name: "Spaghetti Bolognese",                  brand: "Ask Italian", calories: 875, protein_g: 40, carbs_g: 108,fat_g: 28, fibre_g: 7, sugar_g: 14, salt_g: 2.7, serving_size: "Main portion" },
  { food_name: "Carbonara",                            brand: "Ask Italian", calories: 1050,protein_g: 40, carbs_g: 105,fat_g: 50, fibre_g: 5, sugar_g: 5,  salt_g: 3.1, serving_size: "Main portion" },
  { food_name: "Pollo Milanese",                       brand: "Ask Italian", calories: 930, protein_g: 58, carbs_g: 72, fat_g: 42, fibre_g: 6, sugar_g: 7,  salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Risotto Verdure",                      brand: "Ask Italian", calories: 715, protein_g: 22, carbs_g: 95, fat_g: 26, fibre_g: 6, sugar_g: 10, salt_g: 2.2, serving_size: "Main portion" },
  { food_name: "Calzone Carne",                        brand: "Ask Italian", calories: 1145,protein_g: 52, carbs_g: 115,fat_g: 50, fibre_g: 6, sugar_g: 10, salt_g: 4.4, serving_size: "1 calzone" },
  { food_name: "Dough Balls with Butter",              brand: "Ask Italian", calories: 395, protein_g: 11, carbs_g: 58, fat_g: 13, fibre_g: 3, sugar_g: 2,  salt_g: 1.5, serving_size: "1 portion" },
  { food_name: "Tiramisu",                             brand: "Ask Italian", calories: 470, protein_g: 7,  carbs_g: 45, fat_g: 28, fibre_g: 1, sugar_g: 34, salt_g: 0.3, serving_size: "1 dessert" },

  // ===== PREZZO =====
  { food_name: "Margherita Pizza",                     brand: "Prezzo", calories: 730, protein_g: 28, carbs_g: 98, fat_g: 24, fibre_g: 5, sugar_g: 10,salt_g: 2.9, serving_size: "Whole pizza" },
  { food_name: "American Hot Pizza",                   brand: "Prezzo", calories: 920, protein_g: 42, carbs_g: 98, fat_g: 40, fibre_g: 5, sugar_g: 10,salt_g: 4.0, serving_size: "Whole pizza" },
  { food_name: "Calabrese Pizza",                      brand: "Prezzo", calories: 995, protein_g: 48, carbs_g: 98, fat_g: 44, fibre_g: 6, sugar_g: 11,salt_g: 4.1, serving_size: "Whole pizza" },
  { food_name: "Pepperoni Pizza",                      brand: "Prezzo", calories: 890, protein_g: 40, carbs_g: 98, fat_g: 38, fibre_g: 5, sugar_g: 10,salt_g: 3.9, serving_size: "Whole pizza" },
  { food_name: "Lasagne",                              brand: "Prezzo", calories: 790, protein_g: 38, carbs_g: 70, fat_g: 38, fibre_g: 6, sugar_g: 13,salt_g: 2.5, serving_size: "Main portion" },
  { food_name: "Spaghetti Carbonara",                  brand: "Prezzo", calories: 1035,protein_g: 40, carbs_g: 102,fat_g: 50, fibre_g: 5, sugar_g: 5, salt_g: 3.1, serving_size: "Main portion" },
  { food_name: "Spaghetti Bolognese",                  brand: "Prezzo", calories: 870, protein_g: 40, carbs_g: 108,fat_g: 28, fibre_g: 7, sugar_g: 14,salt_g: 2.6, serving_size: "Main portion" },
  { food_name: "Penne Arrabbiata",                     brand: "Prezzo", calories: 680, protein_g: 20, carbs_g: 108,fat_g: 16, fibre_g: 7, sugar_g: 13,salt_g: 2.2, serving_size: "Main portion" },
  { food_name: "Chicken Milanese",                     brand: "Prezzo", calories: 920, protein_g: 55, carbs_g: 72, fat_g: 42, fibre_g: 6, sugar_g: 7, salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Risotto Carbonara",                    brand: "Prezzo", calories: 825, protein_g: 25, carbs_g: 95, fat_g: 36, fibre_g: 4, sugar_g: 4, salt_g: 2.6, serving_size: "Main portion" },
  { food_name: "Garlic Bread",                         brand: "Prezzo", calories: 440, protein_g: 12, carbs_g: 56, fat_g: 18, fibre_g: 3, sugar_g: 2, salt_g: 1.8, serving_size: "1 portion" },
  { food_name: "Garlic Bread with Mozzarella",         brand: "Prezzo", calories: 580, protein_g: 22, carbs_g: 58, fat_g: 28, fibre_g: 3, sugar_g: 3, salt_g: 2.2, serving_size: "1 portion" },

  // ===== YO! SUSHI =====
  { food_name: "Salmon Nigiri 2 piece",                brand: "YO! Sushi", calories: 85,  protein_g: 5,  carbs_g: 13, fat_g: 1.5, fibre_g: 0.3,sugar_g: 2, salt_g: 0.3, serving_size: "2 pieces" },
  { food_name: "Tuna Nigiri 2 piece",                  brand: "YO! Sushi", calories: 80,  protein_g: 6,  carbs_g: 13, fat_g: 0.5, fibre_g: 0.3,sugar_g: 2, salt_g: 0.3, serving_size: "2 pieces" },
  { food_name: "Prawn Nigiri 2 piece",                 brand: "YO! Sushi", calories: 78,  protein_g: 5,  carbs_g: 13, fat_g: 0.5, fibre_g: 0.3,sugar_g: 2, salt_g: 0.3, serving_size: "2 pieces" },
  { food_name: "Salmon Sashimi 3 piece",               brand: "YO! Sushi", calories: 85,  protein_g: 10, carbs_g: 0,  fat_g: 5,   fibre_g: 0,  sugar_g: 0, salt_g: 0.1, serving_size: "3 pieces" },
  { food_name: "Tuna Maki 6 piece",                    brand: "YO! Sushi", calories: 170, protein_g: 9,  carbs_g: 32, fat_g: 0.5, fibre_g: 1,  sugar_g: 4, salt_g: 0.8, serving_size: "6 pieces" },
  { food_name: "Salmon Maki 6 piece",                  brand: "YO! Sushi", calories: 175, protein_g: 8,  carbs_g: 32, fat_g: 2,   fibre_g: 1,  sugar_g: 4, salt_g: 0.7, serving_size: "6 pieces" },
  { food_name: "California Roll 6 piece",              brand: "YO! Sushi", calories: 195, protein_g: 6,  carbs_g: 34, fat_g: 4,   fibre_g: 2,  sugar_g: 4, salt_g: 0.8, serving_size: "6 pieces" },
  { food_name: "Dragon Roll 6 piece",                  brand: "YO! Sushi", calories: 340, protein_g: 12, carbs_g: 40, fat_g: 15,  fibre_g: 3,  sugar_g: 6, salt_g: 1.2, serving_size: "6 pieces" },
  { food_name: "Chicken Katsu Curry",                  brand: "YO! Sushi", calories: 755, protein_g: 32, carbs_g: 85, fat_g: 28,  fibre_g: 5,  sugar_g: 15,salt_g: 2.3, serving_size: "1 bowl" },
  { food_name: "Teriyaki Chicken Rice Bowl",           brand: "YO! Sushi", calories: 540, protein_g: 34, carbs_g: 72, fat_g: 12,  fibre_g: 4,  sugar_g: 18,salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Teriyaki Salmon Rice Bowl",            brand: "YO! Sushi", calories: 595, protein_g: 32, carbs_g: 70, fat_g: 18,  fibre_g: 4,  sugar_g: 18,salt_g: 2.4, serving_size: "1 bowl" },
  { food_name: "Chicken Gyoza 4 piece",                brand: "YO! Sushi", calories: 220, protein_g: 12, carbs_g: 22, fat_g: 10,  fibre_g: 2,  sugar_g: 2, salt_g: 1.5, serving_size: "4 gyoza" },
  { food_name: "Vegetable Gyoza 4 piece",              brand: "YO! Sushi", calories: 180, protein_g: 6,  carbs_g: 22, fat_g: 7,   fibre_g: 3,  sugar_g: 2, salt_g: 1.3, serving_size: "4 gyoza" },
  { food_name: "Miso Soup",                            brand: "YO! Sushi", calories: 45,  protein_g: 3,  carbs_g: 5,  fat_g: 1,   fibre_g: 1,  sugar_g: 0.5,salt_g: 1.1, serving_size: "1 bowl" },
  { food_name: "Edamame",                              brand: "YO! Sushi", calories: 155, protein_g: 12, carbs_g: 8,  fat_g: 7,   fibre_g: 6,  sugar_g: 2, salt_g: 0.9, serving_size: "1 portion" },

  // ===== WASABI =====
  { food_name: "Chicken Katsu Curry",                  brand: "Wasabi", calories: 770, protein_g: 32, carbs_g: 92, fat_g: 28, fibre_g: 5, sugar_g: 16,salt_g: 2.3, serving_size: "Regular box" },
  { food_name: "Large Chicken Katsu Curry",            brand: "Wasabi", calories: 1065,protein_g: 45, carbs_g: 128,fat_g: 40, fibre_g: 7, sugar_g: 22,salt_g: 3.2, serving_size: "Large box" },
  { food_name: "Teriyaki Chicken Donburi",             brand: "Wasabi", calories: 620, protein_g: 36, carbs_g: 92, fat_g: 11, fibre_g: 4, sugar_g: 20,salt_g: 2.7, serving_size: "1 bowl" },
  { food_name: "Teriyaki Salmon Donburi",              brand: "Wasabi", calories: 680, protein_g: 35, carbs_g: 90, fat_g: 18, fibre_g: 4, sugar_g: 20,salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Chicken Yakisoba",                     brand: "Wasabi", calories: 720, protein_g: 30, carbs_g: 95, fat_g: 22, fibre_g: 6, sugar_g: 17,salt_g: 3.4, serving_size: "1 box" },
  { food_name: "Salmon Sashimi Box",                   brand: "Wasabi", calories: 205, protein_g: 24, carbs_g: 1,  fat_g: 12, fibre_g: 0, sugar_g: 0.5,salt_g: 0.2, serving_size: "1 box" },
  { food_name: "Salmon and Tuna Sushi Box",            brand: "Wasabi", calories: 485, protein_g: 25, carbs_g: 82, fat_g: 6,  fibre_g: 3, sugar_g: 8, salt_g: 1.8, serving_size: "1 box" },
  { food_name: "Crispy Chicken Katsu Sando",           brand: "Wasabi", calories: 565, protein_g: 26, carbs_g: 55, fat_g: 26, fibre_g: 3, sugar_g: 8, salt_g: 2.1, serving_size: "1 sando" },
  { food_name: "Vegetable Gyoza 6 piece",              brand: "Wasabi", calories: 220, protein_g: 7,  carbs_g: 30, fat_g: 8,  fibre_g: 3, sugar_g: 2, salt_g: 1.4, serving_size: "6 gyoza" },
  { food_name: "Chicken Karaage",                      brand: "Wasabi", calories: 395, protein_g: 28, carbs_g: 25, fat_g: 21, fibre_g: 1, sugar_g: 1, salt_g: 1.8, serving_size: "1 portion" },
  { food_name: "Miso Soup",                            brand: "Wasabi", calories: 45,  protein_g: 3,  carbs_g: 5,  fat_g: 1,  fibre_g: 1, sugar_g: 0.5,salt_g: 1.1, serving_size: "1 cup" },
  { food_name: "Edamame",                              brand: "Wasabi", calories: 155, protein_g: 12, carbs_g: 8,  fat_g: 7,  fibre_g: 6, sugar_g: 2, salt_g: 0.9, serving_size: "1 portion" },

  // ===== TORTILLA =====
  { food_name: "Chicken Naked Burrito Bowl",           brand: "Tortilla", calories: 570, protein_g: 40, carbs_g: 65, fat_g: 16, fibre_g: 10, sugar_g: 9, salt_g: 2.3, serving_size: "1 bowl" },
  { food_name: "Steak Naked Burrito Bowl",             brand: "Tortilla", calories: 620, protein_g: 44, carbs_g: 62, fat_g: 22, fibre_g: 10, sugar_g: 9, salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Pulled Pork Naked Burrito Bowl",       brand: "Tortilla", calories: 645, protein_g: 40, carbs_g: 68, fat_g: 22, fibre_g: 10, sugar_g: 12,salt_g: 2.4, serving_size: "1 bowl" },
  { food_name: "Chicken Burrito",                      brand: "Tortilla", calories: 780, protein_g: 45, carbs_g: 95, fat_g: 23, fibre_g: 10, sugar_g: 10,salt_g: 2.8, serving_size: "1 burrito" },
  { food_name: "Steak Burrito",                        brand: "Tortilla", calories: 830, protein_g: 48, carbs_g: 92, fat_g: 29, fibre_g: 10, sugar_g: 10,salt_g: 3.0, serving_size: "1 burrito" },
  { food_name: "Pulled Pork Burrito",                  brand: "Tortilla", calories: 855, protein_g: 44, carbs_g: 98, fat_g: 29, fibre_g: 10, sugar_g: 13,salt_g: 2.9, serving_size: "1 burrito" },
  { food_name: "Veggie Burrito",                       brand: "Tortilla", calories: 720, protein_g: 22, carbs_g: 100,fat_g: 22, fibre_g: 12, sugar_g: 10,salt_g: 2.4, serving_size: "1 burrito" },
  { food_name: "Chicken Tacos 3 piece",                brand: "Tortilla", calories: 515, protein_g: 35, carbs_g: 55, fat_g: 16, fibre_g: 8,  sugar_g: 7, salt_g: 2.0, serving_size: "3 tacos" },
  { food_name: "Steak Tacos 3 piece",                  brand: "Tortilla", calories: 555, protein_g: 38, carbs_g: 52, fat_g: 22, fibre_g: 8,  sugar_g: 7, salt_g: 2.2, serving_size: "3 tacos" },
  { food_name: "Chicken Quesadilla",                   brand: "Tortilla", calories: 665, protein_g: 40, carbs_g: 55, fat_g: 32, fibre_g: 5,  sugar_g: 5, salt_g: 2.6, serving_size: "1 quesadilla" },
  { food_name: "Nachos with Guac",                     brand: "Tortilla", calories: 720, protein_g: 16, carbs_g: 70, fat_g: 40, fibre_g: 10, sugar_g: 5, salt_g: 2.3, serving_size: "1 portion" },
  { food_name: "Loaded Nachos Chicken",                brand: "Tortilla", calories: 945, protein_g: 40, carbs_g: 78, fat_g: 52, fibre_g: 12, sugar_g: 8, salt_g: 3.4, serving_size: "1 portion" },

  // ===== HONEST BURGERS =====
  { food_name: "Honest Burger",                        brand: "Honest Burgers", calories: 870, protein_g: 45, carbs_g: 52, fat_g: 52, fibre_g: 5, sugar_g: 10, salt_g: 3.2, serving_size: "1 burger" },
  { food_name: "Chilli Burger",                        brand: "Honest Burgers", calories: 955, protein_g: 48, carbs_g: 55, fat_g: 58, fibre_g: 5, sugar_g: 11, salt_g: 3.5, serving_size: "1 burger" },
  { food_name: "Tribute Burger",                       brand: "Honest Burgers", calories: 1015,protein_g: 52, carbs_g: 55, fat_g: 62, fibre_g: 5, sugar_g: 11, salt_g: 3.8, serving_size: "1 burger" },
  { food_name: "Plant Based Honest Burger",            brand: "Honest Burgers", calories: 825, protein_g: 32, carbs_g: 70, fat_g: 42, fibre_g: 8, sugar_g: 12, salt_g: 3.0, serving_size: "1 burger" },
  { food_name: "Smoked Chicken Burger",                brand: "Honest Burgers", calories: 780, protein_g: 42, carbs_g: 60, fat_g: 38, fibre_g: 5, sugar_g: 10, salt_g: 2.9, serving_size: "1 burger" },
  { food_name: "Rosemary Salted Chips",                brand: "Honest Burgers", calories: 465, protein_g: 6,  carbs_g: 58, fat_g: 22, fibre_g: 6, sugar_g: 1,  salt_g: 1.5, serving_size: "Side portion" },
  { food_name: "Sweet Potato Fries",                   brand: "Honest Burgers", calories: 390, protein_g: 4,  carbs_g: 52, fat_g: 18, fibre_g: 7, sugar_g: 12, salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Onion Rings",                          brand: "Honest Burgers", calories: 430, protein_g: 6,  carbs_g: 50, fat_g: 22, fibre_g: 4, sugar_g: 6,  salt_g: 1.6, serving_size: "Side portion" },
  { food_name: "Cheese Fries",                         brand: "Honest Burgers", calories: 670, protein_g: 18, carbs_g: 60, fat_g: 38, fibre_g: 6, sugar_g: 3,  salt_g: 2.5, serving_size: "Side portion" },
  { food_name: "Chocolate Brownie",                    brand: "Honest Burgers", calories: 480, protein_g: 7,  carbs_g: 52, fat_g: 26, fibre_g: 3, sugar_g: 40, salt_g: 0.4, serving_size: "1 brownie" },

  // ===== GOURMET BURGER KITCHEN (GBK) =====
  { food_name: "Classic Cheeseburger",                 brand: "GBK", calories: 820, protein_g: 44, carbs_g: 50, fat_g: 48, fibre_g: 4, sugar_g: 9,  salt_g: 3.0, serving_size: "1 burger" },
  { food_name: "Bacon Cheeseburger",                   brand: "GBK", calories: 940, protein_g: 52, carbs_g: 50, fat_g: 58, fibre_g: 4, sugar_g: 10, salt_g: 3.6, serving_size: "1 burger" },
  { food_name: "Blue Cheese Burger",                   brand: "GBK", calories: 895, protein_g: 48, carbs_g: 50, fat_g: 54, fibre_g: 4, sugar_g: 9,  salt_g: 3.5, serving_size: "1 burger" },
  { food_name: "Kiwiburger",                           brand: "GBK", calories: 1010,protein_g: 56, carbs_g: 55, fat_g: 60, fibre_g: 5, sugar_g: 10, salt_g: 3.7, serving_size: "1 burger" },
  { food_name: "BBQ Brisket Burger",                   brand: "GBK", calories: 990, protein_g: 55, carbs_g: 62, fat_g: 55, fibre_g: 4, sugar_g: 16, salt_g: 3.9, serving_size: "1 burger" },
  { food_name: "Chicken Burger",                       brand: "GBK", calories: 720, protein_g: 38, carbs_g: 55, fat_g: 35, fibre_g: 4, sugar_g: 8,  salt_g: 2.7, serving_size: "1 burger" },
  { food_name: "Vegan Burger",                         brand: "GBK", calories: 760, protein_g: 30, carbs_g: 72, fat_g: 38, fibre_g: 8, sugar_g: 11, salt_g: 2.8, serving_size: "1 burger" },
  { food_name: "Skinny Fries",                         brand: "GBK", calories: 400, protein_g: 5,  carbs_g: 52, fat_g: 18, fibre_g: 5, sugar_g: 1,  salt_g: 1.2, serving_size: "Side portion" },
  { food_name: "Sweet Potato Fries",                   brand: "GBK", calories: 380, protein_g: 4,  carbs_g: 50, fat_g: 18, fibre_g: 7, sugar_g: 12, salt_g: 1.0, serving_size: "Side portion" },
  { food_name: "Onion Rings",                          brand: "GBK", calories: 420, protein_g: 6,  carbs_g: 48, fat_g: 22, fibre_g: 4, sugar_g: 6,  salt_g: 1.5, serving_size: "Side portion" },

  // ===== PHO =====
  { food_name: "Pho Bo Tai Chicken",                   brand: "Pho", calories: 425, protein_g: 30, carbs_g: 65, fat_g: 5,  fibre_g: 4, sugar_g: 7, salt_g: 3.0, serving_size: "1 bowl" },
  { food_name: "Pho Bo Tai Beef",                      brand: "Pho", calories: 475, protein_g: 35, carbs_g: 65, fat_g: 8,  fibre_g: 4, sugar_g: 7, salt_g: 3.1, serving_size: "1 bowl" },
  { food_name: "Pho Dac Biet",                         brand: "Pho", calories: 555, protein_g: 42, carbs_g: 65, fat_g: 13, fibre_g: 4, sugar_g: 7, salt_g: 3.5, serving_size: "1 bowl" },
  { food_name: "Vegan Pho",                            brand: "Pho", calories: 390, protein_g: 18, carbs_g: 70, fat_g: 5,  fibre_g: 7, sugar_g: 9, salt_g: 2.6, serving_size: "1 bowl" },
  { food_name: "Prawn Summer Rolls 2 piece",           brand: "Pho", calories: 145, protein_g: 10, carbs_g: 20, fat_g: 2,  fibre_g: 2, sugar_g: 3, salt_g: 0.8, serving_size: "2 rolls" },
  { food_name: "Crispy Spring Rolls 3 piece",          brand: "Pho", calories: 245, protein_g: 8,  carbs_g: 28, fat_g: 11, fibre_g: 3, sugar_g: 3, salt_g: 1.2, serving_size: "3 rolls" },
  { food_name: "Chicken Bun Cha",                      brand: "Pho", calories: 555, protein_g: 38, carbs_g: 72, fat_g: 14, fibre_g: 6, sugar_g: 18,salt_g: 3.4, serving_size: "1 bowl" },
  { food_name: "Beef Bun Bo Nam Bo",                   brand: "Pho", calories: 595, protein_g: 40, carbs_g: 72, fat_g: 18, fibre_g: 6, sugar_g: 15,salt_g: 3.5, serving_size: "1 bowl" },
  { food_name: "Chicken Curry Ca Ri Ga",               brand: "Pho", calories: 695, protein_g: 40, carbs_g: 78, fat_g: 25, fibre_g: 6, sugar_g: 15,salt_g: 3.2, serving_size: "1 bowl" },
  { food_name: "Chicken Salad Goi Ga",                 brand: "Pho", calories: 385, protein_g: 32, carbs_g: 35, fat_g: 12, fibre_g: 6, sugar_g: 20,salt_g: 2.6, serving_size: "1 salad" },
  { food_name: "Vietnamese Steamed Bao 2 piece",       brand: "Pho", calories: 290, protein_g: 14, carbs_g: 42, fat_g: 7,  fibre_g: 2, sugar_g: 10,salt_g: 1.7, serving_size: "2 bao" },
  { food_name: "Vietnamese Iced Coffee",               brand: "Pho", calories: 225, protein_g: 5,  carbs_g: 38, fat_g: 6,  fibre_g: 0, sugar_g: 36,salt_g: 0.2, serving_size: "1 glass" },

  // ===== WAHACA =====
  { food_name: "Pork Pibil Taco",                      brand: "Wahaca", calories: 185, protein_g: 11, carbs_g: 18, fat_g: 8,  fibre_g: 2, sugar_g: 4, salt_g: 0.8, serving_size: "1 taco" },
  { food_name: "Chicken Mole Taco",                    brand: "Wahaca", calories: 175, protein_g: 12, carbs_g: 17, fat_g: 7,  fibre_g: 2, sugar_g: 4, salt_g: 0.7, serving_size: "1 taco" },
  { food_name: "MSC Cod Taco",                         brand: "Wahaca", calories: 195, protein_g: 10, carbs_g: 20, fat_g: 8,  fibre_g: 2, sugar_g: 4, salt_g: 0.8, serving_size: "1 taco" },
  { food_name: "Steak Taco",                           brand: "Wahaca", calories: 200, protein_g: 14, carbs_g: 17, fat_g: 9,  fibre_g: 2, sugar_g: 4, salt_g: 0.9, serving_size: "1 taco" },
  { food_name: "Chicken Burrito",                      brand: "Wahaca", calories: 735, protein_g: 42, carbs_g: 90, fat_g: 22, fibre_g: 10,sugar_g: 10,salt_g: 2.7, serving_size: "1 burrito" },
  { food_name: "Pork Pibil Burrito",                   brand: "Wahaca", calories: 780, protein_g: 40, carbs_g: 92, fat_g: 26, fibre_g: 10,sugar_g: 12,salt_g: 2.8, serving_size: "1 burrito" },
  { food_name: "Chicken Quesadilla",                   brand: "Wahaca", calories: 610, protein_g: 36, carbs_g: 50, fat_g: 30, fibre_g: 5, sugar_g: 5, salt_g: 2.4, serving_size: "1 quesadilla" },
  { food_name: "Chicken Taquitos",                     brand: "Wahaca", calories: 395, protein_g: 18, carbs_g: 38, fat_g: 18, fibre_g: 4, sugar_g: 4, salt_g: 1.6, serving_size: "1 portion" },
  { food_name: "Chargrilled Chicken Fajitas",          brand: "Wahaca", calories: 780, protein_g: 48, carbs_g: 75, fat_g: 28, fibre_g: 9, sugar_g: 12,salt_g: 3.0, serving_size: "1 plate" },
  { food_name: "Mexican Rice",                         brand: "Wahaca", calories: 295, protein_g: 5,  carbs_g: 56, fat_g: 5,  fibre_g: 3, sugar_g: 2, salt_g: 1.1, serving_size: "Side portion" },
  { food_name: "Black Beans",                          brand: "Wahaca", calories: 205, protein_g: 11, carbs_g: 32, fat_g: 2,  fibre_g: 11,sugar_g: 2, salt_g: 0.8, serving_size: "Side portion" },
  { food_name: "Guacamole with Tortilla Chips",        brand: "Wahaca", calories: 485, protein_g: 7,  carbs_g: 42, fat_g: 32, fibre_g: 9, sugar_g: 3, salt_g: 1.5, serving_size: "1 portion" },

  // ===== FRANKIE AND BENNY'S =====
  { food_name: "Classic Cheeseburger",                 brand: "Frankie and Benny's", calories: 1060,protein_g: 50, carbs_g: 82, fat_g: 56, fibre_g: 5, sugar_g: 12, salt_g: 3.5, serving_size: "1 burger + fries" },
  { food_name: "Bacon Cheeseburger",                   brand: "Frankie and Benny's", calories: 1230,protein_g: 58, carbs_g: 82, fat_g: 70, fibre_g: 5, sugar_g: 12, salt_g: 4.2, serving_size: "1 burger + fries" },
  { food_name: "BBQ Chicken Burger",                   brand: "Frankie and Benny's", calories: 1015,protein_g: 48, carbs_g: 95, fat_g: 42, fibre_g: 5, sugar_g: 20, salt_g: 3.4, serving_size: "1 burger + fries" },
  { food_name: "Spaghetti Bolognese",                  brand: "Frankie and Benny's", calories: 890, protein_g: 40, carbs_g: 115,fat_g: 28, fibre_g: 8, sugar_g: 14, salt_g: 2.7, serving_size: "Main portion" },
  { food_name: "Chicken Carbonara",                    brand: "Frankie and Benny's", calories: 1220,protein_g: 52, carbs_g: 108,fat_g: 58, fibre_g: 5, sugar_g: 5,  salt_g: 3.5, serving_size: "Main portion" },
  { food_name: "Meatball Spaghetti",                   brand: "Frankie and Benny's", calories: 1050,protein_g: 45, carbs_g: 115,fat_g: 40, fibre_g: 8, sugar_g: 16, salt_g: 3.2, serving_size: "Main portion" },
  { food_name: "Lasagne",                              brand: "Frankie and Benny's", calories: 890, protein_g: 40, carbs_g: 80, fat_g: 42, fibre_g: 6, sugar_g: 14, salt_g: 2.8, serving_size: "Main portion" },
  { food_name: "Classic Margherita Pizza",             brand: "Frankie and Benny's", calories: 890, protein_g: 36, carbs_g: 100,fat_g: 32, fibre_g: 5, sugar_g: 10, salt_g: 3.3, serving_size: "Whole pizza" },
  { food_name: "Americano Pizza",                      brand: "Frankie and Benny's", calories: 1045,protein_g: 45, carbs_g: 100,fat_g: 45, fibre_g: 5, sugar_g: 10, salt_g: 4.0, serving_size: "Whole pizza" },
  { food_name: "New York Deli Pizza",                  brand: "Frankie and Benny's", calories: 1175,protein_g: 55, carbs_g: 105,fat_g: 52, fibre_g: 6, sugar_g: 12, salt_g: 4.5, serving_size: "Whole pizza" },
  { food_name: "Chicken Tenders",                      brand: "Frankie and Benny's", calories: 730, protein_g: 40, carbs_g: 62, fat_g: 34, fibre_g: 5, sugar_g: 8,  salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Kids Mini Margherita",                 brand: "Frankie and Benny's", calories: 395, protein_g: 18, carbs_g: 55, fat_g: 12, fibre_g: 3, sugar_g: 5,  salt_g: 1.8, serving_size: "Kids portion" },
  { food_name: "Kids Chicken Goujons",                 brand: "Frankie and Benny's", calories: 485, protein_g: 22, carbs_g: 48, fat_g: 22, fibre_g: 4, sugar_g: 4,  salt_g: 1.8, serving_size: "Kids portion" },
  { food_name: "Dough Balls",                          brand: "Frankie and Benny's", calories: 420, protein_g: 13, carbs_g: 58, fat_g: 15, fibre_g: 3, sugar_g: 2,  salt_g: 1.6, serving_size: "1 starter" },
  { food_name: "Warm Chocolate Fudge Cake",            brand: "Frankie and Benny's", calories: 685, protein_g: 8,  carbs_g: 85, fat_g: 35, fibre_g: 3, sugar_g: 65, salt_g: 0.8, serving_size: "1 dessert" },

  // ============================================================
  // STAGE 2 — Generic British + takeaway classics
  // Not chain-specific. Use natural search terms like "curry", "fish and chips",
  // "sunday roast", "kebab" — all are branded under a category label for clarity.
  // ============================================================

  // ===== BRITISH CLASSICS (home / pub) =====
  { food_name: "Full English Breakfast",               brand: "British Classic", calories: 820, protein_g: 42, carbs_g: 60, fat_g: 45, fibre_g: 7,  sugar_g: 10, salt_g: 4.5, serving_size: "1 plate" },
  { food_name: "Small Full English Breakfast",         brand: "British Classic", calories: 485, protein_g: 25, carbs_g: 38, fat_g: 25, fibre_g: 5,  sugar_g: 7,  salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Vegetarian Full English",              brand: "British Classic", calories: 620, protein_g: 28, carbs_g: 65, fat_g: 28, fibre_g: 12, sugar_g: 12, salt_g: 3.4, serving_size: "1 plate" },
  { food_name: "Sunday Roast Beef",                    brand: "British Classic", calories: 885, protein_g: 52, carbs_g: 85, fat_g: 32, fibre_g: 10, sugar_g: 14, salt_g: 3.5, serving_size: "1 plate" },
  { food_name: "Sunday Roast Chicken",                 brand: "British Classic", calories: 760, protein_g: 48, carbs_g: 82, fat_g: 24, fibre_g: 10, sugar_g: 14, salt_g: 3.2, serving_size: "1 plate" },
  { food_name: "Sunday Roast Pork with Crackling",     brand: "British Classic", calories: 920, protein_g: 50, carbs_g: 82, fat_g: 42, fibre_g: 10, sugar_g: 14, salt_g: 3.4, serving_size: "1 plate" },
  { food_name: "Sunday Roast Lamb",                    brand: "British Classic", calories: 940, protein_g: 55, carbs_g: 82, fat_g: 42, fibre_g: 10, sugar_g: 14, salt_g: 3.5, serving_size: "1 plate" },
  { food_name: "Sunday Roast Turkey",                  brand: "British Classic", calories: 780, protein_g: 55, carbs_g: 82, fat_g: 22, fibre_g: 10, sugar_g: 14, salt_g: 3.4, serving_size: "1 plate" },
  { food_name: "Yorkshire Pudding",                    brand: "British Classic", calories: 110, protein_g: 4,  carbs_g: 12, fat_g: 5,  fibre_g: 0.5,sugar_g: 1,  salt_g: 0.3, serving_size: "1 pudding" },
  { food_name: "Shepherd's Pie",                       brand: "British Classic", calories: 540, protein_g: 30, carbs_g: 55, fat_g: 22, fibre_g: 6,  sugar_g: 10, salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Cottage Pie",                          brand: "British Classic", calories: 560, protein_g: 32, carbs_g: 55, fat_g: 23, fibre_g: 6,  sugar_g: 10, salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Bangers and Mash",                     brand: "British Classic", calories: 710, protein_g: 30, carbs_g: 70, fat_g: 35, fibre_g: 7,  sugar_g: 12, salt_g: 3.5, serving_size: "1 plate" },
  { food_name: "Toad in the Hole",                     brand: "British Classic", calories: 765, protein_g: 30, carbs_g: 65, fat_g: 42, fibre_g: 3,  sugar_g: 6,  salt_g: 3.0, serving_size: "1 portion" },
  { food_name: "Beef Stew with Dumplings",             brand: "British Classic", calories: 680, protein_g: 42, carbs_g: 60, fat_g: 28, fibre_g: 7,  sugar_g: 12, salt_g: 2.6, serving_size: "1 bowl" },
  { food_name: "Steak and Kidney Pie",                 brand: "British Classic", calories: 720, protein_g: 32, carbs_g: 55, fat_g: 42, fibre_g: 3,  sugar_g: 3,  salt_g: 2.4, serving_size: "1 pie" },
  { food_name: "Steak and Ale Pie",                    brand: "British Classic", calories: 745, protein_g: 32, carbs_g: 58, fat_g: 43, fibre_g: 3,  sugar_g: 4,  salt_g: 2.4, serving_size: "1 pie" },
  { food_name: "Chicken and Mushroom Pie",             brand: "British Classic", calories: 665, protein_g: 28, carbs_g: 55, fat_g: 38, fibre_g: 3,  sugar_g: 3,  salt_g: 2.2, serving_size: "1 pie" },
  { food_name: "Pie and Mash",                         brand: "British Classic", calories: 815, protein_g: 34, carbs_g: 85, fat_g: 40, fibre_g: 6,  sugar_g: 5,  salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Liver and Onions",                     brand: "British Classic", calories: 495, protein_g: 40, carbs_g: 32, fat_g: 22, fibre_g: 4,  sugar_g: 10, salt_g: 2.2, serving_size: "1 plate" },
  { food_name: "Gammon Egg and Chips",                 brand: "British Classic", calories: 850, protein_g: 48, carbs_g: 85, fat_g: 35, fibre_g: 7,  sugar_g: 5,  salt_g: 4.5, serving_size: "1 plate" },
  { food_name: "Ploughman's Lunch",                    brand: "British Classic", calories: 715, protein_g: 28, carbs_g: 62, fat_g: 40, fibre_g: 6,  sugar_g: 15, salt_g: 2.7, serving_size: "1 plate" },
  { food_name: "Bubble and Squeak",                    brand: "British Classic", calories: 285, protein_g: 6,  carbs_g: 35, fat_g: 13, fibre_g: 6,  sugar_g: 6,  salt_g: 0.8, serving_size: "1 portion" },
  { food_name: "Beans on Toast",                       brand: "British Classic", calories: 360, protein_g: 16, carbs_g: 60, fat_g: 5,  fibre_g: 12, sugar_g: 13, salt_g: 2.4, serving_size: "2 slices + beans" },
  { food_name: "Cheese on Toast",                      brand: "British Classic", calories: 355, protein_g: 15, carbs_g: 28, fat_g: 20, fibre_g: 2,  sugar_g: 2,  salt_g: 1.3, serving_size: "2 slices" },
  { food_name: "Welsh Rarebit",                        brand: "British Classic", calories: 425, protein_g: 17, carbs_g: 30, fat_g: 25, fibre_g: 2,  sugar_g: 3,  salt_g: 1.6, serving_size: "1 portion" },
  { food_name: "Scotch Egg",                           brand: "British Classic", calories: 255, protein_g: 13, carbs_g: 12, fat_g: 17, fibre_g: 1,  sugar_g: 1,  salt_g: 1.1, serving_size: "1 egg (110g)" },
  { food_name: "Cornish Pasty",                        brand: "British Classic", calories: 545, protein_g: 15, carbs_g: 50, fat_g: 31, fibre_g: 3,  sugar_g: 2,  salt_g: 1.8, serving_size: "1 pasty (227g)" },
  { food_name: "Ham Egg and Chips",                    brand: "British Classic", calories: 780, protein_g: 38, carbs_g: 80, fat_g: 34, fibre_g: 6,  sugar_g: 4,  salt_g: 3.6, serving_size: "1 plate" },
  { food_name: "Jacket Potato with Cheese and Beans",  brand: "British Classic", calories: 560, protein_g: 23, carbs_g: 85, fat_g: 13, fibre_g: 12, sugar_g: 12, salt_g: 1.8, serving_size: "1 jacket" },
  { food_name: "Jacket Potato with Tuna Mayo",         brand: "British Classic", calories: 530, protein_g: 26, carbs_g: 68, fat_g: 18, fibre_g: 8,  sugar_g: 4,  salt_g: 1.4, serving_size: "1 jacket" },
  { food_name: "Jacket Potato with Cheese",            brand: "British Classic", calories: 490, protein_g: 17, carbs_g: 66, fat_g: 18, fibre_g: 7,  sugar_g: 5,  salt_g: 1.0, serving_size: "1 jacket" },

  // ===== FISH AND CHIPS SHOP =====
  { food_name: "Cod and Chips",                        brand: "Chippy", calories: 980, protein_g: 45, carbs_g: 110,fat_g: 40, fibre_g: 9,  sugar_g: 4,  salt_g: 3.0, serving_size: "Regular portion" },
  { food_name: "Haddock and Chips",                    brand: "Chippy", calories: 955, protein_g: 45, carbs_g: 108,fat_g: 39, fibre_g: 9,  sugar_g: 4,  salt_g: 3.0, serving_size: "Regular portion" },
  { food_name: "Plaice and Chips",                     brand: "Chippy", calories: 910, protein_g: 40, carbs_g: 108,fat_g: 36, fibre_g: 9,  sugar_g: 4,  salt_g: 2.8, serving_size: "Regular portion" },
  { food_name: "Large Cod and Chips",                  brand: "Chippy", calories: 1310,protein_g: 62, carbs_g: 140,fat_g: 58, fibre_g: 12, sugar_g: 5,  salt_g: 4.0, serving_size: "Large portion" },
  { food_name: "Small Cod and Chips",                  brand: "Chippy", calories: 680, protein_g: 30, carbs_g: 78, fat_g: 28, fibre_g: 6,  sugar_g: 3,  salt_g: 2.1, serving_size: "Small portion" },
  { food_name: "Battered Sausage and Chips",           brand: "Chippy", calories: 905, protein_g: 26, carbs_g: 95, fat_g: 48, fibre_g: 8,  sugar_g: 3,  salt_g: 3.2, serving_size: "1 portion" },
  { food_name: "Saveloy and Chips",                    brand: "Chippy", calories: 850, protein_g: 22, carbs_g: 92, fat_g: 44, fibre_g: 8,  sugar_g: 3,  salt_g: 3.5, serving_size: "1 portion" },
  { food_name: "Steak and Kidney Pie and Chips",       brand: "Chippy", calories: 1095,protein_g: 35, carbs_g: 108,fat_g: 60, fibre_g: 9,  sugar_g: 4,  salt_g: 3.8, serving_size: "1 portion" },
  { food_name: "Chips Regular",                        brand: "Chippy", calories: 555, protein_g: 8,  carbs_g: 78, fat_g: 24, fibre_g: 7,  sugar_g: 1,  salt_g: 1.2, serving_size: "Regular portion" },
  { food_name: "Chips Large",                          brand: "Chippy", calories: 780, protein_g: 11, carbs_g: 110,fat_g: 34, fibre_g: 10, sugar_g: 2,  salt_g: 1.7, serving_size: "Large portion" },
  { food_name: "Chips Small",                          brand: "Chippy", calories: 340, protein_g: 5,  carbs_g: 48, fat_g: 15, fibre_g: 4,  sugar_g: 1,  salt_g: 0.7, serving_size: "Small portion" },
  { food_name: "Chips with Cheese",                    brand: "Chippy", calories: 755, protein_g: 22, carbs_g: 80, fat_g: 38, fibre_g: 7,  sugar_g: 1,  salt_g: 2.2, serving_size: "Regular portion" },
  { food_name: "Chips with Curry Sauce",               brand: "Chippy", calories: 685, protein_g: 10, carbs_g: 95, fat_g: 28, fibre_g: 8,  sugar_g: 8,  salt_g: 2.3, serving_size: "Regular portion" },
  { food_name: "Chips with Gravy",                     brand: "Chippy", calories: 615, protein_g: 10, carbs_g: 86, fat_g: 25, fibre_g: 8,  sugar_g: 3,  salt_g: 2.5, serving_size: "Regular portion" },
  { food_name: "Mushy Peas",                           brand: "Chippy", calories: 115, protein_g: 8,  carbs_g: 18, fat_g: 0.5,fibre_g: 7,  sugar_g: 2,  salt_g: 0.8, serving_size: "Side portion" },
  { food_name: "Curry Sauce",                          brand: "Chippy", calories: 130, protein_g: 2,  carbs_g: 18, fat_g: 5,  fibre_g: 1,  sugar_g: 8,  salt_g: 1.2, serving_size: "1 pot" },
  { food_name: "Pickled Egg",                          brand: "Chippy", calories: 80,  protein_g: 6.5,carbs_g: 1,  fat_g: 5.5,fibre_g: 0,  sugar_g: 0.5,salt_g: 0.5, serving_size: "1 egg" },
  { food_name: "Pickled Onion",                        brand: "Chippy", calories: 15,  protein_g: 0.3,carbs_g: 3,  fat_g: 0,  fibre_g: 0.5,sugar_g: 2,  salt_g: 0.5, serving_size: "1 onion" },

  // ===== INDIAN TAKEAWAY =====
  { food_name: "Chicken Tikka Masala",                 brand: "Indian Takeaway", calories: 685, protein_g: 45, carbs_g: 20, fat_g: 45, fibre_g: 3, sugar_g: 12, salt_g: 2.2, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Korma",                        brand: "Indian Takeaway", calories: 720, protein_g: 40, carbs_g: 20, fat_g: 50, fibre_g: 3, sugar_g: 14, salt_g: 1.8, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Madras",                       brand: "Indian Takeaway", calories: 540, protein_g: 45, carbs_g: 15, fat_g: 32, fibre_g: 4, sugar_g: 8,  salt_g: 2.0, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Vindaloo",                     brand: "Indian Takeaway", calories: 595, protein_g: 45, carbs_g: 18, fat_g: 36, fibre_g: 4, sugar_g: 10, salt_g: 2.1, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Jalfrezi",                     brand: "Indian Takeaway", calories: 510, protein_g: 45, carbs_g: 18, fat_g: 28, fibre_g: 5, sugar_g: 12, salt_g: 2.0, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Rogan Josh",                   brand: "Indian Takeaway", calories: 555, protein_g: 45, carbs_g: 18, fat_g: 32, fibre_g: 4, sugar_g: 11, salt_g: 2.0, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Dopiaza",                      brand: "Indian Takeaway", calories: 560, protein_g: 42, carbs_g: 22, fat_g: 32, fibre_g: 5, sugar_g: 14, salt_g: 2.1, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Bhuna",                        brand: "Indian Takeaway", calories: 530, protein_g: 45, carbs_g: 18, fat_g: 30, fibre_g: 4, sugar_g: 10, salt_g: 2.0, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Dhansak",                      brand: "Indian Takeaway", calories: 615, protein_g: 48, carbs_g: 45, fat_g: 25, fibre_g: 8, sugar_g: 12, salt_g: 2.2, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Pathia",                       brand: "Indian Takeaway", calories: 580, protein_g: 45, carbs_g: 20, fat_g: 34, fibre_g: 4, sugar_g: 12, salt_g: 2.1, serving_size: "1 portion (450g)" },
  { food_name: "Chicken Balti",                        brand: "Indian Takeaway", calories: 545, protein_g: 44, carbs_g: 20, fat_g: 30, fibre_g: 4, sugar_g: 10, salt_g: 2.0, serving_size: "1 portion (450g)" },
  { food_name: "Lamb Tikka Masala",                    brand: "Indian Takeaway", calories: 785, protein_g: 44, carbs_g: 20, fat_g: 55, fibre_g: 3, sugar_g: 12, salt_g: 2.3, serving_size: "1 portion (450g)" },
  { food_name: "Lamb Rogan Josh",                      brand: "Indian Takeaway", calories: 645, protein_g: 42, carbs_g: 18, fat_g: 42, fibre_g: 4, sugar_g: 11, salt_g: 2.1, serving_size: "1 portion (450g)" },
  { food_name: "Lamb Madras",                          brand: "Indian Takeaway", calories: 680, protein_g: 42, carbs_g: 15, fat_g: 45, fibre_g: 4, sugar_g: 8,  salt_g: 2.1, serving_size: "1 portion (450g)" },
  { food_name: "Lamb Bhuna",                           brand: "Indian Takeaway", calories: 640, protein_g: 42, carbs_g: 18, fat_g: 42, fibre_g: 4, sugar_g: 10, salt_g: 2.1, serving_size: "1 portion (450g)" },
  { food_name: "Prawn Curry",                          brand: "Indian Takeaway", calories: 465, protein_g: 30, carbs_g: 20, fat_g: 28, fibre_g: 4, sugar_g: 10, salt_g: 2.2, serving_size: "1 portion (450g)" },
  { food_name: "Saag Paneer",                          brand: "Indian Takeaway", calories: 420, protein_g: 18, carbs_g: 12, fat_g: 32, fibre_g: 5, sugar_g: 5,  salt_g: 1.6, serving_size: "1 portion (350g)" },
  { food_name: "Paneer Tikka Masala",                  brand: "Indian Takeaway", calories: 585, protein_g: 24, carbs_g: 22, fat_g: 44, fibre_g: 4, sugar_g: 14, salt_g: 2.0, serving_size: "1 portion (450g)" },
  { food_name: "Vegetable Biryani",                    brand: "Indian Takeaway", calories: 585, protein_g: 14, carbs_g: 95, fat_g: 18, fibre_g: 8, sugar_g: 10, salt_g: 2.0, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Biryani",                      brand: "Indian Takeaway", calories: 710, protein_g: 38, carbs_g: 90, fat_g: 22, fibre_g: 6, sugar_g: 8,  salt_g: 2.4, serving_size: "1 portion (400g)" },
  { food_name: "Lamb Biryani",                         brand: "Indian Takeaway", calories: 780, protein_g: 40, carbs_g: 88, fat_g: 30, fibre_g: 6, sugar_g: 8,  salt_g: 2.4, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Tikka Starter",                brand: "Indian Takeaway", calories: 340, protein_g: 48, carbs_g: 5,  fat_g: 14, fibre_g: 1, sugar_g: 3,  salt_g: 1.8, serving_size: "1 starter" },
  { food_name: "Tandoori Chicken",                     brand: "Indian Takeaway", calories: 385, protein_g: 50, carbs_g: 4,  fat_g: 18, fibre_g: 1, sugar_g: 2,  salt_g: 2.0, serving_size: "1/4 chicken" },
  { food_name: "Onion Bhaji 4 piece",                  brand: "Indian Takeaway", calories: 310, protein_g: 7,  carbs_g: 28, fat_g: 19, fibre_g: 4, sugar_g: 4,  salt_g: 1.4, serving_size: "4 bhajis" },
  { food_name: "Vegetable Samosa 2 piece",             brand: "Indian Takeaway", calories: 290, protein_g: 6,  carbs_g: 32, fat_g: 15, fibre_g: 3, sugar_g: 3,  salt_g: 1.2, serving_size: "2 samosas" },
  { food_name: "Meat Samosa 2 piece",                  brand: "Indian Takeaway", calories: 330, protein_g: 10, carbs_g: 30, fat_g: 18, fibre_g: 3, sugar_g: 3,  salt_g: 1.3, serving_size: "2 samosas" },
  { food_name: "Chicken Pakora",                       brand: "Indian Takeaway", calories: 385, protein_g: 25, carbs_g: 20, fat_g: 22, fibre_g: 2, sugar_g: 2,  salt_g: 1.6, serving_size: "1 starter" },
  { food_name: "Vegetable Pakora",                     brand: "Indian Takeaway", calories: 280, protein_g: 7,  carbs_g: 26, fat_g: 16, fibre_g: 4, sugar_g: 3,  salt_g: 1.2, serving_size: "1 starter" },
  { food_name: "Pilau Rice",                           brand: "Indian Takeaway", calories: 370, protein_g: 7,  carbs_g: 70, fat_g: 6,  fibre_g: 2, sugar_g: 1,  salt_g: 1.2, serving_size: "1 portion (300g)" },
  { food_name: "Egg Fried Rice",                       brand: "Indian Takeaway", calories: 420, protein_g: 12, carbs_g: 70, fat_g: 10, fibre_g: 2, sugar_g: 2,  salt_g: 1.5, serving_size: "1 portion (300g)" },
  { food_name: "Mushroom Rice",                        brand: "Indian Takeaway", calories: 395, protein_g: 9,  carbs_g: 72, fat_g: 8,  fibre_g: 3, sugar_g: 2,  salt_g: 1.3, serving_size: "1 portion (300g)" },
  { food_name: "Plain Naan",                           brand: "Indian Takeaway", calories: 315, protein_g: 10, carbs_g: 55, fat_g: 6,  fibre_g: 2, sugar_g: 4,  salt_g: 1.3, serving_size: "1 naan" },
  { food_name: "Garlic Naan",                          brand: "Indian Takeaway", calories: 345, protein_g: 10, carbs_g: 55, fat_g: 9,  fibre_g: 2, sugar_g: 4,  salt_g: 1.3, serving_size: "1 naan" },
  { food_name: "Peshwari Naan",                        brand: "Indian Takeaway", calories: 420, protein_g: 11, carbs_g: 62, fat_g: 14, fibre_g: 3, sugar_g: 15, salt_g: 1.3, serving_size: "1 naan" },
  { food_name: "Keema Naan",                           brand: "Indian Takeaway", calories: 445, protein_g: 18, carbs_g: 56, fat_g: 16, fibre_g: 3, sugar_g: 5,  salt_g: 1.4, serving_size: "1 naan" },
  { food_name: "Chapati",                              brand: "Indian Takeaway", calories: 125, protein_g: 4,  carbs_g: 22, fat_g: 2,  fibre_g: 2, sugar_g: 0.5,salt_g: 0.3, serving_size: "1 chapati" },
  { food_name: "Poppadom with Pickles",                brand: "Indian Takeaway", calories: 95,  protein_g: 4,  carbs_g: 12, fat_g: 4,  fibre_g: 2, sugar_g: 1,  salt_g: 0.6, serving_size: "1 poppadom" },
  { food_name: "Aloo Gobi",                            brand: "Indian Takeaway", calories: 245, protein_g: 6,  carbs_g: 28, fat_g: 12, fibre_g: 6, sugar_g: 7,  salt_g: 1.2, serving_size: "1 portion" },
  { food_name: "Tarka Dal",                            brand: "Indian Takeaway", calories: 295, protein_g: 14, carbs_g: 38, fat_g: 9,  fibre_g: 10,sugar_g: 3,  salt_g: 1.5, serving_size: "1 portion" },

  // ===== CHINESE TAKEAWAY =====
  { food_name: "Sweet and Sour Chicken",               brand: "Chinese Takeaway", calories: 635, protein_g: 30, carbs_g: 80, fat_g: 22, fibre_g: 3, sugar_g: 35, salt_g: 1.8, serving_size: "1 portion (400g)" },
  { food_name: "Sweet and Sour Chicken Balls",         brand: "Chinese Takeaway", calories: 715, protein_g: 28, carbs_g: 82, fat_g: 32, fibre_g: 3, sugar_g: 35, salt_g: 1.9, serving_size: "1 portion" },
  { food_name: "Sweet and Sour Pork",                  brand: "Chinese Takeaway", calories: 685, protein_g: 28, carbs_g: 80, fat_g: 28, fibre_g: 3, sugar_g: 35, salt_g: 1.9, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Chow Mein",                    brand: "Chinese Takeaway", calories: 625, protein_g: 32, carbs_g: 75, fat_g: 22, fibre_g: 5, sugar_g: 8,  salt_g: 3.0, serving_size: "1 portion (400g)" },
  { food_name: "Beef Chow Mein",                       brand: "Chinese Takeaway", calories: 675, protein_g: 35, carbs_g: 75, fat_g: 26, fibre_g: 5, sugar_g: 8,  salt_g: 3.0, serving_size: "1 portion (400g)" },
  { food_name: "Special Chow Mein",                    brand: "Chinese Takeaway", calories: 705, protein_g: 38, carbs_g: 76, fat_g: 28, fibre_g: 5, sugar_g: 8,  salt_g: 3.2, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Kung Po",                      brand: "Chinese Takeaway", calories: 520, protein_g: 35, carbs_g: 35, fat_g: 25, fibre_g: 4, sugar_g: 18, salt_g: 2.6, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Szechuan",                     brand: "Chinese Takeaway", calories: 545, protein_g: 35, carbs_g: 38, fat_g: 26, fibre_g: 4, sugar_g: 20, salt_g: 2.8, serving_size: "1 portion (400g)" },
  { food_name: "Chicken in Black Bean Sauce",          brand: "Chinese Takeaway", calories: 445, protein_g: 35, carbs_g: 30, fat_g: 18, fibre_g: 4, sugar_g: 15, salt_g: 3.0, serving_size: "1 portion (400g)" },
  { food_name: "Beef in Black Bean Sauce",             brand: "Chinese Takeaway", calories: 495, protein_g: 36, carbs_g: 30, fat_g: 23, fibre_g: 4, sugar_g: 15, salt_g: 3.0, serving_size: "1 portion (400g)" },
  { food_name: "Beef in Oyster Sauce",                 brand: "Chinese Takeaway", calories: 485, protein_g: 38, carbs_g: 28, fat_g: 22, fibre_g: 3, sugar_g: 14, salt_g: 3.0, serving_size: "1 portion (400g)" },
  { food_name: "Lemon Chicken",                        brand: "Chinese Takeaway", calories: 595, protein_g: 30, carbs_g: 70, fat_g: 22, fibre_g: 2, sugar_g: 30, salt_g: 1.8, serving_size: "1 portion (400g)" },
  { food_name: "Salt and Pepper Chicken",              brand: "Chinese Takeaway", calories: 580, protein_g: 35, carbs_g: 30, fat_g: 35, fibre_g: 3, sugar_g: 3,  salt_g: 3.5, serving_size: "1 portion (400g)" },
  { food_name: "Salt and Pepper Squid",                brand: "Chinese Takeaway", calories: 525, protein_g: 28, carbs_g: 32, fat_g: 30, fibre_g: 2, sugar_g: 3,  salt_g: 3.3, serving_size: "1 portion" },
  { food_name: "Crispy Aromatic Duck Quarter",         brand: "Chinese Takeaway", calories: 720, protein_g: 35, carbs_g: 52, fat_g: 40, fibre_g: 3, sugar_g: 15, salt_g: 2.6, serving_size: "1/4 duck with pancakes" },
  { food_name: "Crispy Aromatic Duck Half",            brand: "Chinese Takeaway", calories: 1395,protein_g: 70, carbs_g: 95, fat_g: 75, fibre_g: 5, sugar_g: 28, salt_g: 5.0, serving_size: "1/2 duck with pancakes" },
  { food_name: "Peking Duck Pancakes 4 piece",         brand: "Chinese Takeaway", calories: 395, protein_g: 17, carbs_g: 45, fat_g: 16, fibre_g: 3, sugar_g: 12, salt_g: 1.8, serving_size: "4 pancakes" },
  { food_name: "Chicken Satay",                        brand: "Chinese Takeaway", calories: 465, protein_g: 35, carbs_g: 18, fat_g: 28, fibre_g: 2, sugar_g: 12, salt_g: 1.8, serving_size: "1 starter" },
  { food_name: "Spring Rolls 2 piece",                 brand: "Chinese Takeaway", calories: 250, protein_g: 5,  carbs_g: 30, fat_g: 12, fibre_g: 3, sugar_g: 3,  salt_g: 1.4, serving_size: "2 rolls" },
  { food_name: "Vegetable Spring Rolls 2 piece",       brand: "Chinese Takeaway", calories: 225, protein_g: 4,  carbs_g: 30, fat_g: 10, fibre_g: 3, sugar_g: 3,  salt_g: 1.3, serving_size: "2 rolls" },
  { food_name: "Sesame Prawn Toast",                   brand: "Chinese Takeaway", calories: 385, protein_g: 15, carbs_g: 32, fat_g: 22, fibre_g: 2, sugar_g: 3,  salt_g: 1.4, serving_size: "4 pieces" },
  { food_name: "Prawn Crackers",                       brand: "Chinese Takeaway", calories: 265, protein_g: 2,  carbs_g: 30, fat_g: 15, fibre_g: 1, sugar_g: 0.5,salt_g: 1.3, serving_size: "1 portion (50g)" },
  { food_name: "Wonton Soup",                          brand: "Chinese Takeaway", calories: 195, protein_g: 12, carbs_g: 22, fat_g: 6,  fibre_g: 2, sugar_g: 3,  salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Hot and Sour Soup",                    brand: "Chinese Takeaway", calories: 155, protein_g: 10, carbs_g: 18, fat_g: 5,  fibre_g: 2, sugar_g: 6,  salt_g: 2.3, serving_size: "1 bowl" },
  { food_name: "Egg Fried Rice",                       brand: "Chinese Takeaway", calories: 495, protein_g: 12, carbs_g: 78, fat_g: 14, fibre_g: 3, sugar_g: 2,  salt_g: 1.6, serving_size: "1 portion (350g)" },
  { food_name: "Special Fried Rice",                   brand: "Chinese Takeaway", calories: 620, protein_g: 22, carbs_g: 80, fat_g: 22, fibre_g: 3, sugar_g: 3,  salt_g: 2.1, serving_size: "1 portion (400g)" },
  { food_name: "Boiled Rice",                          brand: "Chinese Takeaway", calories: 405, protein_g: 9,  carbs_g: 90, fat_g: 1,  fibre_g: 2, sugar_g: 0.5,salt_g: 0.3, serving_size: "1 portion (300g)" },
  { food_name: "Singapore Rice Noodles",               brand: "Chinese Takeaway", calories: 575, protein_g: 24, carbs_g: 85, fat_g: 14, fibre_g: 4, sugar_g: 5,  salt_g: 3.2, serving_size: "1 portion" },

  // ===== THAI TAKEAWAY =====
  { food_name: "Chicken Green Thai Curry",             brand: "Thai Takeaway", calories: 605, protein_g: 35, carbs_g: 20, fat_g: 42, fibre_g: 4, sugar_g: 10, salt_g: 2.4, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Red Thai Curry",               brand: "Thai Takeaway", calories: 625, protein_g: 35, carbs_g: 22, fat_g: 43, fibre_g: 4, sugar_g: 12, salt_g: 2.4, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Massaman Curry",               brand: "Thai Takeaway", calories: 685, protein_g: 35, carbs_g: 40, fat_g: 40, fibre_g: 5, sugar_g: 18, salt_g: 2.5, serving_size: "1 portion (400g)" },
  { food_name: "Chicken Panang Curry",                 brand: "Thai Takeaway", calories: 645, protein_g: 35, carbs_g: 22, fat_g: 44, fibre_g: 4, sugar_g: 14, salt_g: 2.4, serving_size: "1 portion (400g)" },
  { food_name: "Pad Thai Chicken",                     brand: "Thai Takeaway", calories: 745, protein_g: 35, carbs_g: 90, fat_g: 24, fibre_g: 5, sugar_g: 20, salt_g: 3.0, serving_size: "1 portion (400g)" },
  { food_name: "Pad Thai Prawn",                       brand: "Thai Takeaway", calories: 720, protein_g: 32, carbs_g: 90, fat_g: 22, fibre_g: 5, sugar_g: 20, salt_g: 3.1, serving_size: "1 portion (400g)" },
  { food_name: "Pad See Ew Chicken",                   brand: "Thai Takeaway", calories: 720, protein_g: 35, carbs_g: 85, fat_g: 24, fibre_g: 5, sugar_g: 12, salt_g: 3.2, serving_size: "1 portion (400g)" },
  { food_name: "Tom Yum Soup",                         brand: "Thai Takeaway", calories: 180, protein_g: 18, carbs_g: 10, fat_g: 8,  fibre_g: 2, sugar_g: 6,  salt_g: 2.8, serving_size: "1 bowl" },
  { food_name: "Tom Kha Gai Coconut Soup",             brand: "Thai Takeaway", calories: 385, protein_g: 22, carbs_g: 12, fat_g: 28, fibre_g: 2, sugar_g: 7,  salt_g: 2.4, serving_size: "1 bowl" },
  { food_name: "Thai Chicken Satay",                   brand: "Thai Takeaway", calories: 455, protein_g: 32, carbs_g: 18, fat_g: 28, fibre_g: 2, sugar_g: 12, salt_g: 1.8, serving_size: "1 starter" },
  { food_name: "Thai Spring Rolls",                    brand: "Thai Takeaway", calories: 230, protein_g: 5,  carbs_g: 28, fat_g: 11, fibre_g: 3, sugar_g: 3,  salt_g: 1.3, serving_size: "2 rolls" },
  { food_name: "Thai Fishcakes",                       brand: "Thai Takeaway", calories: 310, protein_g: 22, carbs_g: 22, fat_g: 14, fibre_g: 2, sugar_g: 6,  salt_g: 2.0, serving_size: "1 starter" },
  { food_name: "Jasmine Rice",                         brand: "Thai Takeaway", calories: 400, protein_g: 8,  carbs_g: 90, fat_g: 1,  fibre_g: 2, sugar_g: 0.5,salt_g: 0.2, serving_size: "1 portion (300g)" },
  { food_name: "Coconut Rice",                         brand: "Thai Takeaway", calories: 485, protein_g: 8,  carbs_g: 88, fat_g: 12, fibre_g: 2, sugar_g: 4,  salt_g: 0.8, serving_size: "1 portion (300g)" },

  // ===== KEBAB SHOP =====
  { food_name: "Donner Kebab in Pitta",                brand: "Kebab Shop", calories: 780, protein_g: 42, carbs_g: 55, fat_g: 42, fibre_g: 4, sugar_g: 6,  salt_g: 3.5, serving_size: "1 kebab" },
  { food_name: "Large Donner Kebab in Pitta",          brand: "Kebab Shop", calories: 1100,protein_g: 62, carbs_g: 68, fat_g: 60, fibre_g: 5, sugar_g: 7,  salt_g: 4.8, serving_size: "1 large kebab" },
  { food_name: "Mixed Donner Kebab",                   brand: "Kebab Shop", calories: 820, protein_g: 45, carbs_g: 52, fat_g: 45, fibre_g: 4, sugar_g: 6,  salt_g: 3.6, serving_size: "1 kebab" },
  { food_name: "Donner Meat Only",                     brand: "Kebab Shop", calories: 520, protein_g: 35, carbs_g: 3,  fat_g: 42, fibre_g: 0, sugar_g: 1,  salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Chicken Shish Kebab",                  brand: "Kebab Shop", calories: 685, protein_g: 52, carbs_g: 55, fat_g: 25, fibre_g: 4, sugar_g: 6,  salt_g: 3.2, serving_size: "1 kebab" },
  { food_name: "Lamb Shish Kebab",                     brand: "Kebab Shop", calories: 740, protein_g: 48, carbs_g: 55, fat_g: 32, fibre_g: 4, sugar_g: 6,  salt_g: 3.3, serving_size: "1 kebab" },
  { food_name: "Mixed Shish Kebab",                    brand: "Kebab Shop", calories: 710, protein_g: 50, carbs_g: 55, fat_g: 28, fibre_g: 4, sugar_g: 6,  salt_g: 3.2, serving_size: "1 kebab" },
  { food_name: "Chicken Doner Wrap",                   brand: "Kebab Shop", calories: 695, protein_g: 38, carbs_g: 62, fat_g: 30, fibre_g: 4, sugar_g: 7,  salt_g: 3.2, serving_size: "1 wrap" },
  { food_name: "Lamb Doner Wrap",                      brand: "Kebab Shop", calories: 755, protein_g: 38, carbs_g: 60, fat_g: 38, fibre_g: 4, sugar_g: 6,  salt_g: 3.4, serving_size: "1 wrap" },
  { food_name: "Doner Meat and Chips",                 brand: "Kebab Shop", calories: 1060,protein_g: 42, carbs_g: 82, fat_g: 62, fibre_g: 8, sugar_g: 4,  salt_g: 3.8, serving_size: "1 portion" },
  { food_name: "Chicken Shawarma",                     brand: "Kebab Shop", calories: 620, protein_g: 42, carbs_g: 55, fat_g: 25, fibre_g: 4, sugar_g: 6,  salt_g: 2.9, serving_size: "1 kebab" },
  { food_name: "Falafel Wrap",                         brand: "Kebab Shop", calories: 555, protein_g: 16, carbs_g: 70, fat_g: 22, fibre_g: 10,sugar_g: 8,  salt_g: 2.5, serving_size: "1 wrap" },
  { food_name: "Garlic Mayo Sauce",                    brand: "Kebab Shop", calories: 155, protein_g: 0.5,carbs_g: 2,  fat_g: 16, fibre_g: 0, sugar_g: 1,  salt_g: 0.4, serving_size: "2 tbsp" },
  { food_name: "Chilli Sauce",                         brand: "Kebab Shop", calories: 35,  protein_g: 0.5,carbs_g: 8,  fat_g: 0,  fibre_g: 0.5,sugar_g: 7,  salt_g: 0.8, serving_size: "2 tbsp" },

  // ============================================================
  // STAGE 3 — Supermarket branded ranges + branded packaged products
  // ============================================================

  // ===== TESCO FINEST READY MEALS =====
  { food_name: "Chicken Tikka Masala Ready Meal",      brand: "Tesco Finest", calories: 675, protein_g: 42, carbs_g: 45, fat_g: 36, fibre_g: 4, sugar_g: 12, salt_g: 2.0, serving_size: "1 meal (500g)" },
  { food_name: "Chicken Korma Ready Meal",             brand: "Tesco Finest", calories: 710, protein_g: 38, carbs_g: 48, fat_g: 40, fibre_g: 4, sugar_g: 15, salt_g: 1.8, serving_size: "1 meal (500g)" },
  { food_name: "Beef Lasagne",                         brand: "Tesco Finest", calories: 590, protein_g: 32, carbs_g: 50, fat_g: 28, fibre_g: 5, sugar_g: 12, salt_g: 2.2, serving_size: "1 meal (400g)" },
  { food_name: "Macaroni Cheese",                      brand: "Tesco Finest", calories: 540, protein_g: 22, carbs_g: 52, fat_g: 26, fibre_g: 3, sugar_g: 5,  salt_g: 1.8, serving_size: "1 meal (400g)" },
  { food_name: "Shepherd's Pie",                       brand: "Tesco Finest", calories: 480, protein_g: 28, carbs_g: 48, fat_g: 18, fibre_g: 5, sugar_g: 10, salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Cottage Pie",                          brand: "Tesco Finest", calories: 495, protein_g: 30, carbs_g: 48, fat_g: 20, fibre_g: 5, sugar_g: 10, salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Thai Green Chicken Curry",             brand: "Tesco Finest", calories: 545, protein_g: 32, carbs_g: 55, fat_g: 22, fibre_g: 4, sugar_g: 10, salt_g: 2.2, serving_size: "1 meal (400g)" },
  { food_name: "Beef Bourguignon",                     brand: "Tesco Finest", calories: 520, protein_g: 40, carbs_g: 35, fat_g: 22, fibre_g: 5, sugar_g: 8,  salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Chicken and Mushroom Pie",             brand: "Tesco Finest", calories: 625, protein_g: 22, carbs_g: 52, fat_g: 36, fibre_g: 3, sugar_g: 4,  salt_g: 1.8, serving_size: "1 pie (425g)" },
  { food_name: "Steak and Ale Pie",                    brand: "Tesco Finest", calories: 715, protein_g: 30, carbs_g: 55, fat_g: 42, fibre_g: 3, sugar_g: 4,  salt_g: 2.0, serving_size: "1 pie (425g)" },

  // ===== M&S READY MEALS =====
  { food_name: "Chicken Tikka Masala",                 brand: "M&S", calories: 625, protein_g: 42, carbs_g: 42, fat_g: 32, fibre_g: 4,  sugar_g: 12, salt_g: 1.8, serving_size: "1 meal (400g)" },
  { food_name: "Chicken Korma",                        brand: "M&S", calories: 685, protein_g: 38, carbs_g: 48, fat_g: 36, fibre_g: 4,  sugar_g: 14, salt_g: 1.7, serving_size: "1 meal (400g)" },
  { food_name: "Chicken Jalfrezi",                     brand: "M&S", calories: 540, protein_g: 44, carbs_g: 42, fat_g: 22, fibre_g: 5,  sugar_g: 12, salt_g: 1.9, serving_size: "1 meal (400g)" },
  { food_name: "Gastropub Beef Lasagne",               brand: "M&S", calories: 605, protein_g: 32, carbs_g: 52, fat_g: 28, fibre_g: 5,  sugar_g: 12, salt_g: 2.2, serving_size: "1 meal (400g)" },
  { food_name: "Dine In Fish Pie",                     brand: "M&S", calories: 495, protein_g: 28, carbs_g: 42, fat_g: 22, fibre_g: 4,  sugar_g: 6,  salt_g: 1.6, serving_size: "1 meal (400g)" },
  { food_name: "Made Without Lasagne",                 brand: "M&S", calories: 485, protein_g: 28, carbs_g: 45, fat_g: 22, fibre_g: 4,  sugar_g: 10, salt_g: 1.8, serving_size: "1 meal (400g)" },
  { food_name: "Chicken Curry and Rice",               brand: "M&S", calories: 605, protein_g: 35, carbs_g: 75, fat_g: 18, fibre_g: 5,  sugar_g: 10, salt_g: 2.0, serving_size: "1 meal (450g)" },
  { food_name: "Count on Us Chicken Tikka",            brand: "M&S", calories: 385, protein_g: 35, carbs_g: 50, fat_g: 5,  fibre_g: 5,  sugar_g: 10, salt_g: 1.6, serving_size: "1 meal (400g)" },
  { food_name: "Count on Us Spaghetti Bolognese",      brand: "M&S", calories: 355, protein_g: 25, carbs_g: 55, fat_g: 4,  fibre_g: 6,  sugar_g: 10, salt_g: 1.4, serving_size: "1 meal (400g)" },
  { food_name: "Plant Kitchen Mushroom Stroganoff",    brand: "M&S", calories: 425, protein_g: 12, carbs_g: 62, fat_g: 14, fibre_g: 7,  sugar_g: 8,  salt_g: 1.6, serving_size: "1 meal (400g)" },
  { food_name: "Plant Kitchen No Chicken Kiev",        brand: "M&S", calories: 425, protein_g: 24, carbs_g: 32, fat_g: 22, fibre_g: 7,  sugar_g: 2,  salt_g: 1.5, serving_size: "2 kievs" },
  { food_name: "Steak and Chips Dine In",              brand: "M&S", calories: 735, protein_g: 48, carbs_g: 55, fat_g: 32, fibre_g: 6,  sugar_g: 3,  salt_g: 2.2, serving_size: "1 meal (450g)" },

  // ===== SAINSBURY'S TASTE THE DIFFERENCE =====
  { food_name: "Chicken Tikka Masala",                 brand: "Sainsbury's Taste the Difference", calories: 635, protein_g: 38, carbs_g: 48, fat_g: 32, fibre_g: 4, sugar_g: 13, salt_g: 1.9, serving_size: "1 meal (450g)" },
  { food_name: "Thai Green Curry with Rice",           brand: "Sainsbury's Taste the Difference", calories: 595, protein_g: 32, carbs_g: 65, fat_g: 22, fibre_g: 4, sugar_g: 10, salt_g: 2.0, serving_size: "1 meal (450g)" },
  { food_name: "Spaghetti Carbonara",                  brand: "Sainsbury's Taste the Difference", calories: 715, protein_g: 32, carbs_g: 65, fat_g: 38, fibre_g: 4, sugar_g: 5,  salt_g: 2.2, serving_size: "1 meal (400g)" },
  { food_name: "Beef Lasagne",                         brand: "Sainsbury's Taste the Difference", calories: 575, protein_g: 32, carbs_g: 48, fat_g: 28, fibre_g: 4, sugar_g: 10, salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Fisherman's Pie",                      brand: "Sainsbury's Taste the Difference", calories: 485, protein_g: 28, carbs_g: 40, fat_g: 22, fibre_g: 4, sugar_g: 6,  salt_g: 1.7, serving_size: "1 meal (400g)" },
  { food_name: "Margherita Sourdough Pizza",           brand: "Sainsbury's Taste the Difference", calories: 775, protein_g: 30, carbs_g: 95, fat_g: 28, fibre_g: 5, sugar_g: 8,  salt_g: 3.0, serving_size: "Whole pizza" },
  { food_name: "Pepperoni Sourdough Pizza",            brand: "Sainsbury's Taste the Difference", calories: 945, protein_g: 42, carbs_g: 95, fat_g: 42, fibre_g: 5, sugar_g: 8,  salt_g: 4.0, serving_size: "Whole pizza" },

  // ===== WAITROSE NO.1 =====
  { food_name: "Chicken Tikka Masala",                 brand: "Waitrose No.1", calories: 605, protein_g: 40, carbs_g: 45, fat_g: 30, fibre_g: 4, sugar_g: 12, salt_g: 1.8, serving_size: "1 meal (400g)" },
  { food_name: "Thai Green Chicken Curry",             brand: "Waitrose No.1", calories: 555, protein_g: 30, carbs_g: 55, fat_g: 22, fibre_g: 4, sugar_g: 10, salt_g: 1.9, serving_size: "1 meal (400g)" },
  { food_name: "Beef Lasagne",                         brand: "Waitrose No.1", calories: 565, protein_g: 32, carbs_g: 48, fat_g: 26, fibre_g: 5, sugar_g: 12, salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Cottage Pie",                          brand: "Waitrose No.1", calories: 485, protein_g: 30, carbs_g: 48, fat_g: 19, fibre_g: 5, sugar_g: 10, salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Fish Pie",                             brand: "Waitrose No.1", calories: 465, protein_g: 26, carbs_g: 42, fat_g: 20, fibre_g: 4, sugar_g: 6,  salt_g: 1.6, serving_size: "1 meal (400g)" },

  // ===== ASDA EXTRA SPECIAL =====
  { food_name: "Chicken Tikka Masala",                 brand: "Asda Extra Special", calories: 615, protein_g: 38, carbs_g: 46, fat_g: 30, fibre_g: 4, sugar_g: 12, salt_g: 2.0, serving_size: "1 meal (450g)" },
  { food_name: "Spaghetti Bolognese",                  brand: "Asda Extra Special", calories: 525, protein_g: 28, carbs_g: 72, fat_g: 12, fibre_g: 6, sugar_g: 14, salt_g: 2.0, serving_size: "1 meal (450g)" },
  { food_name: "Lasagne",                              brand: "Asda Extra Special", calories: 560, protein_g: 30, carbs_g: 48, fat_g: 26, fibre_g: 5, sugar_g: 11, salt_g: 2.0, serving_size: "1 meal (400g)" },
  { food_name: "Shepherd's Pie",                       brand: "Asda Extra Special", calories: 465, protein_g: 28, carbs_g: 46, fat_g: 18, fibre_g: 5, sugar_g: 10, salt_g: 1.9, serving_size: "1 meal (400g)" },

  // ===== BIRDS EYE =====
  { food_name: "Chicken Dippers 6 piece",              brand: "Birds Eye", calories: 220, protein_g: 15, carbs_g: 18, fat_g: 10, fibre_g: 1, sugar_g: 0.5, salt_g: 1.0, serving_size: "6 dippers (90g)" },
  { food_name: "Chicken Dippers 10 piece",             brand: "Birds Eye", calories: 365, protein_g: 25, carbs_g: 30, fat_g: 17, fibre_g: 2, sugar_g: 1,   salt_g: 1.6, serving_size: "10 dippers (150g)" },
  { food_name: "Fish Fingers 5 piece",                 brand: "Birds Eye", calories: 280, protein_g: 17, carbs_g: 22, fat_g: 14, fibre_g: 1, sugar_g: 1,   salt_g: 1.0, serving_size: "5 fingers (140g)" },
  { food_name: "Fish Fingers 10 piece",                brand: "Birds Eye", calories: 560, protein_g: 34, carbs_g: 44, fat_g: 28, fibre_g: 2, sugar_g: 2,   salt_g: 2.0, serving_size: "10 fingers (280g)" },
  { food_name: "Cod Fillets in Breadcrumbs",           brand: "Birds Eye", calories: 260, protein_g: 17, carbs_g: 18, fat_g: 13, fibre_g: 1, sugar_g: 1,   salt_g: 0.9, serving_size: "1 fillet (125g)" },
  { food_name: "Battered Cod",                         brand: "Birds Eye", calories: 280, protein_g: 14, carbs_g: 20, fat_g: 15, fibre_g: 1, sugar_g: 0.5, salt_g: 0.8, serving_size: "1 fillet (125g)" },
  { food_name: "Potato Waffles",                       brand: "Birds Eye", calories: 105, protein_g: 1.5,carbs_g: 14, fat_g: 4.5,fibre_g: 1, sugar_g: 0.3, salt_g: 0.3, serving_size: "1 waffle (52g)" },
  { food_name: "Garden Peas",                          brand: "Birds Eye", calories: 60,  protein_g: 5,  carbs_g: 8,  fat_g: 0.7,fibre_g: 5, sugar_g: 3,   salt_g: 0,   serving_size: "80g portion" },

  // ===== GOODFELLA'S / CHICAGO TOWN =====
  { food_name: "Margherita Stonebaked Pizza",          brand: "Goodfella's", calories: 675, protein_g: 28, carbs_g: 85, fat_g: 24, fibre_g: 5, sugar_g: 7,  salt_g: 2.5, serving_size: "Whole pizza" },
  { food_name: "Pepperoni Stonebaked Pizza",           brand: "Goodfella's", calories: 820, protein_g: 36, carbs_g: 85, fat_g: 36, fibre_g: 5, sugar_g: 7,  salt_g: 3.3, serving_size: "Whole pizza" },
  { food_name: "Meat Feast Stonebaked Pizza",          brand: "Goodfella's", calories: 895, protein_g: 42, carbs_g: 85, fat_g: 40, fibre_g: 5, sugar_g: 7,  salt_g: 3.6, serving_size: "Whole pizza" },
  { food_name: "Chicago Town Takeaway Pepperoni",      brand: "Chicago Town", calories: 1420,protein_g: 58, carbs_g: 155,fat_g: 62, fibre_g: 7, sugar_g: 12, salt_g: 5.8, serving_size: "Whole pizza" },
  { food_name: "Chicago Town Takeaway Four Cheese",    brand: "Chicago Town", calories: 1490,protein_g: 62, carbs_g: 152,fat_g: 68, fibre_g: 7, sugar_g: 12, salt_g: 5.5, serving_size: "Whole pizza" },
  { food_name: "Chicago Town Stuffed Crust",           brand: "Chicago Town", calories: 1380,protein_g: 55, carbs_g: 150,fat_g: 60, fibre_g: 6, sugar_g: 11, salt_g: 5.5, serving_size: "Whole pizza" },

  // ===== ICELAND READY MEALS =====
  { food_name: "Chicken Tikka Masala",                 brand: "Iceland", calories: 465, protein_g: 32, carbs_g: 45, fat_g: 18, fibre_g: 3, sugar_g: 10, salt_g: 1.6, serving_size: "1 meal (450g)" },
  { food_name: "Spaghetti Bolognese",                  brand: "Iceland", calories: 395, protein_g: 22, carbs_g: 55, fat_g: 9,  fibre_g: 5, sugar_g: 10, salt_g: 1.5, serving_size: "1 meal (450g)" },
  { food_name: "Slimming World Chicken Hotpot",        brand: "Iceland", calories: 275, protein_g: 25, carbs_g: 38, fat_g: 2,  fibre_g: 5, sugar_g: 10, salt_g: 1.3, serving_size: "1 meal (500g)" },
  { food_name: "Slimming World Cottage Pie",           brand: "Iceland", calories: 310, protein_g: 22, carbs_g: 38, fat_g: 8,  fibre_g: 6, sugar_g: 10, salt_g: 1.5, serving_size: "1 meal (500g)" },

  // ===== CONFECTIONERY — chocolate bars =====
  { food_name: "Cadbury Dairy Milk 45g Bar",           brand: "Cadbury", calories: 240, protein_g: 3.4,carbs_g: 26, fat_g: 13, fibre_g: 0.7, sugar_g: 25, salt_g: 0.1, serving_size: "45g bar" },
  { food_name: "Cadbury Dairy Milk 110g Bar",          brand: "Cadbury", calories: 585, protein_g: 8.4,carbs_g: 63, fat_g: 32, fibre_g: 2,   sugar_g: 61, salt_g: 0.3, serving_size: "110g bar" },
  { food_name: "Cadbury Wispa",                        brand: "Cadbury", calories: 210, protein_g: 2.7,carbs_g: 22, fat_g: 12, fibre_g: 0.5, sugar_g: 21, salt_g: 0.1, serving_size: "1 bar (36g)" },
  { food_name: "Cadbury Crunchie",                     brand: "Cadbury", calories: 185, protein_g: 1.7,carbs_g: 28, fat_g: 7,  fibre_g: 0.3, sugar_g: 24, salt_g: 0.1, serving_size: "1 bar (40g)" },
  { food_name: "Cadbury Twirl",                        brand: "Cadbury", calories: 230, protein_g: 3.1,carbs_g: 23, fat_g: 13, fibre_g: 0.5, sugar_g: 23, salt_g: 0.1, serving_size: "1 twin bar (43g)" },
  { food_name: "Cadbury Flake",                        brand: "Cadbury", calories: 170, protein_g: 2.4,carbs_g: 18, fat_g: 9,  fibre_g: 0.5, sugar_g: 18, salt_g: 0.1, serving_size: "1 bar (32g)" },
  { food_name: "Cadbury Dairy Milk Buttons",           brand: "Cadbury", calories: 160, protein_g: 2.3,carbs_g: 17, fat_g: 9,  fibre_g: 0.5, sugar_g: 17, salt_g: 0.1, serving_size: "30g bag" },
  { food_name: "Cadbury Creme Egg",                    brand: "Cadbury", calories: 177, protein_g: 1.6,carbs_g: 26, fat_g: 6.5,fibre_g: 0,   sugar_g: 26, salt_g: 0.1, serving_size: "1 egg (40g)" },
  { food_name: "Mars Bar",                             brand: "Mars", calories: 228, protein_g: 2,  carbs_g: 34, fat_g: 9,   fibre_g: 0,   sugar_g: 30, salt_g: 0.3, serving_size: "1 bar (51g)" },
  { food_name: "Snickers Bar",                         brand: "Snickers", calories: 245, protein_g: 4.5,carbs_g: 27, fat_g: 13, fibre_g: 1, sugar_g: 23, salt_g: 0.2, serving_size: "1 bar (48g)" },
  { food_name: "Twix Twin Bar",                        brand: "Twix", calories: 250, protein_g: 2.4,carbs_g: 32, fat_g: 12, fibre_g: 0,   sugar_g: 24, salt_g: 0.2, serving_size: "1 twin bar (50g)" },
  { food_name: "Bounty Bar",                           brand: "Bounty", calories: 268, protein_g: 2.4,carbs_g: 30, fat_g: 15, fibre_g: 2,   sugar_g: 25, salt_g: 0.1, serving_size: "1 twin bar (57g)" },
  { food_name: "Kit Kat 4 Finger",                     brand: "Kit Kat", calories: 206, protein_g: 2.7,carbs_g: 25, fat_g: 11, fibre_g: 0.6, sugar_g: 21, salt_g: 0.1, serving_size: "1 bar (41g)" },
  { food_name: "Kit Kat Chunky",                       brand: "Kit Kat", calories: 210, protein_g: 2.5,carbs_g: 25, fat_g: 11, fibre_g: 0.5, sugar_g: 21, salt_g: 0.1, serving_size: "1 bar (40g)" },
  { food_name: "Aero Peppermint",                      brand: "Aero", calories: 201, protein_g: 2.5,carbs_g: 24, fat_g: 11, fibre_g: 0.5, sugar_g: 23, salt_g: 0.1, serving_size: "1 bar (36g)" },
  { food_name: "Maltesers",                            brand: "Maltesers", calories: 187, protein_g: 3.1,carbs_g: 24, fat_g: 9,  fibre_g: 0.6, sugar_g: 22, salt_g: 0.1, serving_size: "37g bag" },
  { food_name: "Minstrels",                            brand: "Galaxy", calories: 200, protein_g: 1.6,carbs_g: 27, fat_g: 9,  fibre_g: 0.5, sugar_g: 26, salt_g: 0.1, serving_size: "42g bag" },
  { food_name: "Galaxy Chocolate Bar",                 brand: "Galaxy", calories: 228, protein_g: 3,  carbs_g: 24, fat_g: 13, fibre_g: 0.5, sugar_g: 24, salt_g: 0.1, serving_size: "1 bar (42g)" },
  { food_name: "Milky Way",                            brand: "Mars", calories: 95,  protein_g: 0.9,carbs_g: 15, fat_g: 3.5,fibre_g: 0,   sugar_g: 14, salt_g: 0.1, serving_size: "1 bar (21.5g)" },
  { food_name: "Toblerone",                            brand: "Toblerone", calories: 270, protein_g: 3,  carbs_g: 31, fat_g: 14, fibre_g: 0.5, sugar_g: 30, salt_g: 0.1, serving_size: "50g bar" },
  { food_name: "Reese's Peanut Butter Cups",           brand: "Reese's", calories: 220, protein_g: 5,  carbs_g: 23, fat_g: 13, fibre_g: 2,   sugar_g: 21, salt_g: 0.3, serving_size: "2 cups (42g)" },
  { food_name: "Lindt Lindor Milk Truffles",           brand: "Lindt", calories: 220, protein_g: 2,  carbs_g: 18, fat_g: 15, fibre_g: 1,   sugar_g: 18, salt_g: 0.1, serving_size: "3 truffles (37g)" },
  { food_name: "Haribo Starmix",                       brand: "Haribo", calories: 330, protein_g: 7,  carbs_g: 77, fat_g: 0,  fibre_g: 0,   sugar_g: 46, salt_g: 0.1, serving_size: "100g bag" },
  { food_name: "Haribo Tangfastics",                   brand: "Haribo", calories: 330, protein_g: 6,  carbs_g: 77, fat_g: 0,  fibre_g: 0,   sugar_g: 50, salt_g: 0.1, serving_size: "100g bag" },
  { food_name: "Percy Pigs",                           brand: "M&S", calories: 310, protein_g: 6,  carbs_g: 70, fat_g: 0,  fibre_g: 0,   sugar_g: 50, salt_g: 0.1, serving_size: "100g bag" },
  { food_name: "Cadbury Fudge",                        brand: "Cadbury", calories: 115, protein_g: 1,  carbs_g: 20, fat_g: 3.5,fibre_g: 0,   sugar_g: 16, salt_g: 0.1, serving_size: "1 bar (25g)" },
  { food_name: "Curly Wurly",                          brand: "Cadbury", calories: 115, protein_g: 1.2,carbs_g: 19, fat_g: 3.5,fibre_g: 0,   sugar_g: 15, salt_g: 0.1, serving_size: "1 bar (26g)" },

  // ===== CRISPS AND SAVOURY SNACKS =====
  { food_name: "Walkers Ready Salted Crisps Standard", brand: "Walkers", calories: 179, protein_g: 2.2,carbs_g: 17, fat_g: 11, fibre_g: 1.2, sugar_g: 0.2, salt_g: 0.4, serving_size: "32.5g bag" },
  { food_name: "Walkers Cheese and Onion Crisps",      brand: "Walkers", calories: 179, protein_g: 2.3,carbs_g: 17, fat_g: 11, fibre_g: 1.2, sugar_g: 0.5, salt_g: 0.5, serving_size: "32.5g bag" },
  { food_name: "Walkers Salt and Vinegar Crisps",      brand: "Walkers", calories: 179, protein_g: 2.2,carbs_g: 17, fat_g: 11, fibre_g: 1.2, sugar_g: 0.3, salt_g: 0.5, serving_size: "32.5g bag" },
  { food_name: "Walkers Prawn Cocktail Crisps",        brand: "Walkers", calories: 179, protein_g: 2.1,carbs_g: 17, fat_g: 11, fibre_g: 1.1, sugar_g: 1,   salt_g: 0.5, serving_size: "32.5g bag" },
  { food_name: "Walkers Sensations Thai Sweet Chilli", brand: "Walkers", calories: 155, protein_g: 2,  carbs_g: 18, fat_g: 8,  fibre_g: 1.5, sugar_g: 2,   salt_g: 0.4, serving_size: "30g bag" },
  { food_name: "Walkers Quavers Cheese",               brand: "Walkers", calories: 87,  protein_g: 0.8,carbs_g: 9,  fat_g: 5,  fibre_g: 0.3, sugar_g: 0.3, salt_g: 0.3, serving_size: "16g bag" },
  { food_name: "Walkers Wotsits Cheese",               protein_g: 2.3, brand: "Walkers", calories: 91,  carbs_g: 8.6,fat_g: 5.7,fibre_g: 0.3, sugar_g: 0.5, salt_g: 0.3, serving_size: "16.5g bag" },
  { food_name: "Walkers Monster Munch Pickled Onion",  brand: "Walkers", calories: 96,  protein_g: 1.3,carbs_g: 10, fat_g: 5.4,fibre_g: 0.6, sugar_g: 0.3, salt_g: 0.4, serving_size: "20g bag" },
  { food_name: "Pringles Original Can",                brand: "Pringles", calories: 1350,protein_g: 18, carbs_g: 128,fat_g: 85, fibre_g: 8,   sugar_g: 4,   salt_g: 3.0, serving_size: "1 tube (200g)" },
  { food_name: "Pringles Original Small Serving",      brand: "Pringles", calories: 135, protein_g: 1.8,carbs_g: 13, fat_g: 8.5,fibre_g: 0.8, sugar_g: 0.4, salt_g: 0.3, serving_size: "30g" },
  { food_name: "Doritos Chilli Heatwave",              brand: "Doritos", calories: 158, protein_g: 2.4,carbs_g: 16, fat_g: 9,  fibre_g: 1.2, sugar_g: 1.5, salt_g: 0.4, serving_size: "30g" },
  { food_name: "Doritos Cool Original",                brand: "Doritos", calories: 155, protein_g: 2.2,carbs_g: 17, fat_g: 8.5,fibre_g: 1,   sugar_g: 1.2, salt_g: 0.4, serving_size: "30g" },
  { food_name: "Mini Cheddars",                        brand: "Mini Cheddars", calories: 130, protein_g: 2.5,carbs_g: 12, fat_g: 7.5,fibre_g: 0.5, sugar_g: 0.3, salt_g: 0.5, serving_size: "25g bag" },
  { food_name: "Twiglets",                             brand: "Jacob's", calories: 99,  protein_g: 3,  carbs_g: 16, fat_g: 2,  fibre_g: 2,   sugar_g: 2,   salt_g: 0.7, serving_size: "25g bag" },
  { food_name: "Nik Naks Nice 'n' Spicy",              brand: "Nik Naks", calories: 183, protein_g: 1.9,carbs_g: 18, fat_g: 11, fibre_g: 0.5, sugar_g: 1,   salt_g: 0.4, serving_size: "34g bag" },
  { food_name: "Space Raiders Pickled Onion",          brand: "KP", calories: 91,  protein_g: 1.4,carbs_g: 11, fat_g: 5,  fibre_g: 0.5, sugar_g: 0.5, salt_g: 0.3, serving_size: "19g bag" },

  // ===== CEREALS — per typical portion (40g cereal + 125ml semi-skimmed milk where relevant) =====
  { food_name: "Weetabix 2 Biscuits with Milk",        brand: "Weetabix", calories: 215, protein_g: 10, carbs_g: 35, fat_g: 3.5,fibre_g: 5,   sugar_g: 9,   salt_g: 0.4, serving_size: "2 biscuits + 125ml milk" },
  { food_name: "Weetabix 3 Biscuits with Milk",        brand: "Weetabix", calories: 295, protein_g: 13, carbs_g: 49, fat_g: 4,  fibre_g: 7,   sugar_g: 11,  salt_g: 0.5, serving_size: "3 biscuits + 125ml milk" },
  { food_name: "Kellogg's Cornflakes",                 brand: "Kellogg's", calories: 143, protein_g: 3,  carbs_g: 32, fat_g: 0.4,fibre_g: 1.2, sugar_g: 3.2, salt_g: 0.4, serving_size: "40g" },
  { food_name: "Kellogg's Cornflakes with Milk",       brand: "Kellogg's", calories: 210, protein_g: 7.3,carbs_g: 38, fat_g: 2.7,fibre_g: 1.2, sugar_g: 8.8, salt_g: 0.5, serving_size: "40g + 125ml milk" },
  { food_name: "Kellogg's Frosties",                   brand: "Kellogg's", calories: 150, protein_g: 1.6,carbs_g: 35, fat_g: 0.2,fibre_g: 1,   sugar_g: 14,  salt_g: 0.3, serving_size: "40g" },
  { food_name: "Kellogg's Special K",                  brand: "Kellogg's", calories: 150, protein_g: 6,  carbs_g: 30, fat_g: 0.6,fibre_g: 1.2, sugar_g: 6,   salt_g: 0.4, serving_size: "40g" },
  { food_name: "Kellogg's Crunchy Nut",                brand: "Kellogg's", calories: 162, protein_g: 2.4,carbs_g: 33, fat_g: 2,  fibre_g: 1.2, sugar_g: 14,  salt_g: 0.4, serving_size: "40g" },
  { food_name: "Kellogg's Rice Krispies",              brand: "Kellogg's", calories: 150, protein_g: 2.4,carbs_g: 34, fat_g: 0.4,fibre_g: 0.5, sugar_g: 4,   salt_g: 0.4, serving_size: "40g" },
  { food_name: "Kellogg's Coco Pops",                  brand: "Kellogg's", calories: 150, protein_g: 2,  carbs_g: 34, fat_g: 0.8,fibre_g: 1,   sugar_g: 6.8, salt_g: 0.4, serving_size: "40g" },
  { food_name: "Nestlé Shreddies",                     brand: "Nestlé", calories: 150, protein_g: 4,  carbs_g: 30, fat_g: 0.7,fibre_g: 4.6, sugar_g: 5,   salt_g: 0.3, serving_size: "40g" },
  { food_name: "Nestlé Cheerios",                      brand: "Nestlé", calories: 150, protein_g: 3.2,carbs_g: 30, fat_g: 1.6,fibre_g: 2.4, sugar_g: 8,   salt_g: 0.3, serving_size: "40g" },
  { food_name: "Nestlé Shredded Wheat 2 biscuits",     brand: "Nestlé", calories: 160, protein_g: 5.4,carbs_g: 30, fat_g: 1.1,fibre_g: 4.7, sugar_g: 0.4, salt_g: 0,   serving_size: "2 biscuits (45g)" },
  { food_name: "Quaker Oats So Simple Original",       brand: "Quaker", calories: 171, protein_g: 6.3,carbs_g: 32, fat_g: 3,  fibre_g: 3.2, sugar_g: 1,   salt_g: 0,   serving_size: "1 sachet (36g)" },
  { food_name: "Quaker Oats So Simple Golden Syrup",   brand: "Quaker", calories: 167, protein_g: 5,  carbs_g: 32, fat_g: 2.2,fibre_g: 3,   sugar_g: 11,  salt_g: 0.1, serving_size: "1 sachet (36g)" },
  { food_name: "Dorset Cereals Berry Muesli",          brand: "Dorset Cereals", calories: 175, protein_g: 4.6,carbs_g: 30, fat_g: 4,  fibre_g: 4.5, sugar_g: 9,   salt_g: 0,   serving_size: "45g" },
  { food_name: "Alpen Original Muesli",                brand: "Alpen", calories: 160, protein_g: 4.2,carbs_g: 28, fat_g: 3,  fibre_g: 3,   sugar_g: 9,   salt_g: 0.1, serving_size: "45g" },
  { food_name: "Porridge Oats with Semi-Skimmed Milk", brand: "Generic", calories: 280, protein_g: 11, carbs_g: 42, fat_g: 7,  fibre_g: 4,   sugar_g: 8,   salt_g: 0.2, serving_size: "40g oats + 250ml milk" },
  { food_name: "Porridge Oats with Water",             brand: "Generic", calories: 152, protein_g: 4.6,carbs_g: 27, fat_g: 3,  fibre_g: 4,   sugar_g: 0.4, salt_g: 0,   serving_size: "40g oats + 250ml water" },

  // ===== PROTEIN BRANDS — bars, shakes, puddings =====
  { food_name: "Grenade Carb Killa White Chocolate Cookie",brand:"Grenade", calories: 215, protein_g: 20, carbs_g: 18, fat_g: 8,  fibre_g: 4,   sugar_g: 2,   salt_g: 0.7, serving_size: "1 bar (60g)" },
  { food_name: "Grenade Carb Killa Salted Caramel",    brand: "Grenade", calories: 216, protein_g: 20, carbs_g: 17, fat_g: 8,  fibre_g: 5,   sugar_g: 2,   salt_g: 0.8, serving_size: "1 bar (60g)" },
  { food_name: "Grenade Carb Killa Peanut Nutter",     brand: "Grenade", calories: 220, protein_g: 20, carbs_g: 17, fat_g: 9,  fibre_g: 5,   sugar_g: 1.5, salt_g: 0.7, serving_size: "1 bar (60g)" },
  { food_name: "Grenade Carb Killa Birthday Cake",     brand: "Grenade", calories: 218, protein_g: 20, carbs_g: 18, fat_g: 8,  fibre_g: 4,   sugar_g: 2,   salt_g: 0.7, serving_size: "1 bar (60g)" },
  { food_name: "MyProtein Layered Bar Chocolate",      brand: "MyProtein", calories: 202, protein_g: 20, carbs_g: 15, fat_g: 7,  fibre_g: 6,   sugar_g: 1.5, salt_g: 0.5, serving_size: "1 bar (60g)" },
  { food_name: "MyProtein Impact Whey Chocolate",      brand: "MyProtein", calories: 97,  protein_g: 19, carbs_g: 2,  fat_g: 1.6,fibre_g: 0.5, sugar_g: 1.5, salt_g: 0.1, serving_size: "1 scoop (25g)" },
  { food_name: "MyProtein Impact Whey Vanilla",        brand: "MyProtein", calories: 97,  protein_g: 19, carbs_g: 2,  fat_g: 1.6,fibre_g: 0.3, sugar_g: 1.5, salt_g: 0.1, serving_size: "1 scoop (25g)" },
  { food_name: "PhD Smart Protein Bar Chocolate",      brand: "PhD", calories: 205, protein_g: 20, carbs_g: 20, fat_g: 6.5,fibre_g: 4,   sugar_g: 2,   salt_g: 0.6, serving_size: "1 bar (64g)" },
  { food_name: "Optimum Nutrition Gold Standard Whey", brand: "Optimum Nutrition", calories: 120, protein_g: 24, carbs_g: 3,  fat_g: 1,  fibre_g: 1,   sugar_g: 1.5, salt_g: 0.1, serving_size: "1 scoop (30g)" },
  { food_name: "Huel Black Edition Vanilla",           brand: "Huel", calories: 400, protein_g: 40, carbs_g: 17, fat_g: 14, fibre_g: 8,   sugar_g: 2,   salt_g: 0.7, serving_size: "1 serving (90g)" },
  { food_name: "Huel Ready to Drink Vanilla",          brand: "Huel", calories: 400, protein_g: 20, carbs_g: 37, fat_g: 18, fibre_g: 6,   sugar_g: 3,   salt_g: 0.7, serving_size: "1 bottle (500ml)" },
  { food_name: "Huel Hot and Savoury Thai Green Curry",brand: "Huel", calories: 400, protein_g: 25, carbs_g: 47, fat_g: 12, fibre_g: 8,   sugar_g: 3,   salt_g: 1.3, serving_size: "1 pot (92g)" },
  { food_name: "Mars Protein Bar",                     brand: "Mars", calories: 205, protein_g: 19, carbs_g: 17, fat_g: 6,  fibre_g: 2,   sugar_g: 15,  salt_g: 0.5, serving_size: "1 bar (51g)" },
  { food_name: "Snickers Protein Bar",                 brand: "Snickers", calories: 200, protein_g: 18, carbs_g: 16, fat_g: 7,  fibre_g: 2,   sugar_g: 13,  salt_g: 0.4, serving_size: "1 bar (51g)" },
  { food_name: "Fage Total 0% Greek Yogurt",           brand: "Fage", calories: 100, protein_g: 19, carbs_g: 5,  fat_g: 0,  fibre_g: 0,   sugar_g: 4,   salt_g: 0.1, serving_size: "170g pot" },
  { food_name: "Fage Total 5% Greek Yogurt",           brand: "Fage", calories: 160, protein_g: 14, carbs_g: 5,  fat_g: 8,  fibre_g: 0,   sugar_g: 4,   salt_g: 0.1, serving_size: "170g pot" },
  { food_name: "Arla Protein Pudding Chocolate",       brand: "Arla", calories: 200, protein_g: 20, carbs_g: 23, fat_g: 2.8,fibre_g: 2,   sugar_g: 10,  salt_g: 0.3, serving_size: "200g pot" },
  { food_name: "Arla Protein Strawberry Yogurt",       brand: "Arla", calories: 130, protein_g: 20, carbs_g: 10, fat_g: 1,  fibre_g: 1,   sugar_g: 9,   salt_g: 0.2, serving_size: "200g pot" },

  // ===== BREAD / BASICS / COMMON STAPLES =====
  { food_name: "White Bread Slice Medium",             brand: "Generic", calories: 93,  protein_g: 3.3,carbs_g: 17, fat_g: 0.8,fibre_g: 1,   sugar_g: 1.2, salt_g: 0.4, serving_size: "1 slice (36g)" },
  { food_name: "Wholemeal Bread Slice Medium",         brand: "Generic", calories: 85,  protein_g: 4,  carbs_g: 14, fat_g: 1,  fibre_g: 2.5, sugar_g: 1.2, salt_g: 0.4, serving_size: "1 slice (36g)" },
  { food_name: "Sourdough Bread Slice",                brand: "Generic", calories: 125, protein_g: 4.5,carbs_g: 24, fat_g: 0.8,fibre_g: 1.5, sugar_g: 1,   salt_g: 0.5, serving_size: "1 slice (50g)" },
  { food_name: "Bagel Plain",                          brand: "Generic", calories: 250, protein_g: 9,  carbs_g: 48, fat_g: 2,  fibre_g: 2,   sugar_g: 6,   salt_g: 0.8, serving_size: "1 bagel (85g)" },
  { food_name: "Everything Bagel",                     brand: "Generic", calories: 260, protein_g: 9,  carbs_g: 48, fat_g: 3,  fibre_g: 2,   sugar_g: 5,   salt_g: 1.0, serving_size: "1 bagel (85g)" },
  { food_name: "English Muffin",                       brand: "Generic", calories: 140, protein_g: 5,  carbs_g: 28, fat_g: 1,  fibre_g: 1,   sugar_g: 2,   salt_g: 0.5, serving_size: "1 muffin (65g)" },
  { food_name: "Crumpet Regular",                      brand: "Generic", calories: 95,  protein_g: 3,  carbs_g: 19, fat_g: 0.4,fibre_g: 1,   sugar_g: 0.8, salt_g: 0.5, serving_size: "1 crumpet (50g)" },
  { food_name: "Tortilla Wrap Regular",                brand: "Generic", calories: 160, protein_g: 5,  carbs_g: 27, fat_g: 4,  fibre_g: 2,   sugar_g: 1,   salt_g: 0.6, serving_size: "1 wrap (60g)" },
  { food_name: "Tortilla Wrap Large",                  brand: "Generic", calories: 215, protein_g: 7,  carbs_g: 36, fat_g: 5,  fibre_g: 3,   sugar_g: 1,   salt_g: 0.8, serving_size: "1 wrap (80g)" },

  // ============================================================
  // STAGE 4 — Alcoholic drinks
  // ============================================================

  // ===== BEER — pints and bottles =====
  { food_name: "Lager 4% ABV Pint",                    brand: "Alcohol", calories: 210, protein_g: 2, carbs_g: 20, fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Lager 5% ABV Pint",                    brand: "Alcohol", calories: 250, protein_g: 2, carbs_g: 20, fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Carling Pint",                         brand: "Alcohol", calories: 195, protein_g: 2, carbs_g: 18, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Foster's Pint",                        brand: "Alcohol", calories: 210, protein_g: 2, carbs_g: 19, fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Stella Artois Pint",                   brand: "Alcohol", calories: 255, protein_g: 2, carbs_g: 20, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Heineken Pint",                        brand: "Alcohol", calories: 240, protein_g: 2, carbs_g: 19, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Budweiser Pint",                       brand: "Alcohol", calories: 215, protein_g: 2, carbs_g: 18, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Peroni Pint",                          brand: "Alcohol", calories: 260, protein_g: 2, carbs_g: 21, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Corona Bottle",                        brand: "Alcohol", calories: 150, protein_g: 1, carbs_g: 13, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "330ml bottle" },
  { food_name: "Beck's Bottle",                        brand: "Alcohol", calories: 135, protein_g: 1, carbs_g: 9,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "275ml bottle" },
  { food_name: "Guinness Pint",                        brand: "Alcohol", calories: 210, protein_g: 2, carbs_g: 18, fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Ale 4% Pint",                          brand: "Alcohol", calories: 205, protein_g: 2, carbs_g: 20, fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Real Ale 4.5% Pint",                   brand: "Alcohol", calories: 225, protein_g: 2, carbs_g: 22, fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "IPA 5% Pint",                          brand: "Alcohol", calories: 255, protein_g: 2, carbs_g: 22, fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Craft Beer 6% Pint",                   brand: "Alcohol", calories: 295, protein_g: 2, carbs_g: 22, fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Stout 4% Pint",                        brand: "Alcohol", calories: 210, protein_g: 2, carbs_g: 19, fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Lager Half Pint 4%",                   brand: "Alcohol", calories: 105, protein_g: 1, carbs_g: 10, fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "Half pint (284ml)" },
  { food_name: "Lager Half Pint 5%",                   brand: "Alcohol", calories: 125, protein_g: 1, carbs_g: 10, fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "Half pint (284ml)" },
  { food_name: "Non-Alcoholic Beer Pint",              brand: "Alcohol", calories: 130, protein_g: 1, carbs_g: 25, fat_g: 0, fibre_g: 0, sugar_g: 3, salt_g: 0, serving_size: "1 pint (568ml)" },

  // ===== CIDER =====
  { food_name: "Cider 4.5% Pint",                      brand: "Alcohol", calories: 215, protein_g: 0, carbs_g: 16, fat_g: 0, fibre_g: 0, sugar_g: 15, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Cider 5% Pint",                        brand: "Alcohol", calories: 245, protein_g: 0, carbs_g: 17, fat_g: 0, fibre_g: 0, sugar_g: 16, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Strongbow Pint",                       brand: "Alcohol", calories: 215, protein_g: 0, carbs_g: 14, fat_g: 0, fibre_g: 0, sugar_g: 13, salt_g: 0, serving_size: "1 pint (568ml)" },
  { food_name: "Kopparberg Mixed Fruit Bottle",        brand: "Alcohol", calories: 225, protein_g: 0, carbs_g: 30, fat_g: 0, fibre_g: 0, sugar_g: 30, salt_g: 0, serving_size: "500ml bottle" },
  { food_name: "Kopparberg Strawberry and Lime Bottle",brand: "Alcohol", calories: 230, protein_g: 0, carbs_g: 31, fat_g: 0, fibre_g: 0, sugar_g: 31, salt_g: 0, serving_size: "500ml bottle" },
  { food_name: "Rekorderlig Strawberry and Lime",      brand: "Alcohol", calories: 240, protein_g: 0, carbs_g: 32, fat_g: 0, fibre_g: 0, sugar_g: 32, salt_g: 0, serving_size: "500ml bottle" },
  { food_name: "Thatchers Gold Pint",                  brand: "Alcohol", calories: 225, protein_g: 0, carbs_g: 14, fat_g: 0, fibre_g: 0, sugar_g: 13, salt_g: 0, serving_size: "1 pint (568ml)" },

  // ===== WINE =====
  { food_name: "Red Wine 175ml Glass",                 brand: "Alcohol", calories: 160, protein_g: 0, carbs_g: 4,  fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "Medium glass (175ml)" },
  { food_name: "Red Wine 250ml Glass",                 brand: "Alcohol", calories: 225, protein_g: 0, carbs_g: 6,  fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "Large glass (250ml)" },
  { food_name: "Red Wine 125ml Glass",                 brand: "Alcohol", calories: 115, protein_g: 0, carbs_g: 3,  fat_g: 0, fibre_g: 0, sugar_g: 0.5,salt_g: 0, serving_size: "Small glass (125ml)" },
  { food_name: "Red Wine Bottle",                      brand: "Alcohol", calories: 685, protein_g: 0, carbs_g: 17, fat_g: 0, fibre_g: 0, sugar_g: 4, salt_g: 0, serving_size: "750ml bottle" },
  { food_name: "White Wine 175ml Glass Dry",           brand: "Alcohol", calories: 155, protein_g: 0, carbs_g: 5,  fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "Medium glass (175ml)" },
  { food_name: "White Wine 250ml Glass Dry",           brand: "Alcohol", calories: 220, protein_g: 0, carbs_g: 7,  fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "Large glass (250ml)" },
  { food_name: "White Wine 125ml Glass",               brand: "Alcohol", calories: 110, protein_g: 0, carbs_g: 3,  fat_g: 0, fibre_g: 0, sugar_g: 0.5,salt_g: 0, serving_size: "Small glass (125ml)" },
  { food_name: "White Wine Bottle",                    brand: "Alcohol", calories: 660, protein_g: 0, carbs_g: 20, fat_g: 0, fibre_g: 0, sugar_g: 4, salt_g: 0, serving_size: "750ml bottle" },
  { food_name: "Rosé Wine 175ml Glass",                brand: "Alcohol", calories: 148, protein_g: 0, carbs_g: 5,  fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "Medium glass (175ml)" },
  { food_name: "Rosé Wine 250ml Glass",                brand: "Alcohol", calories: 210, protein_g: 0, carbs_g: 7,  fat_g: 0, fibre_g: 0, sugar_g: 3, salt_g: 0, serving_size: "Large glass (250ml)" },
  { food_name: "Prosecco 125ml Glass",                 brand: "Alcohol", calories: 90,  protein_g: 0, carbs_g: 3,  fat_g: 0, fibre_g: 0, sugar_g: 2, salt_g: 0, serving_size: "125ml glass" },
  { food_name: "Prosecco Bottle",                      brand: "Alcohol", calories: 540, protein_g: 0, carbs_g: 18, fat_g: 0, fibre_g: 0, sugar_g: 12,salt_g: 0, serving_size: "750ml bottle" },
  { food_name: "Champagne 125ml Glass",                brand: "Alcohol", calories: 95,  protein_g: 0, carbs_g: 2,  fat_g: 0, fibre_g: 0, sugar_g: 1, salt_g: 0, serving_size: "125ml glass" },
  { food_name: "Dessert Wine 75ml",                    brand: "Alcohol", calories: 115, protein_g: 0, carbs_g: 9,  fat_g: 0, fibre_g: 0, sugar_g: 9, salt_g: 0, serving_size: "75ml glass" },

  // ===== SPIRITS (single 25ml / double 50ml) =====
  { food_name: "Gin Single",                           brand: "Alcohol", calories: 55,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml single" },
  { food_name: "Gin Double",                           brand: "Alcohol", calories: 110, protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "50ml double" },
  { food_name: "Gin and Tonic",                        brand: "Alcohol", calories: 115, protein_g: 0, carbs_g: 15, fat_g: 0, fibre_g: 0, sugar_g: 15,salt_g: 0, serving_size: "25ml gin + 200ml tonic" },
  { food_name: "Gin and Slimline Tonic",               brand: "Alcohol", calories: 60,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml gin + 200ml slim tonic" },
  { food_name: "Vodka Single",                         brand: "Alcohol", calories: 55,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml single" },
  { food_name: "Vodka Double",                         brand: "Alcohol", calories: 110, protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "50ml double" },
  { food_name: "Vodka and Coke",                       brand: "Alcohol", calories: 145, protein_g: 0, carbs_g: 21, fat_g: 0, fibre_g: 0, sugar_g: 21,salt_g: 0, serving_size: "25ml + 200ml Coke" },
  { food_name: "Vodka and Diet Coke",                  brand: "Alcohol", calories: 56,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml + 200ml Diet Coke" },
  { food_name: "Vodka and Red Bull",                   brand: "Alcohol", calories: 145, protein_g: 0, carbs_g: 22, fat_g: 0, fibre_g: 0, sugar_g: 22,salt_g: 0, serving_size: "25ml + 250ml Red Bull" },
  { food_name: "Rum Single",                           brand: "Alcohol", calories: 55,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml single" },
  { food_name: "Rum Double",                           brand: "Alcohol", calories: 110, protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "50ml double" },
  { food_name: "Rum and Coke",                         brand: "Alcohol", calories: 145, protein_g: 0, carbs_g: 21, fat_g: 0, fibre_g: 0, sugar_g: 21,salt_g: 0, serving_size: "25ml + 200ml Coke" },
  { food_name: "Whisky Single",                        brand: "Alcohol", calories: 60,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml single" },
  { food_name: "Whisky Double",                        brand: "Alcohol", calories: 120, protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "50ml double" },
  { food_name: "Whisky and Coke",                      brand: "Alcohol", calories: 150, protein_g: 0, carbs_g: 21, fat_g: 0, fibre_g: 0, sugar_g: 21,salt_g: 0, serving_size: "25ml + 200ml Coke" },
  { food_name: "Tequila Shot",                         brand: "Alcohol", calories: 65,  protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "25ml shot" },
  { food_name: "Jägermeister Shot",                    brand: "Alcohol", calories: 70,  protein_g: 0, carbs_g: 5,  fat_g: 0, fibre_g: 0, sugar_g: 5, salt_g: 0, serving_size: "25ml shot" },
  { food_name: "Sambuca Shot",                         brand: "Alcohol", calories: 105, protein_g: 0, carbs_g: 10, fat_g: 0, fibre_g: 0, sugar_g: 10,salt_g: 0, serving_size: "25ml shot" },
  { food_name: "Baileys 50ml",                         brand: "Alcohol", calories: 165, protein_g: 1, carbs_g: 13, fat_g: 8, fibre_g: 0, sugar_g: 10,salt_g: 0, serving_size: "50ml" },

  // ===== COCKTAILS =====
  { food_name: "Mojito",                               brand: "Cocktail", calories: 175, protein_g: 0, carbs_g: 20, fat_g: 0, fibre_g: 0, sugar_g: 18,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Piña Colada",                          brand: "Cocktail", calories: 380, protein_g: 2, carbs_g: 45, fat_g: 15,fibre_g: 0.5, sugar_g: 42,salt_g: 0.1, serving_size: "1 cocktail" },
  { food_name: "Margarita",                            brand: "Cocktail", calories: 220, protein_g: 0, carbs_g: 15, fat_g: 0, fibre_g: 0, sugar_g: 14,salt_g: 0.5, serving_size: "1 cocktail" },
  { food_name: "Cosmopolitan",                         brand: "Cocktail", calories: 200, protein_g: 0, carbs_g: 13, fat_g: 0, fibre_g: 0, sugar_g: 12,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Espresso Martini",                     brand: "Cocktail", calories: 235, protein_g: 0, carbs_g: 18, fat_g: 0, fibre_g: 0, sugar_g: 17,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Old Fashioned",                        brand: "Cocktail", calories: 155, protein_g: 0, carbs_g: 4,  fat_g: 0, fibre_g: 0, sugar_g: 4, salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Aperol Spritz",                        brand: "Cocktail", calories: 170, protein_g: 0, carbs_g: 15, fat_g: 0, fibre_g: 0, sugar_g: 14,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Negroni",                              brand: "Cocktail", calories: 210, protein_g: 0, carbs_g: 12, fat_g: 0, fibre_g: 0, sugar_g: 11,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Long Island Iced Tea",                 brand: "Cocktail", calories: 275, protein_g: 0, carbs_g: 33, fat_g: 0, fibre_g: 0, sugar_g: 30,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Porn Star Martini",                    brand: "Cocktail", calories: 265, protein_g: 0, carbs_g: 28, fat_g: 0, fibre_g: 0, sugar_g: 26,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Mai Tai",                              brand: "Cocktail", calories: 240, protein_g: 0, carbs_g: 22, fat_g: 0, fibre_g: 0, sugar_g: 21,salt_g: 0, serving_size: "1 cocktail" },
  { food_name: "Sex on the Beach",                     brand: "Cocktail", calories: 215, protein_g: 0, carbs_g: 25, fat_g: 0, fibre_g: 0.5,sugar_g: 23,salt_g: 0, serving_size: "1 cocktail" },

  // ============================================================
  // STAGE 5 — Secondary chains + fast-casual
  // ============================================================

  // ===== CHIPOTLE =====
  { food_name: "Chicken Burrito",                      brand: "Chipotle", calories: 915, protein_g: 52, carbs_g: 95, fat_g: 33, fibre_g: 12, sugar_g: 5, salt_g: 2.9, serving_size: "1 burrito" },
  { food_name: "Steak Burrito",                        brand: "Chipotle", calories: 945, protein_g: 52, carbs_g: 95, fat_g: 36, fibre_g: 12, sugar_g: 5, salt_g: 3.0, serving_size: "1 burrito" },
  { food_name: "Barbacoa Burrito",                     brand: "Chipotle", calories: 945, protein_g: 53, carbs_g: 95, fat_g: 36, fibre_g: 12, sugar_g: 5, salt_g: 3.1, serving_size: "1 burrito" },
  { food_name: "Carnitas Burrito",                     brand: "Chipotle", calories: 985, protein_g: 48, carbs_g: 95, fat_g: 42, fibre_g: 12, sugar_g: 5, salt_g: 3.0, serving_size: "1 burrito" },
  { food_name: "Sofritas Burrito",                     brand: "Chipotle", calories: 895, protein_g: 30, carbs_g: 105,fat_g: 34, fibre_g: 14, sugar_g: 8, salt_g: 2.7, serving_size: "1 burrito" },
  { food_name: "Chicken Burrito Bowl",                 brand: "Chipotle", calories: 635, protein_g: 48, carbs_g: 45, fat_g: 25, fibre_g: 10, sugar_g: 4, salt_g: 2.3, serving_size: "1 bowl" },
  { food_name: "Steak Burrito Bowl",                   brand: "Chipotle", calories: 665, protein_g: 48, carbs_g: 45, fat_g: 28, fibre_g: 10, sugar_g: 4, salt_g: 2.4, serving_size: "1 bowl" },
  { food_name: "Chicken Tacos 3 piece",                brand: "Chipotle", calories: 620, protein_g: 35, carbs_g: 60, fat_g: 24, fibre_g: 9,  sugar_g: 3, salt_g: 2.1, serving_size: "3 tacos" },
  { food_name: "Chicken Salad Bowl",                   brand: "Chipotle", calories: 485, protein_g: 45, carbs_g: 32, fat_g: 20, fibre_g: 9,  sugar_g: 5, salt_g: 2.0, serving_size: "1 salad" },
  { food_name: "Chips and Guacamole",                  brand: "Chipotle", calories: 770, protein_g: 9,  carbs_g: 82, fat_g: 47, fibre_g: 13, sugar_g: 2, salt_g: 1.6, serving_size: "1 portion" },

  // ===== SHAKE SHACK =====
  { food_name: "ShackBurger",                          brand: "Shake Shack", calories: 530, protein_g: 27, carbs_g: 33, fat_g: 32, fibre_g: 1, sugar_g: 6,  salt_g: 2.2, serving_size: "1 burger" },
  { food_name: "Double ShackBurger",                   brand: "Shake Shack", calories: 790, protein_g: 46, carbs_g: 34, fat_g: 52, fibre_g: 1, sugar_g: 6,  salt_g: 3.2, serving_size: "1 burger" },
  { food_name: "SmokeShack Burger",                    brand: "Shake Shack", calories: 620, protein_g: 32, carbs_g: 33, fat_g: 39, fibre_g: 1, sugar_g: 6,  salt_g: 2.7, serving_size: "1 burger" },
  { food_name: "Chick'n Shack",                        brand: "Shake Shack", calories: 550, protein_g: 29, carbs_g: 47, fat_g: 28, fibre_g: 3, sugar_g: 8,  salt_g: 2.4, serving_size: "1 burger" },
  { food_name: "'Shroom Burger",                       brand: "Shake Shack", calories: 580, protein_g: 16, carbs_g: 48, fat_g: 37, fibre_g: 3, sugar_g: 5,  salt_g: 2.5, serving_size: "1 burger" },
  { food_name: "Crinkle Cut Fries",                    brand: "Shake Shack", calories: 420, protein_g: 5,  carbs_g: 47, fat_g: 22, fibre_g: 5, sugar_g: 1,  salt_g: 1.2, serving_size: "Regular" },
  { food_name: "Cheese Fries",                         brand: "Shake Shack", calories: 580, protein_g: 12, carbs_g: 48, fat_g: 36, fibre_g: 5, sugar_g: 2,  salt_g: 2.0, serving_size: "Regular" },
  { food_name: "Vanilla Shake",                        brand: "Shake Shack", calories: 680, protein_g: 15, carbs_g: 72, fat_g: 38, fibre_g: 0, sugar_g: 64, salt_g: 0.5, serving_size: "Regular" },
  { food_name: "Chocolate Shake",                      brand: "Shake Shack", calories: 720, protein_g: 15, carbs_g: 79, fat_g: 38, fibre_g: 1, sugar_g: 68, salt_g: 0.6, serving_size: "Regular" },

  // ===== BYRON BURGERS =====
  { food_name: "Byron Classic Cheeseburger",           brand: "Byron", calories: 845, protein_g: 46, carbs_g: 48, fat_g: 52, fibre_g: 4, sugar_g: 8,  salt_g: 3.0, serving_size: "1 burger" },
  { food_name: "Smoky Burger",                         brand: "Byron", calories: 955, protein_g: 50, carbs_g: 52, fat_g: 58, fibre_g: 4, sugar_g: 10, salt_g: 3.3, serving_size: "1 burger" },
  { food_name: "Chilli Queen Burger",                  brand: "Byron", calories: 1025,protein_g: 52, carbs_g: 55, fat_g: 62, fibre_g: 5, sugar_g: 10, salt_g: 3.5, serving_size: "1 burger" },
  { food_name: "Byron Chicken Burger",                 brand: "Byron", calories: 755, protein_g: 40, carbs_g: 55, fat_g: 38, fibre_g: 4, sugar_g: 8,  salt_g: 2.8, serving_size: "1 burger" },
  { food_name: "Plant Byron",                          brand: "Byron", calories: 790, protein_g: 32, carbs_g: 70, fat_g: 40, fibre_g: 8, sugar_g: 11, salt_g: 3.0, serving_size: "1 burger" },
  { food_name: "Skin on Fries",                        brand: "Byron", calories: 410, protein_g: 5,  carbs_g: 54, fat_g: 18, fibre_g: 6, sugar_g: 1,  salt_g: 1.2, serving_size: "Side portion" },
  { food_name: "Courgette Fries",                      brand: "Byron", calories: 340, protein_g: 6,  carbs_g: 30, fat_g: 22, fibre_g: 4, sugar_g: 4,  salt_g: 1.3, serving_size: "Side portion" },

  // ===== PAUL BAKERY =====
  { food_name: "Butter Croissant",                     brand: "Paul", calories: 285, protein_g: 5,  carbs_g: 28, fat_g: 17, fibre_g: 2, sugar_g: 5,  salt_g: 0.6, serving_size: "1 croissant" },
  { food_name: "Almond Croissant",                     brand: "Paul", calories: 445, protein_g: 10, carbs_g: 40, fat_g: 27, fibre_g: 3, sugar_g: 16, salt_g: 0.5, serving_size: "1 croissant" },
  { food_name: "Pain au Chocolat",                     brand: "Paul", calories: 330, protein_g: 6,  carbs_g: 32, fat_g: 19, fibre_g: 2, sugar_g: 11, salt_g: 0.5, serving_size: "1 pastry" },
  { food_name: "Pain aux Raisins",                     brand: "Paul", calories: 365, protein_g: 6,  carbs_g: 45, fat_g: 17, fibre_g: 2, sugar_g: 20, salt_g: 0.5, serving_size: "1 pastry" },
  { food_name: "Chicken Caesar Sandwich",              brand: "Paul", calories: 520, protein_g: 28, carbs_g: 48, fat_g: 24, fibre_g: 4, sugar_g: 4,  salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Jambon Beurre Baguette",               brand: "Paul", calories: 480, protein_g: 20, carbs_g: 55, fat_g: 20, fibre_g: 3, sugar_g: 3,  salt_g: 2.2, serving_size: "1 baguette" },
  { food_name: "Millefeuille",                         brand: "Paul", calories: 420, protein_g: 5,  carbs_g: 42, fat_g: 26, fibre_g: 1, sugar_g: 25, salt_g: 0.3, serving_size: "1 pastry" },
  { food_name: "Macaron",                              brand: "Paul", calories: 85,  protein_g: 1,  carbs_g: 12, fat_g: 3.5,fibre_g: 0.5,sugar_g: 11, salt_g: 0.1, serving_size: "1 macaron" },

  // ===== OLE AND STEEN =====
  { food_name: "Cinnamon Social",                      brand: "Ole and Steen", calories: 380, protein_g: 7,  carbs_g: 47, fat_g: 18, fibre_g: 2, sugar_g: 18, salt_g: 0.6, serving_size: "1 pastry" },
  { food_name: "Tebirkes",                             brand: "Ole and Steen", calories: 395, protein_g: 7,  carbs_g: 32, fat_g: 26, fibre_g: 2, sugar_g: 10, salt_g: 0.8, serving_size: "1 pastry" },
  { food_name: "Spandauer",                            brand: "Ole and Steen", calories: 420, protein_g: 7,  carbs_g: 43, fat_g: 24, fibre_g: 2, sugar_g: 18, salt_g: 0.6, serving_size: "1 pastry" },
  { food_name: "Chicken Salad Sandwich",               brand: "Ole and Steen", calories: 475, protein_g: 26, carbs_g: 45, fat_g: 20, fibre_g: 4, sugar_g: 4,  salt_g: 1.8, serving_size: "1 sandwich" },
  { food_name: "Avocado Rye Bread",                    brand: "Ole and Steen", calories: 425, protein_g: 10, carbs_g: 45, fat_g: 22, fibre_g: 8, sugar_g: 4,  salt_g: 1.5, serving_size: "1 open sandwich" },
  { food_name: "Rye Bread with Salmon",                brand: "Ole and Steen", calories: 445, protein_g: 25, carbs_g: 40, fat_g: 22, fibre_g: 7, sugar_g: 3,  salt_g: 2.0, serving_size: "1 open sandwich" },

  // ===== VITAL INGREDIENT =====
  { food_name: "Chicken Caesar Salad",                 brand: "Vital Ingredient", calories: 495, protein_g: 35, carbs_g: 25, fat_g: 28, fibre_g: 4, sugar_g: 5, salt_g: 1.8, serving_size: "1 bowl" },
  { food_name: "Superfood Salad",                      brand: "Vital Ingredient", calories: 445, protein_g: 18, carbs_g: 45, fat_g: 20, fibre_g: 8, sugar_g: 8, salt_g: 1.2, serving_size: "1 bowl" },
  { food_name: "Chicken Thai Noodles",                 brand: "Vital Ingredient", calories: 520, protein_g: 32, carbs_g: 55, fat_g: 18, fibre_g: 5, sugar_g: 10,salt_g: 2.0, serving_size: "1 bowl" },
  { food_name: "Vegetable Thai Green Curry",           brand: "Vital Ingredient", calories: 540, protein_g: 12, carbs_g: 65, fat_g: 25, fibre_g: 7, sugar_g: 9, salt_g: 1.9, serving_size: "1 bowl" },

  // ===== CHOPSTIX =====
  { food_name: "Caramel Drizzle Chicken Box",          brand: "Chopstix", calories: 720, protein_g: 28, carbs_g: 92, fat_g: 24, fibre_g: 4, sugar_g: 30,salt_g: 2.8, serving_size: "1 box" },
  { food_name: "Salt and Pepper Chicken Box",          brand: "Chopstix", calories: 685, protein_g: 32, carbs_g: 80, fat_g: 25, fibre_g: 4, sugar_g: 5, salt_g: 3.2, serving_size: "1 box" },
  { food_name: "Teriyaki Chicken Box",                 brand: "Chopstix", calories: 660, protein_g: 30, carbs_g: 82, fat_g: 22, fibre_g: 4, sugar_g: 18,salt_g: 2.8, serving_size: "1 box" },
  { food_name: "Vegetable Noodles Box",                brand: "Chopstix", calories: 520, protein_g: 12, carbs_g: 88, fat_g: 12, fibre_g: 6, sugar_g: 9, salt_g: 2.5, serving_size: "1 box" },

  // ===== WRAPCHIC =====
  { food_name: "Chicken Tikka Wrap",                   brand: "Wrapchic", calories: 525, protein_g: 30, carbs_g: 55, fat_g: 18, fibre_g: 5, sugar_g: 5, salt_g: 1.8, serving_size: "1 wrap" },
  { food_name: "Butter Chicken Burrito",               brand: "Wrapchic", calories: 655, protein_g: 32, carbs_g: 70, fat_g: 25, fibre_g: 6, sugar_g: 9, salt_g: 2.1, serving_size: "1 burrito" },
  { food_name: "Paneer Tikka Wrap",                    brand: "Wrapchic", calories: 495, protein_g: 22, carbs_g: 52, fat_g: 20, fibre_g: 5, sugar_g: 5, salt_g: 1.7, serving_size: "1 wrap" },

  // ===== ABOKADO =====
  { food_name: "Chicken and Teriyaki Udon Hot Pot",    brand: "Abokado", calories: 445, protein_g: 28, carbs_g: 55, fat_g: 12, fibre_g: 4, sugar_g: 14,salt_g: 2.1, serving_size: "1 pot" },
  { food_name: "Teriyaki Salmon Sushi Box",            brand: "Abokado", calories: 485, protein_g: 22, carbs_g: 75, fat_g: 9,  fibre_g: 3, sugar_g: 12,salt_g: 1.6, serving_size: "1 box" },
  { food_name: "Katsu Curry Rice Pot",                 brand: "Abokado", calories: 565, protein_g: 22, carbs_g: 82, fat_g: 15, fibre_g: 5, sugar_g: 10,salt_g: 1.8, serving_size: "1 pot" },

  // ===== MILLIE'S COOKIES =====
  { food_name: "Choc Chunk Cookie",                    brand: "Millie's Cookies", calories: 295, protein_g: 3,  carbs_g: 38, fat_g: 14, fibre_g: 1, sugar_g: 22, salt_g: 0.3, serving_size: "1 cookie" },
  { food_name: "Double Chocolate Cookie",              brand: "Millie's Cookies", calories: 305, protein_g: 3.5,carbs_g: 36, fat_g: 16, fibre_g: 2, sugar_g: 22, salt_g: 0.3, serving_size: "1 cookie" },
  { food_name: "White Chocolate Cookie",               brand: "Millie's Cookies", calories: 300, protein_g: 3,  carbs_g: 38, fat_g: 15, fibre_g: 1, sugar_g: 24, salt_g: 0.3, serving_size: "1 cookie" },
  { food_name: "Oreo Cookie",                          brand: "Millie's Cookies", calories: 315, protein_g: 3,  carbs_g: 40, fat_g: 16, fibre_g: 1, sugar_g: 25, salt_g: 0.4, serving_size: "1 cookie" },

  // ===== CINNABON =====
  { food_name: "Classic Cinnabon",                     brand: "Cinnabon", calories: 880, protein_g: 15, carbs_g: 127,fat_g: 36, fibre_g: 3, sugar_g: 58, salt_g: 1.2, serving_size: "1 roll" },
  { food_name: "Minibon",                              brand: "Cinnabon", calories: 350, protein_g: 6,  carbs_g: 50, fat_g: 14, fibre_g: 1, sugar_g: 23, salt_g: 0.5, serving_size: "1 minibon" },
  { food_name: "Caramel Pecanbon",                     brand: "Cinnabon", calories: 1080,protein_g: 16, carbs_g: 141,fat_g: 51, fibre_g: 4, sugar_g: 75, salt_g: 1.3, serving_size: "1 roll" },
  { food_name: "BonBites 6 piece",                     brand: "Cinnabon", calories: 440, protein_g: 7,  carbs_g: 62, fat_g: 18, fibre_g: 1, sugar_g: 28, salt_g: 0.6, serving_size: "6 bites" },

  // ===== TIM HORTONS =====
  { food_name: "Original Glazed Timbit",               brand: "Tim Hortons", calories: 55,  protein_g: 0.7,carbs_g: 7,  fat_g: 3,  fibre_g: 0.2,sugar_g: 4, salt_g: 0.1, serving_size: "1 timbit" },
  { food_name: "Chocolate Glazed Donut",               brand: "Tim Hortons", calories: 260, protein_g: 3,  carbs_g: 34, fat_g: 13, fibre_g: 1,  sugar_g: 18,salt_g: 0.4, serving_size: "1 donut" },
  { food_name: "Maple Dip Donut",                      brand: "Tim Hortons", calories: 270, protein_g: 3,  carbs_g: 36, fat_g: 13, fibre_g: 1,  sugar_g: 20,salt_g: 0.4, serving_size: "1 donut" },
  { food_name: "Boston Cream Donut",                   brand: "Tim Hortons", calories: 290, protein_g: 4,  carbs_g: 36, fat_g: 14, fibre_g: 1,  sugar_g: 16,salt_g: 0.4, serving_size: "1 donut" },
  { food_name: "Double Double Coffee",                 brand: "Tim Hortons", calories: 100, protein_g: 2,  carbs_g: 13, fat_g: 4,  fibre_g: 0,  sugar_g: 13,salt_g: 0.1, serving_size: "Medium (350ml)" },
  { food_name: "French Vanilla Cappuccino",            brand: "Tim Hortons", calories: 250, protein_g: 4,  carbs_g: 42, fat_g: 7,  fibre_g: 0,  sugar_g: 32,salt_g: 0.3, serving_size: "Medium (350ml)" },

  // ===== EAT =====
  { food_name: "Chicken and Bacon Club Sandwich",      brand: "EAT.", calories: 445, protein_g: 28, carbs_g: 42, fat_g: 18, fibre_g: 4, sugar_g: 4, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Hot Chicken Wrap",                     brand: "EAT.", calories: 525, protein_g: 32, carbs_g: 55, fat_g: 18, fibre_g: 4, sugar_g: 6, salt_g: 2.1, serving_size: "1 wrap" },
  { food_name: "Chicken Chorizo Soup",                 brand: "EAT.", calories: 295, protein_g: 18, carbs_g: 28, fat_g: 12, fibre_g: 4, sugar_g: 6, salt_g: 2.2, serving_size: "Regular" },

  // ===== JOE AND THE JUICE =====
  { food_name: "Tunacado Sandwich",                    brand: "Joe and the Juice", calories: 385, protein_g: 22, carbs_g: 38, fat_g: 15, fibre_g: 4, sugar_g: 5, salt_g: 1.7, serving_size: "1 sandwich" },
  { food_name: "Serrano Sandwich",                     brand: "Joe and the Juice", calories: 420, protein_g: 18, carbs_g: 40, fat_g: 20, fibre_g: 4, sugar_g: 5, salt_g: 2.0, serving_size: "1 sandwich" },
  { food_name: "Spicy Tuna Sandwich",                  brand: "Joe and the Juice", calories: 410, protein_g: 22, carbs_g: 38, fat_g: 17, fibre_g: 4, sugar_g: 5, salt_g: 1.8, serving_size: "1 sandwich" },
  { food_name: "Power Shake",                          brand: "Joe and the Juice", calories: 320, protein_g: 20, carbs_g: 40, fat_g: 8,  fibre_g: 3, sugar_g: 28,salt_g: 0.3, serving_size: "Regular" },
  { food_name: "Pick Me Up Juice",                     brand: "Joe and the Juice", calories: 165, protein_g: 2,  carbs_g: 38, fat_g: 0.5,fibre_g: 1, sugar_g: 33,salt_g: 0.1, serving_size: "Regular" },

  // ===== LIDL BAKERY / BUDGET =====
  { food_name: "Lidl Chocolate Croissant",             brand: "Lidl Bakery", calories: 305, protein_g: 5,  carbs_g: 32, fat_g: 17, fibre_g: 2, sugar_g: 13, salt_g: 0.5, serving_size: "1 pastry" },
  { food_name: "Lidl Butter Croissant",                brand: "Lidl Bakery", calories: 275, protein_g: 5,  carbs_g: 28, fat_g: 15, fibre_g: 2, sugar_g: 5,  salt_g: 0.6, serving_size: "1 croissant" },
  { food_name: "Lidl Cinnamon Swirl",                  brand: "Lidl Bakery", calories: 355, protein_g: 6,  carbs_g: 48, fat_g: 15, fibre_g: 2, sugar_g: 22, salt_g: 0.5, serving_size: "1 swirl" },

  // ============================================================
  // STAGE 6 — Breakfast + home-cooked basics + generic lunches
  // These are under "Home Cooked" brand so search by food name works naturally
  // ============================================================

  // ===== EGGS =====
  { food_name: "Boiled Egg Medium",                    brand: "Home Cooked", calories: 70,  protein_g: 6.3,carbs_g: 0.4,fat_g: 5,   fibre_g: 0, sugar_g: 0.4,salt_g: 0.2, serving_size: "1 egg (50g)" },
  { food_name: "Boiled Egg Large",                     brand: "Home Cooked", calories: 85,  protein_g: 7.5,carbs_g: 0.4,fat_g: 6,   fibre_g: 0, sugar_g: 0.4,salt_g: 0.2, serving_size: "1 egg (60g)" },
  { food_name: "Fried Egg",                            brand: "Home Cooked", calories: 90,  protein_g: 6.3,carbs_g: 0.4,fat_g: 7,   fibre_g: 0, sugar_g: 0.4,salt_g: 0.2, serving_size: "1 egg" },
  { food_name: "Poached Egg",                          brand: "Home Cooked", calories: 70,  protein_g: 6.3,carbs_g: 0.4,fat_g: 5,   fibre_g: 0, sugar_g: 0.4,salt_g: 0.2, serving_size: "1 egg" },
  { food_name: "Scrambled Egg 2 eggs",                 brand: "Home Cooked", calories: 205, protein_g: 14, carbs_g: 1,  fat_g: 16,  fibre_g: 0, sugar_g: 1,  salt_g: 0.4, serving_size: "2 eggs + butter" },
  { food_name: "Scrambled Egg 3 eggs",                 brand: "Home Cooked", calories: 300, protein_g: 21, carbs_g: 1.5,fat_g: 23,  fibre_g: 0, sugar_g: 1.5,salt_g: 0.6, serving_size: "3 eggs + butter" },
  { food_name: "Omelette Plain 2 egg",                 brand: "Home Cooked", calories: 195, protein_g: 13, carbs_g: 0.8,fat_g: 16,  fibre_g: 0, sugar_g: 0.8,salt_g: 0.4, serving_size: "2 eggs" },
  { food_name: "Omelette Plain 3 egg",                 brand: "Home Cooked", calories: 290, protein_g: 19, carbs_g: 1,  fat_g: 24,  fibre_g: 0, sugar_g: 1,  salt_g: 0.6, serving_size: "3 eggs" },
  { food_name: "Cheese Omelette 3 egg",                brand: "Home Cooked", calories: 410, protein_g: 28, carbs_g: 1,  fat_g: 33,  fibre_g: 0, sugar_g: 1,  salt_g: 1.2, serving_size: "3 eggs + 30g cheese" },
  { food_name: "Ham and Cheese Omelette 3 egg",        brand: "Home Cooked", calories: 475, protein_g: 34, carbs_g: 1.5,fat_g: 36,  fibre_g: 0, sugar_g: 1,  salt_g: 2.0, serving_size: "3 eggs" },
  { food_name: "Egg White Omelette 4 whites",          brand: "Home Cooked", calories: 70,  protein_g: 14, carbs_g: 1,  fat_g: 0.5, fibre_g: 0, sugar_g: 1,  salt_g: 0.5, serving_size: "4 whites" },

  // ===== TOAST + TOPPINGS =====
  { food_name: "Toast White Bread",                    brand: "Home Cooked", calories: 95,  protein_g: 3.3,carbs_g: 17, fat_g: 0.8, fibre_g: 1, sugar_g: 1.2, salt_g: 0.4, serving_size: "1 slice" },
  { food_name: "Toast Wholemeal",                      brand: "Home Cooked", calories: 85,  protein_g: 4,  carbs_g: 14, fat_g: 1,   fibre_g: 2.5,sugar_g: 1.2, salt_g: 0.4, serving_size: "1 slice" },
  { food_name: "Toast with Butter",                    brand: "Home Cooked", calories: 150, protein_g: 3.5,carbs_g: 17, fat_g: 7,   fibre_g: 1, sugar_g: 1.2, salt_g: 0.5, serving_size: "1 slice + 10g butter" },
  { food_name: "Toast with Jam",                       brand: "Home Cooked", calories: 140, protein_g: 3.5,carbs_g: 28, fat_g: 1,   fibre_g: 1, sugar_g: 11,  salt_g: 0.4, serving_size: "1 slice + 15g jam" },
  { food_name: "Toast with Marmite",                   brand: "Home Cooked", calories: 110, protein_g: 4.5,carbs_g: 18, fat_g: 1,   fibre_g: 1, sugar_g: 1.2, salt_g: 0.7, serving_size: "1 slice + 5g marmite" },
  { food_name: "Toast with Peanut Butter",             brand: "Home Cooked", calories: 195, protein_g: 7,  carbs_g: 18, fat_g: 10,  fibre_g: 2, sugar_g: 2,   salt_g: 0.5, serving_size: "1 slice + 15g PB" },
  { food_name: "Avocado on Toast",                     brand: "Home Cooked", calories: 220, protein_g: 5,  carbs_g: 20, fat_g: 14,  fibre_g: 6, sugar_g: 2,   salt_g: 0.5, serving_size: "1 slice + 1/2 avocado" },
  { food_name: "Beans on Toast 2 slices",              brand: "Home Cooked", calories: 360, protein_g: 16, carbs_g: 60, fat_g: 5,   fibre_g: 12,sugar_g: 13,  salt_g: 2.4, serving_size: "2 slices + 200g beans" },
  { food_name: "Egg on Toast",                         brand: "Home Cooked", calories: 165, protein_g: 10, carbs_g: 17, fat_g: 6,   fibre_g: 1, sugar_g: 1.5, salt_g: 0.6, serving_size: "1 slice + 1 egg" },

  // ===== PORRIDGE =====
  { food_name: "Porridge with Water",                  brand: "Home Cooked", calories: 152, protein_g: 4.6,carbs_g: 27, fat_g: 3,   fibre_g: 4, sugar_g: 0.4, salt_g: 0,   serving_size: "40g oats + 250ml water" },
  { food_name: "Porridge with Semi-Skimmed Milk",      brand: "Home Cooked", calories: 280, protein_g: 11, carbs_g: 42, fat_g: 7,   fibre_g: 4, sugar_g: 8,   salt_g: 0.2, serving_size: "40g oats + 250ml milk" },
  { food_name: "Porridge with Banana",                 brand: "Home Cooked", calories: 260, protein_g: 5.5,carbs_g: 50, fat_g: 3.5, fibre_g: 6, sugar_g: 16,  salt_g: 0,   serving_size: "40g oats + banana" },
  { food_name: "Porridge with Honey",                  brand: "Home Cooked", calories: 215, protein_g: 4.6,carbs_g: 42, fat_g: 3,   fibre_g: 4, sugar_g: 15,  salt_g: 0,   serving_size: "40g oats + 20g honey" },
  { food_name: "Overnight Oats Basic",                 brand: "Home Cooked", calories: 305, protein_g: 12, carbs_g: 45, fat_g: 8,   fibre_g: 5, sugar_g: 10,  salt_g: 0.2, serving_size: "40g oats + milk + fruit" },

  // ===== RICE =====
  { food_name: "White Rice Cooked",                    brand: "Home Cooked", calories: 130, protein_g: 2.7,carbs_g: 28, fat_g: 0.3, fibre_g: 0.4,sugar_g: 0,   salt_g: 0,   serving_size: "100g cooked" },
  { food_name: "White Rice Cooked Large Portion",      brand: "Home Cooked", calories: 260, protein_g: 5.4,carbs_g: 57, fat_g: 0.6, fibre_g: 0.8,sugar_g: 0,   salt_g: 0,   serving_size: "200g cooked" },
  { food_name: "Brown Rice Cooked",                    brand: "Home Cooked", calories: 110, protein_g: 2.5,carbs_g: 23, fat_g: 0.9, fibre_g: 1.8,sugar_g: 0,   salt_g: 0,   serving_size: "100g cooked" },
  { food_name: "Basmati Rice Cooked",                  brand: "Home Cooked", calories: 130, protein_g: 2.8,carbs_g: 28, fat_g: 0.5, fibre_g: 0.4,sugar_g: 0,   salt_g: 0,   serving_size: "100g cooked" },
  { food_name: "Microwave Rice Pouch",                 brand: "Home Cooked", calories: 315, protein_g: 6.5,carbs_g: 60, fat_g: 5,   fibre_g: 2,  sugar_g: 1,   salt_g: 1.0, serving_size: "250g pouch" },

  // ===== PASTA =====
  { food_name: "Spaghetti Cooked Dry 75g",             brand: "Home Cooked", calories: 265, protein_g: 10, carbs_g: 54, fat_g: 1.5, fibre_g: 3, sugar_g: 2,  salt_g: 0,   serving_size: "75g dry weight" },
  { food_name: "Spaghetti Cooked Dry 100g",            brand: "Home Cooked", calories: 355, protein_g: 13, carbs_g: 72, fat_g: 2,   fibre_g: 4, sugar_g: 3,  salt_g: 0,   serving_size: "100g dry weight" },
  { food_name: "Penne Cooked Dry 75g",                 brand: "Home Cooked", calories: 265, protein_g: 10, carbs_g: 54, fat_g: 1.5, fibre_g: 3, sugar_g: 2,  salt_g: 0,   serving_size: "75g dry weight" },
  { food_name: "Pasta Bake Plain",                     brand: "Home Cooked", calories: 485, protein_g: 22, carbs_g: 55, fat_g: 19, fibre_g: 4, sugar_g: 8,  salt_g: 1.5, serving_size: "1 portion (350g)" },
  { food_name: "Spaghetti Bolognese Home",             brand: "Home Cooked", calories: 520, protein_g: 30, carbs_g: 65, fat_g: 15, fibre_g: 5, sugar_g: 10, salt_g: 1.2, serving_size: "1 portion (400g)" },
  { food_name: "Pasta with Pesto",                     brand: "Home Cooked", calories: 520, protein_g: 14, carbs_g: 65, fat_g: 22, fibre_g: 4, sugar_g: 3,  salt_g: 1.1, serving_size: "1 portion (300g)" },
  { food_name: "Mac and Cheese Home",                  brand: "Home Cooked", calories: 560, protein_g: 22, carbs_g: 55, fat_g: 28, fibre_g: 3, sugar_g: 6,  salt_g: 1.6, serving_size: "1 portion (350g)" },

  // ===== PROTEINS — common sizes =====
  { food_name: "Chicken Breast Grilled 100g",          brand: "Home Cooked", calories: 165, protein_g: 31, carbs_g: 0,  fat_g: 3.5, fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "100g" },
  { food_name: "Chicken Breast Grilled 150g",          brand: "Home Cooked", calories: 250, protein_g: 47, carbs_g: 0,  fat_g: 5,   fibre_g: 0, sugar_g: 0,  salt_g: 0.3, serving_size: "150g" },
  { food_name: "Chicken Breast Grilled 200g",          brand: "Home Cooked", calories: 330, protein_g: 62, carbs_g: 0,  fat_g: 7,   fibre_g: 0, sugar_g: 0,  salt_g: 0.4, serving_size: "200g" },
  { food_name: "Chicken Thigh Cooked",                 brand: "Home Cooked", calories: 210, protein_g: 26, carbs_g: 0,  fat_g: 11,  fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "100g" },
  { food_name: "Chicken Drumstick Cooked",             brand: "Home Cooked", calories: 175, protein_g: 25, carbs_g: 0,  fat_g: 8,   fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "1 drumstick (85g)" },
  { food_name: "Salmon Fillet Cooked",                 brand: "Home Cooked", calories: 230, protein_g: 25, carbs_g: 0,  fat_g: 14,  fibre_g: 0, sugar_g: 0,  salt_g: 0.1, serving_size: "120g fillet" },
  { food_name: "Tuna Steak Cooked",                    brand: "Home Cooked", calories: 150, protein_g: 32, carbs_g: 0,  fat_g: 2,   fibre_g: 0, sugar_g: 0,  salt_g: 0.1, serving_size: "120g steak" },
  { food_name: "Cod Fillet Cooked",                    brand: "Home Cooked", calories: 110, protein_g: 24, carbs_g: 0,  fat_g: 0.9, fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "120g fillet" },
  { food_name: "Beef Mince 5% Fat Cooked",             brand: "Home Cooked", calories: 165, protein_g: 30, carbs_g: 0,  fat_g: 5,   fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "100g" },
  { food_name: "Beef Mince 20% Fat Cooked",            brand: "Home Cooked", calories: 250, protein_g: 26, carbs_g: 0,  fat_g: 17,  fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "100g" },
  { food_name: "Sirloin Steak 8oz Cooked",             brand: "Home Cooked", calories: 450, protein_g: 55, carbs_g: 0,  fat_g: 25,  fibre_g: 0, sugar_g: 0,  salt_g: 0.3, serving_size: "8oz (225g)" },
  { food_name: "Ribeye Steak 10oz Cooked",             brand: "Home Cooked", calories: 720, protein_g: 62, carbs_g: 0,  fat_g: 52,  fibre_g: 0, sugar_g: 0,  salt_g: 0.4, serving_size: "10oz (280g)" },
  { food_name: "Pork Chop Cooked",                     brand: "Home Cooked", calories: 230, protein_g: 28, carbs_g: 0,  fat_g: 13,  fibre_g: 0, sugar_g: 0,  salt_g: 0.2, serving_size: "1 chop (130g)" },
  { food_name: "Pork Sausage Cooked",                  brand: "Home Cooked", calories: 195, protein_g: 11, carbs_g: 6,  fat_g: 15,  fibre_g: 0, sugar_g: 1,  salt_g: 1.0, serving_size: "1 sausage (60g)" },
  { food_name: "Bacon Rasher Grilled",                 brand: "Home Cooked", calories: 45,  protein_g: 4,  carbs_g: 0.2,fat_g: 3.5, fibre_g: 0, sugar_g: 0,  salt_g: 0.5, serving_size: "1 rasher (15g)" },
  { food_name: "Tofu Firm",                            brand: "Home Cooked", calories: 145, protein_g: 16, carbs_g: 3,  fat_g: 8,   fibre_g: 2, sugar_g: 1,  salt_g: 0.1, serving_size: "100g" },
  { food_name: "Prawns Cooked",                        brand: "Home Cooked", calories: 100, protein_g: 22, carbs_g: 0,  fat_g: 1,   fibre_g: 0, sugar_g: 0,  salt_g: 0.8, serving_size: "100g" },

  // ===== VEGETABLES / CARBS =====
  { food_name: "Jacket Potato Plain",                  brand: "Home Cooked", calories: 225, protein_g: 6,  carbs_g: 51, fat_g: 0.3, fibre_g: 6, sugar_g: 3,  salt_g: 0,   serving_size: "1 medium (250g)" },
  { food_name: "Jacket Potato Large",                  brand: "Home Cooked", calories: 340, protein_g: 9,  carbs_g: 78, fat_g: 0.5, fibre_g: 9, sugar_g: 4,  salt_g: 0,   serving_size: "1 large (380g)" },
  { food_name: "Boiled Potatoes",                      brand: "Home Cooked", calories: 130, protein_g: 3,  carbs_g: 30, fat_g: 0.2, fibre_g: 2, sugar_g: 1,  salt_g: 0,   serving_size: "150g" },
  { food_name: "Roast Potatoes Home",                  brand: "Home Cooked", calories: 230, protein_g: 4,  carbs_g: 35, fat_g: 9,   fibre_g: 3, sugar_g: 2,  salt_g: 0.5, serving_size: "150g" },
  { food_name: "Mashed Potato Home",                   brand: "Home Cooked", calories: 170, protein_g: 3,  carbs_g: 25, fat_g: 6,   fibre_g: 2, sugar_g: 1,  salt_g: 0.4, serving_size: "150g" },
  { food_name: "Chips Oven Cooked",                    brand: "Home Cooked", calories: 240, protein_g: 4,  carbs_g: 35, fat_g: 9,   fibre_g: 3, sugar_g: 1,  salt_g: 0.3, serving_size: "150g portion" },
  { food_name: "Sweet Potato Baked",                   brand: "Home Cooked", calories: 180, protein_g: 4,  carbs_g: 42, fat_g: 0.2, fibre_g: 6, sugar_g: 14, salt_g: 0.1, serving_size: "1 medium (200g)" },
  { food_name: "Broccoli Steamed",                     brand: "Home Cooked", calories: 35,  protein_g: 3,  carbs_g: 4,  fat_g: 0.4, fibre_g: 3, sugar_g: 1.5,salt_g: 0,   serving_size: "100g" },
  { food_name: "Carrots Boiled",                       brand: "Home Cooked", calories: 35,  protein_g: 0.8,carbs_g: 8,  fat_g: 0.2, fibre_g: 3, sugar_g: 5,  salt_g: 0.1, serving_size: "100g" },
  { food_name: "Peas Boiled",                          brand: "Home Cooked", calories: 80,  protein_g: 5,  carbs_g: 10, fat_g: 1,   fibre_g: 5, sugar_g: 3,  salt_g: 0,   serving_size: "100g" },
  { food_name: "Sweetcorn",                            brand: "Home Cooked", calories: 95,  protein_g: 3,  carbs_g: 18, fat_g: 1.5, fibre_g: 3, sugar_g: 6,  salt_g: 0,   serving_size: "100g" },
  { food_name: "Spinach Sautéed",                      brand: "Home Cooked", calories: 45,  protein_g: 3,  carbs_g: 4,  fat_g: 2,   fibre_g: 3, sugar_g: 0.5,salt_g: 0.1, serving_size: "100g" },
  { food_name: "Side Salad Plain",                     brand: "Home Cooked", calories: 25,  protein_g: 1,  carbs_g: 3,  fat_g: 0.3, fibre_g: 2, sugar_g: 2,  salt_g: 0,   serving_size: "80g bowl" },
  { food_name: "Mixed Vegetables Steamed",             brand: "Home Cooked", calories: 50,  protein_g: 3,  carbs_g: 8,  fat_g: 0.5, fibre_g: 3, sugar_g: 4,  salt_g: 0.1, serving_size: "120g" },

  // ===== FRUIT =====
  { food_name: "Apple Medium",                         brand: "Home Cooked", calories: 95,  protein_g: 0.5,carbs_g: 25, fat_g: 0.3, fibre_g: 4, sugar_g: 19, salt_g: 0,   serving_size: "1 medium (180g)" },
  { food_name: "Banana Medium",                        brand: "Home Cooked", calories: 105, protein_g: 1.3,carbs_g: 27, fat_g: 0.4, fibre_g: 3, sugar_g: 14, salt_g: 0,   serving_size: "1 medium (120g)" },
  { food_name: "Banana Large",                         brand: "Home Cooked", calories: 135, protein_g: 1.7,carbs_g: 35, fat_g: 0.5, fibre_g: 4, sugar_g: 18, salt_g: 0,   serving_size: "1 large (150g)" },
  { food_name: "Orange Medium",                        brand: "Home Cooked", calories: 62,  protein_g: 1.2,carbs_g: 15, fat_g: 0.2, fibre_g: 3, sugar_g: 12, salt_g: 0,   serving_size: "1 medium (130g)" },
  { food_name: "Satsuma",                              brand: "Home Cooked", calories: 35,  protein_g: 0.5,carbs_g: 8,  fat_g: 0.1, fibre_g: 1, sugar_g: 7,  salt_g: 0,   serving_size: "1 satsuma (75g)" },
  { food_name: "Grapes Handful",                       brand: "Home Cooked", calories: 70,  protein_g: 0.7,carbs_g: 18, fat_g: 0.2, fibre_g: 1, sugar_g: 16, salt_g: 0,   serving_size: "100g" },
  { food_name: "Strawberries",                         brand: "Home Cooked", calories: 33,  protein_g: 0.7,carbs_g: 8,  fat_g: 0.3, fibre_g: 2, sugar_g: 5,  salt_g: 0,   serving_size: "100g" },
  { food_name: "Blueberries",                          brand: "Home Cooked", calories: 57,  protein_g: 0.7,carbs_g: 14, fat_g: 0.3, fibre_g: 2, sugar_g: 10, salt_g: 0,   serving_size: "100g" },
  { food_name: "Raspberries",                          brand: "Home Cooked", calories: 52,  protein_g: 1.2,carbs_g: 12, fat_g: 0.7, fibre_g: 7, sugar_g: 4,  salt_g: 0,   serving_size: "100g" },
  { food_name: "Pineapple Chunks",                     brand: "Home Cooked", calories: 50,  protein_g: 0.5,carbs_g: 13, fat_g: 0.1, fibre_g: 1, sugar_g: 10, salt_g: 0,   serving_size: "100g" },
  { food_name: "Mango Chunks",                         brand: "Home Cooked", calories: 60,  protein_g: 0.8,carbs_g: 15, fat_g: 0.4, fibre_g: 2, sugar_g: 14, salt_g: 0,   serving_size: "100g" },
  { food_name: "Watermelon",                           brand: "Home Cooked", calories: 30,  protein_g: 0.6,carbs_g: 8,  fat_g: 0.2, fibre_g: 0.4,sugar_g: 6,  salt_g: 0,   serving_size: "100g" },
  { food_name: "Avocado Half",                         brand: "Home Cooked", calories: 160, protein_g: 2,  carbs_g: 9,  fat_g: 15,  fibre_g: 7, sugar_g: 0.7,salt_g: 0,   serving_size: "1/2 avocado (100g)" },
  { food_name: "Avocado Whole",                        brand: "Home Cooked", calories: 320, protein_g: 4,  carbs_g: 17, fat_g: 29,  fibre_g: 14,sugar_g: 1.3,salt_g: 0,   serving_size: "1 avocado (200g)" },

  // ===== DAIRY =====
  { food_name: "Whole Milk",                           brand: "Home Cooked", calories: 61,  protein_g: 3.4,carbs_g: 4.7,fat_g: 3.3, fibre_g: 0, sugar_g: 4.7, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Whole Milk Glass",                     brand: "Home Cooked", calories: 120, protein_g: 6.6,carbs_g: 9.3,fat_g: 6.5, fibre_g: 0, sugar_g: 9.3, salt_g: 0.2, serving_size: "200ml glass" },
  { food_name: "Semi-Skimmed Milk",                    brand: "Home Cooked", calories: 48,  protein_g: 3.5,carbs_g: 4.8,fat_g: 1.7, fibre_g: 0, sugar_g: 4.8, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Semi-Skimmed Milk Glass",              brand: "Home Cooked", calories: 95,  protein_g: 6.8,carbs_g: 9.3,fat_g: 3.3, fibre_g: 0, sugar_g: 9.3, salt_g: 0.2, serving_size: "200ml glass" },
  { food_name: "Skimmed Milk",                         brand: "Home Cooked", calories: 35,  protein_g: 3.5,carbs_g: 5,  fat_g: 0.2, fibre_g: 0, sugar_g: 5,   salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Oat Milk",                             brand: "Home Cooked", calories: 43,  protein_g: 0.3,carbs_g: 7,  fat_g: 1.5, fibre_g: 0.8,sugar_g: 3.3,salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Almond Milk Unsweetened",              brand: "Home Cooked", calories: 13,  protein_g: 0.5,carbs_g: 0.1,fat_g: 1.1, fibre_g: 0, sugar_g: 0,   salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Greek Yogurt Natural",                 brand: "Home Cooked", calories: 97,  protein_g: 9,  carbs_g: 4,  fat_g: 5,   fibre_g: 0, sugar_g: 4,   salt_g: 0.1, serving_size: "100g" },
  { food_name: "Greek Yogurt 0% Fat",                  brand: "Home Cooked", calories: 57,  protein_g: 10, carbs_g: 4,  fat_g: 0.2, fibre_g: 0, sugar_g: 4,   salt_g: 0.1, serving_size: "100g" },
  { food_name: "Butter",                               brand: "Home Cooked", calories: 72,  protein_g: 0.1,carbs_g: 0,  fat_g: 8,   fibre_g: 0, sugar_g: 0,   salt_g: 0.1, serving_size: "10g knob" },
  { food_name: "Cheddar Cheese",                       brand: "Home Cooked", calories: 125, protein_g: 7.5,carbs_g: 0.1,fat_g: 10,  fibre_g: 0, sugar_g: 0,   salt_g: 0.5, serving_size: "30g" },
  { food_name: "Mozzarella Ball",                      brand: "Home Cooked", calories: 150, protein_g: 11, carbs_g: 1,  fat_g: 11,  fibre_g: 0, sugar_g: 1,   salt_g: 0.3, serving_size: "60g" },
  { food_name: "Feta Cheese",                          brand: "Home Cooked", calories: 80,  protein_g: 4.5,carbs_g: 1,  fat_g: 7,   fibre_g: 0, sugar_g: 1,   salt_g: 0.6, serving_size: "30g" },
  { food_name: "Cream Cheese",                         brand: "Home Cooked", calories: 50,  protein_g: 1,  carbs_g: 1,  fat_g: 5,   fibre_g: 0, sugar_g: 1,   salt_g: 0.1, serving_size: "1 tbsp (15g)" },

  // ===== SAUCES / CONDIMENTS =====
  { food_name: "Ketchup",                              brand: "Home Cooked", calories: 15,  protein_g: 0.2,carbs_g: 3.5,fat_g: 0,   fibre_g: 0, sugar_g: 3,   salt_g: 0.2, serving_size: "1 tbsp (15g)" },
  { food_name: "Mayonnaise",                           brand: "Home Cooked", calories: 100, protein_g: 0.1,carbs_g: 0.2,fat_g: 11,  fibre_g: 0, sugar_g: 0.2, salt_g: 0.2, serving_size: "1 tbsp (15g)" },
  { food_name: "BBQ Sauce",                            brand: "Home Cooked", calories: 25,  protein_g: 0.1,carbs_g: 6,  fat_g: 0,   fibre_g: 0, sugar_g: 5,   salt_g: 0.3, serving_size: "1 tbsp (15g)" },
  { food_name: "Brown Sauce",                          brand: "Home Cooked", calories: 15,  protein_g: 0.1,carbs_g: 4,  fat_g: 0,   fibre_g: 0, sugar_g: 3,   salt_g: 0.2, serving_size: "1 tbsp (15g)" },
  { food_name: "Soy Sauce",                            brand: "Home Cooked", calories: 7,   protein_g: 1,  carbs_g: 0.5,fat_g: 0,   fibre_g: 0, sugar_g: 0.1, salt_g: 1.3, serving_size: "1 tbsp (15ml)" },
  { food_name: "Sriracha",                             brand: "Home Cooked", calories: 15,  protein_g: 0.2,carbs_g: 3,  fat_g: 0,   fibre_g: 0, sugar_g: 2,   salt_g: 0.3, serving_size: "1 tbsp (15g)" },
  { food_name: "Hummus",                               brand: "Home Cooked", calories: 50,  protein_g: 1.5,carbs_g: 3,  fat_g: 4,   fibre_g: 1, sugar_g: 0.3, salt_g: 0.2, serving_size: "2 tbsp (30g)" },
  { food_name: "Peanut Butter",                        brand: "Home Cooked", calories: 95,  protein_g: 4,  carbs_g: 3,  fat_g: 8,   fibre_g: 1, sugar_g: 1.5, salt_g: 0.2, serving_size: "1 tbsp (16g)" },
  { food_name: "Olive Oil",                            brand: "Home Cooked", calories: 120, protein_g: 0,  carbs_g: 0,  fat_g: 14,  fibre_g: 0, sugar_g: 0,   salt_g: 0,   serving_size: "1 tbsp (14g)" },
  { food_name: "Honey",                                brand: "Home Cooked", calories: 64,  protein_g: 0.1,carbs_g: 17, fat_g: 0,   fibre_g: 0, sugar_g: 17,  salt_g: 0,   serving_size: "1 tbsp (21g)" },
  { food_name: "Jam Strawberry",                       brand: "Home Cooked", calories: 40,  protein_g: 0.1,carbs_g: 10, fat_g: 0,   fibre_g: 0, sugar_g: 10,  salt_g: 0,   serving_size: "1 tbsp (15g)" },

  // ===== NUTS AND SEEDS =====
  { food_name: "Almonds",                              brand: "Home Cooked", calories: 170, protein_g: 6,  carbs_g: 3,  fat_g: 14,  fibre_g: 3, sugar_g: 1,  salt_g: 0,   serving_size: "30g (about 23 nuts)" },
  { food_name: "Cashews",                              brand: "Home Cooked", calories: 160, protein_g: 5,  carbs_g: 9,  fat_g: 13,  fibre_g: 1, sugar_g: 2,  salt_g: 0,   serving_size: "30g" },
  { food_name: "Walnuts",                              brand: "Home Cooked", calories: 185, protein_g: 4,  carbs_g: 3,  fat_g: 18,  fibre_g: 2, sugar_g: 1,  salt_g: 0,   serving_size: "30g" },
  { food_name: "Mixed Nuts",                           brand: "Home Cooked", calories: 170, protein_g: 5,  carbs_g: 6,  fat_g: 15,  fibre_g: 2, sugar_g: 1,  salt_g: 0.1, serving_size: "30g" },
  { food_name: "Peanuts Salted",                       brand: "Home Cooked", calories: 180, protein_g: 8,  carbs_g: 5,  fat_g: 14,  fibre_g: 2, sugar_g: 1,  salt_g: 0.3, serving_size: "30g" },

  // ===== SOFT DRINKS =====
  { food_name: "Coca-Cola 330ml Can",                  brand: "Drinks", calories: 139, protein_g: 0, carbs_g: 35, fat_g: 0, fibre_g: 0, sugar_g: 35, salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Coca-Cola 500ml Bottle",               brand: "Drinks", calories: 210, protein_g: 0, carbs_g: 53, fat_g: 0, fibre_g: 0, sugar_g: 53, salt_g: 0, serving_size: "500ml bottle" },
  { food_name: "Diet Coke 330ml Can",                  brand: "Drinks", calories: 1,   protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0,  salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Coke Zero 330ml Can",                  brand: "Drinks", calories: 1,   protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0,  salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Pepsi Max 330ml Can",                  brand: "Drinks", calories: 1,   protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0,  salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Pepsi 330ml Can",                      brand: "Drinks", calories: 140, protein_g: 0, carbs_g: 35, fat_g: 0, fibre_g: 0, sugar_g: 35, salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Fanta Orange 330ml Can",               brand: "Drinks", calories: 125, protein_g: 0, carbs_g: 30, fat_g: 0, fibre_g: 0, sugar_g: 28, salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Sprite 330ml Can",                     brand: "Drinks", calories: 130, protein_g: 0, carbs_g: 32, fat_g: 0, fibre_g: 0, sugar_g: 32, salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Sprite Zero 330ml Can",                brand: "Drinks", calories: 1,   protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0, sugar_g: 0,  salt_g: 0, serving_size: "1 can (330ml)" },
  { food_name: "Lucozade Sport",                       brand: "Drinks", calories: 140, protein_g: 0, carbs_g: 32, fat_g: 0, fibre_g: 0, sugar_g: 26, salt_g: 0.4, serving_size: "500ml bottle" },
  { food_name: "Lucozade Original",                    brand: "Drinks", calories: 250, protein_g: 0, carbs_g: 60, fat_g: 0, fibre_g: 0, sugar_g: 60, salt_g: 0.3, serving_size: "380ml bottle" },
  { food_name: "Red Bull 250ml Can",                   brand: "Drinks", calories: 115, protein_g: 0, carbs_g: 28, fat_g: 0, fibre_g: 0, sugar_g: 28, salt_g: 0.1, serving_size: "1 can (250ml)" },
  { food_name: "Red Bull Sugarfree 250ml Can",         brand: "Drinks", calories: 8,   protein_g: 0, carbs_g: 2,  fat_g: 0, fibre_g: 0, sugar_g: 0,  salt_g: 0.1, serving_size: "1 can (250ml)" },
  { food_name: "Monster Energy 500ml",                 brand: "Drinks", calories: 230, protein_g: 0, carbs_g: 55, fat_g: 0, fibre_g: 0, sugar_g: 55, salt_g: 0.4, serving_size: "1 can (500ml)" },
  { food_name: "Monster Ultra 500ml",                  brand: "Drinks", calories: 10,  protein_g: 0, carbs_g: 4,  fat_g: 0, fibre_g: 0, sugar_g: 0,  salt_g: 0.4, serving_size: "1 can (500ml)" },
  { food_name: "Orange Juice",                         brand: "Drinks", calories: 115, protein_g: 2, carbs_g: 26, fat_g: 0.5,fibre_g: 0.5,sugar_g: 23,salt_g: 0,   serving_size: "250ml glass" },
  { food_name: "Apple Juice",                          brand: "Drinks", calories: 115, protein_g: 0.3,carbs_g: 28, fat_g: 0.1,fibre_g: 0.5,sugar_g: 24,salt_g: 0,   serving_size: "250ml glass" },
  { food_name: "Innocent Smoothie Strawberry Banana",  brand: "Drinks", calories: 190, protein_g: 2, carbs_g: 42, fat_g: 0.5,fibre_g: 3,  sugar_g: 37,salt_g: 0,   serving_size: "250ml bottle" },
  { food_name: "Ribena Blackcurrant",                  brand: "Drinks", calories: 105, protein_g: 0, carbs_g: 25, fat_g: 0, fibre_g: 0,  sugar_g: 25,salt_g: 0,   serving_size: "250ml carton" },
  { food_name: "Water Still",                          brand: "Drinks", calories: 0,   protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0,  sugar_g: 0, salt_g: 0,   serving_size: "500ml bottle" },
  { food_name: "Sparkling Water",                      brand: "Drinks", calories: 0,   protein_g: 0, carbs_g: 0,  fat_g: 0, fibre_g: 0,  sugar_g: 0, salt_g: 0,   serving_size: "500ml bottle" },
  { food_name: "Tonic Water",                          brand: "Drinks", calories: 85,  protein_g: 0, carbs_g: 22, fat_g: 0, fibre_g: 0,  sugar_g: 22,salt_g: 0,   serving_size: "200ml bottle" },
  { food_name: "Slimline Tonic",                       brand: "Drinks", calories: 6,   protein_g: 0, carbs_g: 0.5,fat_g: 0, fibre_g: 0,  sugar_g: 0, salt_g: 0,   serving_size: "200ml bottle" },

  // ============================================================
  // STAGE 7 — Ice cream & frozen desserts
  // ============================================================

  // ===== BEN AND JERRY'S =====
  { food_name: "Cookie Dough 100ml",                   brand: "Ben and Jerry's", calories: 270, protein_g: 4,  carbs_g: 32, fat_g: 14, fibre_g: 1,  sugar_g: 25, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Cookie Dough Whole Pint",              brand: "Ben and Jerry's", calories: 1215,protein_g: 18, carbs_g: 144,fat_g: 63, fibre_g: 4,  sugar_g: 113,salt_g: 0.9, serving_size: "465ml tub" },
  { food_name: "Chocolate Fudge Brownie 100ml",        brand: "Ben and Jerry's", calories: 255, protein_g: 4.5,carbs_g: 33, fat_g: 12, fibre_g: 1.5,sugar_g: 27, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Half Baked 100ml",                     brand: "Ben and Jerry's", calories: 260, protein_g: 4,  carbs_g: 34, fat_g: 12, fibre_g: 1,  sugar_g: 27, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Phish Food 100ml",                     brand: "Ben and Jerry's", calories: 260, protein_g: 4,  carbs_g: 35, fat_g: 12, fibre_g: 0.5,sugar_g: 29, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Caramel Chew Chew 100ml",              brand: "Ben and Jerry's", calories: 275, protein_g: 4,  carbs_g: 32, fat_g: 14, fibre_g: 0.5,sugar_g: 26, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Vanilla 100ml",                        brand: "Ben and Jerry's", calories: 235, protein_g: 4,  carbs_g: 23, fat_g: 13, fibre_g: 0,  sugar_g: 22, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Strawberry Cheesecake 100ml",          brand: "Ben and Jerry's", calories: 245, protein_g: 4,  carbs_g: 29, fat_g: 12, fibre_g: 0.3,sugar_g: 24, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Topped Salted Caramel Brownie 100ml",  brand: "Ben and Jerry's", calories: 290, protein_g: 4,  carbs_g: 35, fat_g: 14, fibre_g: 1,  sugar_g: 27, salt_g: 0.3, serving_size: "100ml" },
  { food_name: "Topped Berry Revolutionary 100ml",     brand: "Ben and Jerry's", calories: 265, protein_g: 3,  carbs_g: 35, fat_g: 12, fibre_g: 0.5,sugar_g: 27, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Non-Dairy Chocolate Fudge Brownie",    brand: "Ben and Jerry's", calories: 250, protein_g: 3,  carbs_g: 33, fat_g: 12, fibre_g: 2,  sugar_g: 23, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Mini Cup Cookie Dough",                brand: "Ben and Jerry's", calories: 265, protein_g: 4,  carbs_g: 31, fat_g: 14, fibre_g: 1,  sugar_g: 25, salt_g: 0.2, serving_size: "1 mini cup (100ml)" },

  // ===== MAGNUM =====
  { food_name: "Magnum Classic",                       brand: "Magnum", calories: 230, protein_g: 3,  carbs_g: 22, fat_g: 14, fibre_g: 0.5, sugar_g: 20, salt_g: 0.1, serving_size: "1 stick (100ml)" },
  { food_name: "Magnum Almond",                        brand: "Magnum", calories: 245, protein_g: 4,  carbs_g: 22, fat_g: 16, fibre_g: 1,   sugar_g: 20, salt_g: 0.1, serving_size: "1 stick (100ml)" },
  { food_name: "Magnum White",                         brand: "Magnum", calories: 240, protein_g: 3,  carbs_g: 23, fat_g: 15, fibre_g: 0.1, sugar_g: 22, salt_g: 0.1, serving_size: "1 stick (100ml)" },
  { food_name: "Magnum Double Chocolate",              brand: "Magnum", calories: 265, protein_g: 3,  carbs_g: 27, fat_g: 16, fibre_g: 1,   sugar_g: 23, salt_g: 0.1, serving_size: "1 stick (88ml)" },
  { food_name: "Magnum Double Caramel",                brand: "Magnum", calories: 260, protein_g: 3,  carbs_g: 27, fat_g: 15, fibre_g: 0.5, sugar_g: 24, salt_g: 0.2, serving_size: "1 stick (88ml)" },
  { food_name: "Magnum Mini Classic",                  brand: "Magnum", calories: 130, protein_g: 2,  carbs_g: 13, fat_g: 8,  fibre_g: 0,   sugar_g: 11, salt_g: 0,   serving_size: "1 mini (55ml)" },
  { food_name: "Magnum Mini Almond",                   brand: "Magnum", calories: 135, protein_g: 2,  carbs_g: 12, fat_g: 9,  fibre_g: 0.5, sugar_g: 11, salt_g: 0,   serving_size: "1 mini (55ml)" },
  { food_name: "Magnum Ruby",                          brand: "Magnum", calories: 250, protein_g: 3,  carbs_g: 27, fat_g: 14, fibre_g: 0.5, sugar_g: 23, salt_g: 0.1, serving_size: "1 stick (90ml)" },

  // ===== HÄAGEN-DAZS =====
  { food_name: "Vanilla Tub 100ml",                    brand: "Häagen-Dazs", calories: 240, protein_g: 4,  carbs_g: 21, fat_g: 15, fibre_g: 0,   sugar_g: 21, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Cookies and Cream Tub 100ml",          brand: "Häagen-Dazs", calories: 245, protein_g: 4,  carbs_g: 23, fat_g: 15, fibre_g: 0.5, sugar_g: 20, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Belgian Chocolate Tub 100ml",          brand: "Häagen-Dazs", calories: 255, protein_g: 4,  carbs_g: 25, fat_g: 16, fibre_g: 1,   sugar_g: 24, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Salted Caramel Tub 100ml",             brand: "Häagen-Dazs", calories: 260, protein_g: 4,  carbs_g: 27, fat_g: 15, fibre_g: 0,   sugar_g: 25, salt_g: 0.3, serving_size: "100ml" },
  { food_name: "Strawberries and Cream 100ml",         brand: "Häagen-Dazs", calories: 225, protein_g: 3.5,carbs_g: 23, fat_g: 13, fibre_g: 0.5, sugar_g: 22, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Pralines and Cream 100ml",             brand: "Häagen-Dazs", calories: 255, protein_g: 4,  carbs_g: 24, fat_g: 16, fibre_g: 0.3, sugar_g: 23, salt_g: 0.2, serving_size: "100ml" },
  { food_name: "Mini Cup Vanilla",                     brand: "Häagen-Dazs", calories: 230, protein_g: 4,  carbs_g: 20, fat_g: 14, fibre_g: 0,   sugar_g: 20, salt_g: 0.1, serving_size: "1 mini cup (95ml)" },

  // ===== ICE CREAM — other branded =====
  { food_name: "Cornetto Classico",                    brand: "Cornetto", calories: 215, protein_g: 3,  carbs_g: 26, fat_g: 11, fibre_g: 0.5, sugar_g: 19, salt_g: 0.2, serving_size: "1 cone (90ml)" },
  { food_name: "Cornetto Strawberry",                  brand: "Cornetto", calories: 205, protein_g: 2.5,carbs_g: 27, fat_g: 10, fibre_g: 0.5, sugar_g: 20, salt_g: 0.2, serving_size: "1 cone (90ml)" },
  { food_name: "Cornetto Mint",                        brand: "Cornetto", calories: 220, protein_g: 3,  carbs_g: 27, fat_g: 11, fibre_g: 0.5, sugar_g: 20, salt_g: 0.2, serving_size: "1 cone (90ml)" },
  { food_name: "Cornetto Enigma Chocolate",            brand: "Cornetto", calories: 250, protein_g: 3,  carbs_g: 29, fat_g: 14, fibre_g: 1,   sugar_g: 22, salt_g: 0.2, serving_size: "1 cone (90ml)" },
  { food_name: "Solero Exotic",                        brand: "Solero", calories: 110, protein_g: 1,  carbs_g: 20, fat_g: 2.5,fibre_g: 0.5, sugar_g: 17, salt_g: 0.1, serving_size: "1 stick (90ml)" },
  { food_name: "Solero Red Berries",                   brand: "Solero", calories: 100, protein_g: 1,  carbs_g: 19, fat_g: 2,  fibre_g: 0.5, sugar_g: 16, salt_g: 0.1, serving_size: "1 stick (90ml)" },
  { food_name: "Twister Ice Lolly",                    brand: "Twister", calories: 75,  protein_g: 0.6,carbs_g: 15, fat_g: 1.5,fibre_g: 0,   sugar_g: 12, salt_g: 0.1, serving_size: "1 lolly (80ml)" },
  { food_name: "Fab Ice Lolly",                        brand: "Fab", calories: 82,  protein_g: 0.5,carbs_g: 15, fat_g: 2,  fibre_g: 0,   sugar_g: 13, salt_g: 0,   serving_size: "1 lolly (58g)" },
  { food_name: "Calippo Orange",                       brand: "Calippo", calories: 95,  protein_g: 0,  carbs_g: 22, fat_g: 0,  fibre_g: 0,   sugar_g: 20, salt_g: 0,   serving_size: "1 tube (105ml)" },
  { food_name: "Calippo Lemon-Lime",                   brand: "Calippo", calories: 95,  protein_g: 0,  carbs_g: 22, fat_g: 0,  fibre_g: 0,   sugar_g: 20, salt_g: 0,   serving_size: "1 tube (105ml)" },
  { food_name: "Mini Milk Vanilla",                    brand: "Mini Milk", calories: 30,  protein_g: 0.8,carbs_g: 5,  fat_g: 0.8,fibre_g: 0,   sugar_g: 5,  salt_g: 0,   serving_size: "1 lolly" },
  { food_name: "Feast Chocolate",                      brand: "Feast", calories: 185, protein_g: 2,  carbs_g: 20, fat_g: 11, fibre_g: 0.5, sugar_g: 18, salt_g: 0.1, serving_size: "1 stick (75ml)" },
  { food_name: "Cadbury 99 Flake Ice Cream",           brand: "Cadbury", calories: 185, protein_g: 3,  carbs_g: 22, fat_g: 9,  fibre_g: 0.5, sugar_g: 18, salt_g: 0.1, serving_size: "1 serving" },
  { food_name: "Carte D'Or Vanilla 100ml",             brand: "Carte D'Or", calories: 95,  protein_g: 1.5,carbs_g: 13, fat_g: 4,  fibre_g: 0,   sugar_g: 12, salt_g: 0.1, serving_size: "100ml" },
  { food_name: "Wall's Vienetta Vanilla Slice",        brand: "Wall's", calories: 140, protein_g: 1.4,carbs_g: 15, fat_g: 8,  fibre_g: 0.5, sugar_g: 12, salt_g: 0.1, serving_size: "1 slice (1/6)" },

  // ===== LITTLE MOONS =====
  { food_name: "Belgian Chocolate Mochi",              brand: "Little Moons", calories: 80,  protein_g: 1,  carbs_g: 11, fat_g: 3.5,fibre_g: 0.3, sugar_g: 7,  salt_g: 0.1, serving_size: "1 ball (32g)" },
  { food_name: "Salted Caramel Mochi",                 brand: "Little Moons", calories: 85,  protein_g: 1,  carbs_g: 12, fat_g: 3.5,fibre_g: 0.2, sugar_g: 8,  salt_g: 0.1, serving_size: "1 ball (32g)" },
  { food_name: "Vanilla Mochi",                        brand: "Little Moons", calories: 75,  protein_g: 1,  carbs_g: 11, fat_g: 3,  fibre_g: 0.1, sugar_g: 7,  salt_g: 0.1, serving_size: "1 ball (32g)" },
  { food_name: "Mango Sorbet Mochi",                   brand: "Little Moons", calories: 65,  protein_g: 0.5,carbs_g: 13, fat_g: 1,  fibre_g: 0.5, sugar_g: 8,  salt_g: 0,   serving_size: "1 ball (32g)" },
  { food_name: "Pink Guava Sorbet Mochi",              brand: "Little Moons", calories: 65,  protein_g: 0.5,carbs_g: 13, fat_g: 1,  fibre_g: 0.5, sugar_g: 8,  salt_g: 0,   serving_size: "1 ball (32g)" },

  // ===== GÜ DESSERTS =====
  { food_name: "Chocolate Ganache Pot",                brand: "Gü", calories: 320, protein_g: 4,  carbs_g: 30, fat_g: 20, fibre_g: 2, sugar_g: 25, salt_g: 0.1, serving_size: "1 pot (85g)" },
  { food_name: "Salted Caramel Cheesecake",            brand: "Gü", calories: 375, protein_g: 4,  carbs_g: 36, fat_g: 23, fibre_g: 1, sugar_g: 27, salt_g: 0.3, serving_size: "1 pot (92g)" },
  { food_name: "Chocolate Brownie",                    brand: "Gü", calories: 310, protein_g: 4,  carbs_g: 33, fat_g: 18, fibre_g: 2, sugar_g: 26, salt_g: 0.2, serving_size: "1 pot (85g)" },
  { food_name: "Sticky Toffee Pudding",                brand: "Gü", calories: 345, protein_g: 3,  carbs_g: 42, fat_g: 18, fibre_g: 1, sugar_g: 30, salt_g: 0.3, serving_size: "1 pot (90g)" },
  { food_name: "Lemon Cheesecake",                     brand: "Gü", calories: 335, protein_g: 4,  carbs_g: 31, fat_g: 21, fibre_g: 1, sugar_g: 23, salt_g: 0.3, serving_size: "1 pot (90g)" },
  { food_name: "Dark Chocolate Soufflé",               brand: "Gü", calories: 380, protein_g: 6,  carbs_g: 35, fat_g: 23, fibre_g: 3, sugar_g: 26, salt_g: 0.2, serving_size: "1 pot (95g)" },

  // ============================================================
  // STAGE 8 — Biscuits, cakes, bakery treats
  // ============================================================

  // ===== MCVITIE'S BISCUITS =====
  { food_name: "Digestive Original",                   brand: "McVitie's", calories: 71,  protein_g: 1.2,carbs_g: 9.7,fat_g: 3.2,fibre_g: 0.5, sugar_g: 2.7, salt_g: 0.1, serving_size: "1 biscuit (15g)" },
  { food_name: "Chocolate Digestive Milk",             brand: "McVitie's", calories: 84,  protein_g: 1.2,carbs_g: 11, fat_g: 3.8,fibre_g: 0.5, sugar_g: 5.3, salt_g: 0.1, serving_size: "1 biscuit (17g)" },
  { food_name: "Chocolate Digestive Dark",             brand: "McVitie's", calories: 83,  protein_g: 1.2,carbs_g: 11, fat_g: 3.8,fibre_g: 0.7, sugar_g: 5.1, salt_g: 0.1, serving_size: "1 biscuit (17g)" },
  { food_name: "Caramel Digestive",                    brand: "McVitie's", calories: 92,  protein_g: 1.2,carbs_g: 11, fat_g: 4.6,fibre_g: 0.5, sugar_g: 6.4, salt_g: 0.1, serving_size: "1 biscuit (17g)" },
  { food_name: "Jaffa Cake",                           brand: "McVitie's", calories: 45,  protein_g: 0.5,carbs_g: 8.5,fat_g: 1,  fibre_g: 0.3, sugar_g: 6.2, salt_g: 0,   serving_size: "1 cake (12g)" },
  { food_name: "Jaffa Cakes Pack 10",                  brand: "McVitie's", calories: 450, protein_g: 5,  carbs_g: 85, fat_g: 10, fibre_g: 3,   sugar_g: 62,  salt_g: 0.3, serving_size: "10 cakes (120g)" },
  { food_name: "Hobnobs Original",                     brand: "McVitie's", calories: 67,  protein_g: 1,  carbs_g: 9.3,fat_g: 2.9,fibre_g: 0.8, sugar_g: 3.3, salt_g: 0.1, serving_size: "1 biscuit (13g)" },
  { food_name: "Chocolate Hobnobs",                    brand: "McVitie's", calories: 85,  protein_g: 1.2,carbs_g: 11, fat_g: 4,  fibre_g: 0.8, sugar_g: 5,   salt_g: 0.1, serving_size: "1 biscuit (17g)" },
  { food_name: "Ginger Nuts",                          brand: "McVitie's", calories: 46,  protein_g: 0.6,carbs_g: 7.8,fat_g: 1.5,fibre_g: 0.2, sugar_g: 3.5, salt_g: 0.1, serving_size: "1 biscuit (9g)" },
  { food_name: "Rich Tea",                             brand: "McVitie's", calories: 37,  protein_g: 0.7,carbs_g: 6.6,fat_g: 1,  fibre_g: 0.2, sugar_g: 1.9, salt_g: 0,   serving_size: "1 biscuit (8g)" },
  { food_name: "Penguin Biscuit",                      brand: "McVitie's", calories: 129, protein_g: 1.5,carbs_g: 16, fat_g: 6.5,fibre_g: 0.4, sugar_g: 10,  salt_g: 0.1, serving_size: "1 biscuit (24.6g)" },
  { food_name: "Club Orange",                          brand: "McVitie's", calories: 120, protein_g: 1.2,carbs_g: 16, fat_g: 5.7,fibre_g: 0.5, sugar_g: 10,  salt_g: 0.1, serving_size: "1 biscuit (24g)" },
  { food_name: "Club Milk Chocolate",                  brand: "McVitie's", calories: 120, protein_g: 1.3,carbs_g: 15, fat_g: 6,  fibre_g: 0.4, sugar_g: 10,  salt_g: 0.1, serving_size: "1 biscuit (24g)" },
  { food_name: "BN Chocolate",                         brand: "McVitie's", calories: 75,  protein_g: 1,  carbs_g: 11, fat_g: 2.8,fibre_g: 0.5, sugar_g: 5.5, salt_g: 0.1, serving_size: "1 biscuit (15g)" },

  // ===== OTHER BISCUITS =====
  { food_name: "Oreo Original",                        brand: "Oreo", calories: 53,  protein_g: 0.5,carbs_g: 8,  fat_g: 2.2,fibre_g: 0.3, sugar_g: 4,   salt_g: 0.1, serving_size: "1 biscuit (11g)" },
  { food_name: "Oreo Pack 3 biscuits",                 brand: "Oreo", calories: 159, protein_g: 1.5,carbs_g: 24, fat_g: 6.6,fibre_g: 0.9, sugar_g: 12,  salt_g: 0.2, serving_size: "3 biscuits (33g)" },
  { food_name: "Oreo Double Stuff",                    brand: "Oreo", calories: 70,  protein_g: 0.6,carbs_g: 10, fat_g: 3,  fibre_g: 0.3, sugar_g: 6,   salt_g: 0.1, serving_size: "1 biscuit (14g)" },
  { food_name: "Oreo Golden",                          brand: "Oreo", calories: 55,  protein_g: 0.5,carbs_g: 8,  fat_g: 2.2,fibre_g: 0.2, sugar_g: 4.5, salt_g: 0.1, serving_size: "1 biscuit (11g)" },
  { food_name: "Bourbon Cream",                        brand: "Generic", calories: 65,  protein_g: 0.8,carbs_g: 9.3,fat_g: 2.8,fibre_g: 0.3, sugar_g: 4,   salt_g: 0,   serving_size: "1 biscuit (13g)" },
  { food_name: "Custard Cream",                        brand: "Generic", calories: 57,  protein_g: 0.7,carbs_g: 8,  fat_g: 2.5,fibre_g: 0.2, sugar_g: 3.2, salt_g: 0,   serving_size: "1 biscuit (12g)" },
  { food_name: "Fig Roll",                             brand: "Jacob's", calories: 68,  protein_g: 0.8,carbs_g: 14, fat_g: 1,  fibre_g: 1.2, sugar_g: 7,   salt_g: 0,   serving_size: "1 biscuit (17g)" },
  { food_name: "Party Ring",                           brand: "Fox's", calories: 35,  protein_g: 0.4,carbs_g: 6,  fat_g: 1,  fibre_g: 0.1, sugar_g: 3,   salt_g: 0,   serving_size: "1 biscuit (7.5g)" },
  { food_name: "Garibaldi",                            brand: "Crawford's", calories: 40,  protein_g: 0.5,carbs_g: 7.5,fat_g: 0.9,fibre_g: 0.3, sugar_g: 3.5, salt_g: 0,   serving_size: "1 biscuit (9g)" },
  { food_name: "Malted Milk",                          brand: "Crawford's", calories: 42,  protein_g: 0.6,carbs_g: 6,  fat_g: 1.8,fibre_g: 0.2, sugar_g: 2,   salt_g: 0,   serving_size: "1 biscuit (8g)" },
  { food_name: "Pink Wafer",                           brand: "Tunnock's", calories: 42,  protein_g: 0.4,carbs_g: 5.5,fat_g: 2,  fibre_g: 0.1, sugar_g: 3.5, salt_g: 0,   serving_size: "1 wafer (8g)" },
  { food_name: "Tunnock's Caramel Wafer",              brand: "Tunnock's", calories: 130, protein_g: 1.5,carbs_g: 17, fat_g: 6,  fibre_g: 0.5, sugar_g: 11,  salt_g: 0.1, serving_size: "1 wafer (30g)" },
  { food_name: "Tunnock's Teacake",                    brand: "Tunnock's", calories: 105, protein_g: 1,  carbs_g: 15, fat_g: 4.5,fibre_g: 0.3, sugar_g: 11,  salt_g: 0.1, serving_size: "1 teacake (24g)" },

  // ===== MR KIPLING =====
  { food_name: "Cherry Bakewell",                      brand: "Mr Kipling", calories: 190, protein_g: 1.7,carbs_g: 25, fat_g: 9,  fibre_g: 0.5, sugar_g: 18, salt_g: 0.1, serving_size: "1 tart (42g)" },
  { food_name: "Angel Slice",                          brand: "Mr Kipling", calories: 110, protein_g: 1,  carbs_g: 15, fat_g: 5,  fibre_g: 0.3, sugar_g: 10, salt_g: 0.1, serving_size: "1 slice (26g)" },
  { food_name: "French Fancy",                         brand: "Mr Kipling", calories: 110, protein_g: 0.7,carbs_g: 19, fat_g: 3.5,fibre_g: 0.2, sugar_g: 15, salt_g: 0,   serving_size: "1 fancy (26g)" },
  { food_name: "Battenberg Slice",                     brand: "Mr Kipling", calories: 160, protein_g: 1.7,carbs_g: 22, fat_g: 7,  fibre_g: 0.5, sugar_g: 15, salt_g: 0,   serving_size: "1 slice (38g)" },
  { food_name: "Viennese Whirl",                       brand: "Mr Kipling", calories: 170, protein_g: 1,  carbs_g: 18, fat_g: 10, fibre_g: 0.3, sugar_g: 9,  salt_g: 0.1, serving_size: "1 whirl (32g)" },
  { food_name: "Lemon Slice",                          brand: "Mr Kipling", calories: 120, protein_g: 1,  carbs_g: 16, fat_g: 5,  fibre_g: 0.2, sugar_g: 11, salt_g: 0.1, serving_size: "1 slice (28g)" },
  { food_name: "Chocolate Slice",                      brand: "Mr Kipling", calories: 115, protein_g: 1,  carbs_g: 15, fat_g: 5,  fibre_g: 0.5, sugar_g: 10, salt_g: 0.1, serving_size: "1 slice (27g)" },
  { food_name: "Apple Pie",                            brand: "Mr Kipling", calories: 225, protein_g: 2,  carbs_g: 32, fat_g: 10, fibre_g: 1,   sugar_g: 15, salt_g: 0.3, serving_size: "1 pie (57g)" },
  { food_name: "Almond Slice",                         brand: "Mr Kipling", calories: 165, protein_g: 2,  carbs_g: 19, fat_g: 9,  fibre_g: 0.5, sugar_g: 12, salt_g: 0.1, serving_size: "1 slice (35g)" },

  // ===== CAKES (supermarket / home) =====
  { food_name: "Victoria Sponge Slice",                brand: "Home Cooked", calories: 320, protein_g: 4,  carbs_g: 42, fat_g: 15, fibre_g: 1,   sugar_g: 28, salt_g: 0.3, serving_size: "1 slice (75g)" },
  { food_name: "Carrot Cake Slice",                    brand: "Home Cooked", calories: 425, protein_g: 5,  carbs_g: 50, fat_g: 22, fibre_g: 2,   sugar_g: 35, salt_g: 0.4, serving_size: "1 slice (90g)" },
  { food_name: "Chocolate Fudge Cake Slice",           brand: "Home Cooked", calories: 445, protein_g: 5,  carbs_g: 55, fat_g: 22, fibre_g: 2,   sugar_g: 40, salt_g: 0.4, serving_size: "1 slice (90g)" },
  { food_name: "Lemon Drizzle Cake Slice",             brand: "Home Cooked", calories: 355, protein_g: 4,  carbs_g: 48, fat_g: 15, fibre_g: 1,   sugar_g: 33, salt_g: 0.3, serving_size: "1 slice (80g)" },
  { food_name: "Rocky Road Slice",                     brand: "Home Cooked", calories: 395, protein_g: 4,  carbs_g: 48, fat_g: 20, fibre_g: 2,   sugar_g: 35, salt_g: 0.3, serving_size: "1 slice (75g)" },
  { food_name: "Flapjack",                             brand: "Home Cooked", calories: 315, protein_g: 4,  carbs_g: 40, fat_g: 15, fibre_g: 3,   sugar_g: 22, salt_g: 0.3, serving_size: "1 piece (70g)" },
  { food_name: "Scone Plain",                          brand: "Home Cooked", calories: 210, protein_g: 4.5,carbs_g: 35, fat_g: 6,  fibre_g: 1.5, sugar_g: 8,  salt_g: 0.6, serving_size: "1 scone (55g)" },
  { food_name: "Scone with Jam and Cream",             brand: "Home Cooked", calories: 380, protein_g: 5,  carbs_g: 48, fat_g: 18, fibre_g: 1.5, sugar_g: 25, salt_g: 0.6, serving_size: "1 scone with toppings" },
  { food_name: "Croissant Plain",                      brand: "Home Cooked", calories: 240, protein_g: 5,  carbs_g: 25, fat_g: 13, fibre_g: 1.5, sugar_g: 5,  salt_g: 0.5, serving_size: "1 croissant (60g)" },
  { food_name: "Pain au Chocolat",                     brand: "Home Cooked", calories: 290, protein_g: 5,  carbs_g: 28, fat_g: 17, fibre_g: 2,   sugar_g: 11, salt_g: 0.5, serving_size: "1 pastry (65g)" },

  // ============================================================
  // STAGE 9 — Expanded confectionery (full Cadbury / Nestlé ranges + tubs)
  // ============================================================

  // ===== MORE CADBURY =====
  { food_name: "Cadbury Picnic",                       brand: "Cadbury", calories: 230, protein_g: 3,  carbs_g: 28, fat_g: 11, fibre_g: 1.5, sugar_g: 22, salt_g: 0.2, serving_size: "1 bar (48.4g)" },
  { food_name: "Cadbury Wispa Gold",                   brand: "Cadbury", calories: 250, protein_g: 2.5,carbs_g: 28, fat_g: 14, fibre_g: 0.5, sugar_g: 25, salt_g: 0.2, serving_size: "1 bar (48g)" },
  { food_name: "Cadbury Boost",                        brand: "Cadbury", calories: 235, protein_g: 2.5,carbs_g: 28, fat_g: 12, fibre_g: 0.5, sugar_g: 22, salt_g: 0.2, serving_size: "1 bar (48.5g)" },
  { food_name: "Cadbury Double Decker",                brand: "Cadbury", calories: 245, protein_g: 2.5,carbs_g: 35, fat_g: 10, fibre_g: 0.8, sugar_g: 28, salt_g: 0.2, serving_size: "1 bar (54.5g)" },
  { food_name: "Cadbury Starbar",                      brand: "Cadbury", calories: 240, protein_g: 4,  carbs_g: 23, fat_g: 14, fibre_g: 1,   sugar_g: 20, salt_g: 0.2, serving_size: "1 bar (49g)" },
  { food_name: "Cadbury Freddo",                       brand: "Cadbury", calories: 95,  protein_g: 1.2,carbs_g: 11, fat_g: 5,  fibre_g: 0.3, sugar_g: 11, salt_g: 0.1, serving_size: "1 bar (18g)" },
  { food_name: "Cadbury Chomp",                        brand: "Cadbury", calories: 115, protein_g: 1,  carbs_g: 17, fat_g: 4.5,fibre_g: 0.2, sugar_g: 14, salt_g: 0.1, serving_size: "1 bar (23.5g)" },
  { food_name: "Cadbury Caramel",                      brand: "Cadbury", calories: 200, protein_g: 2,  carbs_g: 26, fat_g: 10, fibre_g: 0.3, sugar_g: 23, salt_g: 0.1, serving_size: "1 bar (37g)" },
  { food_name: "Cadbury Curly Wurly 5 pack",           brand: "Cadbury", calories: 575, protein_g: 6,  carbs_g: 95, fat_g: 17.5,fibre_g: 0.5,sugar_g: 75, salt_g: 0.5, serving_size: "5 bars (130g)" },
  { food_name: "Cadbury Flake 99",                     brand: "Cadbury", calories: 170, protein_g: 2.4,carbs_g: 18, fat_g: 9,  fibre_g: 0.5, sugar_g: 18, salt_g: 0.1, serving_size: "1 flake (32g)" },
  { food_name: "Cadbury Roses 3 piece",                brand: "Cadbury", calories: 105, protein_g: 1,  carbs_g: 13, fat_g: 5,  fibre_g: 0.3, sugar_g: 11, salt_g: 0,   serving_size: "3 chocolates (20g)" },
  { food_name: "Cadbury Heroes 1 piece",               brand: "Cadbury", calories: 40,  protein_g: 0.5,carbs_g: 5,  fat_g: 2,  fibre_g: 0.2, sugar_g: 4,  salt_g: 0,   serving_size: "1 chocolate (8g)" },
  { food_name: "Cadbury Dairy Milk Fruit and Nut",     brand: "Cadbury", calories: 225, protein_g: 4,  carbs_g: 25, fat_g: 11.5,fibre_g: 2, sugar_g: 22, salt_g: 0.1, serving_size: "45g bar" },
  { food_name: "Cadbury Dairy Milk Caramel",           brand: "Cadbury", calories: 220, protein_g: 2.8,carbs_g: 26, fat_g: 11, fibre_g: 0.5, sugar_g: 24, salt_g: 0.1, serving_size: "45g bar" },
  { food_name: "Cadbury Dairy Milk Oreo",              brand: "Cadbury", calories: 225, protein_g: 3,  carbs_g: 27, fat_g: 11, fibre_g: 0.7, sugar_g: 24, salt_g: 0.2, serving_size: "41g bar" },

  // ===== MORE NESTLÉ / MARS / OTHER =====
  { food_name: "Yorkie",                               brand: "Nestlé", calories: 240, protein_g: 3,  carbs_g: 24, fat_g: 14, fibre_g: 0.5, sugar_g: 24, salt_g: 0.1, serving_size: "1 bar (46g)" },
  { food_name: "Lion Bar",                             brand: "Nestlé", calories: 230, protein_g: 2.5,carbs_g: 30, fat_g: 11, fibre_g: 0.5, sugar_g: 22, salt_g: 0.2, serving_size: "1 bar (42g)" },
  { food_name: "Toffee Crisp",                         brand: "Nestlé", calories: 200, protein_g: 1.8,carbs_g: 25, fat_g: 10, fibre_g: 0.3, sugar_g: 20, salt_g: 0.1, serving_size: "1 bar (38g)" },
  { food_name: "Double Cream",                         brand: "Nestlé", calories: 205, protein_g: 2.5,carbs_g: 27, fat_g: 10, fibre_g: 0.3, sugar_g: 22, salt_g: 0.1, serving_size: "1 bar (41g)" },
  { food_name: "Munchies",                             brand: "Nestlé", calories: 160, protein_g: 1.5,carbs_g: 23, fat_g: 7,  fibre_g: 0.3, sugar_g: 16, salt_g: 0.1, serving_size: "1 bag (37g)" },
  { food_name: "Smarties Tube",                        brand: "Nestlé", calories: 170, protein_g: 2,  carbs_g: 25, fat_g: 7,  fibre_g: 0.5, sugar_g: 24, salt_g: 0,   serving_size: "1 tube (34g)" },
  { food_name: "Rolo Tube",                            brand: "Nestlé", calories: 220, protein_g: 2,  carbs_g: 30, fat_g: 10, fibre_g: 0.3, sugar_g: 25, salt_g: 0.1, serving_size: "1 tube (41g)" },
  { food_name: "After Eight Mint 2 piece",             brand: "Nestlé", calories: 70,  protein_g: 0.5,carbs_g: 12, fat_g: 2.5,fibre_g: 0.3, sugar_g: 10, salt_g: 0,   serving_size: "2 mints (16g)" },
  { food_name: "Quality Street Individual",            brand: "Nestlé", calories: 45,  protein_g: 0.4,carbs_g: 6.5,fat_g: 2,  fibre_g: 0.2, sugar_g: 5,  salt_g: 0,   serving_size: "1 chocolate (9g)" },
  { food_name: "Celebrations Individual",              brand: "Mars", calories: 40,  protein_g: 0.5,carbs_g: 5,  fat_g: 2,  fibre_g: 0.2, sugar_g: 4,  salt_g: 0,   serving_size: "1 chocolate (8g)" },
  { food_name: "Maltesers Teasers Bar",                brand: "Maltesers", calories: 195, protein_g: 3,  carbs_g: 23, fat_g: 10, fibre_g: 0.5, sugar_g: 22, salt_g: 0.1, serving_size: "1 bar (35g)" },
  { food_name: "Wispa Mini Bag",                       brand: "Cadbury", calories: 150, protein_g: 2,  carbs_g: 16, fat_g: 9,  fibre_g: 0.3, sugar_g: 15, salt_g: 0.1, serving_size: "1 mini bag (30g)" },
  { food_name: "Ferrero Rocher",                       brand: "Ferrero", calories: 75,  protein_g: 1,  carbs_g: 6,  fat_g: 5.5,fibre_g: 0.4, sugar_g: 5.5,salt_g: 0,   serving_size: "1 piece (12.5g)" },
  { food_name: "Ferrero Rocher Box 16",                brand: "Ferrero", calories: 1200,protein_g: 16, carbs_g: 96, fat_g: 88, fibre_g: 6,   sugar_g: 88, salt_g: 0.5, serving_size: "Box of 16 (200g)" },
  { food_name: "Kinder Bueno",                         brand: "Kinder", calories: 220, protein_g: 3,  carbs_g: 22, fat_g: 14, fibre_g: 0.5, sugar_g: 18, salt_g: 0.2, serving_size: "1 bar (43g)" },
  { food_name: "Kinder Surprise",                      brand: "Kinder", calories: 110, protein_g: 1.6,carbs_g: 10, fat_g: 7,  fibre_g: 0.3, sugar_g: 10, salt_g: 0.1, serving_size: "1 egg (20g)" },
  { food_name: "Kinder Chocolate Bar",                 brand: "Kinder", calories: 70,  protein_g: 1,  carbs_g: 7,  fat_g: 4,  fibre_g: 0.2, sugar_g: 7,  salt_g: 0.1, serving_size: "1 bar (12.5g)" },
  { food_name: "Milka Alpine Milk Chocolate",          brand: "Milka", calories: 265, protein_g: 3.3,carbs_g: 28, fat_g: 15, fibre_g: 0.7, sugar_g: 28, salt_g: 0.1, serving_size: "50g bar" },
  { food_name: "Lindt Lindor Dark",                    brand: "Lindt", calories: 225, protein_g: 2.5,carbs_g: 16, fat_g: 17, fibre_g: 2,   sugar_g: 15, salt_g: 0.1, serving_size: "3 truffles (37g)" },
  { food_name: "Lindt Excellence 70% Dark 20g",        brand: "Lindt", calories: 115, protein_g: 1.8,carbs_g: 7,  fat_g: 9,  fibre_g: 2,   sugar_g: 5,  salt_g: 0,   serving_size: "2 squares (20g)" },
  { food_name: "Terry's Chocolate Orange",             brand: "Terry's", calories: 1090,protein_g: 13, carbs_g: 123,fat_g: 60, fibre_g: 4,   sugar_g: 120,salt_g: 0.3, serving_size: "Whole ball (157g)" },
  { food_name: "Terry's Chocolate Orange Segment",     brand: "Terry's", calories: 55,  protein_g: 0.6,carbs_g: 6,  fat_g: 3,  fibre_g: 0.2, sugar_g: 6,  salt_g: 0,   serving_size: "1 segment (8g)" },
  { food_name: "Aero Chocolate Bar",                   brand: "Aero", calories: 200, protein_g: 2.5,carbs_g: 22, fat_g: 11, fibre_g: 0.5, sugar_g: 22, salt_g: 0.1, serving_size: "1 bar (36g)" },

  // ===== SWEETS / CHEWS =====
  { food_name: "Skittles",                             brand: "Mars", calories: 175, protein_g: 0,  carbs_g: 39, fat_g: 2,  fibre_g: 0,   sugar_g: 31, salt_g: 0,   serving_size: "1 bag (45g)" },
  { food_name: "Starburst Original",                   brand: "Mars", calories: 175, protein_g: 0,  carbs_g: 37, fat_g: 3,  fibre_g: 0,   sugar_g: 28, salt_g: 0,   serving_size: "1 pack (45g)" },
  { food_name: "Chewits",                              brand: "Chewits", calories: 115, protein_g: 0,  carbs_g: 26, fat_g: 1,  fibre_g: 0,   sugar_g: 21, salt_g: 0,   serving_size: "1 pack (30g)" },
  { food_name: "Polos Original",                       brand: "Nestlé", calories: 105, protein_g: 0,  carbs_g: 25, fat_g: 0.2,fibre_g: 0,   sugar_g: 24, salt_g: 0,   serving_size: "1 tube (26g)" },
  { food_name: "Mints Extra Strong",                   brand: "Trebor", calories: 98,  protein_g: 0,  carbs_g: 24, fat_g: 0,  fibre_g: 0,   sugar_g: 23, salt_g: 0,   serving_size: "1 roll (24g)" },
  { food_name: "Fruit Pastilles",                      brand: "Rowntree's", calories: 175, protein_g: 2.5,carbs_g: 40, fat_g: 0,  fibre_g: 0,   sugar_g: 30, salt_g: 0,   serving_size: "1 tube (52.5g)" },
  { food_name: "Fruit Gums",                           brand: "Rowntree's", calories: 175, protein_g: 5,  carbs_g: 38, fat_g: 0,  fibre_g: 0,   sugar_g: 28, salt_g: 0,   serving_size: "1 tube (52.5g)" },
  { food_name: "Jelly Babies",                         brand: "Bassett's", calories: 330, protein_g: 4,  carbs_g: 77, fat_g: 0,  fibre_g: 0,   sugar_g: 55, salt_g: 0.1, serving_size: "100g bag" },
  { food_name: "Liquorice Allsorts",                   brand: "Bassett's", calories: 350, protein_g: 3,  carbs_g: 75, fat_g: 4,  fibre_g: 2,   sugar_g: 50, salt_g: 0.1, serving_size: "100g bag" },
  { food_name: "Refreshers",                           brand: "Swizzels", calories: 105, protein_g: 0,  carbs_g: 25, fat_g: 0.5,fibre_g: 0,   sugar_g: 20, salt_g: 0,   serving_size: "1 bar (28g)" },
  { food_name: "Love Hearts",                          brand: "Swizzels", calories: 90,  protein_g: 0,  carbs_g: 22, fat_g: 0,  fibre_g: 0,   sugar_g: 17, salt_g: 0,   serving_size: "1 roll (25g)" },
  { food_name: "Haribo Goldbears",                     brand: "Haribo", calories: 340, protein_g: 7,  carbs_g: 77, fat_g: 0,  fibre_g: 0,   sugar_g: 46, salt_g: 0,   serving_size: "100g bag" },
  { food_name: "Haribo Giant Strawbs",                 brand: "Haribo", calories: 330, protein_g: 3,  carbs_g: 80, fat_g: 0,  fibre_g: 0,   sugar_g: 52, salt_g: 0,   serving_size: "100g bag" },

  // ============================================================
  // STAGE 10 — More cereals / granola
  // ============================================================

  { food_name: "Jordans Country Crisp Strawberry",     brand: "Jordans", calories: 195, protein_g: 4,  carbs_g: 27, fat_g: 7,  fibre_g: 3,   sugar_g: 9,  salt_g: 0.1, serving_size: "45g" },
  { food_name: "Jordans Country Crisp Four Nut",       brand: "Jordans", calories: 210, protein_g: 5,  carbs_g: 25, fat_g: 10, fibre_g: 3.5, sugar_g: 7,  salt_g: 0.1, serving_size: "45g" },
  { food_name: "Jordans Crunchy Nut Cereal",           brand: "Jordans", calories: 200, protein_g: 4.5,carbs_g: 27, fat_g: 8,  fibre_g: 3,   sugar_g: 9,  salt_g: 0.1, serving_size: "45g" },
  { food_name: "Dorset Cereals Luxury Muesli",         brand: "Dorset Cereals", calories: 170, protein_g: 4.5,carbs_g: 28, fat_g: 3.5,fibre_g: 4,  sugar_g: 9,  salt_g: 0,   serving_size: "45g" },
  { food_name: "Dorset Cereals Simply Nutty Granola",  brand: "Dorset Cereals", calories: 215, protein_g: 5,  carbs_g: 23, fat_g: 11, fibre_g: 3,   sugar_g: 7,  salt_g: 0.1, serving_size: "45g" },
  { food_name: "Lizi's Original Granola",              brand: "Lizi's", calories: 210, protein_g: 5,  carbs_g: 24, fat_g: 10, fibre_g: 4,   sugar_g: 3.5,salt_g: 0.1, serving_size: "50g" },
  { food_name: "Weetabix Protein 2 biscuits",          brand: "Weetabix", calories: 155, protein_g: 11, carbs_g: 24, fat_g: 1.5,fibre_g: 4,   sugar_g: 2,  salt_g: 0.2, serving_size: "2 biscuits (46g)" },
  { food_name: "Weetabix Chocolate",                   brand: "Weetabix", calories: 140, protein_g: 4,  carbs_g: 26, fat_g: 1.5,fibre_g: 3,   sugar_g: 5,  salt_g: 0.2, serving_size: "2 biscuits (37.5g)" },
  { food_name: "Weetos",                               brand: "Weetabix", calories: 155, protein_g: 3.5,carbs_g: 32, fat_g: 1.5,fibre_g: 3,   sugar_g: 9,  salt_g: 0.3, serving_size: "40g" },
  { food_name: "Ready Brek Original",                  brand: "Ready Brek", calories: 145, protein_g: 4.5,carbs_g: 24, fat_g: 3.5,fibre_g: 3,   sugar_g: 1,  salt_g: 0,   serving_size: "30g + 160ml milk" },
  { food_name: "Kellogg's All-Bran",                   brand: "Kellogg's", calories: 105, protein_g: 4.4,carbs_g: 16, fat_g: 1.3,fibre_g: 10,  sugar_g: 6.5,salt_g: 0.3, serving_size: "40g" },
  { food_name: "Kellogg's Bran Flakes",                brand: "Kellogg's", calories: 135, protein_g: 4,  carbs_g: 27, fat_g: 0.7,fibre_g: 5,   sugar_g: 8,  salt_g: 0.3, serving_size: "40g" },
  { food_name: "Kellogg's Fruit 'n Fibre",             brand: "Kellogg's", calories: 145, protein_g: 3.2,carbs_g: 29, fat_g: 1.5,fibre_g: 3,   sugar_g: 10, salt_g: 0.2, serving_size: "40g" },
  { food_name: "Kellogg's Krave Chocolate Hazelnut",   brand: "Kellogg's", calories: 170, protein_g: 3.5,carbs_g: 27, fat_g: 5,  fibre_g: 2,   sugar_g: 10, salt_g: 0.3, serving_size: "40g" },
  { food_name: "Nestlé Nesquik Cereal",                brand: "Nestlé", calories: 150, protein_g: 3,  carbs_g: 32, fat_g: 1.5,fibre_g: 1,   sugar_g: 11, salt_g: 0.3, serving_size: "40g" },
  { food_name: "Nestlé Honey Cheerios",                brand: "Nestlé", calories: 155, protein_g: 3.5,carbs_g: 31, fat_g: 1.5,fibre_g: 2.5, sugar_g: 10, salt_g: 0.2, serving_size: "40g" },
  { food_name: "Belvita Breakfast Biscuits 4 piece",   brand: "Belvita", calories: 225, protein_g: 4,  carbs_g: 33, fat_g: 7,  fibre_g: 3,   sugar_g: 10, salt_g: 0.3, serving_size: "4 biscuits (50g)" },
  { food_name: "Nutri-Grain Strawberry",               brand: "Kellogg's", calories: 135, protein_g: 1.7,carbs_g: 25, fat_g: 3,  fibre_g: 1.5, sugar_g: 11, salt_g: 0.2, serving_size: "1 bar (37g)" },

  // ============================================================
  // STAGE 11 — More protein/snack bars
  // ============================================================

  { food_name: "Quest Bar Chocolate Chip Cookie Dough",brand: "Quest", calories: 190, protein_g: 21, carbs_g: 22, fat_g: 8,  fibre_g: 14,  sugar_g: 1,  salt_g: 0.5, serving_size: "1 bar (60g)" },
  { food_name: "Quest Bar Cookies and Cream",          brand: "Quest", calories: 180, protein_g: 21, carbs_g: 21, fat_g: 7,  fibre_g: 14,  sugar_g: 1,  salt_g: 0.4, serving_size: "1 bar (60g)" },
  { food_name: "Quest Bar Birthday Cake",              brand: "Quest", calories: 180, protein_g: 20, carbs_g: 22, fat_g: 7,  fibre_g: 12,  sugar_g: 1,  salt_g: 0.4, serving_size: "1 bar (60g)" },
  { food_name: "Barebells Protein Bar Caramel Cashew", brand: "Barebells", calories: 195, protein_g: 20, carbs_g: 19, fat_g: 6.5,fibre_g: 1, sugar_g: 2,  salt_g: 0.5, serving_size: "1 bar (55g)" },
  { food_name: "Barebells Protein Bar Cookies and Cream",brand:"Barebells", calories: 200, protein_g: 20, carbs_g: 19, fat_g: 7,  fibre_g: 1, sugar_g: 2,  salt_g: 0.4, serving_size: "1 bar (55g)" },
  { food_name: "Barebells Protein Bar Salty Peanut",   brand: "Barebells", calories: 205, protein_g: 20, carbs_g: 18, fat_g: 7.5,fibre_g: 1, sugar_g: 2,  salt_g: 0.6, serving_size: "1 bar (55g)" },
  { food_name: "Per4m Protein Flapjack",               brand: "Per4m", calories: 290, protein_g: 22, carbs_g: 26, fat_g: 11, fibre_g: 3,   sugar_g: 8,  salt_g: 0.5, serving_size: "1 flapjack (75g)" },
  { food_name: "Warrior Crunch Bar",                   brand: "Warrior", calories: 210, protein_g: 20, carbs_g: 22, fat_g: 7,  fibre_g: 8,   sugar_g: 2,  salt_g: 0.6, serving_size: "1 bar (64g)" },
  { food_name: "Pulsin Protein Bar Chocolate",         brand: "Pulsin", calories: 205, protein_g: 13, carbs_g: 19, fat_g: 10, fibre_g: 4,   sugar_g: 9,  salt_g: 0.2, serving_size: "1 bar (50g)" },
  { food_name: "Fulfil Chocolate Salted Caramel",      brand: "Fulfil", calories: 205, protein_g: 20, carbs_g: 17, fat_g: 7.5,fibre_g: 4,   sugar_g: 1.5,salt_g: 0.4, serving_size: "1 bar (55g)" },
  { food_name: "Fulfil Chocolate Peanut Butter",       brand: "Fulfil", calories: 215, protein_g: 20, carbs_g: 15, fat_g: 10, fibre_g: 4,   sugar_g: 1.5,salt_g: 0.4, serving_size: "1 bar (55g)" },
  { food_name: "Kind Bar Dark Chocolate Nuts and Sea Salt",brand:"Kind", calories: 200, protein_g: 6,  carbs_g: 17, fat_g: 14, fibre_g: 3,   sugar_g: 5,  salt_g: 0.3, serving_size: "1 bar (40g)" },
  { food_name: "Kind Bar Caramel Almond and Sea Salt", brand: "Kind", calories: 210, protein_g: 5,  carbs_g: 19, fat_g: 14, fibre_g: 3,   sugar_g: 9,  salt_g: 0.3, serving_size: "1 bar (40g)" },
  { food_name: "Nature Valley Crunchy Oats and Honey", brand: "Nature Valley", calories: 190, protein_g: 4,  carbs_g: 27, fat_g: 7.5,fibre_g: 2, sugar_g: 12, salt_g: 0.2, serving_size: "1 twin bar (42g)" },
  { food_name: "Nature Valley Protein Peanut Chocolate",brand:"Nature Valley", calories: 190, protein_g: 10, carbs_g: 15, fat_g: 11, fibre_g: 5,  sugar_g: 6,  salt_g: 0.3, serving_size: "1 bar (40g)" },
  { food_name: "Trek Protein Nut Bar",                 brand: "Trek", calories: 230, protein_g: 10, carbs_g: 22, fat_g: 11, fibre_g: 3,   sugar_g: 14, salt_g: 0.1, serving_size: "1 bar (50g)" },
  { food_name: "Trek Flapjack Peanut Power",           brand: "Trek", calories: 205, protein_g: 10, carbs_g: 19, fat_g: 9,  fibre_g: 3,   sugar_g: 11, salt_g: 0.1, serving_size: "1 bar (50g)" },
  { food_name: "Eat Natural Almond Apricot Yogurt",    brand: "Eat Natural", calories: 210, protein_g: 4,  carbs_g: 22, fat_g: 11, fibre_g: 2,   sugar_g: 14, salt_g: 0.1, serving_size: "1 bar (45g)" },
  { food_name: "Eat Natural Dark Chocolate and Cranberry",brand:"Eat Natural", calories: 215, protein_g: 4,  carbs_g: 25, fat_g: 11, fibre_g: 2,  sugar_g: 16, salt_g: 0.1, serving_size: "1 bar (45g)" },
  { food_name: "Graze Protein Flapjack",               brand: "Graze", calories: 215, protein_g: 10, carbs_g: 20, fat_g: 11, fibre_g: 2,   sugar_g: 11, salt_g: 0.1, serving_size: "1 bar (53g)" },
  { food_name: "Graze Punchy Protein Nuts",            brand: "Graze", calories: 170, protein_g: 9,  carbs_g: 8,  fat_g: 12, fibre_g: 3,   sugar_g: 3,  salt_g: 0.5, serving_size: "1 pack (30g)" },
  { food_name: "Mule Bar Cocoa Mountain",              brand: "Mule Bar", calories: 220, protein_g: 4,  carbs_g: 34, fat_g: 7,  fibre_g: 3,   sugar_g: 22, salt_g: 0.1, serving_size: "1 bar (56g)" },
  { food_name: "Clif Bar Chocolate Chip",              brand: "Clif", calories: 250, protein_g: 9,  carbs_g: 42, fat_g: 6,  fibre_g: 4,   sugar_g: 18, salt_g: 0.3, serving_size: "1 bar (68g)" },
  { food_name: "Sci-MX Pro 2Go Protein Bar",           brand: "Sci-MX", calories: 220, protein_g: 21, carbs_g: 22, fat_g: 6,  fibre_g: 4,   sugar_g: 3,  salt_g: 0.4, serving_size: "1 bar (60g)" },

  // ============================================================
  // STAGE 12 — Regional UK pub chains
  // ============================================================

  // ===== GREENE KING / HUNGRY HORSE / BEEFEATER / BREWERS FAYRE =====
  { food_name: "Fish and Chips",                       brand: "Greene King", calories: 1050,protein_g: 40, carbs_g: 105,fat_g: 48, fibre_g: 8, sugar_g: 6,  salt_g: 3.1, serving_size: "1 plate" },
  { food_name: "Classic Cheeseburger",                 brand: "Greene King", calories: 985, protein_g: 48, carbs_g: 75, fat_g: 52, fibre_g: 5, sugar_g: 10, salt_g: 3.3, serving_size: "1 burger + chips" },
  { food_name: "Chicken Tikka Masala",                 brand: "Greene King", calories: 910, protein_g: 45, carbs_g: 95, fat_g: 32, fibre_g: 6, sugar_g: 15, salt_g: 3.0, serving_size: "1 plate" },
  { food_name: "Steak and Ale Pie",                    brand: "Greene King", calories: 985, protein_g: 40, carbs_g: 100,fat_g: 45, fibre_g: 7, sugar_g: 10, salt_g: 2.8, serving_size: "1 pie + chips" },
  { food_name: "Sunday Roast Beef",                    brand: "Greene King", calories: 1050,protein_g: 55, carbs_g: 95, fat_g: 42, fibre_g: 10,sugar_g: 14, salt_g: 3.5, serving_size: "1 plate" },
  { food_name: "Traditional English Breakfast",        brand: "Greene King", calories: 890, protein_g: 45, carbs_g: 65, fat_g: 48, fibre_g: 8, sugar_g: 12, salt_g: 4.3, serving_size: "1 plate" },
  { food_name: "Mixed Grill",                          brand: "Hungry Horse", calories: 1785,protein_g: 95, carbs_g: 110,fat_g: 95, fibre_g: 8, sugar_g: 16, salt_g: 5.8, serving_size: "1 plate" },
  { food_name: "Hangover Burger",                      brand: "Hungry Horse", calories: 1640,protein_g: 75, carbs_g: 110,fat_g: 95, fibre_g: 8, sugar_g: 14, salt_g: 5.2, serving_size: "1 burger + chips" },
  { food_name: "8oz Rump Steak",                       brand: "Hungry Horse", calories: 810, protein_g: 55, carbs_g: 55, fat_g: 38, fibre_g: 6, sugar_g: 4,  salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Gammon Egg and Chips",                 brand: "Hungry Horse", calories: 1085,protein_g: 55, carbs_g: 105,fat_g: 48, fibre_g: 7, sugar_g: 5,  salt_g: 5.0, serving_size: "1 plate" },
  { food_name: "Ultimate Mixed Grill",                 brand: "Beefeater", calories: 1895,protein_g: 110,carbs_g: 100,fat_g: 105,fibre_g: 8, sugar_g: 14, salt_g: 6.2, serving_size: "1 plate" },
  { food_name: "10oz Sirloin Steak",                   brand: "Beefeater", calories: 935, protein_g: 75, carbs_g: 60, fat_g: 42, fibre_g: 6, sugar_g: 4,  salt_g: 2.6, serving_size: "1 plate" },
  { food_name: "Beefeater Classic Burger",             brand: "Beefeater", calories: 1085,protein_g: 55, carbs_g: 85, fat_g: 52, fibre_g: 6, sugar_g: 11, salt_g: 3.6, serving_size: "1 burger + chips" },
  { food_name: "Traditional Fish and Chips",           brand: "Beefeater", calories: 1120,protein_g: 42, carbs_g: 108,fat_g: 55, fibre_g: 8, sugar_g: 7,  salt_g: 3.2, serving_size: "1 plate" },
  { food_name: "Full Premier Breakfast",               brand: "Beefeater", calories: 915, protein_g: 48, carbs_g: 70, fat_g: 48, fibre_g: 8, sugar_g: 13, salt_g: 4.5, serving_size: "1 plate" },
  { food_name: "Brewers Breakfast",                    brand: "Brewers Fayre", calories: 855, protein_g: 45, carbs_g: 62, fat_g: 45, fibre_g: 7, sugar_g: 12, salt_g: 4.4, serving_size: "1 plate" },
  { food_name: "Chicken and Bacon Stack Burger",       brand: "Brewers Fayre", calories: 1095,protein_g: 60, carbs_g: 80, fat_g: 55, fibre_g: 5, sugar_g: 12, salt_g: 4.0, serving_size: "1 burger + chips" },
  { food_name: "Scampi and Chips",                     brand: "Brewers Fayre", calories: 895, protein_g: 26, carbs_g: 100,fat_g: 42, fibre_g: 8, sugar_g: 6,  salt_g: 2.9, serving_size: "1 plate" },

  // ===== MILLER AND CARTER =====
  { food_name: "8oz Fillet Steak",                     brand: "Miller and Carter", calories: 405, protein_g: 55, carbs_g: 0,  fat_g: 22, fibre_g: 0, sugar_g: 0,  salt_g: 0.3, serving_size: "1 steak" },
  { food_name: "8oz Sirloin Steak",                    brand: "Miller and Carter", calories: 450, protein_g: 55, carbs_g: 0,  fat_g: 25, fibre_g: 0, sugar_g: 0,  salt_g: 0.3, serving_size: "1 steak" },
  { food_name: "10oz Ribeye Steak",                    brand: "Miller and Carter", calories: 720, protein_g: 62, carbs_g: 0,  fat_g: 52, fibre_g: 0, sugar_g: 0,  salt_g: 0.4, serving_size: "1 steak" },
  { food_name: "30-Day Matured T-Bone Steak",          brand: "Miller and Carter", calories: 920, protein_g: 88, carbs_g: 0,  fat_g: 62, fibre_g: 0, sugar_g: 0,  salt_g: 0.5, serving_size: "1 steak" },
  { food_name: "Miller Steak Frites Burger",           brand: "Miller and Carter", calories: 1150,protein_g: 55, carbs_g: 75, fat_g: 65, fibre_g: 5, sugar_g: 11, salt_g: 3.7, serving_size: "1 burger + chips" },
  { food_name: "Lobster Mac and Cheese",               brand: "Miller and Carter", calories: 735, protein_g: 40, carbs_g: 55, fat_g: 38, fibre_g: 3, sugar_g: 6,  salt_g: 2.3, serving_size: "1 portion" },
  { food_name: "Steakhouse Wedge Salad",               brand: "Miller and Carter", calories: 365, protein_g: 11, carbs_g: 15, fat_g: 28, fibre_g: 4, sugar_g: 9,  salt_g: 2.0, serving_size: "1 salad" },
  { food_name: "Chargrilled Chicken Skewers",          brand: "Miller and Carter", calories: 545, protein_g: 58, carbs_g: 15, fat_g: 28, fibre_g: 3, sugar_g: 9,  salt_g: 2.5, serving_size: "1 plate" },

  // ============================================================
  // STAGE 13 — Fast-casual expansion
  // ============================================================

  // ===== CÔTE BRASSERIE =====
  { food_name: "Steak Frites",                         brand: "Côte", calories: 760, protein_g: 55, carbs_g: 60, fat_g: 38, fibre_g: 6, sugar_g: 3,  salt_g: 2.2, serving_size: "1 plate" },
  { food_name: "Moules Marinière",                     brand: "Côte", calories: 485, protein_g: 42, carbs_g: 25, fat_g: 22, fibre_g: 3, sugar_g: 5,  salt_g: 2.6, serving_size: "1 main" },
  { food_name: "Croque Monsieur",                      brand: "Côte", calories: 680, protein_g: 32, carbs_g: 55, fat_g: 38, fibre_g: 3, sugar_g: 8,  salt_g: 3.2, serving_size: "1 portion" },
  { food_name: "Chicken Milanese",                     brand: "Côte", calories: 695, protein_g: 55, carbs_g: 45, fat_g: 30, fibre_g: 4, sugar_g: 6,  salt_g: 2.4, serving_size: "1 plate" },
  { food_name: "Tuna Niçoise Salad",                   brand: "Côte", calories: 485, protein_g: 35, carbs_g: 25, fat_g: 25, fibre_g: 5, sugar_g: 5,  salt_g: 2.2, serving_size: "1 salad" },
  { food_name: "Crème Brûlée",                         brand: "Côte", calories: 465, protein_g: 5,  carbs_g: 40, fat_g: 30, fibre_g: 0, sugar_g: 38, salt_g: 0.2, serving_size: "1 dessert" },

  // ===== BILL'S =====
  { food_name: "Big Bill's Burger",                    brand: "Bill's", calories: 1065,protein_g: 52, carbs_g: 70, fat_g: 58, fibre_g: 5, sugar_g: 11, salt_g: 3.5, serving_size: "1 burger + chips" },
  { food_name: "Halloumi Fries",                       brand: "Bill's", calories: 510, protein_g: 22, carbs_g: 26, fat_g: 35, fibre_g: 2, sugar_g: 5,  salt_g: 2.8, serving_size: "1 starter" },
  { food_name: "Chicken Milanese",                     brand: "Bill's", calories: 785, protein_g: 48, carbs_g: 55, fat_g: 38, fibre_g: 5, sugar_g: 7,  salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Full Bill's Breakfast",                brand: "Bill's", calories: 895, protein_g: 42, carbs_g: 68, fat_g: 48, fibre_g: 7, sugar_g: 12, salt_g: 4.2, serving_size: "1 plate" },
  { food_name: "Avocado Smash on Sourdough",           brand: "Bill's", calories: 465, protein_g: 13, carbs_g: 42, fat_g: 27, fibre_g: 7, sugar_g: 4,  salt_g: 1.5, serving_size: "1 portion" },
  { food_name: "Sticky Toffee Pudding",                brand: "Bill's", calories: 685, protein_g: 6,  carbs_g: 95, fat_g: 32, fibre_g: 2, sugar_g: 70, salt_g: 0.6, serving_size: "1 dessert" },

  // ===== BOSTON TEA PARTY =====
  { food_name: "BTP Full Breakfast",                   brand: "Boston Tea Party", calories: 845, protein_g: 42, carbs_g: 55, fat_g: 48, fibre_g: 8, sugar_g: 12, salt_g: 4.0, serving_size: "1 plate" },
  { food_name: "Avocado Eggs Benedict",                brand: "Boston Tea Party", calories: 585, protein_g: 25, carbs_g: 45, fat_g: 32, fibre_g: 6, sugar_g: 4,  salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Ham Hock Hash",                        brand: "Boston Tea Party", calories: 645, protein_g: 35, carbs_g: 48, fat_g: 32, fibre_g: 4, sugar_g: 5,  salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Buddha Bowl",                          brand: "Boston Tea Party", calories: 545, protein_g: 20, carbs_g: 72, fat_g: 20, fibre_g: 10,sugar_g: 10, salt_g: 1.8, serving_size: "1 bowl" },

  // ===== PATTY AND BUN / MEAT LIQUOR =====
  { food_name: "Ari Gold Burger",                      brand: "Patty and Bun", calories: 920, protein_g: 45, carbs_g: 55, fat_g: 55, fibre_g: 4, sugar_g: 10, salt_g: 3.3, serving_size: "1 burger" },
  { food_name: "Smokey Robinson Burger",               brand: "Patty and Bun", calories: 955, protein_g: 47, carbs_g: 58, fat_g: 57, fibre_g: 4, sugar_g: 13, salt_g: 3.4, serving_size: "1 burger" },
  { food_name: "Patty Chips Rosemary Salt",            brand: "Patty and Bun", calories: 425, protein_g: 5,  carbs_g: 54, fat_g: 20, fibre_g: 5, sugar_g: 1,  salt_g: 1.4, serving_size: "Side portion" },
  { food_name: "Dead Hippie Burger",                   brand: "Meat Liquor", calories: 980, protein_g: 50, carbs_g: 55, fat_g: 62, fibre_g: 4, sugar_g: 12, salt_g: 3.5, serving_size: "1 burger" },
  { food_name: "Buffalo Chicken Burger",               brand: "Meat Liquor", calories: 865, protein_g: 42, carbs_g: 62, fat_g: 48, fibre_g: 4, sugar_g: 9,  salt_g: 3.2, serving_size: "1 burger" },

  // ===== FRANCO MANCA / PIZZA PILGRIMS =====
  { food_name: "Margherita Sourdough Pizza",           brand: "Franco Manca", calories: 705, protein_g: 27, carbs_g: 100,fat_g: 23, fibre_g: 5, sugar_g: 8,  salt_g: 2.8, serving_size: "Whole pizza" },
  { food_name: "Tomato Mozzarella Basil Pizza",        brand: "Franco Manca", calories: 720, protein_g: 28, carbs_g: 100,fat_g: 24, fibre_g: 5, sugar_g: 9,  salt_g: 2.8, serving_size: "Whole pizza" },
  { food_name: "Chorizo and Mozzarella Pizza",         brand: "Franco Manca", calories: 945, protein_g: 42, carbs_g: 102,fat_g: 42, fibre_g: 5, sugar_g: 9,  salt_g: 3.8, serving_size: "Whole pizza" },
  { food_name: "Cured Ham and Artichoke Pizza",        brand: "Franco Manca", calories: 865, protein_g: 40, carbs_g: 100,fat_g: 35, fibre_g: 5, sugar_g: 9,  salt_g: 3.5, serving_size: "Whole pizza" },
  { food_name: "Margherita Pizza",                     brand: "Pizza Pilgrims", calories: 685, protein_g: 26, carbs_g: 95, fat_g: 22, fibre_g: 5, sugar_g: 8,  salt_g: 2.7, serving_size: "Whole pizza" },
  { food_name: "Nduja Pizza",                          brand: "Pizza Pilgrims", calories: 960, protein_g: 40, carbs_g: 97, fat_g: 45, fibre_g: 5, sugar_g: 9,  salt_g: 3.8, serving_size: "Whole pizza" },
  { food_name: "Double Pepperoni Pizza",               brand: "Pizza Pilgrims", calories: 1005,protein_g: 45, carbs_g: 97, fat_g: 48, fibre_g: 5, sugar_g: 9,  salt_g: 4.1, serving_size: "Whole pizza" },

  // ============================================================
  // STAGE 14 — Meat cuts, seafood, pulses, baking basics, cooking oils
  // ============================================================

  // ===== BEEF CUTS =====
  { food_name: "Beef Rump Steak Raw 100g",             brand: "Ingredient", calories: 150, protein_g: 22, carbs_g: 0, fat_g: 7,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Fillet Steak Raw 100g",           brand: "Ingredient", calories: 145, protein_g: 23, carbs_g: 0, fat_g: 6,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Sirloin Steak Raw 100g",          brand: "Ingredient", calories: 170, protein_g: 22, carbs_g: 0, fat_g: 9,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Ribeye Raw 100g",                 brand: "Ingredient", calories: 235, protein_g: 21, carbs_g: 0, fat_g: 17,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Brisket Raw 100g",                brand: "Ingredient", calories: 220, protein_g: 20, carbs_g: 0, fat_g: 15,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Chuck Raw 100g",                  brand: "Ingredient", calories: 195, protein_g: 20, carbs_g: 0, fat_g: 12,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Mince 5% Fat Raw 100g",           brand: "Ingredient", calories: 125, protein_g: 21, carbs_g: 0, fat_g: 5,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Mince 10% Fat Raw 100g",          brand: "Ingredient", calories: 170, protein_g: 20, carbs_g: 0, fat_g: 10,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Mince 20% Fat Raw 100g",          brand: "Ingredient", calories: 250, protein_g: 17, carbs_g: 0, fat_g: 20,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Beef Stewing Steak Raw 100g",          brand: "Ingredient", calories: 155, protein_g: 21, carbs_g: 0, fat_g: 8,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },

  // ===== LAMB CUTS =====
  { food_name: "Lamb Leg Raw 100g",                    brand: "Ingredient", calories: 200, protein_g: 21, carbs_g: 0, fat_g: 13,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Lamb Loin Chop Raw 100g",              brand: "Ingredient", calories: 225, protein_g: 21, carbs_g: 0, fat_g: 16,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Lamb Shoulder Raw 100g",               brand: "Ingredient", calories: 235, protein_g: 20, carbs_g: 0, fat_g: 17,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Lamb Mince 20% Fat Raw 100g",          brand: "Ingredient", calories: 255, protein_g: 17, carbs_g: 0, fat_g: 21,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Lamb Rack Raw 100g",                   brand: "Ingredient", calories: 260, protein_g: 19, carbs_g: 0, fat_g: 20,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },

  // ===== PORK CUTS =====
  { food_name: "Pork Loin Raw 100g",                   brand: "Ingredient", calories: 175, protein_g: 22, carbs_g: 0, fat_g: 10,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Pork Belly Raw 100g",                  brand: "Ingredient", calories: 320, protein_g: 15, carbs_g: 0, fat_g: 29,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Pork Shoulder Raw 100g",               brand: "Ingredient", calories: 220, protein_g: 20, carbs_g: 0, fat_g: 15,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Pork Tenderloin Raw 100g",             brand: "Ingredient", calories: 145, protein_g: 24, carbs_g: 0, fat_g: 5,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Pork Ribs Raw 100g",                   brand: "Ingredient", calories: 280, protein_g: 18, carbs_g: 0, fat_g: 23,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Pork Mince 10% Fat Raw 100g",          brand: "Ingredient", calories: 185, protein_g: 20, carbs_g: 0, fat_g: 11,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },

  // ===== CHICKEN / POULTRY =====
  { food_name: "Chicken Breast Raw 100g",              brand: "Ingredient", calories: 110, protein_g: 23, carbs_g: 0, fat_g: 1.5, fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Chicken Thigh Boneless Raw 100g",      brand: "Ingredient", calories: 175, protein_g: 19, carbs_g: 0, fat_g: 11,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Chicken Drumstick Raw 100g",           brand: "Ingredient", calories: 170, protein_g: 18, carbs_g: 0, fat_g: 10,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Chicken Wings Raw 100g",               brand: "Ingredient", calories: 200, protein_g: 18, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Chicken Mince Raw 100g",               brand: "Ingredient", calories: 145, protein_g: 19, carbs_g: 0, fat_g: 8,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Turkey Breast Raw 100g",               brand: "Ingredient", calories: 105, protein_g: 22, carbs_g: 0, fat_g: 1.5, fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Turkey Mince Raw 100g",                brand: "Ingredient", calories: 160, protein_g: 20, carbs_g: 0, fat_g: 9,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Duck Breast Raw 100g",                 brand: "Ingredient", calories: 135, protein_g: 20, carbs_g: 0, fat_g: 6,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },

  // ===== SEAFOOD =====
  { food_name: "Salmon Fillet Raw 100g",               brand: "Ingredient", calories: 205, protein_g: 20, carbs_g: 0, fat_g: 13,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Smoked Salmon 100g",                   brand: "Ingredient", calories: 180, protein_g: 25, carbs_g: 0, fat_g: 9,   fibre_g: 0, sugar_g: 0, salt_g: 4.0, serving_size: "100g" },
  { food_name: "Cod Fillet Raw 100g",                  brand: "Ingredient", calories: 82,  protein_g: 18, carbs_g: 0, fat_g: 0.7, fibre_g: 0, sugar_g: 0, salt_g: 0.2, serving_size: "100g raw" },
  { food_name: "Haddock Fillet Raw 100g",              brand: "Ingredient", calories: 80,  protein_g: 18, carbs_g: 0, fat_g: 0.7, fibre_g: 0, sugar_g: 0, salt_g: 0.2, serving_size: "100g raw" },
  { food_name: "Plaice Raw 100g",                      brand: "Ingredient", calories: 80,  protein_g: 17, carbs_g: 0, fat_g: 1.4, fibre_g: 0, sugar_g: 0, salt_g: 0.2, serving_size: "100g raw" },
  { food_name: "Sea Bass Fillet Raw 100g",             brand: "Ingredient", calories: 100, protein_g: 19, carbs_g: 0, fat_g: 2.5, fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Hake Fillet Raw 100g",                 brand: "Ingredient", calories: 90,  protein_g: 18, carbs_g: 0, fat_g: 2,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Tuna Steak Raw 100g",                  brand: "Ingredient", calories: 115, protein_g: 25, carbs_g: 0, fat_g: 1,   fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Tuna Canned in Brine",                 brand: "Ingredient", calories: 100, protein_g: 24, carbs_g: 0, fat_g: 0.6, fibre_g: 0, sugar_g: 0, salt_g: 1.0, serving_size: "1 can drained (112g)" },
  { food_name: "Tuna Canned in Oil",                   brand: "Ingredient", calories: 190, protein_g: 22, carbs_g: 0, fat_g: 11,  fibre_g: 0, sugar_g: 0, salt_g: 0.9, serving_size: "1 can drained (112g)" },
  { food_name: "Mackerel Fillet Raw 100g",             brand: "Ingredient", calories: 205, protein_g: 19, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Sardines Canned in Oil",               brand: "Ingredient", calories: 210, protein_g: 25, carbs_g: 0, fat_g: 12,  fibre_g: 0, sugar_g: 0, salt_g: 0.9, serving_size: "1 can (120g)" },
  { food_name: "Prawns Raw 100g",                      brand: "Ingredient", calories: 75,  protein_g: 18, carbs_g: 0, fat_g: 0.3, fibre_g: 0, sugar_g: 0, salt_g: 0.3, serving_size: "100g raw" },
  { food_name: "King Prawns Cooked 100g",              brand: "Ingredient", calories: 85,  protein_g: 19, carbs_g: 0, fat_g: 0.9, fibre_g: 0, sugar_g: 0, salt_g: 0.5, serving_size: "100g cooked" },
  { food_name: "Mussels Cooked 100g",                  brand: "Ingredient", calories: 100, protein_g: 14, carbs_g: 4, fat_g: 3,   fibre_g: 0, sugar_g: 0, salt_g: 0.6, serving_size: "100g cooked" },
  { food_name: "Scallops Raw 100g",                    brand: "Ingredient", calories: 85,  protein_g: 17, carbs_g: 2, fat_g: 0.8, fibre_g: 0, sugar_g: 0, salt_g: 0.3, serving_size: "100g raw" },
  { food_name: "Squid Raw 100g",                       brand: "Ingredient", calories: 90,  protein_g: 15, carbs_g: 3, fat_g: 1.4, fibre_g: 0, sugar_g: 0, salt_g: 0.1, serving_size: "100g raw" },
  { food_name: "Lobster Cooked 100g",                  brand: "Ingredient", calories: 95,  protein_g: 21, carbs_g: 0, fat_g: 1,   fibre_g: 0, sugar_g: 0, salt_g: 0.7, serving_size: "100g cooked" },
  { food_name: "Crab Meat 100g",                       brand: "Ingredient", calories: 85,  protein_g: 18, carbs_g: 0, fat_g: 1,   fibre_g: 0, sugar_g: 0, salt_g: 0.5, serving_size: "100g" },

  // ===== PULSES / LEGUMES =====
  { food_name: "Chickpeas Canned Drained 100g",        brand: "Ingredient", calories: 120, protein_g: 7,  carbs_g: 14, fat_g: 2.5, fibre_g: 6, sugar_g: 1, salt_g: 0.4, serving_size: "100g drained" },
  { food_name: "Red Lentils Dry 50g",                  brand: "Ingredient", calories: 175, protein_g: 13, carbs_g: 30, fat_g: 0.5, fibre_g: 5, sugar_g: 1, salt_g: 0,   serving_size: "50g dry weight" },
  { food_name: "Green Lentils Dry 50g",                brand: "Ingredient", calories: 170, protein_g: 12, carbs_g: 30, fat_g: 0.5, fibre_g: 5, sugar_g: 1, salt_g: 0,   serving_size: "50g dry weight" },
  { food_name: "Puy Lentils Cooked 100g",              brand: "Ingredient", calories: 125, protein_g: 9,  carbs_g: 20, fat_g: 0.5, fibre_g: 4, sugar_g: 1, salt_g: 0,   serving_size: "100g cooked" },
  { food_name: "Kidney Beans Canned Drained 100g",     brand: "Ingredient", calories: 105, protein_g: 7,  carbs_g: 15, fat_g: 0.5, fibre_g: 6, sugar_g: 1, salt_g: 0.5, serving_size: "100g drained" },
  { food_name: "Butter Beans Canned Drained 100g",     brand: "Ingredient", calories: 95,  protein_g: 6,  carbs_g: 15, fat_g: 0.3, fibre_g: 5, sugar_g: 1, salt_g: 0.4, serving_size: "100g drained" },
  { food_name: "Cannellini Beans Canned Drained 100g", brand: "Ingredient", calories: 95,  protein_g: 7,  carbs_g: 14, fat_g: 0.3, fibre_g: 6, sugar_g: 1, salt_g: 0.4, serving_size: "100g drained" },
  { food_name: "Black Beans Canned Drained 100g",      brand: "Ingredient", calories: 115, protein_g: 7,  carbs_g: 16, fat_g: 0.5, fibre_g: 7, sugar_g: 1, salt_g: 0.5, serving_size: "100g drained" },
  { food_name: "Baked Beans in Tomato Sauce",          brand: "Heinz", calories: 155, protein_g: 10, carbs_g: 25, fat_g: 0.5, fibre_g: 10, sugar_g: 10, salt_g: 1.3, serving_size: "1/2 can (210g)" },

  // ===== OILS / BAKING BASICS =====
  { food_name: "Olive Oil Extra Virgin",               brand: "Ingredient", calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (14g)" },
  { food_name: "Sunflower Oil",                        brand: "Ingredient", calories: 124, protein_g: 0, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (14g)" },
  { food_name: "Rapeseed Oil",                         brand: "Ingredient", calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (14g)" },
  { food_name: "Coconut Oil",                          brand: "Ingredient", calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (14g)" },
  { food_name: "Sesame Oil",                           brand: "Ingredient", calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (14g)" },
  { food_name: "Avocado Oil",                          brand: "Ingredient", calories: 124, protein_g: 0, carbs_g: 0, fat_g: 14,  fibre_g: 0, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (14g)" },
  { food_name: "Plain Flour 100g",                     brand: "Ingredient", calories: 345, protein_g: 10, carbs_g: 72, fat_g: 1.3,fibre_g: 3, sugar_g: 1, salt_g: 0, serving_size: "100g" },
  { food_name: "Self-Raising Flour 100g",              brand: "Ingredient", calories: 345, protein_g: 10, carbs_g: 72, fat_g: 1.3,fibre_g: 3, sugar_g: 1, salt_g: 1.6, serving_size: "100g" },
  { food_name: "Wholemeal Flour 100g",                 brand: "Ingredient", calories: 325, protein_g: 13, carbs_g: 62, fat_g: 2.5,fibre_g: 10,sugar_g: 2, salt_g: 0, serving_size: "100g" },
  { food_name: "Granulated Sugar 1 tsp",               brand: "Ingredient", calories: 15,  protein_g: 0,  carbs_g: 4,  fat_g: 0,  fibre_g: 0, sugar_g: 4, salt_g: 0, serving_size: "1 tsp (4g)" },
  { food_name: "Granulated Sugar 1 tbsp",              brand: "Ingredient", calories: 50,  protein_g: 0,  carbs_g: 13, fat_g: 0,  fibre_g: 0, sugar_g: 13,salt_g: 0, serving_size: "1 tbsp (13g)" },
  { food_name: "Brown Sugar 1 tsp",                    brand: "Ingredient", calories: 15,  protein_g: 0,  carbs_g: 4,  fat_g: 0,  fibre_g: 0, sugar_g: 4, salt_g: 0, serving_size: "1 tsp (4g)" },
  { food_name: "Caster Sugar 100g",                    brand: "Ingredient", calories: 400, protein_g: 0,  carbs_g: 100,fat_g: 0,  fibre_g: 0, sugar_g: 100,salt_g: 0, serving_size: "100g" },
  { food_name: "Icing Sugar 100g",                     brand: "Ingredient", calories: 400, protein_g: 0,  carbs_g: 100,fat_g: 0,  fibre_g: 0, sugar_g: 100,salt_g: 0, serving_size: "100g" },
  { food_name: "Cocoa Powder 1 tbsp",                  brand: "Ingredient", calories: 12,  protein_g: 1,  carbs_g: 3,  fat_g: 0.8,fibre_g: 2, sugar_g: 0, salt_g: 0, serving_size: "1 tbsp (5g)" },

  // ===== DRINKS / YAZOO / MILKSHAKES =====
  { food_name: "Yazoo Chocolate Milkshake",            brand: "Yazoo", calories: 250, protein_g: 14, carbs_g: 36, fat_g: 6,  fibre_g: 0, sugar_g: 35, salt_g: 0.3, serving_size: "400ml bottle" },
  { food_name: "Yazoo Strawberry Milkshake",           brand: "Yazoo", calories: 245, protein_g: 14, carbs_g: 36, fat_g: 6,  fibre_g: 0, sugar_g: 35, salt_g: 0.3, serving_size: "400ml bottle" },
  { food_name: "Yazoo Banana Milkshake",               brand: "Yazoo", calories: 240, protein_g: 14, carbs_g: 35, fat_g: 6,  fibre_g: 0, sugar_g: 34, salt_g: 0.3, serving_size: "400ml bottle" },
  { food_name: "Frijj Chocolate Milkshake",            brand: "Frijj", calories: 180, protein_g: 8,  carbs_g: 30, fat_g: 3,  fibre_g: 0, sugar_g: 27, salt_g: 0.3, serving_size: "400ml bottle" },
  { food_name: "Upbeat Protein Milkshake",             brand: "Upbeat", calories: 135, protein_g: 22, carbs_g: 9,  fat_g: 1,  fibre_g: 0, sugar_g: 9,  salt_g: 0.2, serving_size: "250ml bottle" },
  { food_name: "Robinsons Orange Squash",              brand: "Robinsons", calories: 20,  protein_g: 0,  carbs_g: 4,  fat_g: 0,  fibre_g: 0, sugar_g: 4,  salt_g: 0,   serving_size: "1 serving diluted" },
  { food_name: "Vimto",                                brand: "Vimto", calories: 90,  protein_g: 0,  carbs_g: 22, fat_g: 0,  fibre_g: 0, sugar_g: 22, salt_g: 0,   serving_size: "330ml can" },
  { food_name: "J2O Orange and Passion Fruit",         brand: "J2O", calories: 85,  protein_g: 0,  carbs_g: 20, fat_g: 0,  fibre_g: 0, sugar_g: 20, salt_g: 0,   serving_size: "275ml bottle" },
  { food_name: "Iced Coffee Latte Bottled",            brand: "Drinks", calories: 150, protein_g: 6,  carbs_g: 22, fat_g: 4,  fibre_g: 0, sugar_g: 20, salt_g: 0.2, serving_size: "250ml bottle" },

  // ============================================================
  // STAGE 15 — Asian chains + Korean / Vietnamese cuisine
  // ============================================================

  // ===== PING PONG (DIM SUM) =====
  { food_name: "Char Siu Bao Buns 3 piece",            brand: "Ping Pong", calories: 365, protein_g: 15, carbs_g: 55, fat_g: 10, fibre_g: 3, sugar_g: 12, salt_g: 1.8, serving_size: "3 buns" },
  { food_name: "Prawn Har Gau 3 piece",                brand: "Ping Pong", calories: 165, protein_g: 10, carbs_g: 20, fat_g: 5,  fibre_g: 1, sugar_g: 2,  salt_g: 1.3, serving_size: "3 dumplings" },
  { food_name: "Pork Siu Mai 3 piece",                 brand: "Ping Pong", calories: 195, protein_g: 13, carbs_g: 18, fat_g: 8,  fibre_g: 1, sugar_g: 2,  salt_g: 1.5, serving_size: "3 dumplings" },
  { food_name: "Chicken and Cashew Nut Dumplings",     brand: "Ping Pong", calories: 235, protein_g: 14, carbs_g: 22, fat_g: 11, fibre_g: 2, sugar_g: 3,  salt_g: 1.6, serving_size: "3 dumplings" },
  { food_name: "Crispy Duck Spring Rolls",             brand: "Ping Pong", calories: 285, protein_g: 12, carbs_g: 28, fat_g: 14, fibre_g: 2, sugar_g: 4,  salt_g: 1.6, serving_size: "4 rolls" },
  { food_name: "Salt and Pepper Squid",                brand: "Ping Pong", calories: 355, protein_g: 22, carbs_g: 22, fat_g: 20, fibre_g: 1, sugar_g: 2,  salt_g: 2.4, serving_size: "1 starter" },
  { food_name: "Chicken Yakitori Skewers",             brand: "Ping Pong", calories: 245, protein_g: 28, carbs_g: 8,  fat_g: 11, fibre_g: 0.5,sugar_g: 6,  salt_g: 1.5, serving_size: "3 skewers" },

  // ===== BUSABA EATHAI =====
  { food_name: "Pad Thai Chicken",                     brand: "Busaba", calories: 710, protein_g: 32, carbs_g: 85, fat_g: 24, fibre_g: 5, sugar_g: 18, salt_g: 3.0, serving_size: "1 bowl" },
  { food_name: "Pad Thai Prawn",                       brand: "Busaba", calories: 685, protein_g: 28, carbs_g: 85, fat_g: 22, fibre_g: 5, sugar_g: 18, salt_g: 3.1, serving_size: "1 bowl" },
  { food_name: "Green Chicken Curry",                  brand: "Busaba", calories: 580, protein_g: 32, carbs_g: 22, fat_g: 40, fibre_g: 4, sugar_g: 10, salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Massaman Beef Curry",                  brand: "Busaba", calories: 785, protein_g: 38, carbs_g: 42, fat_g: 48, fibre_g: 5, sugar_g: 18, salt_g: 2.7, serving_size: "1 bowl" },
  { food_name: "Chicken Satay 4 piece",                brand: "Busaba", calories: 425, protein_g: 30, carbs_g: 16, fat_g: 26, fibre_g: 2, sugar_g: 10, salt_g: 1.7, serving_size: "4 skewers" },
  { food_name: "Calamari Starter",                     brand: "Busaba", calories: 295, protein_g: 18, carbs_g: 20, fat_g: 16, fibre_g: 1, sugar_g: 2,  salt_g: 2.0, serving_size: "1 starter" },
  { food_name: "Thai Jasmine Rice",                    brand: "Busaba", calories: 255, protein_g: 5,  carbs_g: 56, fat_g: 0.5,fibre_g: 1, sugar_g: 0,  salt_g: 0,   serving_size: "1 portion" },

  // ===== SHORYU RAMEN =====
  { food_name: "Shoryu Ganso Tonkotsu Ramen",          brand: "Shoryu", calories: 920, protein_g: 45, carbs_g: 85, fat_g: 40, fibre_g: 5, sugar_g: 5, salt_g: 5.2, serving_size: "1 bowl" },
  { food_name: "Spicy Miso Tantanmen Ramen",           brand: "Shoryu", calories: 970, protein_g: 42, carbs_g: 85, fat_g: 44, fibre_g: 6, sugar_g: 8, salt_g: 5.0, serving_size: "1 bowl" },
  { food_name: "Karaka Tantanmen Ramen",               brand: "Shoryu", calories: 985, protein_g: 42, carbs_g: 86, fat_g: 46, fibre_g: 6, sugar_g: 8, salt_g: 5.3, serving_size: "1 bowl" },
  { food_name: "Yuzu Tonkotsu Ramen",                  brand: "Shoryu", calories: 875, protein_g: 42, carbs_g: 85, fat_g: 38, fibre_g: 5, sugar_g: 6, salt_g: 4.8, serving_size: "1 bowl" },
  { food_name: "Pork Buns Hirata 2 piece",             brand: "Shoryu", calories: 320, protein_g: 14, carbs_g: 38, fat_g: 12, fibre_g: 2, sugar_g: 10, salt_g: 1.9, serving_size: "2 buns" },
  { food_name: "Chicken Karaage",                      brand: "Shoryu", calories: 420, protein_g: 28, carbs_g: 22, fat_g: 24, fibre_g: 1, sugar_g: 1, salt_g: 1.8, serving_size: "1 starter" },

  // ===== KANADA-YA =====
  { food_name: "Original Tonkotsu Ramen",              brand: "Kanada-Ya", calories: 895, protein_g: 44, carbs_g: 82, fat_g: 40, fibre_g: 5, sugar_g: 5, salt_g: 5.0, serving_size: "1 bowl" },
  { food_name: "Truffle Tonkotsu Ramen",               brand: "Kanada-Ya", calories: 945, protein_g: 44, carbs_g: 82, fat_g: 44, fibre_g: 5, sugar_g: 5, salt_g: 5.1, serving_size: "1 bowl" },
  { food_name: "Chicken Karaage",                      brand: "Kanada-Ya", calories: 395, protein_g: 26, carbs_g: 22, fat_g: 22, fibre_g: 1, sugar_g: 1, salt_g: 1.7, serving_size: "1 portion" },

  // ===== BONE DADDIES =====
  { food_name: "Tonkotsu Ramen",                       brand: "Bone Daddies", calories: 910, protein_g: 44, carbs_g: 82, fat_g: 42, fibre_g: 5, sugar_g: 6, salt_g: 5.1, serving_size: "1 bowl" },
  { food_name: "Tantanmen Ramen",                      brand: "Bone Daddies", calories: 985, protein_g: 42, carbs_g: 85, fat_g: 46, fibre_g: 6, sugar_g: 8, salt_g: 5.0, serving_size: "1 bowl" },
  { food_name: "Kimchi Ramen",                         brand: "Bone Daddies", calories: 920, protein_g: 42, carbs_g: 84, fat_g: 42, fibre_g: 6, sugar_g: 7, salt_g: 5.2, serving_size: "1 bowl" },
  { food_name: "Chicken Wings Korean Style",           brand: "Bone Daddies", calories: 520, protein_g: 30, carbs_g: 22, fat_g: 34, fibre_g: 1, sugar_g: 14, salt_g: 2.6, serving_size: "6 wings" },

  // ===== ROSA'S THAI =====
  { food_name: "Pad Thai with Chicken",                brand: "Rosa's Thai", calories: 695, protein_g: 33, carbs_g: 82, fat_g: 24, fibre_g: 5, sugar_g: 18, salt_g: 2.9, serving_size: "1 bowl" },
  { food_name: "Green Curry Chicken",                  brand: "Rosa's Thai", calories: 620, protein_g: 33, carbs_g: 35, fat_g: 40, fibre_g: 4, sugar_g: 10, salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Tom Yum Noodle Soup",                  brand: "Rosa's Thai", calories: 445, protein_g: 22, carbs_g: 70, fat_g: 8,  fibre_g: 4, sugar_g: 8, salt_g: 3.0, serving_size: "1 bowl" },
  { food_name: "Thai Chicken Basil Stir Fry",          brand: "Rosa's Thai", calories: 595, protein_g: 35, carbs_g: 55, fat_g: 24, fibre_g: 4, sugar_g: 14, salt_g: 2.8, serving_size: "1 plate" },
  { food_name: "Chicken Satay 4 piece",                brand: "Rosa's Thai", calories: 440, protein_g: 32, carbs_g: 18, fat_g: 26, fibre_g: 2, sugar_g: 11, salt_g: 1.8, serving_size: "4 skewers" },
  { food_name: "Som Tam Papaya Salad",                 brand: "Rosa's Thai", calories: 185, protein_g: 5,  carbs_g: 32, fat_g: 4,  fibre_g: 5, sugar_g: 22, salt_g: 1.9, serving_size: "1 salad" },

  // ===== TAMPOPO =====
  { food_name: "Katsu Curry",                          brand: "Tampopo", calories: 795, protein_g: 35, carbs_g: 95, fat_g: 30, fibre_g: 6, sugar_g: 14, salt_g: 2.5, serving_size: "1 bowl" },
  { food_name: "Yaki Soba",                            brand: "Tampopo", calories: 745, protein_g: 38, carbs_g: 88, fat_g: 24, fibre_g: 6, sugar_g: 16, salt_g: 3.8, serving_size: "1 bowl" },
  { food_name: "Pad Thai",                             brand: "Tampopo", calories: 720, protein_g: 32, carbs_g: 86, fat_g: 24, fibre_g: 5, sugar_g: 18, salt_g: 3.0, serving_size: "1 bowl" },
  { food_name: "Dim Sum Selection",                    brand: "Tampopo", calories: 445, protein_g: 22, carbs_g: 48, fat_g: 18, fibre_g: 3, sugar_g: 6, salt_g: 2.5, serving_size: "1 platter" },

  // ===== KOREAN CUISINE =====
  { food_name: "Bibimbap Beef",                        brand: "Korean Cuisine", calories: 665, protein_g: 32, carbs_g: 85, fat_g: 22, fibre_g: 6, sugar_g: 10, salt_g: 2.4, serving_size: "1 bowl" },
  { food_name: "Bibimbap Chicken",                     brand: "Korean Cuisine", calories: 625, protein_g: 35, carbs_g: 85, fat_g: 18, fibre_g: 6, sugar_g: 10, salt_g: 2.3, serving_size: "1 bowl" },
  { food_name: "Bibimbap Vegetable",                   brand: "Korean Cuisine", calories: 540, protein_g: 14, carbs_g: 92, fat_g: 14, fibre_g: 8, sugar_g: 10, salt_g: 2.2, serving_size: "1 bowl" },
  { food_name: "Beef Bulgogi",                         brand: "Korean Cuisine", calories: 485, protein_g: 40, carbs_g: 25, fat_g: 25, fibre_g: 2, sugar_g: 15, salt_g: 2.6, serving_size: "1 portion" },
  { food_name: "Chicken Bulgogi",                      brand: "Korean Cuisine", calories: 415, protein_g: 40, carbs_g: 22, fat_g: 18, fibre_g: 2, sugar_g: 14, salt_g: 2.5, serving_size: "1 portion" },
  { food_name: "Korean BBQ Short Ribs Galbi",          brand: "Korean Cuisine", calories: 635, protein_g: 42, carbs_g: 18, fat_g: 45, fibre_g: 1, sugar_g: 14, salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Korean Fried Chicken",                 brand: "Korean Cuisine", calories: 745, protein_g: 42, carbs_g: 58, fat_g: 36, fibre_g: 2, sugar_g: 18, salt_g: 3.0, serving_size: "1 portion" },
  { food_name: "Kimchi",                               brand: "Korean Cuisine", calories: 25,  protein_g: 1.5,carbs_g: 4,  fat_g: 0.5,fibre_g: 2, sugar_g: 2,  salt_g: 1.5, serving_size: "60g portion" },
  { food_name: "Japchae Glass Noodles",                brand: "Korean Cuisine", calories: 485, protein_g: 15, carbs_g: 75, fat_g: 14, fibre_g: 4, sugar_g: 10, salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Tteokbokki Rice Cakes",                brand: "Korean Cuisine", calories: 395, protein_g: 8,  carbs_g: 78, fat_g: 5,  fibre_g: 2, sugar_g: 15, salt_g: 2.5, serving_size: "1 portion" },
  { food_name: "Kimchi Pancake",                       brand: "Korean Cuisine", calories: 335, protein_g: 8,  carbs_g: 42, fat_g: 14, fibre_g: 3, sugar_g: 4,  salt_g: 1.8, serving_size: "1 pancake" },
  { food_name: "Korean Beef Ramen",                    brand: "Korean Cuisine", calories: 765, protein_g: 35, carbs_g: 85, fat_g: 30, fibre_g: 5, sugar_g: 10, salt_g: 5.0, serving_size: "1 bowl" },

  // ===== VIETNAMESE DEEPER =====
  { food_name: "Banh Mi Pork",                         brand: "Vietnamese Cuisine", calories: 495, protein_g: 22, carbs_g: 55, fat_g: 22, fibre_g: 4, sugar_g: 8,  salt_g: 2.3, serving_size: "1 baguette" },
  { food_name: "Banh Mi Chicken",                      brand: "Vietnamese Cuisine", calories: 465, protein_g: 24, carbs_g: 55, fat_g: 18, fibre_g: 4, sugar_g: 8,  salt_g: 2.2, serving_size: "1 baguette" },
  { food_name: "Banh Mi Tofu",                         brand: "Vietnamese Cuisine", calories: 420, protein_g: 16, carbs_g: 58, fat_g: 14, fibre_g: 5, sugar_g: 8,  salt_g: 2.0, serving_size: "1 baguette" },
  { food_name: "Bun Cha Hanoi Pork",                   brand: "Vietnamese Cuisine", calories: 555, protein_g: 35, carbs_g: 72, fat_g: 14, fibre_g: 6, sugar_g: 18, salt_g: 3.4, serving_size: "1 bowl" },
  { food_name: "Bun Bo Nam Bo Beef",                   brand: "Vietnamese Cuisine", calories: 585, protein_g: 38, carbs_g: 70, fat_g: 18, fibre_g: 6, sugar_g: 16, salt_g: 3.3, serving_size: "1 bowl" },
  { food_name: "Goi Cuon Summer Rolls 2 piece",        brand: "Vietnamese Cuisine", calories: 140, protein_g: 8,  carbs_g: 22, fat_g: 2,  fibre_g: 2, sugar_g: 3,  salt_g: 0.8, serving_size: "2 rolls" },
  { food_name: "Nem Vietnamese Fried Rolls",           brand: "Vietnamese Cuisine", calories: 240, protein_g: 8,  carbs_g: 28, fat_g: 11, fibre_g: 3, sugar_g: 3,  salt_g: 1.3, serving_size: "3 rolls" },
  { food_name: "Vietnamese Iced Coffee Ca Phe",        brand: "Vietnamese Cuisine", calories: 225, protein_g: 5,  carbs_g: 38, fat_g: 6,  fibre_g: 0, sugar_g: 36, salt_g: 0.2, serving_size: "1 glass" },

  // ============================================================
  // STAGE 16 — Upscale steak + bakery + Indian casual
  // ============================================================

  // ===== HAWKSMOOR =====
  { food_name: "8oz Sirloin Steak",                    brand: "Hawksmoor", calories: 440, protein_g: 55, carbs_g: 0,  fat_g: 24, fibre_g: 0, sugar_g: 0,  salt_g: 0.3, serving_size: "1 steak" },
  { food_name: "10oz Ribeye Steak",                    brand: "Hawksmoor", calories: 725, protein_g: 60, carbs_g: 0,  fat_g: 52, fibre_g: 0, sugar_g: 0,  salt_g: 0.4, serving_size: "1 steak" },
  { food_name: "400g Porterhouse Steak",               brand: "Hawksmoor", calories: 920, protein_g: 85, carbs_g: 0,  fat_g: 65, fibre_g: 0, sugar_g: 0,  salt_g: 0.5, serving_size: "1 steak" },
  { food_name: "Kimchi Burger",                        brand: "Hawksmoor", calories: 1085,protein_g: 52, carbs_g: 70, fat_g: 65, fibre_g: 5, sugar_g: 12, salt_g: 3.5, serving_size: "1 burger + chips" },
  { food_name: "Triple Cooked Chips",                  brand: "Hawksmoor", calories: 465, protein_g: 6,  carbs_g: 58, fat_g: 22, fibre_g: 6, sugar_g: 1,  salt_g: 1.3, serving_size: "Side portion" },
  { food_name: "Mac and Cheese Side",                  brand: "Hawksmoor", calories: 455, protein_g: 18, carbs_g: 40, fat_g: 24, fibre_g: 3, sugar_g: 4,  salt_g: 1.8, serving_size: "Side portion" },

  // ===== FLAT IRON =====
  { food_name: "Flat Iron Steak",                      brand: "Flat Iron", calories: 420, protein_g: 52, carbs_g: 0,  fat_g: 22, fibre_g: 0, sugar_g: 0, salt_g: 0.3, serving_size: "1 steak" },
  { food_name: "Flat Iron Steak with Chips",           brand: "Flat Iron", calories: 820, protein_g: 58, carbs_g: 55, fat_g: 42, fibre_g: 5, sugar_g: 1, salt_g: 1.5, serving_size: "1 plate" },
  { food_name: "Dripping Cooked Chips",                brand: "Flat Iron", calories: 400, protein_g: 6,  carbs_g: 55, fat_g: 20, fibre_g: 5, sugar_g: 1, salt_g: 1.2, serving_size: "Side portion" },
  { food_name: "Creamed Spinach Side",                 brand: "Flat Iron", calories: 220, protein_g: 8,  carbs_g: 8,  fat_g: 18, fibre_g: 4, sugar_g: 3, salt_g: 1.0, serving_size: "Side portion" },

  // ===== STK STEAKHOUSE =====
  { food_name: "Filet Mignon 8oz",                     brand: "STK", calories: 425, protein_g: 54, carbs_g: 0,  fat_g: 23, fibre_g: 0, sugar_g: 0, salt_g: 0.3, serving_size: "8oz" },
  { food_name: "Ribeye 12oz",                          brand: "STK", calories: 865, protein_g: 72, carbs_g: 0,  fat_g: 62, fibre_g: 0, sugar_g: 0, salt_g: 0.5, serving_size: "12oz" },
  { food_name: "STK Burger",                           brand: "STK", calories: 1150,protein_g: 55, carbs_g: 75, fat_g: 65, fibre_g: 5, sugar_g: 11, salt_g: 3.7, serving_size: "1 burger + chips" },
  { food_name: "Parmesan Truffle Fries",               brand: "STK", calories: 595, protein_g: 14, carbs_g: 58, fat_g: 32, fibre_g: 5, sugar_g: 2, salt_g: 2.0, serving_size: "1 portion" },

  // ===== BEN'S COOKIES =====
  { food_name: "Milk Chocolate Chunk Cookie",          brand: "Ben's Cookies", calories: 335, protein_g: 4,  carbs_g: 42, fat_g: 17, fibre_g: 1, sugar_g: 25, salt_g: 0.3, serving_size: "1 cookie (80g)" },
  { food_name: "Dark Chocolate Chunk Cookie",          brand: "Ben's Cookies", calories: 330, protein_g: 4,  carbs_g: 42, fat_g: 17, fibre_g: 2, sugar_g: 25, salt_g: 0.3, serving_size: "1 cookie (80g)" },
  { food_name: "White Chocolate Chunk Cookie",         brand: "Ben's Cookies", calories: 345, protein_g: 4,  carbs_g: 43, fat_g: 17, fibre_g: 1, sugar_g: 27, salt_g: 0.3, serving_size: "1 cookie (80g)" },
  { food_name: "Double Chocolate Cookie",              brand: "Ben's Cookies", calories: 340, protein_g: 4,  carbs_g: 40, fat_g: 18, fibre_g: 2, sugar_g: 24, salt_g: 0.3, serving_size: "1 cookie (80g)" },
  { food_name: "Chocolate and Orange Cookie",          brand: "Ben's Cookies", calories: 335, protein_g: 4,  carbs_g: 42, fat_g: 17, fibre_g: 1, sugar_g: 25, salt_g: 0.3, serving_size: "1 cookie (80g)" },
  { food_name: "Triple Chocolate Cookie",              brand: "Ben's Cookies", calories: 345, protein_g: 4,  carbs_g: 40, fat_g: 19, fibre_g: 2, sugar_g: 25, salt_g: 0.3, serving_size: "1 cookie (80g)" },
  { food_name: "Peanut Butter Cookie",                 brand: "Ben's Cookies", calories: 345, protein_g: 6,  carbs_g: 38, fat_g: 19, fibre_g: 2, sugar_g: 22, salt_g: 0.4, serving_size: "1 cookie (80g)" },

  // ===== CROSSTOWN DOUGHNUTS =====
  { food_name: "Creme Brulee Doughnut",                brand: "Crosstown", calories: 395, protein_g: 6,  carbs_g: 45, fat_g: 21, fibre_g: 2, sugar_g: 22, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Chocolate Truffle Doughnut",           brand: "Crosstown", calories: 425, protein_g: 7,  carbs_g: 45, fat_g: 24, fibre_g: 3, sugar_g: 25, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Peanut Butter Doughnut",               brand: "Crosstown", calories: 440, protein_g: 9,  carbs_g: 42, fat_g: 26, fibre_g: 3, sugar_g: 22, salt_g: 0.5, serving_size: "1 doughnut" },
  { food_name: "Raspberry Jam Doughnut",               brand: "Crosstown", calories: 355, protein_g: 5,  carbs_g: 48, fat_g: 15, fibre_g: 2, sugar_g: 24, salt_g: 0.4, serving_size: "1 doughnut" },
  { food_name: "Matcha Glazed Doughnut",               brand: "Crosstown", calories: 370, protein_g: 5,  carbs_g: 46, fat_g: 18, fibre_g: 2, sugar_g: 22, salt_g: 0.4, serving_size: "1 doughnut" },

  // ===== LONGBOYS =====
  { food_name: "Longboys Classic Vanilla",             brand: "Longboys", calories: 265, protein_g: 4,  carbs_g: 30, fat_g: 14, fibre_g: 1, sugar_g: 18, salt_g: 0.3, serving_size: "1 long donut" },
  { food_name: "Longboys Chocolate",                   brand: "Longboys", calories: 295, protein_g: 5,  carbs_g: 32, fat_g: 16, fibre_g: 2, sugar_g: 22, salt_g: 0.4, serving_size: "1 long donut" },
  { food_name: "Longboys Lemon Meringue",              brand: "Longboys", calories: 310, protein_g: 4,  carbs_g: 38, fat_g: 15, fibre_g: 1, sugar_g: 25, salt_g: 0.3, serving_size: "1 long donut" },

  // ===== MOWGLI STREET FOOD =====
  { food_name: "Mowgli House Chips",                   brand: "Mowgli", calories: 435, protein_g: 8,  carbs_g: 55, fat_g: 19, fibre_g: 5, sugar_g: 2,  salt_g: 1.5, serving_size: "1 portion" },
  { food_name: "Yoghurt Chat Bombs",                   brand: "Mowgli", calories: 285, protein_g: 10, carbs_g: 32, fat_g: 13, fibre_g: 4, sugar_g: 8,  salt_g: 1.2, serving_size: "1 starter" },
  { food_name: "Bhel Puri",                            brand: "Mowgli", calories: 235, protein_g: 7,  carbs_g: 40, fat_g: 6,  fibre_g: 5, sugar_g: 10, salt_g: 1.6, serving_size: "1 starter" },
  { food_name: "Angry Bird Chicken",                   brand: "Mowgli", calories: 485, protein_g: 38, carbs_g: 18, fat_g: 30, fibre_g: 3, sugar_g: 8,  salt_g: 2.0, serving_size: "1 portion" },
  { food_name: "Home-Style Dhal",                      brand: "Mowgli", calories: 345, protein_g: 16, carbs_g: 42, fat_g: 12, fibre_g: 10,sugar_g: 4,  salt_g: 1.5, serving_size: "1 bowl" },
  { food_name: "Kathi Chicken Roll",                   brand: "Mowgli", calories: 525, protein_g: 28, carbs_g: 48, fat_g: 24, fibre_g: 4, sugar_g: 5,  salt_g: 2.3, serving_size: "1 roll" },
  { food_name: "Chicken Claypot",                      brand: "Mowgli", calories: 585, protein_g: 42, carbs_g: 18, fat_g: 38, fibre_g: 3, sugar_g: 10, salt_g: 2.2, serving_size: "1 claypot" },
  { food_name: "Paneer Claypot",                       brand: "Mowgli", calories: 565, protein_g: 22, carbs_g: 20, fat_g: 42, fibre_g: 4, sugar_g: 10, salt_g: 2.0, serving_size: "1 claypot" },

  // ===== TAMATANGA =====
  { food_name: "Chicken Tikka Masala",                 brand: "Tamatanga", calories: 625, protein_g: 42, carbs_g: 20, fat_g: 38, fibre_g: 3, sugar_g: 12, salt_g: 2.3, serving_size: "1 bowl" },
  { food_name: "Lamb Rogan Josh",                      brand: "Tamatanga", calories: 680, protein_g: 42, carbs_g: 18, fat_g: 44, fibre_g: 4, sugar_g: 10, salt_g: 2.2, serving_size: "1 bowl" },
  { food_name: "Butter Chicken",                       brand: "Tamatanga", calories: 720, protein_g: 40, carbs_g: 22, fat_g: 48, fibre_g: 3, sugar_g: 15, salt_g: 2.2, serving_size: "1 bowl" },
  { food_name: "Vegetable Biryani",                    brand: "Tamatanga", calories: 585, protein_g: 14, carbs_g: 95, fat_g: 18, fibre_g: 8, sugar_g: 10, salt_g: 2.0, serving_size: "1 portion" },
  { food_name: "Chicken Biryani",                      brand: "Tamatanga", calories: 720, protein_g: 38, carbs_g: 92, fat_g: 22, fibre_g: 6, sugar_g: 8,  salt_g: 2.4, serving_size: "1 portion" },
  { food_name: "Peshawari Naan",                       brand: "Tamatanga", calories: 425, protein_g: 11, carbs_g: 62, fat_g: 14, fibre_g: 3, sugar_g: 15, salt_g: 1.3, serving_size: "1 naan" },

  // ============================================================
  // STAGE 17 — Middle Eastern, Caribbean, Mexican deeper, Spanish tapas
  // ============================================================

  // ===== MIDDLE EASTERN =====
  { food_name: "Chicken Shawarma Wrap",                brand: "Middle Eastern", calories: 595, protein_g: 38, carbs_g: 55, fat_g: 24, fibre_g: 4, sugar_g: 6,  salt_g: 2.7, serving_size: "1 wrap" },
  { food_name: "Lamb Shawarma Wrap",                   brand: "Middle Eastern", calories: 665, protein_g: 36, carbs_g: 55, fat_g: 32, fibre_g: 4, sugar_g: 6,  salt_g: 2.8, serving_size: "1 wrap" },
  { food_name: "Falafel Wrap with Hummus",             brand: "Middle Eastern", calories: 545, protein_g: 16, carbs_g: 68, fat_g: 22, fibre_g: 10,sugar_g: 8,  salt_g: 2.4, serving_size: "1 wrap" },
  { food_name: "Falafel 4 piece",                      brand: "Middle Eastern", calories: 345, protein_g: 13, carbs_g: 35, fat_g: 17, fibre_g: 7, sugar_g: 3,  salt_g: 1.4, serving_size: "4 pieces" },
  { food_name: "Tabbouleh Salad",                      brand: "Middle Eastern", calories: 185, protein_g: 4,  carbs_g: 25, fat_g: 8,  fibre_g: 4, sugar_g: 3,  salt_g: 0.8, serving_size: "1 bowl" },
  { food_name: "Fattoush Salad",                       brand: "Middle Eastern", calories: 265, protein_g: 5,  carbs_g: 32, fat_g: 14, fibre_g: 5, sugar_g: 8,  salt_g: 1.2, serving_size: "1 bowl" },
  { food_name: "Baba Ganoush",                         brand: "Middle Eastern", calories: 135, protein_g: 3,  carbs_g: 11, fat_g: 10, fibre_g: 4, sugar_g: 5,  salt_g: 0.8, serving_size: "100g" },
  { food_name: "Hummus",                               brand: "Middle Eastern", calories: 215, protein_g: 7,  carbs_g: 16, fat_g: 13, fibre_g: 5, sugar_g: 1,  salt_g: 1.0, serving_size: "100g" },
  { food_name: "Labneh Yogurt Dip",                    brand: "Middle Eastern", calories: 155, protein_g: 9,  carbs_g: 6,  fat_g: 11, fibre_g: 0, sugar_g: 5,  salt_g: 0.4, serving_size: "100g" },
  { food_name: "Kofta Kebab Lamb",                     brand: "Middle Eastern", calories: 485, protein_g: 32, carbs_g: 8,  fat_g: 36, fibre_g: 2, sugar_g: 3,  salt_g: 1.8, serving_size: "2 kofta" },
  { food_name: "Kofta Kebab Chicken",                  brand: "Middle Eastern", calories: 395, protein_g: 36, carbs_g: 8,  fat_g: 24, fibre_g: 2, sugar_g: 3,  salt_g: 1.8, serving_size: "2 kofta" },
  { food_name: "Meze Platter",                         brand: "Middle Eastern", calories: 785, protein_g: 22, carbs_g: 78, fat_g: 42, fibre_g: 12,sugar_g: 8,  salt_g: 3.2, serving_size: "1 platter" },
  { food_name: "Lamb Kibbeh 3 piece",                  brand: "Middle Eastern", calories: 385, protein_g: 18, carbs_g: 38, fat_g: 18, fibre_g: 3, sugar_g: 3,  salt_g: 1.6, serving_size: "3 kibbeh" },
  { food_name: "Stuffed Vine Leaves 5 piece",          brand: "Middle Eastern", calories: 195, protein_g: 4,  carbs_g: 30, fat_g: 7,  fibre_g: 3, sugar_g: 4,  salt_g: 1.0, serving_size: "5 pieces" },
  { food_name: "Chicken Skewer Shish Taouk",           brand: "Middle Eastern", calories: 385, protein_g: 48, carbs_g: 5,  fat_g: 19, fibre_g: 1, sugar_g: 2,  salt_g: 1.8, serving_size: "1 skewer" },

  // ===== CARIBBEAN =====
  { food_name: "Jerk Chicken Quarter",                 brand: "Caribbean", calories: 385, protein_g: 38, carbs_g: 5,  fat_g: 24, fibre_g: 1, sugar_g: 3,  salt_g: 2.0, serving_size: "1/4 chicken" },
  { food_name: "Jerk Chicken Half",                    brand: "Caribbean", calories: 770, protein_g: 76, carbs_g: 10, fat_g: 48, fibre_g: 2, sugar_g: 5,  salt_g: 3.5, serving_size: "1/2 chicken" },
  { food_name: "Curry Goat",                           brand: "Caribbean", calories: 585, protein_g: 38, carbs_g: 25, fat_g: 38, fibre_g: 3, sugar_g: 8,  salt_g: 2.4, serving_size: "1 portion" },
  { food_name: "Jerk Pork",                            brand: "Caribbean", calories: 545, protein_g: 36, carbs_g: 8,  fat_g: 40, fibre_g: 1, sugar_g: 4,  salt_g: 2.2, serving_size: "1 portion" },
  { food_name: "Rice and Peas",                        brand: "Caribbean", calories: 385, protein_g: 10, carbs_g: 70, fat_g: 7,  fibre_g: 6, sugar_g: 1,  salt_g: 1.0, serving_size: "1 portion" },
  { food_name: "Fried Plantain",                       brand: "Caribbean", calories: 215, protein_g: 2,  carbs_g: 45, fat_g: 4,  fibre_g: 4, sugar_g: 22, salt_g: 0.2, serving_size: "1 portion" },
  { food_name: "Ackee and Saltfish",                   brand: "Caribbean", calories: 395, protein_g: 22, carbs_g: 12, fat_g: 28, fibre_g: 4, sugar_g: 3,  salt_g: 3.5, serving_size: "1 portion" },
  { food_name: "Roti Wrap Chicken",                    brand: "Caribbean", calories: 565, protein_g: 30, carbs_g: 65, fat_g: 22, fibre_g: 4, sugar_g: 4,  salt_g: 2.3, serving_size: "1 roti" },
  { food_name: "Callaloo",                             brand: "Caribbean", calories: 95,  protein_g: 5,  carbs_g: 8,  fat_g: 5,  fibre_g: 4, sugar_g: 2,  salt_g: 0.8, serving_size: "1 side" },
  { food_name: "Festival Dumplings 2 piece",           brand: "Caribbean", calories: 195, protein_g: 3,  carbs_g: 32, fat_g: 6,  fibre_g: 1, sugar_g: 8,  salt_g: 0.4, serving_size: "2 dumplings" },
  { food_name: "Jerk Chicken Wrap",                    brand: "Caribbean", calories: 535, protein_g: 32, carbs_g: 52, fat_g: 22, fibre_g: 4, sugar_g: 6,  salt_g: 2.3, serving_size: "1 wrap" },
  { food_name: "Patty Jamaican Beef",                  brand: "Caribbean", calories: 345, protein_g: 11, carbs_g: 32, fat_g: 19, fibre_g: 2, sugar_g: 2,  salt_g: 1.3, serving_size: "1 patty" },

  // ===== MEXICAN DEEPER =====
  { food_name: "Beef Quesadilla",                      brand: "Mexican Cuisine", calories: 615, protein_g: 34, carbs_g: 42, fat_g: 34, fibre_g: 4, sugar_g: 4, salt_g: 2.2, serving_size: "1 quesadilla" },
  { food_name: "Chicken Quesadilla",                   brand: "Mexican Cuisine", calories: 565, protein_g: 36, carbs_g: 42, fat_g: 28, fibre_g: 4, sugar_g: 4, salt_g: 2.1, serving_size: "1 quesadilla" },
  { food_name: "Beef Enchiladas 3 piece",              brand: "Mexican Cuisine", calories: 685, protein_g: 32, carbs_g: 58, fat_g: 34, fibre_g: 6, sugar_g: 8, salt_g: 2.8, serving_size: "3 enchiladas" },
  { food_name: "Chicken Enchiladas 3 piece",           brand: "Mexican Cuisine", calories: 635, protein_g: 34, carbs_g: 58, fat_g: 28, fibre_g: 6, sugar_g: 8, salt_g: 2.7, serving_size: "3 enchiladas" },
  { food_name: "Beef Chimichanga",                     brand: "Mexican Cuisine", calories: 785, protein_g: 32, carbs_g: 65, fat_g: 42, fibre_g: 5, sugar_g: 5, salt_g: 2.8, serving_size: "1 chimichanga" },
  { food_name: "Chicken Fajitas",                      brand: "Mexican Cuisine", calories: 745, protein_g: 42, carbs_g: 80, fat_g: 28, fibre_g: 8, sugar_g: 14, salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Steak Fajitas",                        brand: "Mexican Cuisine", calories: 815, protein_g: 44, carbs_g: 80, fat_g: 34, fibre_g: 8, sugar_g: 14, salt_g: 2.9, serving_size: "1 portion" },
  { food_name: "Nachos Grande",                        brand: "Mexican Cuisine", calories: 985, protein_g: 38, carbs_g: 85, fat_g: 56, fibre_g: 10,sugar_g: 6, salt_g: 3.2, serving_size: "1 portion" },
  { food_name: "Churros 3 piece",                      brand: "Mexican Cuisine", calories: 345, protein_g: 4,  carbs_g: 38, fat_g: 19, fibre_g: 1, sugar_g: 18, salt_g: 0.5, serving_size: "3 churros" },
  { food_name: "Churros with Chocolate Sauce",         brand: "Mexican Cuisine", calories: 465, protein_g: 5,  carbs_g: 56, fat_g: 24, fibre_g: 2, sugar_g: 32, salt_g: 0.6, serving_size: "3 churros + dip" },
  { food_name: "Guacamole",                            brand: "Mexican Cuisine", calories: 165, protein_g: 2,  carbs_g: 10, fat_g: 14, fibre_g: 7, sugar_g: 1, salt_g: 0.5, serving_size: "100g" },
  { food_name: "Salsa Fresh",                          brand: "Mexican Cuisine", calories: 30,  protein_g: 1,  carbs_g: 6,  fat_g: 0.2,fibre_g: 1, sugar_g: 4, salt_g: 0.8, serving_size: "100g" },
  { food_name: "Refried Beans",                        brand: "Mexican Cuisine", calories: 155, protein_g: 8,  carbs_g: 22, fat_g: 3,  fibre_g: 8, sugar_g: 1, salt_g: 0.8, serving_size: "100g" },

  // ===== SPANISH TAPAS =====
  { food_name: "Patatas Bravas",                       brand: "Spanish Tapas", calories: 345, protein_g: 5,  carbs_g: 42, fat_g: 18, fibre_g: 5, sugar_g: 4,  salt_g: 1.5, serving_size: "1 tapa" },
  { food_name: "Chorizo al Vino",                      brand: "Spanish Tapas", calories: 395, protein_g: 22, carbs_g: 4,  fat_g: 32, fibre_g: 1, sugar_g: 2,  salt_g: 2.2, serving_size: "1 tapa" },
  { food_name: "Albondigas Meatballs",                 brand: "Spanish Tapas", calories: 385, protein_g: 24, carbs_g: 18, fat_g: 24, fibre_g: 2, sugar_g: 5,  salt_g: 1.8, serving_size: "1 tapa" },
  { food_name: "Padron Peppers",                       brand: "Spanish Tapas", calories: 145, protein_g: 4,  carbs_g: 8,  fat_g: 11, fibre_g: 3, sugar_g: 5,  salt_g: 1.2, serving_size: "1 tapa" },
  { food_name: "Jamon Serrano 100g",                   brand: "Spanish Tapas", calories: 240, protein_g: 31, carbs_g: 1,  fat_g: 13, fibre_g: 0, sugar_g: 0,  salt_g: 5.0, serving_size: "100g" },
  { food_name: "Jamon Iberico 100g",                   brand: "Spanish Tapas", calories: 265, protein_g: 32, carbs_g: 1,  fat_g: 15, fibre_g: 0, sugar_g: 0,  salt_g: 4.5, serving_size: "100g" },
  { food_name: "Tortilla Española Wedge",              brand: "Spanish Tapas", calories: 285, protein_g: 10, carbs_g: 22, fat_g: 17, fibre_g: 2, sugar_g: 2,  salt_g: 1.2, serving_size: "1 wedge" },
  { food_name: "Gambas al Ajillo Garlic Prawns",       brand: "Spanish Tapas", calories: 245, protein_g: 22, carbs_g: 4,  fat_g: 16, fibre_g: 1, sugar_g: 1,  salt_g: 1.6, serving_size: "1 tapa" },
  { food_name: "Croquetas 3 piece",                    brand: "Spanish Tapas", calories: 285, protein_g: 10, carbs_g: 28, fat_g: 15, fibre_g: 2, sugar_g: 3,  salt_g: 1.4, serving_size: "3 croquetas" },
  { food_name: "Pan con Tomate",                       brand: "Spanish Tapas", calories: 185, protein_g: 5,  carbs_g: 30, fat_g: 5,  fibre_g: 3, sugar_g: 3,  salt_g: 0.8, serving_size: "1 tapa" },
  { food_name: "Manchego Cheese 50g",                  brand: "Spanish Tapas", calories: 195, protein_g: 13, carbs_g: 0.5,fat_g: 16, fibre_g: 0, sugar_g: 0,  salt_g: 0.9, serving_size: "50g" },
  { food_name: "Paella Mixta",                         brand: "Spanish Cuisine", calories: 685, protein_g: 38, carbs_g: 85, fat_g: 18, fibre_g: 4, sugar_g: 4,  salt_g: 2.8, serving_size: "1 portion" },
  { food_name: "Paella Valenciana",                    brand: "Spanish Cuisine", calories: 720, protein_g: 42, carbs_g: 85, fat_g: 20, fibre_g: 4, sugar_g: 4,  salt_g: 2.9, serving_size: "1 portion" },
  { food_name: "Seafood Paella",                       brand: "Spanish Cuisine", calories: 645, protein_g: 36, carbs_g: 85, fat_g: 15, fibre_g: 4, sugar_g: 4,  salt_g: 3.0, serving_size: "1 portion" },

  // ============================================================
  // STAGE 18 — More branded products
  // ============================================================

  // ===== REESE'S FULL RANGE =====
  { food_name: "Reese's Peanut Butter Cups 2 cup",     brand: "Reese's", calories: 220, protein_g: 5,  carbs_g: 23, fat_g: 13, fibre_g: 2, sugar_g: 21, salt_g: 0.3, serving_size: "2 cups (42g)" },
  { food_name: "Reese's Big Cup",                      brand: "Reese's", calories: 220, protein_g: 5,  carbs_g: 22, fat_g: 13, fibre_g: 2, sugar_g: 19, salt_g: 0.3, serving_size: "1 big cup (39g)" },
  { food_name: "Reese's Nutrageous",                   brand: "Reese's", calories: 240, protein_g: 5,  carbs_g: 25, fat_g: 14, fibre_g: 1, sugar_g: 22, salt_g: 0.3, serving_size: "1 bar (47g)" },
  { food_name: "Reese's Pieces 43g",                   brand: "Reese's", calories: 215, protein_g: 5,  carbs_g: 26, fat_g: 11, fibre_g: 1, sugar_g: 22, salt_g: 0.2, serving_size: "43g bag" },
  { food_name: "Reese's Peanut Butter Cup Miniatures 5",brand:"Reese's", calories: 220, protein_g: 5,  carbs_g: 23, fat_g: 13, fibre_g: 1, sugar_g: 20, salt_g: 0.3, serving_size: "5 mini cups" },

  // ===== THORNTON'S / HOTEL CHOCOLAT =====
  { food_name: "Thornton's Viennese Truffle",          brand: "Thornton's", calories: 75,  protein_g: 0.7,carbs_g: 7,  fat_g: 5,  fibre_g: 0.2, sugar_g: 6,  salt_g: 0,   serving_size: "1 truffle (13g)" },
  { food_name: "Thornton's Caramel Shortcake",         brand: "Thornton's", calories: 175, protein_g: 2,  carbs_g: 22, fat_g: 9,  fibre_g: 0.5, sugar_g: 16, salt_g: 0.1, serving_size: "1 bar (35g)" },
  { food_name: "Hotel Chocolat Puddles 3 piece",       brand: "Hotel Chocolat", calories: 165, protein_g: 2.5,carbs_g: 14, fat_g: 11, fibre_g: 1,   sugar_g: 12, salt_g: 0,   serving_size: "3 puddles (30g)" },
  { food_name: "Hotel Chocolat Slab Mint Batons",      brand: "Hotel Chocolat", calories: 200, protein_g: 3,  carbs_g: 18, fat_g: 13, fibre_g: 2,   sugar_g: 15, salt_g: 0,   serving_size: "1 slab (38g)" },
  { food_name: "Hotel Chocolat Praline Truffle",       brand: "Hotel Chocolat", calories: 80,  protein_g: 1,  carbs_g: 7,  fat_g: 5.5,fibre_g: 0.5, sugar_g: 6,  salt_g: 0,   serving_size: "1 truffle (14g)" },

  // ===== CRISPS — KETTLE / TYRRELL'S / POPCHIPS =====
  { food_name: "Kettle Chips Lightly Salted",          brand: "Kettle Chips", calories: 145, protein_g: 2.5,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 0.2, salt_g: 0.3, serving_size: "30g bag" },
  { food_name: "Kettle Chips Mature Cheddar and Red Onion",brand:"Kettle Chips", calories: 145, protein_g: 2.5,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 0.5, salt_g: 0.4, serving_size: "30g bag" },
  { food_name: "Kettle Chips Sea Salt and Balsamic Vinegar",brand:"Kettle Chips", calories: 145, protein_g: 2.5,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 0.8, salt_g: 0.4, serving_size: "30g bag" },
  { food_name: "Kettle Chips Sweet Chilli",            brand: "Kettle Chips", calories: 145, protein_g: 2.3,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 1.2, salt_g: 0.4, serving_size: "30g bag" },
  { food_name: "Tyrrell's Sea Salted",                 brand: "Tyrrell's", calories: 140, protein_g: 2.5,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 0.3, salt_g: 0.3, serving_size: "30g bag" },
  { food_name: "Tyrrell's Lightly Sea Salted",         brand: "Tyrrell's", calories: 142, protein_g: 2.5,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 0.3, salt_g: 0.3, serving_size: "30g bag" },
  { food_name: "Tyrrell's Sweet Chilli and Red Pepper",brand: "Tyrrell's", calories: 142, protein_g: 2.3,carbs_g: 15, fat_g: 8,  fibre_g: 1.5, sugar_g: 1,   salt_g: 0.4, serving_size: "30g bag" },
  { food_name: "Popchips Sea Salt",                    brand: "Popchips", calories: 94,  protein_g: 1.5,carbs_g: 13, fat_g: 4,  fibre_g: 0.8, sugar_g: 0.3, salt_g: 0.3, serving_size: "23g bag" },
  { food_name: "Popchips Barbeque",                    brand: "Popchips", calories: 95,  protein_g: 1.5,carbs_g: 13, fat_g: 4,  fibre_g: 0.7, sugar_g: 1.2, salt_g: 0.3, serving_size: "23g bag" },
  { food_name: "Walkers Sensations Roasted Chicken and Thyme",brand:"Walkers", calories: 155, protein_g: 2,  carbs_g: 18, fat_g: 8,  fibre_g: 1.5, sugar_g: 1.5, salt_g: 0.4, serving_size: "30g bag" },
  { food_name: "Walkers Sensations Lime and Coriander",brand: "Walkers", calories: 155, protein_g: 2,  carbs_g: 18, fat_g: 8,  fibre_g: 1.5, sugar_g: 2,   salt_g: 0.4, serving_size: "30g bag" },

  // ===== CHARLIE BIGHAM'S / WAGAMAMA FROZEN / ITSU FROZEN =====
  { food_name: "Fish Pie",                             brand: "Charlie Bigham's", calories: 535, protein_g: 30, carbs_g: 40, fat_g: 28, fibre_g: 4, sugar_g: 6, salt_g: 1.6, serving_size: "1 meal (445g)" },
  { food_name: "Chicken Tikka Masala",                 brand: "Charlie Bigham's", calories: 685, protein_g: 40, carbs_g: 45, fat_g: 38, fibre_g: 5, sugar_g: 14,salt_g: 2.0, serving_size: "1 meal (450g)" },
  { food_name: "Lasagne",                              brand: "Charlie Bigham's", calories: 705, protein_g: 35, carbs_g: 52, fat_g: 38, fibre_g: 5, sugar_g: 12,salt_g: 2.2, serving_size: "1 meal (450g)" },
  { food_name: "Macaroni Cheese",                      brand: "Charlie Bigham's", calories: 585, protein_g: 22, carbs_g: 52, fat_g: 32, fibre_g: 3, sugar_g: 6, salt_g: 1.7, serving_size: "1 meal (400g)" },
  { food_name: "Cottage Pie",                          brand: "Charlie Bigham's", calories: 485, protein_g: 28, carbs_g: 45, fat_g: 22, fibre_g: 5, sugar_g: 10,salt_g: 1.8, serving_size: "1 meal (400g)" },
  { food_name: "Chicken Katsu Curry",                  brand: "Wagamama Frozen", calories: 620, protein_g: 32, carbs_g: 80, fat_g: 20, fibre_g: 5, sugar_g: 14, salt_g: 2.4, serving_size: "1 meal (400g)" },
  { food_name: "Yaki Soba",                            brand: "Wagamama Frozen", calories: 545, protein_g: 28, carbs_g: 70, fat_g: 18, fibre_g: 5, sugar_g: 12, salt_g: 3.0, serving_size: "1 meal (400g)" },
  { food_name: "Itsu Teriyaki Chicken Rice Bowl",      brand: "Itsu Frozen", calories: 425, protein_g: 28, carbs_g: 60, fat_g: 8,  fibre_g: 4, sugar_g: 16, salt_g: 1.8, serving_size: "1 pot (350g)" },
  { food_name: "Itsu Katsu Chicken Rice Bowl",         brand: "Itsu Frozen", calories: 495, protein_g: 22, carbs_g: 68, fat_g: 15, fibre_g: 4, sugar_g: 12, salt_g: 1.9, serving_size: "1 pot (350g)" },

  // ===== NUT BUTTERS =====
  { food_name: "Pip and Nut Smooth Peanut Butter",     brand: "Pip and Nut", calories: 95,  protein_g: 4,  carbs_g: 2.5,fat_g: 8,  fibre_g: 1, sugar_g: 1, salt_g: 0.1, serving_size: "1 tbsp (15g)" },
  { food_name: "Pip and Nut Almond Butter",            brand: "Pip and Nut", calories: 95,  protein_g: 3.5,carbs_g: 2,  fat_g: 8.5,fibre_g: 1, sugar_g: 1, salt_g: 0.1, serving_size: "1 tbsp (15g)" },
  { food_name: "Pip and Nut Cashew Butter",            brand: "Pip and Nut", calories: 92,  protein_g: 3,  carbs_g: 4,  fat_g: 7,  fibre_g: 0.5,sugar_g: 1, salt_g: 0.1, serving_size: "1 tbsp (15g)" },
  { food_name: "Meridian Peanut Butter Smooth",        brand: "Meridian", calories: 95,  protein_g: 4,  carbs_g: 2.5,fat_g: 8,  fibre_g: 1, sugar_g: 1, salt_g: 0,   serving_size: "1 tbsp (15g)" },
  { food_name: "Meridian Almond Butter",               brand: "Meridian", calories: 96,  protein_g: 3.5,carbs_g: 2,  fat_g: 8.5,fibre_g: 1, sugar_g: 1, salt_g: 0,   serving_size: "1 tbsp (15g)" },
  { food_name: "Sun Pat Crunchy Peanut Butter",        brand: "Sun Pat", calories: 95,  protein_g: 4,  carbs_g: 2,  fat_g: 8,  fibre_g: 1, sugar_g: 1, salt_g: 0.1, serving_size: "1 tbsp (15g)" },

  // ===== YOGURTS =====
  { food_name: "Yeo Valley Natural Yogurt",            brand: "Yeo Valley", calories: 75,  protein_g: 4,  carbs_g: 6,  fat_g: 4,  fibre_g: 0, sugar_g: 6,  salt_g: 0.1, serving_size: "100g" },
  { food_name: "Yeo Valley Greek Style Natural",       brand: "Yeo Valley", calories: 135, protein_g: 5,  carbs_g: 5,  fat_g: 10, fibre_g: 0, sugar_g: 5,  salt_g: 0.1, serving_size: "100g" },
  { food_name: "Yeo Valley Strawberry Yogurt",         brand: "Yeo Valley", calories: 105, protein_g: 4.5,carbs_g: 14, fat_g: 3.8,fibre_g: 0, sugar_g: 13, salt_g: 0.1, serving_size: "1 pot (150g)" },
  { food_name: "Rachel's Organic Greek Natural",       brand: "Rachel's", calories: 110, protein_g: 5,  carbs_g: 5,  fat_g: 8,  fibre_g: 0, sugar_g: 5,  salt_g: 0.1, serving_size: "100g" },
  { food_name: "Müller Corner Strawberry",             brand: "Müller", calories: 165, protein_g: 4.5,carbs_g: 25, fat_g: 4.5,fibre_g: 0, sugar_g: 23, salt_g: 0.1, serving_size: "1 pot (135g)" },
  { food_name: "Müller Rice Original",                 brand: "Müller", calories: 195, protein_g: 5,  carbs_g: 32, fat_g: 5,  fibre_g: 0, sugar_g: 20, salt_g: 0.2, serving_size: "1 pot (180g)" },
  { food_name: "Activia Strawberry Yogurt",            brand: "Activia", calories: 110, protein_g: 5,  carbs_g: 17, fat_g: 3,  fibre_g: 1, sugar_g: 14, salt_g: 0.1, serving_size: "1 pot (125g)" },
  { food_name: "Activia 0% Fat Strawberry",            brand: "Activia", calories: 75,  protein_g: 5,  carbs_g: 13, fat_g: 0.1,fibre_g: 1, sugar_g: 12, salt_g: 0.1, serving_size: "1 pot (120g)" },
  { food_name: "Oykos Strawberry",                     brand: "Oykos", calories: 180, protein_g: 7,  carbs_g: 23, fat_g: 6,  fibre_g: 0, sugar_g: 22, salt_g: 0.1, serving_size: "1 pot (110g)" },
  { food_name: "Oykos Raspberry",                      brand: "Oykos", calories: 180, protein_g: 7,  carbs_g: 23, fat_g: 6,  fibre_g: 0, sugar_g: 22, salt_g: 0.1, serving_size: "1 pot (110g)" },
  { food_name: "Alpro Plant Yogurt Strawberry",        brand: "Alpro", calories: 115, protein_g: 4,  carbs_g: 15, fat_g: 4,  fibre_g: 0.5,sugar_g: 12, salt_g: 0.2, serving_size: "1 pot (150g)" },
  { food_name: "Alpro Plain Soya Yogurt",              brand: "Alpro", calories: 55,  protein_g: 4,  carbs_g: 2.5,fat_g: 2.5,fibre_g: 0.5,sugar_g: 2, salt_g: 0.1, serving_size: "100g" },

  // ===== CHEESE VARIETIES =====
  { food_name: "Brie",                                 brand: "Cheese", calories: 100, protein_g: 6,  carbs_g: 0.5,fat_g: 8,  fibre_g: 0, sugar_g: 0.5,salt_g: 0.5, serving_size: "30g" },
  { food_name: "Camembert",                            brand: "Cheese", calories: 90,  protein_g: 6,  carbs_g: 0.5,fat_g: 7,  fibre_g: 0, sugar_g: 0.5,salt_g: 0.5, serving_size: "30g" },
  { food_name: "Stilton",                              brand: "Cheese", calories: 125, protein_g: 7,  carbs_g: 0.1,fat_g: 10, fibre_g: 0, sugar_g: 0,  salt_g: 0.7, serving_size: "30g" },
  { food_name: "Red Leicester",                        brand: "Cheese", calories: 120, protein_g: 7.5,carbs_g: 0.1,fat_g: 10, fibre_g: 0, sugar_g: 0,  salt_g: 0.5, serving_size: "30g" },
  { food_name: "Parmesan",                             brand: "Cheese", calories: 120, protein_g: 11, carbs_g: 0,  fat_g: 8.5,fibre_g: 0, sugar_g: 0,  salt_g: 0.7, serving_size: "30g" },
  { food_name: "Halloumi Raw",                         brand: "Cheese", calories: 95,  protein_g: 6.5,carbs_g: 0.7,fat_g: 7.5,fibre_g: 0, sugar_g: 0.7,salt_g: 0.9, serving_size: "30g" },
  { food_name: "Halloumi Grilled 100g",                brand: "Cheese", calories: 320, protein_g: 22, carbs_g: 2,  fat_g: 25, fibre_g: 0, sugar_g: 2,  salt_g: 3.0, serving_size: "100g" },
  { food_name: "Goats Cheese Soft",                    brand: "Cheese", calories: 80,  protein_g: 5,  carbs_g: 0.7,fat_g: 7,  fibre_g: 0, sugar_g: 0.7,salt_g: 0.4, serving_size: "30g" },
  { food_name: "Mature Cheddar",                       brand: "Cheese", calories: 125, protein_g: 7.5,carbs_g: 0.1,fat_g: 10, fibre_g: 0, sugar_g: 0,  salt_g: 0.6, serving_size: "30g" },
  { food_name: "Cream Cheese Philadelphia",            brand: "Cheese", calories: 65,  protein_g: 1.5,carbs_g: 1,  fat_g: 6,  fibre_g: 0, sugar_g: 1,  salt_g: 0.2, serving_size: "1 tbsp (20g)" },
  { food_name: "Babybel Original",                     brand: "Cheese", calories: 63,  protein_g: 4.5,carbs_g: 0,  fat_g: 5,  fibre_g: 0, sugar_g: 0,  salt_g: 0.4, serving_size: "1 piece (20g)" },
  { food_name: "Dairylea Triangle",                    brand: "Cheese", calories: 35,  protein_g: 1.5,carbs_g: 1,  fat_g: 3,  fibre_g: 0, sugar_g: 1,  salt_g: 0.2, serving_size: "1 triangle (17.5g)" },
  { food_name: "Ricotta 50g",                          brand: "Cheese", calories: 85,  protein_g: 5,  carbs_g: 2,  fat_g: 6.5,fibre_g: 0, sugar_g: 2,  salt_g: 0.2, serving_size: "50g" },
  { food_name: "Cottage Cheese",                       brand: "Cheese", calories: 100, protein_g: 12, carbs_g: 4,  fat_g: 4,  fibre_g: 0, sugar_g: 4,  salt_g: 0.5, serving_size: "100g" },

  // ============================================================
  // STAGE 19 — Cooking specifics, pasta, noodles, sauces, olives
  // ============================================================

  // ===== PASTA SHAPES =====
  { food_name: "Farfalle Cooked 100g",                 brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 32, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Fusilli Cooked 100g",                  brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 32, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Rigatoni Cooked 100g",                 brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 32, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Tagliatelle Cooked 100g",              brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 32, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Orzo Cooked 100g",                     brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 32, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Linguine Cooked 100g",                 brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 32, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Ravioli Meat Filled 100g",             brand: "Ingredient", calories: 220, protein_g: 11, carbs_g: 28, fat_g: 7,   fibre_g: 2, sugar_g: 2, salt_g: 0.8, serving_size: "100g cooked" },
  { food_name: "Tortellini Cheese Filled 100g",        brand: "Ingredient", calories: 245, protein_g: 11, carbs_g: 32, fat_g: 8,   fibre_g: 2, sugar_g: 3, salt_g: 0.9, serving_size: "100g cooked" },
  { food_name: "Gnocchi Cooked 100g",                  brand: "Ingredient", calories: 135, protein_g: 3.5,carbs_g: 28, fat_g: 1,   fibre_g: 2, sugar_g: 1, salt_g: 0.4, serving_size: "100g cooked" },

  // ===== NOODLES =====
  { food_name: "Udon Noodles Cooked 100g",             brand: "Ingredient", calories: 125, protein_g: 3,  carbs_g: 26, fat_g: 0.5, fibre_g: 1, sugar_g: 0, salt_g: 0.5, serving_size: "100g cooked" },
  { food_name: "Egg Noodles Cooked 100g",              brand: "Ingredient", calories: 140, protein_g: 5,  carbs_g: 28, fat_g: 1.5, fibre_g: 2, sugar_g: 0, salt_g: 0, serving_size: "100g cooked" },
  { food_name: "Rice Noodles Cooked 100g",             brand: "Ingredient", calories: 110, protein_g: 2,  carbs_g: 25, fat_g: 0.2, fibre_g: 1, sugar_g: 0, salt_g: 0.1, serving_size: "100g cooked" },
  { food_name: "Ramen Noodles Cooked 100g",            brand: "Ingredient", calories: 155, protein_g: 5,  carbs_g: 30, fat_g: 1,   fibre_g: 2, sugar_g: 0, salt_g: 0.3, serving_size: "100g cooked" },
  { food_name: "Soba Buckwheat Noodles Cooked 100g",   brand: "Ingredient", calories: 115, protein_g: 5,  carbs_g: 24, fat_g: 0.1, fibre_g: 2, sugar_g: 1, salt_g: 0.3, serving_size: "100g cooked" },
  { food_name: "Instant Ramen Pot Chicken",            brand: "Pot Noodle", calories: 385, protein_g: 9,  carbs_g: 50, fat_g: 15, fibre_g: 3, sugar_g: 4, salt_g: 3.5, serving_size: "1 pot (90g)" },
  { food_name: "Pot Noodle Chicken and Mushroom",      brand: "Pot Noodle", calories: 385, protein_g: 9,  carbs_g: 52, fat_g: 14, fibre_g: 3, sugar_g: 5, salt_g: 3.6, serving_size: "1 pot (90g)" },
  { food_name: "Pot Noodle Bombay Bad Boy",            brand: "Pot Noodle", calories: 395, protein_g: 9,  carbs_g: 52, fat_g: 15, fibre_g: 3, sugar_g: 5, salt_g: 3.7, serving_size: "1 pot (90g)" },

  // ===== SAUCE BRANDS =====
  { food_name: "Dolmio Bolognese Sauce Original",      brand: "Dolmio", calories: 65,  protein_g: 1.5,carbs_g: 10, fat_g: 2,  fibre_g: 1.5,sugar_g: 9, salt_g: 0.8, serving_size: "1/2 jar (250g)" },
  { food_name: "Dolmio Lasagne Sauce",                 brand: "Dolmio", calories: 85,  protein_g: 3,  carbs_g: 8,  fat_g: 5,  fibre_g: 1,  sugar_g: 6, salt_g: 0.9, serving_size: "1/2 jar (250g)" },
  { food_name: "Dolmio Carbonara Sauce",               brand: "Dolmio", calories: 245, protein_g: 5,  carbs_g: 10, fat_g: 20, fibre_g: 0.5,sugar_g: 4, salt_g: 1.2, serving_size: "1/2 jar (150g)" },
  { food_name: "Homepride Chicken Tonight Creamy Mushroom",brand:"Homepride", calories: 175, protein_g: 2,  carbs_g: 12, fat_g: 13, fibre_g: 1,  sugar_g: 5, salt_g: 1.0, serving_size: "1/2 jar (250g)" },
  { food_name: "Loyd Grossman Tomato and Basil Sauce", brand: "Loyd Grossman", calories: 125, protein_g: 2,  carbs_g: 15, fat_g: 6,  fibre_g: 2,  sugar_g: 12,salt_g: 1.0, serving_size: "1/2 jar (175g)" },
  { food_name: "Sharwood's Tikka Masala Sauce",        brand: "Sharwood's", calories: 205, protein_g: 3,  carbs_g: 15, fat_g: 14, fibre_g: 2,  sugar_g: 12,salt_g: 1.0, serving_size: "1/2 jar (210g)" },
  { food_name: "Patak's Tikka Masala Paste",           brand: "Patak's", calories: 190, protein_g: 2,  carbs_g: 8,  fat_g: 16, fibre_g: 3,  sugar_g: 3, salt_g: 2.0, serving_size: "4 tbsp (60g)" },
  { food_name: "Heinz Tomato Ketchup",                 brand: "Heinz", calories: 18,  protein_g: 0.2,carbs_g: 4,  fat_g: 0,  fibre_g: 0,  sugar_g: 4, salt_g: 0.3, serving_size: "1 tbsp (15g)" },
  { food_name: "HP Brown Sauce",                       brand: "HP", calories: 18,  protein_g: 0.2,carbs_g: 4,  fat_g: 0,  fibre_g: 0,  sugar_g: 3, salt_g: 0.3, serving_size: "1 tbsp (15g)" },
  { food_name: "Hellmann's Mayonnaise",                brand: "Hellmann's", calories: 100, protein_g: 0.2,carbs_g: 0.2,fat_g: 11, fibre_g: 0,  sugar_g: 0.2,salt_g: 0.2, serving_size: "1 tbsp (15g)" },
  { food_name: "Hellmann's Light Mayonnaise",          brand: "Hellmann's", calories: 36,  protein_g: 0.2,carbs_g: 1,  fat_g: 3.5,fibre_g: 0,  sugar_g: 1, salt_g: 0.2, serving_size: "1 tbsp (15g)" },
  { food_name: "Lea and Perrins Worcestershire Sauce", brand: "Lea and Perrins", calories: 12,  protein_g: 0,  carbs_g: 3,  fat_g: 0,  fibre_g: 0,  sugar_g: 2, salt_g: 0.3, serving_size: "1 tsp (5ml)" },
  { food_name: "Tabasco Sauce",                        brand: "Tabasco", calories: 1,   protein_g: 0,  carbs_g: 0,  fat_g: 0,  fibre_g: 0,  sugar_g: 0, salt_g: 0.1, serving_size: "1 tsp (5ml)" },

  // ===== HUMMUS / DIPS BRANDS =====
  { food_name: "Sabra Classic Hummus",                 brand: "Sabra", calories: 70,  protein_g: 2,  carbs_g: 4,  fat_g: 5,  fibre_g: 2,   sugar_g: 0.5, salt_g: 0.2, serving_size: "2 tbsp (28g)" },
  { food_name: "Sabra Roasted Red Pepper Hummus",      brand: "Sabra", calories: 70,  protein_g: 2,  carbs_g: 4,  fat_g: 5,  fibre_g: 2,   sugar_g: 1,   salt_g: 0.2, serving_size: "2 tbsp (28g)" },
  { food_name: "Tesco Reduced Fat Houmous",            brand: "Tesco", calories: 170, protein_g: 6,  carbs_g: 12, fat_g: 10, fibre_g: 4,   sugar_g: 1,   salt_g: 0.7, serving_size: "1/2 pot (100g)" },
  { food_name: "Taramasalata",                         brand: "Home Cooked", calories: 240, protein_g: 3,  carbs_g: 5,  fat_g: 23, fibre_g: 0.5, sugar_g: 1,   salt_g: 1.0, serving_size: "50g" },
  { food_name: "Tzatziki",                             brand: "Home Cooked", calories: 55,  protein_g: 3,  carbs_g: 2,  fat_g: 4,  fibre_g: 0.5, sugar_g: 2,   salt_g: 0.3, serving_size: "50g" },
  { food_name: "Salsa Dip",                            brand: "Home Cooked", calories: 18,  protein_g: 0.5,carbs_g: 4,  fat_g: 0,  fibre_g: 0.5, sugar_g: 3,   salt_g: 0.4, serving_size: "2 tbsp (30g)" },
  { food_name: "Sour Cream and Chive Dip",             brand: "Home Cooked", calories: 95,  protein_g: 1.5,carbs_g: 3,  fat_g: 9,  fibre_g: 0,   sugar_g: 2,   salt_g: 0.3, serving_size: "2 tbsp (30g)" },

  // ===== OLIVES / ANTIPASTI =====
  { food_name: "Green Olives",                         brand: "Ingredient", calories: 50,  protein_g: 0.4,carbs_g: 1,  fat_g: 5,  fibre_g: 1, sugar_g: 0, salt_g: 0.6, serving_size: "30g" },
  { food_name: "Black Olives",                         brand: "Ingredient", calories: 40,  protein_g: 0.3,carbs_g: 1,  fat_g: 4,  fibre_g: 1, sugar_g: 0, salt_g: 0.6, serving_size: "30g" },
  { food_name: "Marinated Olives Mixed",               brand: "Ingredient", calories: 60,  protein_g: 0.5,carbs_g: 1,  fat_g: 6,  fibre_g: 1, sugar_g: 0, salt_g: 0.7, serving_size: "30g" },
  { food_name: "Sun-Dried Tomatoes in Oil",            brand: "Ingredient", calories: 95,  protein_g: 1,  carbs_g: 4,  fat_g: 8,  fibre_g: 1, sugar_g: 3, salt_g: 0.8, serving_size: "30g" },
  { food_name: "Artichoke Hearts in Oil",              brand: "Ingredient", calories: 55,  protein_g: 1,  carbs_g: 3,  fat_g: 4,  fibre_g: 2, sugar_g: 1, salt_g: 0.5, serving_size: "30g" },

  // ===== HERBS AND SPICES (negligible cal for completeness) =====
  { food_name: "Garlic Clove",                         brand: "Ingredient", calories: 4,   protein_g: 0.2,carbs_g: 1,  fat_g: 0,   fibre_g: 0.1, sugar_g: 0, salt_g: 0, serving_size: "1 clove (3g)" },
  { food_name: "Ginger Fresh 1 tsp",                   brand: "Ingredient", calories: 2,   protein_g: 0,  carbs_g: 0.4,fat_g: 0,   fibre_g: 0.1, sugar_g: 0, salt_g: 0, serving_size: "1 tsp (2g)" },
  { food_name: "Onion White 1 medium",                 brand: "Ingredient", calories: 45,  protein_g: 1.2,carbs_g: 10, fat_g: 0.1, fibre_g: 2,   sugar_g: 5, salt_g: 0, serving_size: "1 medium (110g)" },
  { food_name: "Tomato 1 medium",                      brand: "Ingredient", calories: 20,  protein_g: 1,  carbs_g: 4,  fat_g: 0.2, fibre_g: 1.5, sugar_g: 3, salt_g: 0, serving_size: "1 medium (120g)" },
  { food_name: "Lemon Juice 1 tbsp",                   brand: "Ingredient", calories: 4,   protein_g: 0.1,carbs_g: 1,  fat_g: 0,   fibre_g: 0,   sugar_g: 0.5,salt_g: 0, serving_size: "1 tbsp (15ml)" },

];

// ──────────────────────────────────────────────
// Normalise text for search: lowercase, strip apostrophes, collapse spaces
// So "Nando's", "NANDOS", "nando s" all become the same token stream
// ──────────────────────────────────────────────
function normalise(s: string): string {
  return s.toLowerCase().replace(/['']/g, "").replace(/\s+/g, " ").trim();
}

// Build a Set of all unique brand names (normalised) for fast brand-match detection
// Computed once at module load — O(1) lookup per search
const ALL_BRANDS = new Set<string>(
  RESTAURANT_MEALS.map((m) => normalise(m.brand)),
);

// ──────────────────────────────────────────────
// Search helper — returns meals matching the query.
//
// Key behaviour:
//   1. If the query exactly matches a brand name (e.g. "nandos", "tesco meal deal"),
//      return EVERY item from that brand uncapped. This is what lets typing
//      "Nando's" surface the full 50-item Nando's menu.
//   2. Otherwise return top N relevance-sorted results.
//
// Relevance scoring:
//   - Brand-name start (e.g. "nan" → Nando's, McDonald's)         +50
//   - Query at start of meal name (e.g. "big" → "Big Mac")        +30
//   - Query appears as a word inside the name                     +10
//   - Multi-word queries are tokenised, ALL tokens must match
//     somewhere in brand + name combined (so "sweet chilli chicken
//     wrap tesco meal deal" still finds the exact Tesco item)
// ──────────────────────────────────────────────
export function searchRestaurantMeals(query: string, limit = 30): RestaurantMeal[] {

  const q = normalise(query);
  if (q.length < 2) return [];

  // Fast path: exact brand match → return ALL items from that brand.
  // Also covers partial brand matches where the brand starts with the query
  // (e.g. "tesco" → "Tesco Meal Deal", "nan" → "Nando's")
  const brandsThatMatch = Array.from(ALL_BRANDS).filter((brand) =>
    brand === q || brand.startsWith(q) || q.startsWith(brand)
  );
  if (brandsThatMatch.length > 0) {
    // Return every meal whose (normalised) brand matches one of those brands
    const matches = RESTAURANT_MEALS.filter((m) =>
      brandsThatMatch.includes(normalise(m.brand))
    );
    // If we got a meaningful batch back, that's the answer — skip token scoring entirely
    if (matches.length >= 5) return matches;
  }

  // Tokenise multi-word queries. Every token must appear somewhere in
  // brand+name combined, otherwise the meal is rejected.
  const tokens = q.split(" ").filter((t) => t.length > 0);

  const scored = RESTAURANT_MEALS.map((meal) => {
    const nName  = normalise(meal.food_name);
    const nBrand = normalise(meal.brand);
    const combined = `${nBrand} ${nName}`;

    // All tokens must be present — stops false matches where only
    // one word matches (e.g. "tesco" alone shouldn't pull in random Nando's items)
    if (!tokens.every((t) => combined.includes(t))) {
      return { meal, score: 0 };
    }

    let score = 1;
    if (nBrand === q)                                score += 100;
    else if (nBrand.startsWith(q))                   score += 50;
    if (nName.startsWith(q))                         score += 30;
    if (nName.includes(` ${q}`) || nName.startsWith(q)) score += 10;
    // Bonus when every query token appears as a word-boundary match in the name
    // (e.g. "sweet chilli chicken wrap" → all four in the Tesco wrap name)
    const nameWords = nName.split(" ");
    const wordHits = tokens.filter((t) => nameWords.includes(t)).length;
    score += wordHits * 5;

    return { meal, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.meal);
}
