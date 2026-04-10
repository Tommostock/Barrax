/* ============================================
   Generate Daily Contract API Route
   POST /api/generate-contract

   Flow:
   1. Auth check
   2. Idempotency: return existing today's contract if present
   3. Load context (profile training_schedule, rank, last 7 contracts)
   4. Pick a template from CONTRACT_POOL using scoring rules
   5. Ask Gemini (with Groq fallback) for flavour text: title + description
   6. Canned fallback if AI fails -- route NEVER returns 500 on AI failure
   7. Insert daily_contracts row and return

   Uses the Node runtime (NOT edge) because the Gemini helper uses
   Node crypto/fetch patterns.
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini } from "@/lib/gemini";
import { CONTRACT_POOL } from "@/lib/missions/contract-pool";
import { pickContractTemplate } from "@/lib/missions/select";
import { todayLocalISO } from "@/lib/missions/date";
import type { ContractRecentRow } from "@/lib/missions/select";
import type { TrainingSchedule } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface FlavourText {
  title: string;
  description: string;
}

const SYSTEM_PROMPT = `You are a British military tactical operations officer writing daily mission briefings for BARRAX, a fitness app themed as a military operation. Output ONLY a valid JSON object with exactly two string fields: "title" and "description". No other text, no markdown fences.

STYLE RULES:
- British English, drill-sergeant tone. Terse, disciplined, no jokes, no emoji.
- "title": 2 to 6 words, ALL CAPS permitted, tactical language (e.g. "IRON TENDON", "TARGET ACQUIRED", "LAST LIGHT").
- "description": 1 to 2 sentences, 15 to 30 words, addresses the soldier directly, no questions, no pleading.
- Reference the mechanic verbatim in the description so the soldier knows what to do.
- Never invent numbers. Never restate the XP value. Do not use "today" more than once.`;

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = todayLocalISO();

    // 1. Idempotency
    const { data: existing } = await supabase
      .from("daily_contracts")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ contract: existing });
    }

    // 2. Load context
    const [profileRes, rankRes, recentRes] = await Promise.all([
      supabase.from("profiles").select("training_schedule").eq("id", user.id).maybeSingle(),
      supabase.from("ranks").select("current_rank").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("daily_contracts")
        .select("contract_type,difficulty,progress_key,date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7),
    ]);

    const trainingSchedule: TrainingSchedule =
      (profileRes.data?.training_schedule as TrainingSchedule | null) ?? {};
    const rank = rankRes.data?.current_rank ?? 1;
    const recent = (recentRes.data ?? []) as ContractRecentRow[];

    // 3. Pick template
    const template = pickContractTemplate({
      pool: CONTRACT_POOL,
      recent,
      trainingSchedule,
      rank,
    });

    // 4. Flavour via Gemini, with canned fallback
    let flavour: FlavourText;
    try {
      const result = await callGemini<FlavourText>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: [
          `Contract type: ${template.type}`,
          `Difficulty: ${template.difficulty}`,
          `Mechanic: ${template.flavour_hint}`,
          `Target: ${template.target_value} ${template.unit}`,
          `Return JSON: { "title": "...", "description": "..." }`,
        ].join("\n"),
      });
      if (!result?.title || !result?.description) {
        throw new Error("empty flavour");
      }
      flavour = result;
    } catch (err) {
      console.warn("[generate-contract] AI flavour failed, using fallback:", err);
      flavour = {
        title: `CONTRACT: ${template.type.toUpperCase()}`,
        description: `${capitalise(template.flavour_hint)}. Get it done, soldier.`,
      };
    }

    // 5. Insert row
    const row = {
      user_id: user.id,
      date: today,
      contract_type: template.type,
      difficulty: template.difficulty,
      title: flavour.title.slice(0, 120),
      description: flavour.description.slice(0, 400),
      codename: null,
      progress_key: template.progress_key,
      target_value: template.target_value,
      current_value: 0,
      unit: template.unit,
      xp_value: template.xp_value,
      completed: false,
      completed_at: null,
    };

    const { data: saved, error: insertError } = await supabase
      .from("daily_contracts")
      .insert(row)
      .select()
      .single();

    if (insertError) {
      // Handle two-tab race: unique constraint hit means another tab won
      if (
        typeof insertError.message === "string" &&
        insertError.message.toLowerCase().includes("duplicate")
      ) {
        const { data: winner } = await supabase
          .from("daily_contracts")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();
        if (winner) return NextResponse.json({ contract: winner });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ contract: saved });
  } catch (error) {
    console.error("Generate contract error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate contract" },
      { status: 500 },
    );
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
