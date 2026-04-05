/* ============================================
   Generate Workout API Route
   POST /api/generate-workout
   Calls Gemini to generate a single workout
   based on the user's profile and preferences.
   ============================================ */

import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

// System prompt: Gemini acts as a military fitness instructor
const SYSTEM_PROMPT = `You are a military fitness instructor. Generate bodyweight workout programmes that require ZERO gym equipment. All exercises must be doable in a garden, park, or indoors at home.

Respond ONLY in valid JSON with no additional text, markdown, or code fences.

The JSON must match this exact structure:
{
  "name": "Operation [codename]",
  "type": "strength" | "cardio" | "hiit" | "core" | "full_body" | "upper_push" | "upper_pull" | "lower_body" | "recovery",
  "duration_minutes": number,
  "warmup": [
    { "name": string, "description": string, "duration_seconds": number }
  ],
  "exercises": [
    {
      "name": string,
      "description": string,
      "form_cue": string,
      "sets": number,
      "reps": number | null,
      "duration_seconds": number | null,
      "rest_seconds": number,
      "difficulty": 1-5,
      "muscles": string[]
    }
  ],
  "cooldown": [
    { "name": string, "description": string, "duration_seconds": number }
  ],
  "xp_value": number
}

Rules:
- Generate 5-8 exercises per workout (not including warmup/cooldown)
- Include 3-4 warmup exercises (dynamic stretches, light movements)
- Include 3-4 cooldown exercises (static stretches)
- Each exercise must have either reps OR duration_seconds (not both, set the other to null)
- Rest between exercises should be 30-60 seconds
- Scale difficulty based on the user's rank (1-12) and fitness level
- Use creative military operation codenames for workout names
- XP value should be: 30 for <15min, 50 for 15-30min, 80 for 30+min`;

interface GenerateWorkoutRequest {
  availableMinutes: number;
  targetType: string;
  currentRank: number;
  fitnessLevel: string;
  recentWorkouts: string[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateWorkoutRequest = await request.json();

    // Build the user-specific prompt
    const userPrompt = `Generate a single ${body.targetType} workout with these parameters:
- Available time: ${body.availableMinutes} minutes
- Target workout type: ${body.targetType}
- User's current rank: ${body.currentRank} out of 12 (scale difficulty accordingly - rank 1 is easiest, rank 12 is hardest)
- Fitness level: ${body.fitnessLevel}
- Recent workout types to avoid repetition: ${body.recentWorkouts.join(", ") || "none yet"}

Make the workout fit within ${body.availableMinutes} minutes including warmup and cooldown.`;

    // Call Gemini to generate the workout
    const workout = await callGemini<{
      name: string;
      type: string;
      duration_minutes: number;
      warmup: { name: string; description: string; duration_seconds: number }[];
      exercises: {
        name: string;
        description: string;
        form_cue: string;
        sets: number;
        reps: number | null;
        duration_seconds: number | null;
        rest_seconds: number;
        difficulty: number;
        muscles: string[];
      }[];
      cooldown: { name: string; description: string; duration_seconds: number }[];
      xp_value: number;
    }>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // Validate the response has the required fields
    if (!workout.name || !workout.exercises || workout.exercises.length === 0) {
      throw new Error("Invalid workout structure from AI");
    }

    // Ensure XP value is set correctly based on duration
    if (workout.duration_minutes < 15) {
      workout.xp_value = 30;
    } else if (workout.duration_minutes <= 30) {
      workout.xp_value = 50;
    } else {
      workout.xp_value = 80;
    }

    return NextResponse.json(workout);

  } catch (error) {
    console.error("Generate workout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate workout" },
      { status: 500 }
    );
  }
}
