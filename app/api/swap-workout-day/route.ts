/* ============================================
   Swap Workout Day API Route
   POST /api/swap-workout-day

   Moves a workout from one day of the week to
   another rest day in the same programme. Used
   when the user can't do the originally scheduled
   workout (e.g. work gets in the way) and wants to
   bump it to a day they're free.

   Body: { programmeId, fromDay, toDay }
   - fromDay must currently have a workout
   - toDay must currently be a genuine rest day
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Monday → Sunday, matches the programme_data day field values
const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type DayName = (typeof DAY_NAMES)[number];

interface SwapRequest {
  programmeId: string;
  fromDay: DayName;
  toDay: DayName;
}

// Shape of one entry in programme_data.
// Kept loose (Record<string, unknown>) for the workout field
// because the AI may include extra keys we don't strictly type.
interface ProgrammeDayRaw {
  day: string;
  is_rest_day: boolean;
  workout: Record<string, unknown> | null;
}

// Compute the ISO date (YYYY-MM-DD) for a specific day of the
// programme's week, given the Monday week_start.
function dateForDay(weekStart: string, day: DayName): string {
  const base = new Date(weekStart);
  // week_start is the Monday, so dayIndex 0 == Monday
  base.setDate(base.getDate() + DAY_NAMES.indexOf(day));
  return base.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check — only the owner of a programme can reshuffle it
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SwapRequest;
    const { programmeId, fromDay, toDay } = body;

    // Basic input validation
    if (!programmeId || !fromDay || !toDay) {
      return NextResponse.json(
        { error: "programmeId, fromDay and toDay are required" },
        { status: 400 }
      );
    }
    if (fromDay === toDay) {
      return NextResponse.json(
        { error: "Cannot swap a day with itself" },
        { status: 400 }
      );
    }
    if (!DAY_NAMES.includes(fromDay) || !DAY_NAMES.includes(toDay)) {
      return NextResponse.json({ error: "Invalid day name" }, { status: 400 });
    }

    // Load the programme and verify the caller owns it
    const { data: programme, error: progError } = await supabase
      .from("workout_programmes")
      .select("id, user_id, week_start, programme_data")
      .eq("id", programmeId)
      .eq("user_id", user.id)
      .single();

    if (progError || !programme) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    // Clone the days array so we can mutate safely before saving
    const days = (programme.programme_data as ProgrammeDayRaw[]).map((d) => ({
      ...d,
    }));
    const fromEntry = days.find((d) => d.day === fromDay);
    const toEntry = days.find((d) => d.day === toDay);

    if (!fromEntry || !toEntry) {
      return NextResponse.json(
        { error: "One or both days are missing from the programme" },
        { status: 400 }
      );
    }

    // Sanity-check the shape of the swap:
    //  - source day must have a real workout attached
    //  - target day must currently be a rest day with nothing scheduled
    if (fromEntry.is_rest_day || !fromEntry.workout) {
      return NextResponse.json(
        { error: "The source day has no workout to move" },
        { status: 400 }
      );
    }
    if (!toEntry.is_rest_day || toEntry.workout) {
      return NextResponse.json(
        { error: "The target day is not free" },
        { status: 400 }
      );
    }

    // Reject moving activity workouts — they're tied to a specific
    // real-world event (e.g. football match) so relocating them doesn't
    // make sense from the user's perspective.
    if (fromEntry.workout.is_activity === true) {
      return NextResponse.json(
        { error: "Activity days cannot be swapped" },
        { status: 400 }
      );
    }

    // Perform the swap on the JSON payload.
    // The day names themselves stay put — we just move the workout
    // and the rest flag between the two entries.
    const movedWorkout = fromEntry.workout;
    fromEntry.workout = null;
    fromEntry.is_rest_day = true;
    toEntry.workout = movedWorkout;
    toEntry.is_rest_day = false;

    // Save the updated programme_data
    const { error: updateError } = await supabase
      .from("workout_programmes")
      .update({ programme_data: days })
      .eq("id", programmeId);

    if (updateError) {
      console.error("Failed to update programme_data:", updateError);
      return NextResponse.json(
        { error: "Failed to save programme" },
        { status: 500 }
      );
    }

    // Move the matching workout row to the new scheduled_date.
    // We match by the old date so we only bump the one we intend to.
    // We also refuse to move completed workouts, as a safety net.
    const oldDate = dateForDay(programme.week_start, fromDay);
    const newDate = dateForDay(programme.week_start, toDay);

    const { error: workoutError } = await supabase
      .from("workouts")
      .update({ scheduled_date: newDate })
      .eq("programme_id", programmeId)
      .eq("user_id", user.id)
      .eq("scheduled_date", oldDate)
      .neq("status", "complete");

    if (workoutError) {
      console.error("Failed to update workout scheduled_date:", workoutError);
      return NextResponse.json(
        { error: "Failed to update workout date" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Swap workout day error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to swap workout day",
      },
      { status: 500 }
    );
  }
}
