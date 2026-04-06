/* ============================================
   INTEL Page
   Stats and progress overview. Pulls real data
   from workouts, runs, and ranks tables.
   ============================================ */

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import Card from "@/components/ui/Card";
import { TrendingUp, Trophy, Activity } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/geolocation";
import Link from "next/link";

export default async function IntelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real stats from the database
  const { count: workoutCount } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .eq("status", "complete");

  const { data: runs } = await supabase
    .from("runs")
    .select("distance_metres, duration_seconds")
    .eq("user_id", user?.id);

  const { data: rank } = await supabase
    .from("ranks")
    .select("total_xp")
    .eq("user_id", user?.id)
    .single();

  const { data: allWorkouts } = await supabase
    .from("workouts")
    .select("duration_seconds")
    .eq("user_id", user?.id)
    .eq("status", "complete");

  // Calculate totals
  const totalDistanceM = runs?.reduce((sum, r) => sum + (r.distance_metres || 0), 0) ?? 0;
  const totalTrainingSecs = (allWorkouts?.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) ?? 0)
    + (runs?.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) ?? 0);
  const totalHours = Math.floor(totalTrainingSecs / 3600);
  const totalMins = Math.floor((totalTrainingSecs % 3600) / 60);

  const sections = [
    { href: "/intel/body", icon: Activity, title: "Body Tracking", description: "Weight and body measurements" },
    { href: "/intel/runs", icon: TrendingUp, title: "Run Stats", description: "Distance, pace, and trends" },
    { href: "/intel/records", icon: Trophy, title: "Personal Records", description: "Your all-time bests" },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Intelligence Report
      </h2>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Workouts</p>
          <p className="text-2xl font-bold font-mono text-text-primary">{workoutCount ?? 0}</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Distance</p>
          <p className="text-2xl font-bold font-mono text-text-primary">{formatDistance(totalDistanceM)} km</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total XP</p>
          <p className="text-2xl font-bold font-mono text-xp-gold">{(rank?.total_xp ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Time Trained</p>
          <p className="text-2xl font-bold font-mono text-text-primary">{totalHours}h {totalMins}m</p>
        </div>
      </div>

      {/* Section navigation */}
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Link key={section.href} href={section.href}>
            <Card className="flex items-center gap-3 hover:bg-bg-panel-alt transition-colors">
              <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
                <Icon size={18} className="text-green-primary" />
              </div>
              <div>
                <h3 className="text-sm font-heading uppercase tracking-wider text-sand">{section.title}</h3>
                <p className="text-xs text-text-secondary">{section.description}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
