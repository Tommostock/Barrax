/* ============================================
   XP System
   Utility for calculating XP values.
   Actual XP awarding goes through /api/award-xp.
   ============================================ */

// XP values for different actions
const XP_VALUES = {
  RUN_BASE: 40,          // Base run XP
  RUN_PER_KM: 12,        // Additional XP per km
  RUN_MAX: 100,          // Max run XP
} as const;

// Calculate run XP based on distance in metres
export function getRunXP(distanceMetres: number): number {
  const km = distanceMetres / 1000;
  const xp = XP_VALUES.RUN_BASE + Math.floor(km * XP_VALUES.RUN_PER_KM);
  return Math.min(xp, XP_VALUES.RUN_MAX);
}
