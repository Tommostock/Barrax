/* ============================================
   Generate Daily Challenge API Route
   POST /api/generate-challenge
   Creates a daily bonus challenge for extra XP.
   Uses a preset pool rather than AI to save API calls.
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Preset pool of daily challenges — avoids burning Gemini API calls
const CHALLENGE_POOL = [
  { title: "100 Push-Ups", description: "Complete 100 push-ups throughout the day. Break them into sets.", target: 100, unit: "reps", type: "push_ups", xp: 75 },
  { title: "200 Squats", description: "Complete 200 bodyweight squats throughout the day.", target: 200, unit: "reps", type: "squats", xp: 75 },
  { title: "5 Minute Plank", description: "Hold a plank for 5 minutes total today. Break into sets.", target: 300, unit: "seconds", type: "plank", xp: 100 },
  { title: "50 Burpees", description: "Complete 50 burpees throughout the day.", target: 50, unit: "reps", type: "burpees", xp: 100 },
  { title: "Walk 5000 Steps", description: "Get 5000 steps in today. Track with your phone.", target: 5000, unit: "steps", type: "steps", xp: 50 },
  { title: "10 Minute Wall Sit", description: "Hold wall sit for 10 minutes total today.", target: 600, unit: "seconds", type: "wall_sit", xp: 100 },
  { title: "150 Lunges", description: "Complete 150 alternating lunges throughout the day.", target: 150, unit: "reps", type: "lunges", xp: 75 },
  { title: "Morning Run", description: "Complete any run before 09:00.", target: 1, unit: "run", type: "morning_run", xp: 100 },
  { title: "Core Blitz", description: "Complete 200 core reps (any mix of crunches, leg raises, flutter kicks).", target: 200, unit: "reps", type: "core", xp: 75 },
  { title: "Shadow Boxing", description: "Complete 10 rounds of 2-minute shadow boxing with 30s rest.", target: 10, unit: "rounds", type: "boxing", xp: 75 },
  { title: "Stretch Session", description: "Complete a 15-minute full body stretch routine.", target: 900, unit: "seconds", type: "stretch", xp: 50 },
  { title: "Hill Sprints", description: "Complete 10 hill or stair sprints.", target: 10, unit: "sprints", type: "sprints", xp: 100 },
  { title: "No Sugar", description: "Eat zero added sugar today. Stick to your meal plan.", target: 1, unit: "day", type: "nutrition", xp: 50 },
  { title: "Water Champion", description: "Drink 3 litres of water today.", target: 3000, unit: "ml", type: "water", xp: 50 },
  { title: "Double Time", description: "Complete two separate workouts today.", target: 2, unit: "workouts", type: "double", xp: 150 },
];

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if a challenge already exists for today
    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existing) {
      return NextResponse.json({ challenge: existing, message: "Challenge already exists for today" });
    }

    // Pick a random challenge from the pool
    const randomChallenge = CHALLENGE_POOL[Math.floor(Math.random() * CHALLENGE_POOL.length)];

    // Save it
    const { data: saved, error: saveError } = await supabase
      .from("daily_challenges")
      .insert({
        user_id: user.id,
        challenge_data: randomChallenge,
        date: today,
        xp_value: randomChallenge.xp,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({ challenge: saved });

  } catch (error) {
    console.error("Generate challenge error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
