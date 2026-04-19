/* ============================================
   RunMap Component
   Leaflet map showing the run route in real-time.
   Uses light CartoDB tiles with a green route line.
   Must be dynamically imported (no SSR) because
   Leaflet requires the browser window object.
   ============================================ */

"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { GpsPoint } from "@/types";
import "leaflet/dist/leaflet.css";

// Light map tiles from CartoDB — free, no API key needed
// CartoDB Positron — clean white/light-grey base, easy to read
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

// App colours (matching globals.css custom properties) so the map
// styling stays in lockstep with the rest of the UI.
const ROUTE_GREEN = "#4A6B3A";  // --green-primary
const POSITION_GOLD = "#B8A04A"; // --xp-gold

interface RunMapProps {
  points: GpsPoint[];        // GPS points to draw on the map
  isLive?: boolean;          // If true, map follows the latest point
  height?: string;           // CSS height (default: "h-48")
}

/* Helper component to auto-pan the map to follow the runner */
function MapFollower({ points, isLive }: { points: GpsPoint[]; isLive: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!isLive || points.length === 0) return;

    const lastPoint = points[points.length - 1];
    map.setView([lastPoint.lat, lastPoint.lng], map.getZoom(), {
      animate: true,
    });
  }, [points, isLive, map]);

  return null;
}

/* Helper component to fit the map to the whole route once a run
   is complete. Runs only when `isLive` is false and we have at
   least two points. We track the last-fit signature so the user
   can still pan/zoom freely after the initial auto-fit -- we only
   re-fit when the underlying points actually change. */
function RouteBoundsFitter({
  points,
  isLive,
}: {
  points: GpsPoint[];
  isLive: boolean;
}) {
  const map = useMap();
  const lastFitKeyRef = useRef<string>("");

  useEffect(() => {
    if (isLive) return;
    if (points.length < 2) return;

    // Use first/last timestamps + length as a cheap change key so
    // the same completed route doesn't refit on every re-render.
    const key = `${points.length}:${points[0].timestamp}:${points[points.length - 1].timestamp}`;
    if (key === lastFitKeyRef.current) return;
    lastFitKeyRef.current = key;

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [24, 24], animate: false });
  }, [points, isLive, map]);

  return null;
}

export default function RunMap({ points, isLive = false, height = "h-48" }: RunMapProps) {
  // Convert GPS points to Leaflet-compatible coordinate pairs
  const positions = points.map((p) => [p.lat, p.lng] as [number, number]);

  // Default centre (London) if no points yet
  const center: [number, number] =
    points.length > 0
      ? [points[points.length - 1].lat, points[points.length - 1].lng]
      : [51.505, -0.09];

  const zoom = points.length > 0 ? 16 : 13;

  // Latest GPS fix -- shown as a gold dot so the runner can tell
  // at a glance exactly where they are on top of the green route.
  const currentPosition: [number, number] | null =
    points.length > 0
      ? [points[points.length - 1].lat, points[points.length - 1].lng]
      : null;

  return (
    <div className={`${height} w-full border border-green-dark overflow-hidden`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={LIGHT_TILES} attribution={ATTRIBUTION} />

        {/* Draw the route in the app's primary green */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: ROUTE_GREEN,
              weight: 4,
              opacity: 0.9,
            }}
          />
        )}

        {/* Current-position marker. Rendered as a CircleMarker so it
            stays the same visible size regardless of zoom, with a
            dark outline so it remains obvious on light tiles. */}
        {currentPosition && (
          <CircleMarker
            center={currentPosition}
            radius={7}
            pathOptions={{
              color: "#1A1A1A",
              weight: 2,
              fillColor: POSITION_GOLD,
              fillOpacity: 1,
            }}
          />
        )}

        {/* Auto-follow the runner during a live run */}
        <MapFollower points={points} isLive={isLive} />

        {/* Auto-fit to the full route once the run is done */}
        <RouteBoundsFitter points={points} isLive={isLive} />
      </MapContainer>
    </div>
  );
}
