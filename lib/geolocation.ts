/* ============================================
   Geolocation Utilities
   Haversine distance, pace calculation, split
   logging, and elevation gain for run tracking.
   ============================================ */

import type { GpsPoint, RunSplit } from "@/types";

// Earth's radius in metres — used in the Haversine formula
const EARTH_RADIUS_M = 6371000;

// Convert degrees to radians
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/* ---- Haversine Distance ----
   Calculates the straight-line distance between two
   GPS coordinates on Earth's surface, in metres.
   This is the standard formula for GPS distance. */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/* ---- Total Distance ----
   Calculates the total distance of a route by summing
   the Haversine distance between consecutive points. */
export function totalDistance(points: GpsPoint[]): number {
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    distance += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }
  return distance;
}

/* ---- Pace Calculation ----
   Returns pace in seconds per kilometre.
   e.g. 300 = 5:00 min/km */
export function calculatePace(distanceMetres: number, durationSeconds: number): number {
  if (distanceMetres <= 0) return 0;
  // Seconds per kilometre
  return Math.round((durationSeconds / distanceMetres) * 1000);
}

/* ---- Format Pace ----
   Converts pace in seconds/km to a readable "MM:SS" string.
   e.g. 330 seconds -> "5:30" */
export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0 || !isFinite(secondsPerKm)) return "--:--";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ---- Format Distance ----
   Converts metres to km with 2 decimal places.
   e.g. 5432 -> "5.43" */
export function formatDistance(metres: number, unit: "metric" | "imperial" = "metric"): string {
  if (unit === "imperial") {
    const miles = metres / 1609.344;
    return miles.toFixed(2);
  }
  return (metres / 1000).toFixed(2);
}

/* ---- Format Duration ----
   Converts seconds to "HH:MM:SS" or "MM:SS" */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

/* ---- Speed Calculation ----
   Returns current speed in km/h from two GPS points. */
export function calculateSpeed(point1: GpsPoint, point2: GpsPoint): number {
  const dist = haversineDistance(point1.lat, point1.lng, point2.lat, point2.lng);
  const timeDiff = (point2.timestamp - point1.timestamp) / 1000; // ms to seconds
  if (timeDiff <= 0) return 0;
  return (dist / timeDiff) * 3.6; // m/s to km/h
}

/* ---- Split Calculation ----
   Given a route of GPS points, calculates split times
   at every kilometre (or mile). Returns an array of
   splits with distance, pace, and elapsed time. */
export function calculateSplits(
  points: GpsPoint[],
  splitDistanceMetres: number = 1000 // 1km default, use 1609.344 for miles
): RunSplit[] {
  const splits: RunSplit[] = [];
  let cumulativeDistance = 0;
  let splitStartIndex = 0;
  let nextSplitDistance = splitDistanceMetres;

  for (let i = 1; i < points.length; i++) {
    const segmentDist = haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
    cumulativeDistance += segmentDist;

    // Check if we've crossed the next split boundary
    if (cumulativeDistance >= nextSplitDistance) {
      const splitElapsed = (points[i].timestamp - points[splitStartIndex].timestamp) / 1000;
      const splitDist = nextSplitDistance; // exact split distance
      const pace = calculatePace(splitDistanceMetres, splitElapsed);

      splits.push({
        distance_km: splitDist / 1000,
        pace_seconds_per_km: pace,
        elapsed_seconds: Math.round(
          (points[i].timestamp - points[0].timestamp) / 1000
        ),
      });

      splitStartIndex = i;
      nextSplitDistance += splitDistanceMetres;
    }
  }

  return splits;
}

/* ---- Elevation Gain ----
   Calculates total elevation gained during a run.
   Only counts uphill sections (positive altitude changes).
   Applies a small threshold to filter GPS noise. */
export function calculateElevationGain(points: GpsPoint[]): number | null {
  const altitudes = points
    .map((p) => p.altitude)
    .filter((a): a is number => a !== null && a !== undefined);

  if (altitudes.length < 2) return null;

  let gain = 0;
  const THRESHOLD = 2; // Ignore changes smaller than 2m (GPS noise)

  for (let i = 1; i < altitudes.length; i++) {
    const diff = altitudes[i] - altitudes[i - 1];
    if (diff > THRESHOLD) {
      gain += diff;
    }
  }

  return Math.round(gain);
}

/* ---- Best Pace ----
   Finds the fastest pace across all splits. */
export function bestPace(splits: RunSplit[]): number {
  if (splits.length === 0) return 0;
  return Math.min(...splits.map((s) => s.pace_seconds_per_km));
}
