/* ============================================
   MacroSummary Component
   Compact daily macro overview for the dashboard.
   Shows calories and P/C/F with progress bars.
   ============================================ */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { PieChart } from "lucide-react";

export default function MacroSummary() {
  const router = useRouter();
  const supabase = createClient();

  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 67 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get calorie target from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("calorie_target")
        .eq("id", user.id)
        .single();

      const calTarget = profile?.calorie_target ?? 2000;
      setTargets({
        calories: calTarget,
        protein: Math.round(calTarget * 0.3 / 4),   // 30% protein
        carbs: Math.round(calTarget * 0.4 / 4),      // 40% carbs
        fat: Math.round(calTarget * 0.3 / 9),         // 30% fat
      });

      // Get today's food diary entries
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: entries } = await supabase
        .from("food_diary")
        .select("calories, protein_g, carbs_g, fat_g")
        .eq("user_id", user.id)
        .gte("logged_at", todayStart.toISOString())
        .lte("logged_at", todayEnd.toISOString());

      if (entries && entries.length > 0) {
        setTotals({
          calories: entries.reduce((sum, e) => sum + (e.calories || 0), 0),
          protein: entries.reduce((sum, e) => sum + (e.protein_g || 0), 0),
          carbs: entries.reduce((sum, e) => sum + (e.carbs_g || 0), 0),
          fat: entries.reduce((sum, e) => sum + (e.fat_g || 0), 0),
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div className="skeleton h-24 w-full" />;

  // Don't show if no food diary entries today
  if (totals.calories === 0) return null;

  return (
    <Card tag="MACROS" tagVariant="active" onClick={() => router.push("/rations/diary")} className="press-scale">
      <div className="flex items-center gap-2 mb-3">
        <PieChart size={16} className="text-green-primary" />
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand">Today&apos;s Macros</h3>
      </div>

      {/* Calorie progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-text-primary">{Math.round(totals.calories)} kcal</span>
          <span className="text-text-secondary">/ {targets.calories}</span>
        </div>
        <ProgressBar value={totals.calories} max={targets.calories} height="h-2" />
      </div>

      {/* P / C / F row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="flex justify-between text-[0.55rem] font-mono mb-0.5">
            <span className="text-green-light">{Math.round(totals.protein)}g</span>
            <span className="text-text-secondary">/ {targets.protein}</span>
          </div>
          <ProgressBar value={totals.protein} max={targets.protein} color="bg-green-light" height="h-1" />
          <p className="text-[0.5rem] font-mono text-text-secondary mt-0.5">PROTEIN</p>
        </div>
        <div>
          <div className="flex justify-between text-[0.55rem] font-mono mb-0.5">
            <span className="text-xp-gold">{Math.round(totals.carbs)}g</span>
            <span className="text-text-secondary">/ {targets.carbs}</span>
          </div>
          <ProgressBar value={totals.carbs} max={targets.carbs} color="bg-xp-gold" height="h-1" />
          <p className="text-[0.5rem] font-mono text-text-secondary mt-0.5">CARBS</p>
        </div>
        <div>
          <div className="flex justify-between text-[0.55rem] font-mono mb-0.5">
            <span className="text-khaki">{Math.round(totals.fat)}g</span>
            <span className="text-text-secondary">/ {targets.fat}</span>
          </div>
          <ProgressBar value={totals.fat} max={targets.fat} color="bg-khaki" height="h-1" />
          <p className="text-[0.5rem] font-mono text-text-secondary mt-0.5">FAT</p>
        </div>
      </div>
    </Card>
  );
}
