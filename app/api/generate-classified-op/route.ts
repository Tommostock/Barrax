/* ============================================
   Generate Classified Op API Route
   POST /api/generate-classified-op

   Flow:
   1. Auth
   2. Idempotency: return existing current-month op if present
   3. Load last 3 ops (category rotation + progress-key exclusion)
   4. Pick template from OP_POOL
   5. Pick codename from word pool, unique against last 6 months
   6. Ask Gemini for the briefing prose (80-150 words, bold codename,
      \n\n paragraphs, British tactical voice)
   7. Canned fallback if AI fails
   8. Insert classified_ops row and return
   ============================================ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini } from "@/lib/gemini";
import { OP_POOL } from "@/lib/missions/op-pool";
import { pickOpTemplate } from "@/lib/missions/select";
import { pickCodename } from "@/lib/missions/codenames";
import { monthStartLocalISO } from "@/lib/missions/date";
import type { OpRecentRow } from "@/lib/missions/select";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface BriefingResponse {
  briefing: string;
}

const SYSTEM_PROMPT = `You are the command briefing officer for BARRAX, a fitness app themed as a military operation. You receive a codename and an objective. Return ONLY JSON with a single field: { "briefing": "..." }. No other text, no markdown fences.

STYLE:
- British English, tactical-document voice. Declassified brief tone.
- 80 to 150 words total, 3 to 4 short paragraphs separated by \\n\\n.
- Open with the codename wrapped in ** markers (e.g. **Operation Iron Wall**).
- Reference the target number verbatim so the soldier knows the objective.
- Do not mention XP. Do not use emoji. Do not break character.
- Avoid cliches like "your mission, should you choose to accept it".`;

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

    const monthStart = monthStartLocalISO();

    // 1. Idempotency
    const { data: existing } = await supabase
      .from("classified_ops")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_start", monthStart)
      .maybeSingle();
    if (existing) return NextResponse.json({ op: existing });

    // 2. Load context
    const [rankRes, recentRes] = await Promise.all([
      supabase.from("ranks").select("current_rank").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("classified_ops")
        .select("tier,category,progress_key,completed,month_start,codename")
        .eq("user_id", user.id)
        .order("month_start", { ascending: false })
        .limit(6),
    ]);

    const rank = rankRes.data?.current_rank ?? 1;
    const recent = (recentRes.data ?? []) as (OpRecentRow & { codename?: string })[];

    // 3. Pick template
    const template = pickOpTemplate({
      pool: OP_POOL,
      recent: recent.slice(0, 3),
      rank,
    });

    // 4. Pick codename (unique against last 6 months)
    const takenCodenames = recent.map((r) => r.codename ?? "").filter(Boolean);
    const codename = pickCodename(takenCodenames);

    // 5. Flavour via Gemini with canned fallback
    let briefing: string;
    try {
      const result = await callGemini<BriefingResponse>({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: [
          `Codename: ${codename}`,
          `Tier: ${template.tier}`,
          `Category: ${template.category}`,
          `Mechanic: ${template.flavour_hint}`,
          `Target: ${template.target_value} ${template.unit}`,
          `Return JSON: { "briefing": "..." }`,
        ].join("\n"),
      });
      briefing = (result?.briefing ?? "").trim();
      if (briefing.length < 40) throw new Error("briefing too short");
    } catch (err) {
      console.warn("[generate-classified-op] AI briefing failed, using fallback:", err);
      briefing = [
        `**${codename}**`,
        ``,
        `Classification: EYES ONLY. Duration: ${monthStart}.`,
        ``,
        `Objective: ${capitalise(template.flavour_hint)}. Target is ${template.target_value} ${template.unit}, cumulative across the calendar month.`,
        ``,
        `Execution is your responsibility, soldier. Sustained effort wins this one. Stand firm.`,
      ].join("\n");
    }

    // 6. Insert
    const row = {
      user_id: user.id,
      month_start: monthStart,
      tier: template.tier,
      category: template.category,
      codename,
      briefing: briefing.slice(0, 2000),
      progress_key: template.progress_key,
      target_value: template.target_value,
      current_value: 0,
      unit: template.unit,
      xp_value: template.xp_value,
      completed: false,
      completed_at: null,
    };

    const { data: saved, error: insertError } = await supabase
      .from("classified_ops")
      .insert(row)
      .select()
      .single();

    if (insertError) {
      if (
        typeof insertError.message === "string" &&
        insertError.message.toLowerCase().includes("duplicate")
      ) {
        const { data: winner } = await supabase
          .from("classified_ops")
          .select("*")
          .eq("user_id", user.id)
          .eq("month_start", monthStart)
          .maybeSingle();
        if (winner) return NextResponse.json({ op: winner });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ op: saved });
  } catch (error) {
    console.error("Generate classified op error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate classified op" },
      { status: 500 },
    );
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
