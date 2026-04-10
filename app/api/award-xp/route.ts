/* ============================================
   Award XP API Route
   POST /api/award-xp
   Awards XP to a user and checks for rank-up.
   Called after completing workouts, runs, etc.
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RANK_THRESHOLDS } from "@/types";

interface AwardXPRequest {
  amount: number;
  source: string;        // e.g. "workout_complete", "run_complete", "daily_contract", etc.
  reference_id?: string; // optional UUID of the source row (workout_id, contract_id, op_id)
  note?: string;         // optional free-form context shown in /intel/xp-log
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AwardXPRequest = await request.json();

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: "Invalid XP amount" }, { status: 400 });
    }

    // Get current rank data
    const { data: rankData, error: fetchError } = await supabase
      .from("ranks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !rankData) {
      return NextResponse.json({ error: "Could not fetch rank data" }, { status: 500 });
    }

    const previousRank = rankData.current_rank;
    const newTotalXP = rankData.total_xp + body.amount;

    // Calculate the new rank based on total XP
    let newRank = 1;
    for (const threshold of RANK_THRESHOLDS) {
      if (newTotalXP >= threshold.xp) {
        newRank = threshold.rank;
      } else {
        break;
      }
    }

    const rankedUp = newRank > previousRank;

    // Update rank history if ranked up
    const rankHistory = rankData.rank_history || [];
    if (rankedUp) {
      const rankInfo = RANK_THRESHOLDS[newRank - 1];
      rankHistory.push({
        rank: newRank,
        title: rankInfo.title,
        achieved_at: new Date().toISOString(),
        total_xp: newTotalXP,
      });
    }

    // Save the updated rank
    const { error: updateError } = await supabase
      .from("ranks")
      .update({
        total_xp: newTotalXP,
        current_rank: newRank,
        rank_history: rankHistory,
      })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Could not update XP" }, { status: 500 });
    }

    // Audit log: append every XP gain with its source. reference_id
    // and note are optional -- callers like the Contract system set
    // reference_id to the contract/op UUID so the /intel/xp-log
    // screen can link back. Failure here is logged but not fatal --
    // the primary XP total is already persisted.
    try {
      await supabase.from("xp_events").insert({
        user_id: user.id,
        source: body.source,
        amount: body.amount,
        reference_id: body.reference_id ?? null,
        note: body.note ?? null,
      });
    } catch (auditErr) {
      console.warn("[award-xp] audit log insert failed:", auditErr);
    }

    return NextResponse.json({
      previousXP: rankData.total_xp,
      newTotalXP,
      xpAwarded: body.amount,
      previousRank,
      newRank,
      rankedUp,
      rankTitle: rankedUp ? RANK_THRESHOLDS[newRank - 1].title : undefined,
      rankUnlocks: rankedUp ? RANK_THRESHOLDS[newRank - 1].unlocks : undefined,
    });

  } catch (error) {
    console.error("Award XP error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to award XP" },
      { status: 500 }
    );
  }
}
