/* ============================================
   INTEL Page
   Client component — fetches stats on mount.
   No server round-trip needed for tab switching.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import WorkoutCalendar from "@/components/intel/WorkoutCalendar";
import { TrendingUp, Trophy, Activity, PieChart, FileText, Settings } from "lucide-react";
import { formatDistance } from "@/lib/geolocation";
import Link from "next/link";

export default function IntelPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({ workouts: 0, distance: 0, xp: 0, hours: 0, mins: 0 });
  const [calendarWorkouts, setCalendarWorkouts] = useState<{ scheduled_date: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [wcResult, runsResult, rankResult, wResult, calResult] = await Promise.all([
        supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "complete"),
        supabase.from("runs").select("distance_metres, duration_seconds").eq("user_id", user.id),
        supabase.from("ranks").select("total_xp").eq("user_id", user.id).single(),
        supabase.from("workouts").select("duration_seconds").eq("user_id", user.id).eq("status", "complete"),
        // Fetch all workouts for the calendar (scheduled_date + status)
        supabase.from("workouts").select("scheduled_date, status").eq("user_id", user.id),
      ]);

      if (calResult.data) setCalendarWorkouts(calResult.data);

      const totalDist = runsResult.data?.reduce((s, r) => s + (r.distance_metres || 0), 0) ?? 0;
      const totalSecs = (wResult.data?.reduce((s, w) => s + (w.duration_seconds || 0), 0) ?? 0)
        + (runsResult.data?.reduce((s, r) => s + (r.duration_seconds || 0), 0) ?? 0);

      setStats({
        workouts: wcResult.count ?? 0,
        distance: totalDist,
        xp: rankResult.data?.total_xp ?? 0,
        hours: Math.floor(totalSecs / 3600),
        mins: Math.floor((totalSecs % 3600) / 60),
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  const sections = [
    { href: "/intel/body", icon: Activity, title: "Physical Condition", description: "Weight, measurements. Stay sharp." },
    { href: "/intel/nutrition", icon: PieChart, title: "Fuel Analysis", description: "Calories and macros. No excuses." },
    { href: "/intel/runs", icon: TrendingUp, title: "Combat Running", description: "Distance, pace, territory covered" },
    { href: "/intel/records", icon: Trophy, title: "Elite Achievements", description: "Your maximum performance records" },
    { href: "/intel/report", icon: FileText, title: "Mission Debrief", description: "Weekly performance evaluation" },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Intelligence Report</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Workouts</p>
          <p className="text-2xl font-bold font-mono text-text-primary">{loading ? "-" : stats.workouts}</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total Distance</p>
          <p className="text-2xl font-bold font-mono text-text-primary">{loading ? "-" : `${formatDistance(stats.distance)} km`}</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Total XP</p>
          <p className="text-2xl font-bold font-mono text-xp-gold">{loading ? "-" : stats.xp.toLocaleString()}</p>
        </div>
        <div className="bg-bg-panel border border-green-dark p-3">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase">Time Trained</p>
          <p className="text-2xl font-bold font-mono text-text-primary">{loading ? "-" : `${stats.hours}h ${stats.mins}m`}</p>
        </div>
      </div>

      {/* Workout history calendar */}
      <WorkoutCalendar month={new Date()} workouts={calendarWorkouts} />

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

      <Link href="/intel/settings">
        <Card className="flex items-center gap-3 hover:bg-bg-panel-alt transition-colors">
          <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
            <Settings size={18} className="text-green-primary" />
          </div>
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Base Operations</h3>
            <p className="text-xs text-text-secondary">Settings, preferences, account</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
