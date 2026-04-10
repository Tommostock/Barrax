/* ============================================
   Operation Codename Generator
   Two word pools (40 x 40 = 1600 combos). Tries to pick a
   name that isn't in the user's recent history, falls back
   to appending the current month name on collision.
   Server-side only dependency (pure logic, runs anywhere).
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
