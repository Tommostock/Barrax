/* ============================================
   Widget Summary API
   GET /api/widget/summary?token=<widget-token>

   Returns a single compact JSON blob that a Scriptable
   home-screen widget can render. Authentication is by a
   long-lived opaque token stored in widget_tokens -- NOT
   by the normal Supabase auth cookie, because iOS widgets
   don't run in a browser context.

   The payload is intentionally small (~1 KB) so widget
   refreshes stay well inside the Supabase free-tier
   bandwidth budget. See widget_tokens RLS comment for the
   full security model.
   ============================================ */

import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateMacroTargets } from "@/lib/macros";
import { RANK_THRESHOLDS } from "@/types";

// Don't let Next.js cache this response. The widget is
// meant to reflect "right now" data -- iOS handles its own
// refresh cadence on top.
export const dynamic = "force-dynamic";

// SHA-256 hex of the raw token. Matches the hash stored in
// widget_tokens.token_hash so we can look the row up without
// ever storing the plaintext.
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Turn a Date into 'YYYY-MM-DD' in local time (matches the
// app's todayLocalISO helper used in HQDataProvider).
function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }

    const admin = createAdminClient();
    const tokenHash = hashToken(token);

    // 1. Look up the token. Only active (non-revoked) rows.
    const { data: tokenRow, error: tokenErr } = await admin
      .from("widget_tokens")
      .select("id, user_id, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = tokenRow.user_id as string;

    // 2. Fire all the data reads in parallel. Each query
    // filters by user_id manually because the service role
    // client bypasses RLS.
    const today = todayLocalISO();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [profileRes, diaryRes, rankRes, streakRes, workoutRes, lastRunRes] =
      await Promise.all([
        admin
          .from("profiles")
          .select("name, calorie_target, rest_day_calorie_target, protein_pct, carb_pct, fat_pct")
          .eq("id", userId)
          .maybeSingle(),
        admin
          .from("food_diary")
          .select("calories, protein_g, carbs_g, fat_g, quantity")
          .eq("user_id", userId)
          .gte("logged_at", todayStart.toISOString())
          .lte("logged_at", todayEnd.toISOString()),
        admin
          .from("ranks")
          .select("current_rank, total_xp")
          .eq("user_id", userId)
          .maybeSingle(),
        admin
          .from("streaks")
          .select("current_streak, longest_streak, last_active_date")
          .eq("user_id", userId)
          .maybeSingle(),
        admin
          .from("workouts")
          .select("id, workout_data, status, scheduled_date, duration_seconds")
          .eq("user_id", userId)
          .eq("scheduled_date", today)
          .limit(1)
          .maybeSingle(),
        admin
          .from("runs")
          .select("distance_metres, duration_seconds, avg_pace_seconds_per_km, started_at")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    // 3. Aggregate macros. Mirrors HQDataProvider exactly so
    // the widget numbers match what the in-app dashboard shows.
    const diaryRows = diaryRes.data ?? [];
    const caloriesToday = Math.round(
      diaryRows.reduce((s, r) => s + (r.calories ?? 0), 0),
    );
    const proteinToday = Math.round(
      diaryRows.reduce((s, r) => s + (r.protein_g ?? 0) * (r.quantity ?? 1), 0),
    );
    const carbsToday = Math.round(
      diaryRows.reduce((s, r) => s + (r.carbs_g ?? 0) * (r.quantity ?? 1), 0),
    );
    const fatToday = Math.round(
      diaryRows.reduce((s, r) => s + (r.fat_g ?? 0) * (r.quantity ?? 1), 0),
    );

    const calTarget = profileRes.data?.calorie_target ?? 2000;
    const proteinPct = profileRes.data?.protein_pct ?? 30;
    const carbPct = profileRes.data?.carb_pct ?? 40;
    const fatPct = profileRes.data?.fat_pct ?? 30;
    const macroTargets = calculateMacroTargets(calTarget, proteinPct, carbPct, fatPct);

    // 4. Rank title lookup.
    const currentRank = rankRes.data?.current_rank ?? 1;
    const rankInfo = RANK_THRESHOLDS[currentRank - 1];
    const nextRankInfo = RANK_THRESHOLDS[currentRank]; // undefined at max rank

    // 5. Update last_used_at so we can show it on the
    // Settings list. Fire-and-forget -- a failed write here
    // shouldn't fail the widget fetch.
    admin
      .from("widget_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", tokenRow.id)
      .then(() => {}, () => {});

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      user: {
        name: profileRes.data?.name ?? null,
      },
      macros: {
        calories: { value: caloriesToday, target: calTarget },
        protein:  { value: proteinToday,  target: macroTargets.protein },
        carbs:    { value: carbsToday,    target: macroTargets.carbs },
        fat:      { value: fatToday,      target: macroTargets.fat },
      },
      rank: {
        level: currentRank,
        title: rankInfo?.title ?? "Recruit",
        total_xp: rankRes.data?.total_xp ?? 0,
        next_rank_xp: nextRankInfo?.xp ?? null,
      },
      streak: {
        current: streakRes.data?.current_streak ?? 0,
        longest: streakRes.data?.longest_streak ?? 0,
        last_active_date: streakRes.data?.last_active_date ?? null,
      },
      today_workout: workoutRes.data
        ? {
            // The workout name + focus live inside the workout_data JSON
            // blob that the generator writes. Fall back gracefully so
            // the widget still has something to render on empty rows.
            name:
              (workoutRes.data.workout_data as { name?: string } | null)?.name ??
              "No orders",
            focus:
              (workoutRes.data.workout_data as { focus?: string } | null)?.focus ??
              null,
            status: workoutRes.data.status,
            duration_seconds: workoutRes.data.duration_seconds,
          }
        : null,
      last_run: lastRunRes.data
        ? {
            distance_metres: lastRunRes.data.distance_metres,
            duration_seconds: lastRunRes.data.duration_seconds,
            avg_pace_seconds_per_km: lastRunRes.data.avg_pace_seconds_per_km,
            started_at: lastRunRes.data.started_at,
          }
        : null,
    });
  } catch (err) {
    console.error("[widget/summary] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load summary" },
      { status: 500 },
    );
  }
}
