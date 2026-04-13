/* ============================================
   Operation Codename Generator
   Two word pools (40 x 40 = 1600 combos). Tries to pick a
   name that isn't in the user's recent history, falls back
   to appending the current month name on collision.
   Server-side only dependency (pure logic, runs anywhere).

   Also exports pickWorkoutOperationName — a single-word
   UK-military-style codename used for generated workouts.
   UK operations traditionally use a single evocative word
   (e.g. Granby, Telic, Herrick). Drawing from past, present
   and "future-sounding" codenames keeps the Battle Plan
   feeling varied instead of always saying Thunder/Storm.
   ============================================ */

import { currentMonthName } from "@/lib/missions/date";

const ADJECTIVES = [
  "Iron", "Silent", "Red", "Shadow", "Crimson", "Granite", "Cold", "Thunder",
  "Steel", "Black", "Lone", "Savage", "Rapid", "Alpha", "Final", "Midnight",
  "Golden", "Quiet", "Deep", "Broken", "Rising", "Burning", "Fallen", "Last",
  "First", "Blind", "Frozen", "Hollow", "Silver", "Vanguard", "Copper",
  "Titan", "Phantom", "Stone", "Sharp", "Distant", "Storm", "Night", "Glass",
  "Reaper",
];

const NOUNS = [
  "Wall", "Thunder", "Dawn", "Hammer", "Viper", "Arrow", "Anvil", "Crucible",
  "Lance", "Fang", "Fury", "Bastion", "Ember", "Sentinel", "Serpent", "Trident",
  "Echo", "Blade", "Ridge", "Horizon", "Bulwark", "Talon", "Spear", "Chain",
  "Compass", "Forge", "Gauntlet", "Peak", "Beacon", "Tempest", "Summit", "Gale",
  "Canyon", "Eagle", "Wolf", "Bear", "Falcon", "Shield", "Keystone", "Citadel",
];

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a codename that isn't in `taken`. Tries up to 20 random combos,
 * then falls back to appending the month name to break collisions.
 */
export function pickCodename(taken: string[]): string {
  const takenLower = new Set(taken.map((s) => s.toLowerCase()));

  for (let i = 0; i < 20; i++) {
    const name = `Operation ${randomOf(ADJECTIVES)} ${randomOf(NOUNS)}`;
    if (!takenLower.has(name.toLowerCase())) return name;
  }

  // Collision fallback: append current month name.
  return `Operation ${randomOf(ADJECTIVES)} ${randomOf(NOUNS)} ${currentMonthName()}`;
}

// ──────────────────────────────────────────────
// Workout operation codenames
//
// A pool of single-word codenames in the style of real
// UK military operations. Covers three eras so the Battle
// Plan feels varied and steeped in British conflict history:
//   - PAST: actual WW2/Cold War/Falklands/etc. operations
//   - PRESENT: live or recent MOD operation names
//   - FUTURE: evocative British-themed words that *could*
//     plausibly be used as a UK op codename later on
// ──────────────────────────────────────────────

const UK_OPERATION_CODENAMES = [
  // PAST — historic UK military operations
  "Dynamo",     // Dunkirk evacuation, 1940
  "Overlord",   // D-Day, 1944
  "Chastise",   // Dambusters raid, 1943
  "Mincemeat",  // WW2 deception op
  "Chariot",    // St Nazaire raid, 1942
  "Biting",     // Bruneval raid, 1942
  "Jericho",    // Amiens prison raid, 1944
  "Colossus",   // First British airborne op, 1941
  "Musketeer",  // Suez Crisis, 1956
  "Corporate",  // Falklands War, 1982
  "Paraquet",   // South Georgia recapture, 1982
  "Sutton",     // San Carlos landings, 1982
  "Banner",     // Northern Ireland, 1969–2007
  "Motorman",   // Northern Ireland, 1972
  "Demetrius",  // Northern Ireland internment, 1971
  "Granby",     // Gulf War, 1990–91
  "Grapple",    // Bosnia, 1990s
  "Palatine",   // Kosovo/Bosnia, late 1990s
  "Agricola",   // Kosovo, 1999
  "Palliser",   // Sierra Leone, 2000
  "Barras",     // Sierra Leone hostage rescue, 2000
  "Veritas",    // Afghanistan, 2001
  "Telic",      // Iraq, 2003–2011
  "Herrick",    // Afghanistan, 2002–2014
  "Ellamy",     // Libya, 2011
  "Varsity",    // Rhine crossing, 1945
  "Plunder",    // Rhine crossing, 1945
  "Manna",      // Greece, 1944
  "Torch",      // North Africa, 1942
  "Husky",      // Sicily, 1943
  "Market",     // Arnhem, 1944

  // PRESENT — current or recent MOD operations
  "Shader",     // Anti-ISIS coalition, 2014–present
  "Kipion",     // Persistent Gulf maritime presence
  "Cabrit",     // NATO eFP Estonia/Poland
  "Trenton",    // UN South Sudan
  "Tosca",      // UN Cyprus
  "Newcombe",   // Mali
  "Pitting",    // Kabul evacuation, 2021
  "Interflex",  // Training Ukrainian forces
  "Prosperity", // RN global deployment
  "Polaris",    // RN carrier strike group

  // FUTURE — plausible British-themed codenames
  "Albion",
  "Britannia",
  "Excalibur",
  "Pendragon",
  "Avalon",
  "Hadrian",
  "Lionheart",
  "Trafalgar",
  "Agincourt",
  "Nelson",
  "Wellington",
  "Camelot",
  "Broadsword",
  "Longbow",
  "Claymore",
  "Ironside",
  "Roundhead",
  "Cavalier",
  "Crusader",
  "Centurion",
];

/**
 * Pick a single-word UK-style operation codename for a
 * generated workout. Optionally avoids names already in
 * use within the current programme so each day of the
 * week gets a distinct codename.
 */
export function pickWorkoutOperationName(taken: string[] = []): string {
  const takenLower = new Set(
    taken.map((s) => s.toLowerCase().replace(/^operation\s+/, "").trim())
  );

  // Try up to 30 random picks to find one we haven't used yet.
  for (let i = 0; i < 30; i++) {
    const codename = randomOf(UK_OPERATION_CODENAMES);
    if (!takenLower.has(codename.toLowerCase())) {
      return `Operation ${codename}`;
    }
  }

  // Collision fallback: append month name to force uniqueness.
  return `Operation ${randomOf(UK_OPERATION_CODENAMES)} ${currentMonthName()}`;
}
