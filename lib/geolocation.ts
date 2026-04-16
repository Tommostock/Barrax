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

/* ---- Smooth Altitudes (Moving Average) ----
   GPS altitude readings have roughly ±10m of error on most phones.
   A moving average slides a window across the raw data and replaces
   each point with the average of its neighbours. This smooths out
   the random noise while preserving genuine hills and valleys.

   windowSize = how many readings to average (must be odd for symmetry).
   A window of 5 means: the current point + 2 before + 2 after. */
function smoothAltitudes(altitudes: number[], windowSize: number = 5): number[] {
  // Not enough data to smooth — just return as-is
  if (altitudes.length < windowSize) return [...altitudes];

  const smoothed: number[] = [];

  // How far to look either side of the current point
  // e.g. windowSize 5 → halfWindow 2 → [i-2, i-1, i, i+1, i+2]
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < altitudes.length; i++) {
    // Clamp the window edges so we don't go out of bounds
    // At the start/end of the array, the window shrinks to fit
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(altitudes.length - 1, i + halfWindow);

    // Sum all values in the window, then divide by count
    let sum = 0;
    for (let j = start; j <= end; j++) {
      sum += altitudes[j];
    }
    smoothed.push(sum / (end - start + 1));
  }

  return smoothed;
}

/* ---- Elevation Gain ----
   Calculates total elevation gained during a run.
   Only counts uphill sections (positive altitude changes).

   GPS altitude is noisy (±10m on most phones), so raw point-to-point
   comparison on a flat run can show 100m+ of false gain. To fix this:
   1. Smooth the altitude data with a 5-point moving average
   2. Then apply a 2m threshold to ignore remaining small fluctuations */
export function calculateElevationGain(points: GpsPoint[]): number | null {
  const altitudes = points
    .map((p) => p.altitude)
    .filter((a): a is number => a !== null && a !== undefined);

  if (altitudes.length < 2) return null;

  // Step 1: Smooth the raw altitudes to reduce GPS noise
  // A window of 5 readings averages out the ±10m random errors
  const smoothed = smoothAltitudes(altitudes, 5);

  // Step 2: Sum up only the uphill changes that exceed the threshold
  let gain = 0;
  const THRESHOLD = 2; // Ignore changes smaller than 2m after smoothing

  for (let i = 1; i < smoothed.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];
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
