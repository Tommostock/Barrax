/* ============================================
   Swap Day API Route
   POST /api/swap-workout-day

   Swaps the contents of two days in the current
   programme — workout, rest, run, or activity.
   Useful when work gets in the way and the user
   needs to reshuffle a single week without
   touching their recurring training_schedule.

   Body: { programmeId, fromDay, toDay }

   Mechanics:
   1. Swap the `workout`, `is_rest_day` and
      `schedule_type` fields between the two
      entries in programme_data (the `day` name
      itself stays put).
   2. Swap the `scheduled_date` of any workout
      rows sitting on those dates so regular
      workouts and activity rows follow the swap.
   3. Refuses to swap if either side has a
      completed workout (history must stay put).
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSchedule } from "@/types";

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

type DayType = "workout" | "rest" | "run" | "activity";

interface SwapRequest {
  programmeId: string;
  fromDay: DayName;
  toDay: DayName;
}

// Shape of one entry in programme_data.
// Loose on the workout field because the AI may include extra keys
// we don't strictly type; schedule_type is a per-week override written
// by this route when a day gets swapped.
interface ProgrammeDayRaw {
  day: string;
  is_rest_day: boolean;
  workout: Record<string, unknown> | null;
  schedule_type?: DayType;
}

interface WorkoutRow {
  id: string;
  scheduled_date: string;
  status: string;
}

// ISO date (YYYY-MM-DD) for a specific weekday, given the Monday week_start.
function dateForDay(weekStart: string, day: DayName): string {
  const base = new Date(weekStart);
  base.setDate(base.getDate() + DAY_NAMES.indexOf(day));
  return base.toISOString().split("T")[0];
}

// Work out the "current" type of a programme day.
//   1. Per-week override on programme_data wins first
//   2. Otherwise fall back to the user's recurring training_schedule
//   3. Finally default to "workout" if nothing is set
function resolveDayType(
  entry: ProgrammeDayRaw,
  schedule: TrainingSchedule
): DayType {
  if (entry.schedule_type) return entry.schedule_type;
  const rule = schedule[entry.day as keyof TrainingSchedule];
  if (rule?.type) return rule.type as DayType;
  // No rule means a plain workout day by default
  return "workout";
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

    // Load the programme (verifying ownership) and the profile's
    // training_schedule in parallel — we need both to seed per-day
    // type overrides correctly on a day's first swap.
    const [programmeResult, profileResult] = await Promise.all([
      supabase
        .from("workout_programmes")
        .select("id, user_id, week_start, programme_data")
        .eq("id", programmeId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("training_schedule")
        .eq("id", user.id)
        .single(),
    ]);

    if (programmeResult.error || !programmeResult.data) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }
    const programme = programmeResult.data;
    const trainingSchedule = (profileResult.data?.training_schedule ??
      {}) as TrainingSchedule;

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

    // Compute effective types BEFORE we start mutating so we can set
    // them on the other side after the swap.
    const fromType = resolveDayType(fromEntry, trainingSchedule);
    const toType = resolveDayType(toEntry, trainingSchedule);

    // Figure out which dates the two days correspond to in the real
    // world so we can find and move any workout rows sitting on them.
    const fromDate = dateForDay(programme.week_start, fromDay);
    const toDate = dateForDay(programme.week_start, toDay);

    // Load workout rows on both dates. We need these BEFORE the swap
    // so we can refuse to act on completed days and can re-date each
    // row individually afterwards.
    const { data: workoutRowsRaw, error: workoutFetchError } = await supabase
      .from("workouts")
      .select("id, scheduled_date, status")
      .eq("programme_id", programmeId)
      .eq("user_id", user.id)
      .in("scheduled_date", [fromDate, toDate]);

    if (workoutFetchError) {
      console.error("Failed to load workouts for swap:", workoutFetchError);
      return NextResponse.json(
        { error: "Failed to load workouts" },
        { status: 500 }
      );
    }

    const workoutRows = (workoutRowsRaw ?? []) as WorkoutRow[];

    // Refuse to move completed workouts — history must stay intact
    const anyComplete = workoutRows.some((w) => w.status === "complete");
    if (anyComplete) {
      return NextResponse.json(
        { error: "Cannot swap a day with a completed workout" },
        { status: 400 }
      );
    }

    // Perform the swap on the JSON payload.
    // The day names themselves stay put — we just move the workout,
    // the rest flag, and the schedule_type between the two entries.
    const movedWorkout = fromEntry.workout;
    const movedIsRest = fromEntry.is_rest_day;

    fromEntry.workout = toEntry.workout;
    fromEntry.is_rest_day = toEntry.is_rest_day;
    fromEntry.schedule_type = toType;

    toEntry.workout = movedWorkout;
    toEntry.is_rest_day = movedIsRest;
    toEntry.schedule_type = fromType;

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

    // Move every workout row on either date to the OTHER date. We
    // update by id so both sides can land on the same date
    // temporarily without upsetting anything — there's no unique
    // constraint on (user_id, scheduled_date).
    for (const row of workoutRows) {
      const newDate = row.scheduled_date === fromDate ? toDate : fromDate;
      const { error: moveError } = await supabase
        .from("workouts")
        .update({ scheduled_date: newDate })
        .eq("id", row.id);

      if (moveError) {
        console.error("Failed to move workout row:", moveError);
        return NextResponse.json(
          { error: "Failed to move workout rows" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Swap day error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to swap day",
      },
      { status: 500 }
    );
  }
}
