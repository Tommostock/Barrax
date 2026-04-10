/* ============================================
   MUSCLE VOLUME Page
   Shows sets and reps by muscle group from
   all completed workout exercises.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ──────────────────────────────────────────────
// Exercise → primary muscle group mapping
// ──────────────────────────────────────────────

const EXERCISE_MUSCLE_MAP: Record<string, string> = {
  "Push-Up": "chest",
  "Wide Push-Up": "chest",
  "Diamond Push-Up": "chest",
  "Decline Push-Up": "chest",
  "Bodyweight Squat": "legs",
  "Jump Squat": "legs",
  "Sumo Squat": "legs",
  "Wall Sit": "legs",
  "Forward Lunge": "legs",
  "Reverse Lunge": "legs",
  "Plank": "core",
  "Side Plank": "core",
  "Bicycle Crunch": "core",
  "Leg Raises": "core",
  "Flutter Kicks": "core",
  "V-Up": "core",
  "Dead Bug": "core",
  "Burpee": "cardio",
  "Mountain Climber": "cardio",
  "High Knees": "cardio",
  "Star Jump": "cardio",
  "Glute Bridge": "glutes",
  "Single Leg Glute Bridge": "glutes",
  "Tricep Dip": "arms",
  "Superman": "back",
  "Reverse Snow Angel": "back",
};

function getMuscleGroup(exerciseName: string): string {
  // Exact match first
  if (EXERCISE_MUSCLE_MAP[exerciseName]) return EXERCISE_MUSCLE_MAP[exerciseName];
  // Case-insensitive search
  const lower = exerciseName.toLowerCase();
  for (const [key, val] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (lower === key.toLowerCase()) return val;
  }
  return "other";
}

interface MuscleStats {
  muscle: string;
  sets: number;
  reps: number;
}

export default function VolumePage() {
  const supabase = createClient();
  const [data, setData] = useState<MuscleStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all non-skipped workout exercises for this user
      // Join through workouts table to filter by user_id
      const { data: exercises } = await supabase
        .from("workout_exercises")
        .select("exercise_name, sets_completed, reps_completed, workout_id")
        .eq("skipped", false);

      // Also fetch user's workout IDs to filter
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", user.id);

      if (!exercises || !workouts) {
        setLoading(false);
        return;
      }

      const userWorkoutIds = new Set(workouts.map((w) => w.id));

      // Group by muscle
      const muscleMap: Record<string, { sets: number; reps: number }> = {};

      for (const ex of exercises) {
        if (!userWorkoutIds.has(ex.workout_id)) continue;
        const muscle = getMuscleGroup(ex.exercise_name);
        if (!muscleMap[muscle]) muscleMap[muscle] = { sets: 0, reps: 0 };
        muscleMap[muscle].sets += ex.sets_completed ?? 0;
        muscleMap[muscle].reps += ex.reps_completed ?? 0;
      }

      const result: MuscleStats[] = Object.entries(muscleMap)
        .map(([muscle, stats]) => ({ muscle, ...stats }))
        .sort((a, b) => b.sets - a.sets);

      setData(result);
      setLoading(false);
    }

    load();
  }, [supabase]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/intel"
          className="text-text-secondary hover:text-green-light transition-colors min-h-[44px] flex items-center"
        >
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          Muscle Volume
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-64" />
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      ) : data.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary text-center py-8">
            No workout data yet. Complete a workout to see your muscle volume breakdown.
          </p>
        </Card>
      ) : (
        <>
          {/* Bar chart */}
          <Card>
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider mb-3">
              Total Sets by Muscle Group
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="muscle"
                  tick={{ fill: "#C2B280", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#2A3A2A" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8B9A7B", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "#2A3A2A" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1A1A",
                    border: "1px solid #2A3A2A",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#C2B280" }}
                  itemStyle={{ color: "#4ADE80" }}
                />
                <Bar dataKey="sets" fill="#22C55E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Breakdown list */}
          <div className="space-y-2">
            <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
              Breakdown
            </p>
            {data.map((item) => (
              <Card key={item.muscle} className="flex items-center justify-between">
                <span className="text-sm font-heading uppercase tracking-wider text-sand">
                  {item.muscle}
                </span>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-text-primary">
                      {item.sets}
                    </p>
                    <p className="text-[0.5rem] font-mono text-text-secondary uppercase">
                      Sets
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-text-primary">
                      {item.reps}
                    </p>
                    <p className="text-[0.5rem] font-mono text-text-secondary uppercase">
                      Reps
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
