/* ============================================
   Ghost Run System
   Compares the current run to a previous run on
   a similar route. Shows whether you're ahead or
   behind your previous pace.
   ============================================ */

import type { GpsPoint } from "@/types";
import { haversineDistance } from "@/lib/geolocation";

// How close two routes need to be to count as "same route"
const ROUTE_MATCH_THRESHOLD_M = 200; // Start points within 200m

// Check if two runs started from roughly the same location
export function routesMatch(
  currentStart: GpsPoint,
  previousStart: GpsPoint
): boolean {
  const dist = haversineDistance(
    currentStart.lat, currentStart.lng,
    previousStart.lat, previousStart.lng
  );
  return dist <= ROUTE_MATCH_THRESHOLD_M;
}

// Find the ghost's position at the current elapsed time.
// Returns the GPS point the ghost would be at, or null
// if the ghost's run was shorter than the current time.
export function getGhostPosition(
  previousPoints: GpsPoint[],
  currentElapsedMs: number
): GpsPoint | null {
  if (previousPoints.length < 2) return null;

  const startTime = previousPoints[0].timestamp;

  // Find the two points that bracket the current elapsed time
  for (let i = 1; i < previousPoints.length; i++) {
    const pointElapsed = previousPoints[i].timestamp - startTime;

    if (pointElapsed >= currentElapsedMs) {
      // Interpolate between points[i-1] and points[i]
      const prevElapsed = previousPoints[i - 1].timestamp - startTime;
      const ratio = (currentElapsedMs - prevElapsed) / (pointElapsed - prevElapsed);

      return {
        lat: previousPoints[i - 1].lat + ratio * (previousPoints[i].lat - previousPoints[i - 1].lat),
        lng: previousPoints[i - 1].lng + ratio * (previousPoints[i].lng - previousPoints[i - 1].lng),
        timestamp: Date.now(),
        altitude: null,
        speed: null,
      };
    }
  }

  // Current run is longer than the ghost's run
  return null;
}

// Calculate how far ahead or behind the runner is compared to the ghost.
// Positive = ahead (faster), negative = behind (slower).
// Returns time difference in seconds.
export function getGhostTimeDiff(
  currentDistance: number,
  currentElapsedMs: number,
  previousPoints: GpsPoint[]
): number {
  if (previousPoints.length < 2) return 0;

  const startTime = previousPoints[0].timestamp;
  let prevDistance = 0;

  // Find when the ghost reached the current distance
  for (let i = 1; i < previousPoints.length; i++) {
    prevDistance += haversineDistance(
      previousPoints[i - 1].lat, previousPoints[i - 1].lng,
      previousPoints[i].lat, previousPoints[i].lng
    );

    if (prevDistance >= currentDistance) {
      const ghostTimeMs = previousPoints[i].timestamp - startTime;
      return (ghostTimeMs - currentElapsedMs) / 1000; // Positive = you're faster
    }
  }

  // Ghost never reached this distance — you're ahead
  return 999;
}

// Format the ghost time difference for display
export function formatGhostDiff(seconds: number): string {
  if (seconds >= 999) return "AHEAD";
  const abs = Math.abs(Math.round(seconds));
  const sign = seconds > 0 ? "+" : "-";
  if (abs >= 60) {
    const mins = Math.floor(abs / 60);
    const secs = abs % 60;
    return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return `${sign}${abs}s`;
}
