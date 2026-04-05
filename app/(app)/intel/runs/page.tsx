/* ============================================
   Run History & Stats Page
   Shows all past runs with distance, time, pace.
   Includes overall stats and trend charts.
   ============================================ */

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatPace, formatDistance, formatDuration } from "@/lib/geolocation";
import { ArrowLeft, MapPin, Clock, TrendingUp, Zap, Calendar } from "lucide-react";
import type { Run, GpsPoint } from "@/types";

// Dynamic import for the map (Leaflet needs browser APIs)
const RunMap = dynamic(() => import("@/components/run/RunMap"), { ssr: false });

export default function RunHistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  const loadRuns = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (data) setRuns(data as Run[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  // Calculate overall stats from all runs
  const totalDistanceM = runs.reduce((sum, r) => sum + r.distance_metres, 0);
  const totalDurationS = runs.reduce((sum, r) => sum + r.duration_seconds, 0);
  const avgPace = totalDistanceM > 0 ? Math.round((totalDurationS / totalDistanceM) * 1000) : 0;
  const bestPaceValue = runs.length > 0 ? Math.min(...runs.map(r => r.best_pace_seconds_per_km)) : 0;
  const longestRun = runs.length > 0 ? Math.max(...runs.map(r => r.distance_metres)) : 0;

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-32" />
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-20" />)}</div>
        <SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  // If viewing a specific run's details
  if (selectedRun) {
    const routePoints = (selectedRun.route_data || []) as GpsPoint[];
    const splits = (selectedRun.splits || []) as { distance_km: number; pace_seconds_per_km: number; elapsed_seconds: number }[];

    return (
      <div className="px-4 py-4 space-y-4 pb-24">
        <button onClick={() => setSelectedRun(null)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
          <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Back to runs</span>
        </button>

        <Tag variant="complete">RUN COMPLETE</Tag>
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          {new Date(selectedRun.started_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
        </h2>

        {/* Route map */}
        {routePoints.length > 1 && (
          <RunMap points={routePoints} height="h-56" />
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-panel border border-green-dark p-3">
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Distance</p>
            <p className="text-2xl font-bold font-mono text-text-primary">{formatDistance(selectedRun.distance_metres)} km</p>
          </div>
          <div className="bg-bg-panel border border-green-dark p-3">
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Time</p>
            <p className="text-2xl font-bold font-mono text-text-primary">{formatDuration(selectedRun.duration_seconds)}</p>
          </div>
          <div className="bg-bg-panel border border-green-dark p-3">
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Avg Pace</p>
            <p className="text-2xl font-bold font-mono text-text-primary">{formatPace(selectedRun.avg_pace_seconds_per_km)} /km</p>
          </div>
          <div className="bg-bg-panel border border-green-dark p-3">
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Best Pace</p>
            <p className="text-2xl font-bold font-mono text-green-light">{formatPace(selectedRun.best_pace_seconds_per_km)} /km</p>
          </div>
        </div>

        {/* XP earned */}
        <div className="bg-bg-panel border border-xp-gold p-3 text-center">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">XP Earned</p>
          <p className="text-2xl font-bold font-mono text-xp-gold">+{selectedRun.xp_earned}</p>
        </div>

        {/* Elevation */}
        {selectedRun.elevation_gain_metres != null && selectedRun.elevation_gain_metres > 0 && (
          <div className="bg-bg-panel border border-green-dark p-3">
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Elevation Gain</p>
            <p className="text-lg font-bold font-mono text-text-primary">{selectedRun.elevation_gain_metres}m</p>
          </div>
        )}

        {/* Splits table */}
        {splits.length > 0 && (
          <div>
            <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-2">Splits</h3>
            <div className="border border-green-dark">
              <div className="grid grid-cols-3 bg-bg-panel-alt p-2 border-b border-green-dark">
                <span className="text-[0.6rem] font-mono text-text-secondary uppercase">KM</span>
                <span className="text-[0.6rem] font-mono text-text-secondary uppercase">Pace</span>
                <span className="text-[0.6rem] font-mono text-text-secondary uppercase">Elapsed</span>
              </div>
              {splits.map((split, i) => (
                <div key={i} className="grid grid-cols-3 p-2 border-b border-green-dark/50 last:border-0">
                  <span className="text-sm font-mono text-text-primary">{split.distance_km}</span>
                  <span className="text-sm font-mono text-text-primary">{formatPace(split.pace_seconds_per_km)}</span>
                  <span className="text-sm font-mono text-text-secondary">{formatDuration(split.elapsed_seconds)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main run history view
  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Run Stats</h2>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Distance</p>
          <p className="text-xl font-bold font-mono text-text-primary">{formatDistance(totalDistanceM)} km</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Runs</p>
          <p className="text-xl font-bold font-mono text-text-primary">{runs.length}</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Avg Pace</p>
          <p className="text-xl font-bold font-mono text-text-primary">{formatPace(avgPace)} /km</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Best Pace</p>
          <p className="text-xl font-bold font-mono text-green-light">{formatPace(bestPaceValue)} /km</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3 col-span-2">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Longest Run</p>
          <p className="text-xl font-bold font-mono text-text-primary">{formatDistance(longestRun)} km</p>
        </div>
      </div>

      {/* Run list */}
      <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary">Run History</h3>

      {runs.length === 0 ? (
        <Card tag="NO RUNS" tagVariant="default">
          <div className="text-center py-6">
            <MapPin size={32} className="text-text-secondary mx-auto mb-3" />
            <p className="text-xs text-text-secondary">Complete your first run to see it here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Card
              key={run.id}
              tag="COMPLETE"
              tagVariant="complete"
              onClick={() => setSelectedRun(run)}
              className="press-scale"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-heading uppercase tracking-wider text-sand">
                    {new Date(run.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-primary">
                      <MapPin size={11} /> {formatDistance(run.distance_metres)} km
                    </span>
                    <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary">
                      <Clock size={11} /> {formatDuration(run.duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary">
                      <TrendingUp size={11} /> {formatPace(run.avg_pace_seconds_per_km)} /km
                    </span>
                  </div>
                </div>
                <span className="text-[0.65rem] font-mono text-xp-gold flex items-center gap-1">
                  <Zap size={11} /> +{run.xp_earned}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
