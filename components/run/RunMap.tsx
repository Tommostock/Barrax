/* ============================================
   RunMap Component
   Leaflet map showing the run route in real-time.
   Uses light CartoDB tiles with a green route line.
   Must be dynamically imported (no SSR) because
   Leaflet requires the browser window object.
   ============================================ */

"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import type { GpsPoint } from "@/types";
import "leaflet/dist/leaflet.css";

// Light map tiles from CartoDB — free, no API key needed
// CartoDB Positron — clean white/light-grey base, easy to read
const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

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

export default function RunMap({ points, isLive = false, height = "h-48" }: RunMapProps) {
  // Convert GPS points to Leaflet-compatible coordinate pairs
  const positions = points.map((p) => [p.lat, p.lng] as [number, number]);

  // Default centre (London) if no points yet
  const center: [number, number] =
    points.length > 0
      ? [points[points.length - 1].lat, points[points.length - 1].lng]
      : [51.505, -0.09];

  const zoom = points.length > 0 ? 16 : 13;

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
              color: "#4A6B3A",  // --green-primary
              weight: 4,
              opacity: 0.9,
            }}
          />
        )}

        {/* Auto-follow the runner during a live run */}
        <MapFollower points={points} isLive={isLive} />
      </MapContainer>
    </div>
  );
}
