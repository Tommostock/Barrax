/* ============================================
   TodayMission Component
   Card showing today's scheduled workout.
   Pulls real data from the current programme.
   Falls back to a placeholder if no programme exists.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { Swords, Clock, Zap, Play, Check } from "lucide-react";
import type { Workout, WorkoutData } from "@/types";

export default function TodayMission() {
  const router = useRouter();
  const supabase = createClient();

  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadToday() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get today's date string
      const today = new Date().toISOString().split("T")[0];

      // Find a workout scheduled for today
      const { data } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .eq("scheduled_date", today)
        .limit(1)
        .single();

      if (data) setTodayWorkout(data as Workout);
      setLoading(false);
    }
    loadToday();
  }, [supabase]);

  if (loading) {
    return <div className="skeleton h-28 w-full" />;
  }

  // No workout today — show placeholder
  if (!todayWorkout) {
    return (
      <Card tag="NO ORDERS" tagVariant="default" scanLines>
        <div className="flex items-start gap-3">
          <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
            <Swords size={18} className="text-text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Today&apos;s Mission</h3>
            <p className="text-xs text-text-secondary mt-1">
              No workout assigned. Get to MISSIONS and build yourself a programme. NOW.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const wd = todayWorkout.workout_data as WorkoutData;
  const isComplete = todayWorkout.status === "complete";

  return (
    <Card
      tag={isComplete ? "COMPLETE" : "TODAY"}
      tagVariant={isComplete ? "complete" : "active"}
      onClick={() => router.push(isComplete ? `/missions/${todayWorkout.id}` : `/missions/player/${todayWorkout.id}`)}
      className="press-scale"
      scanLines
    >
      <div className="flex items-start gap-3">
        <div className="min-w-[40px] min-h-[40px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
          {isComplete
            ? <Check size={18} className="text-green-light" />
            : <Swords size={18} className="text-green-primary" />
          }
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">{wd.name}</h3>
          <p className="text-xs text-text-secondary mt-1 capitalize">{wd.type?.replace("_", " ")}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[0.65rem] font-mono text-text-secondary">
              <Clock size={12} /> {wd.duration_minutes} min
            </span>
            <span className="flex items-center gap-1 text-[0.65rem] font-mono text-xp-gold">
              <Zap size={12} /> +{wd.xp_value} XP
            </span>
          </div>
          {!isComplete && (
            <button className="mt-3 w-full py-2 bg-green-primary text-text-primary font-heading text-xs uppercase tracking-widest font-bold hover:bg-green-light active:scale-[0.98] transition-all min-h-[44px]"
              onClick={(e) => { e.stopPropagation(); router.push(`/missions/player/${todayWorkout.id}`); }}>
              <span className="flex items-center justify-center gap-2"><Play size={14} /> MOVE OUT, SOLDIER</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
