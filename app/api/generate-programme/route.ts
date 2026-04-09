/* ============================================
   Generate Weekly Programme API Route
   POST /api/generate-programme
   Generates a full week of workouts, rest days,
   runs, and custom activities based on the user's
   training schedule rules.
   ============================================ */

import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSchedule, ScheduleDay } from "@/types";

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
- Balance workout types across the week: include at least upper push, lower body, and cardio/HIIT across the workout days
- Never schedule the same muscle group on consecutive workout days
- Each workout should have 5-8 exercises (not including warmup/cooldown)
- Include 3-4 warmup and 3-4 cooldown exercises per workout
- Scale difficulty by rank (1=easiest, 12=hardest) and fitness level
- Use creative military operation codenames
- XP: 30 for <15min, 50 for 15-30min, 80 for 30+min workouts
- The "days" array MUST contain exactly 7 entries, one for each day of the week
- You MUST follow the user's schedule rules EXACTLY — if a day is marked as rest, make it a rest day; if marked as run, skip it (it will be handled separately)`;

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

interface GenerateProgrammeRequest {
  availableMinutes: number;
  currentRank: number;
  fitnessLevel: string;
  goals: string[];
  trainingSchedule?: TrainingSchedule;
}

// The AI sometimes returns data in different structures.
// This function normalises whatever we get into a clean 7-day array.
interface ProgrammeDay {
  day: string;
  is_rest_day: boolean;
  workout: Record<string, unknown> | null;
}

function normaliseProgramme(raw: Record<string, unknown>): ProgrammeDay[] {
  // Case 1: { days: [...] } — the expected format
  if (Array.isArray(raw.days)) {
    const days = raw.days as ProgrammeDay[];
    if (days.length >= 7) return days.slice(0, 7);
    // If less than 7, pad with rest days
    while (days.length < 7) {
      days.push({
        day: DAY_NAMES[days.length],
        is_rest_day: true,
        workout: null,
      });
    }
    return days;
  }

  // Case 2: { programme: { days: [...] } } — nested wrapper
  if (raw.programme && typeof raw.programme === "object") {
    const prog = raw.programme as Record<string, unknown>;
    if (Array.isArray(prog.days)) {
      return normaliseProgramme(prog as Record<string, unknown>);
    }
  }

  // Case 3: { week: [...] } — alternate key name
  if (Array.isArray(raw.week)) {
    return normaliseProgramme({ days: raw.week });
  }

  // Case 4: { monday: {...}, tuesday: {...}, ... } — object with day keys
  const dayEntries: ProgrammeDay[] = [];
  for (const dayName of DAY_NAMES) {
    const dayData = raw[dayName] as Record<string, unknown> | undefined;
    if (dayData) {
      dayEntries.push({
        day: dayName,
        is_rest_day: dayData.is_rest_day === true || dayData.rest === true || dayData.workout === null,
        workout: (dayData.workout as Record<string, unknown>) ?? (dayData.is_rest_day ? null : dayData),
      });
    }
  }
  if (dayEntries.length >= 5) {
    // Pad missing days as rest days
    for (const dayName of DAY_NAMES) {
      if (!dayEntries.find(d => d.day === dayName)) {
        dayEntries.push({ day: dayName, is_rest_day: true, workout: null });
      }
    }
    // Sort by day order
    dayEntries.sort((a, b) => DAY_NAMES.indexOf(a.day as typeof DAY_NAMES[number]) - DAY_NAMES.indexOf(b.day as typeof DAY_NAMES[number]));
    return dayEntries.slice(0, 7);
  }

  // Case 5: The response itself is an array
  if (Array.isArray(raw)) {
    return normaliseProgramme({ days: raw });
  }

  // Nothing worked — throw so the caller knows
  throw new Error("Could not parse programme structure from AI response");
}

// ──────────────────────────────────────────────
// Build the schedule rules string for the AI prompt.
// Tells the AI exactly which days need workouts,
// which are rest, which are runs, and which are
// activities (so it can skip them).
// ──────────────────────────────────────────────

function buildScheduleInstructions(schedule: TrainingSchedule): string {
  const lines: string[] = [];

  for (const day of DAY_NAMES) {
    const rule = schedule[day];
    if (!rule) {
      lines.push(`- ${day}: WORKOUT (generate a full workout)`);
      continue;
    }

    switch (rule.type) {
      case "workout":
        lines.push(`- ${day}: WORKOUT (generate a full workout)`);
        break;
      case "rest":
        lines.push(`- ${day}: REST DAY (is_rest_day: true, workout: null)`);
        break;
      case "run":
        lines.push(`- ${day}: RUN DAY — set is_rest_day: true, workout: null (the user will track this via the GPS run tracker)`);
        break;
      case "activity":
        lines.push(`- ${day}: EXTERNAL ACTIVITY (${rule.activity_name ?? "activity"}, ${rule.duration_minutes ?? 60} min) — set is_rest_day: true, workout: null (handled outside the programme)`);
        break;
    }
  }

  return lines.join("\n");
}

// ──────────────────────────────────────────────
// Build a pre-made workout entry for a custom
// activity day (e.g. football).  This goes into
// the workouts table so the user can log it and
// earn XP, but no AI generation is needed.
// ──────────────────────────────────────────────

function buildActivityWorkout(rule: ScheduleDay) {
  const name = rule.activity_name ?? "Activity";
  const duration = rule.duration_minutes ?? 60;

  // XP based on duration (same scale as regular workouts)
  const xp = duration < 15 ? 30 : duration < 30 ? 50 : 80;

  // Estimate calories: moderate activity ~6 METs, 75kg average
  // Cal = MET * weight(kg) * hours
  const estimatedCalories = Math.round(6 * 75 * (duration / 60));

  return {
    name: name,
    type: "activity",
    duration_minutes: duration,
    focus: name,
    warmup: [],
    exercises: [],
    cooldown: [],
    xp_value: xp,
    is_activity: true,
    estimated_calories: estimatedCalories,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateProgrammeRequest = await request.json();
    const schedule = body.trainingSchedule ?? {};

    // Build the schedule instructions for the AI
    const scheduleRules = buildScheduleInstructions(schedule);

    // Count how many workout days the AI actually needs to generate
    const workoutDayCount = DAY_NAMES.filter((d) => {
      const rule = schedule[d];
      return !rule || rule.type === "workout";
    }).length;

    // Fetch recent difficulty ratings to adjust intensity
    const { data: recentWorkouts } = await supabase
      .from("workouts")
      .select("difficulty_rating")
      .eq("user_id", user.id)
      .eq("status", "complete")
      .not("difficulty_rating", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5);

    const ratings = (recentWorkouts || []).map((w: { difficulty_rating: number }) => w.difficulty_rating);
    const avgDifficulty = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;

    // Build difficulty feedback for the AI
    let difficultyNote = "";
    if (avgDifficulty) {
      const avg = parseFloat(avgDifficulty);
      if (avg <= 2) difficultyNote = "\nDIFFICULTY FEEDBACK: Recent workouts were rated too easy (avg " + avgDifficulty + "/5). INCREASE intensity — add more reps, harder variations, or longer sets.";
      else if (avg >= 4) difficultyNote = "\nDIFFICULTY FEEDBACK: Recent workouts were rated too hard (avg " + avgDifficulty + "/5). DECREASE intensity — fewer reps, easier variations, or more rest.";
      else difficultyNote = "\nDIFFICULTY FEEDBACK: Recent workouts were rated about right (avg " + avgDifficulty + "/5). Maintain current intensity with slight progression.";
    }

    const userPrompt = `Generate a full 7-day weekly workout programme:
- Available time per workout: ${body.availableMinutes} minutes
- User's current rank: ${body.currentRank} out of 12
- Fitness level: ${body.fitnessLevel}
- Goals: ${body.goals.join(", ") || "general fitness"}${difficultyNote}

WEEKLY SCHEDULE RULES (FOLLOW EXACTLY):
${scheduleRules}

You must generate workouts for exactly ${workoutDayCount} workout days. All other days must be rest/null as specified above.

IMPORTANT: Return exactly 7 days in the "days" array (monday through sunday). This is critical.`;

    // Generate the full programme
    const rawResponse = await callGemini<Record<string, unknown>>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // Normalise whatever the AI returned into a clean 7-day array
    const days = normaliseProgramme(rawResponse);

    // Enforce the schedule rules on top of the AI output.
    // The AI should follow the rules, but we enforce them to be safe.
    for (const day of days) {
      const dayKey = day.day.toLowerCase() as typeof DAY_NAMES[number];
      const rule = schedule[dayKey];
      if (!rule) continue; // no rule = workout, trust the AI

      if (rule.type === "rest" || rule.type === "run" || rule.type === "activity") {
        // Force these to be rest/null in the programme data —
        // activity and run days get their own workout rows below.
        day.is_rest_day = true;
        day.workout = null;
      }
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
        programme_data: days,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Create individual workout rows for each non-rest day
    const workoutRows = days
      .filter((d) => !d.is_rest_day && d.workout)
      .map((d) => {
        const dayIndex = DAY_NAMES.indexOf(d.day.toLowerCase() as typeof DAY_NAMES[number]);
        const scheduledDate = new Date(weekStart);
        scheduledDate.setDate(weekStart.getDate() + (dayIndex >= 0 ? dayIndex : 0));

        return {
          user_id: user.id,
          programme_id: savedProgramme.id,
          workout_data: d.workout,
          status: "pending" as const,
          scheduled_date: scheduledDate.toISOString().split("T")[0],
          xp_earned: 0,
        };
      });

    // Also create workout rows for activity days (e.g. football)
    // so users can log them and earn XP
    for (const day of DAY_NAMES) {
      const rule = schedule[day];
      if (rule?.type === "activity") {
        const dayIndex = DAY_NAMES.indexOf(day);
        const scheduledDate = new Date(weekStart);
        scheduledDate.setDate(weekStart.getDate() + dayIndex);

        workoutRows.push({
          user_id: user.id,
          programme_id: savedProgramme.id,
          workout_data: buildActivityWorkout(rule) as unknown as Record<string, unknown>,
          status: "pending" as const,
          scheduled_date: scheduledDate.toISOString().split("T")[0],
          xp_earned: 0,
        });
      }
    }

    if (workoutRows.length > 0) {
      const { error: workoutError } = await supabase
        .from("workouts")
        .insert(workoutRows);
      if (workoutError) throw workoutError;
    }

    return NextResponse.json({
      programme: savedProgramme,
      message: `Programme generated with ${workoutRows.length} workouts and ${7 - workoutRows.length} rest/run days.`,
    });

  } catch (error) {
    console.error("Generate programme error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate programme" },
      { status: 500 }
    );
  }
}
