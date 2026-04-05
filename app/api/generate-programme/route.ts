/* ============================================
   Generate Weekly Programme API Route
   POST /api/generate-programme
   Generates a full week of 5-6 workouts plus
   rest days, balanced across workout types.
   ============================================ */

import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a military fitness instructor creating a weekly bodyweight training programme. No gym equipment.

Respond ONLY in valid JSON with no additional text.

The JSON must be an object with a "days" array containing exactly 7 entries (Monday to Sunday). Each day has:
{
  "days": [
    {
      "day": "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
      "is_rest_day": boolean,
      "workout": null (if rest day) OR {
        "name": "Operation [codename]",
        "type": "upper_push" | "upper_pull" | "lower_body" | "core" | "cardio" | "hiit" | "full_body" | "recovery",
        "duration_minutes": number,
        "focus": string (brief description like "Chest, shoulders, triceps"),
        "warmup": [{ "name": string, "description": string, "duration_seconds": number }],
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
        "cooldown": [{ "name": string, "description": string, "duration_seconds": number }],
        "xp_value": number
      }
    }
  ]
}

Rules:
- Include 5-6 workout days and 1-2 rest days per week
- Balance workout types across the week: include at least upper push, lower body, and cardio/HIIT
- Never schedule the same muscle group on consecutive days
- Rest days should be on Wednesday and/or Sunday typically
- Each workout should have 5-8 exercises (not including warmup/cooldown)
- Include 3-4 warmup and 3-4 cooldown exercises per workout
- Scale difficulty by rank (1=easiest, 12=hardest) and fitness level
- Use creative military operation codenames
- XP: 30 for <15min, 50 for 15-30min, 80 for 30+min workouts`;

interface GenerateProgrammeRequest {
  availableMinutes: number;
  currentRank: number;
  fitnessLevel: string;
  goals: string[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateProgrammeRequest = await request.json();

    const userPrompt = `Generate a full 7-day weekly workout programme:
- Available time per workout: ${body.availableMinutes} minutes
- User's current rank: ${body.currentRank} out of 12
- Fitness level: ${body.fitnessLevel}
- Goals: ${body.goals.join(", ") || "general fitness"}

Create a balanced week that fits these parameters.`;

    // Generate the full programme
    const programme = await callGemini<{
      days: {
        day: string;
        is_rest_day: boolean;
        workout: {
          name: string;
          type: string;
          duration_minutes: number;
          focus: string;
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
        } | null;
      }[];
    }>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // Validate we got 7 days
    if (!programme.days || programme.days.length !== 7) {
      throw new Error("Programme must have exactly 7 days");
    }

    // Calculate the week start date (Monday of this week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Save programme to database
    const { data: savedProgramme, error: saveError } = await supabase
      .from("workout_programmes")
      .insert({
        user_id: user.id,
        week_start: weekStartStr,
        programme_data: programme.days,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Create individual workout rows for each non-rest day
    const workoutRows = programme.days
      .filter((d) => !d.is_rest_day && d.workout)
      .map((d, index) => {
        const dayIndex = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(d.day);
        const scheduledDate = new Date(weekStart);
        scheduledDate.setDate(weekStart.getDate() + dayIndex);

        return {
          user_id: user.id,
          programme_id: savedProgramme.id,
          workout_data: d.workout,
          status: "pending" as const,
          scheduled_date: scheduledDate.toISOString().split("T")[0],
          xp_earned: 0,
        };
      });

    if (workoutRows.length > 0) {
      const { error: workoutError } = await supabase
        .from("workouts")
        .insert(workoutRows);
      if (workoutError) throw workoutError;
    }

    return NextResponse.json({
      programme: savedProgramme,
      message: `Programme generated with ${workoutRows.length} workouts and ${7 - workoutRows.length} rest days.`,
    });

  } catch (error) {
    console.error("Generate programme error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate programme" },
      { status: 500 }
    );
  }
}
