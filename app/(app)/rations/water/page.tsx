/* ============================================
   Water Tracker Page
   Daily water intake tracking with visual fill
   indicator and quick-add buttons.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { ArrowLeft, Droplets, Plus, Target } from "lucide-react";

export default function WaterTrackerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [todayTotal, setTodayTotal] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(2000); // ml, default 2L
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");

  const loadToday = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get today's start and end timestamps
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("water_logs")
      .select("amount_ml")
      .eq("user_id", user.id)
      .gte("logged_at", todayStart.toISOString())
      .lte("logged_at", todayEnd.toISOString());

    const total = data?.reduce((sum, log) => sum + log.amount_ml, 0) ?? 0;
    setTodayTotal(total);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadToday(); }, [loadToday]);

  // Add water intake
  async function addWater(amount: number) {
    if (amount <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Haptic feedback
    navigator.vibrate?.(50);

    const { error } = await supabase.from("water_logs").insert({
      user_id: user.id,
      amount_ml: amount,
    });

    if (error) {
      alert(`Failed to log water: ${error.message}`);
      return;
    }

    const newTotal = todayTotal + amount;
    setTodayTotal(newTotal);

    // Award XP + notify if just hit the daily target
    if (todayTotal < dailyTarget && newTotal >= dailyTarget) {
      const { hitWaterGoalAndNotify } = await import("@/lib/award-and-notify");
      await hitWaterGoalAndNotify();
    }
  }

  // Calculate fill percentage for the visual indicator
  const fillPercent = Math.min((todayTotal / dailyTarget) * 100, 100);
  const goalHit = todayTotal >= dailyTarget;

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><div className="skeleton h-64 w-full" /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button onClick={() => router.push("/rations")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Rations</span>
      </button>

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Hydration Protocol</h2>

      {/* Visual fill indicator — canteen style */}
      <div className="bg-bg-panel border border-green-dark p-6">
        <div className="relative w-32 h-48 mx-auto border-2 border-green-dark bg-bg-primary overflow-hidden">
          {/* Water fill */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-green-primary/30 border-t border-green-primary transition-all duration-500"
            style={{ height: `${fillPercent}%` }}
          >
            {/* Subtle wave effect at the top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-primary/50" />
          </div>

          {/* Centre text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets size={24} className={goalHit ? "text-green-light" : "text-green-primary"} />
            <p className="text-2xl font-bold font-mono text-text-primary mt-1">
              {todayTotal >= 1000 ? `${(todayTotal / 1000).toFixed(1)}L` : `${todayTotal}ml`}
            </p>
          </div>
        </div>

        {/* Target info */}
        <div className="text-center mt-4">
          <p className="text-xs font-mono text-text-secondary">
            QUOTA: {dailyTarget >= 1000 ? `${(dailyTarget / 1000).toFixed(1)}L` : `${dailyTarget}ml`}
          </p>
          {goalHit && <Tag variant="complete" className="mt-2">QUOTA ACHIEVED</Tag>}
          {!goalHit && (
            <p className="text-xs font-mono text-text-secondary mt-1">
              {dailyTarget - todayTotal >= 1000
                ? `${((dailyTarget - todayTotal) / 1000).toFixed(1)}L to go. DRINK UP.`
                : `${dailyTarget - todayTotal}ml to go. DRINK UP.`}
            </p>
          )}
        </div>
      </div>

      {/* Quick-add buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="secondary" onClick={() => addWater(250)} fullWidth>
          <span className="flex flex-col items-center">
            <Plus size={14} />
            <span className="text-xs mt-1">250ml</span>
          </span>
        </Button>
        <Button variant="secondary" onClick={() => addWater(500)} fullWidth>
          <span className="flex flex-col items-center">
            <Plus size={14} />
            <span className="text-xs mt-1">500ml</span>
          </span>
        </Button>
        <Button variant="secondary" onClick={() => addWater(330)} fullWidth>
          <span className="flex flex-col items-center">
            <Plus size={14} />
            <span className="text-xs mt-1">330ml</span>
          </span>
        </Button>
      </div>

      {/* Custom amount */}
      <Card tag="CUSTOM" tagVariant="default">
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Amount in ml"
            className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
          />
          <Button onClick={() => { addWater(Number(customAmount)); setCustomAmount(""); }} className="px-4">
            ADD
          </Button>
        </div>
      </Card>

      {/* Target setting */}
      <Card tag="SETTINGS" tagVariant="default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-green-primary" />
            <span className="text-sm text-text-primary">Daily Target</span>
          </div>
          <div className="flex items-center gap-2">
            {[1500, 2000, 2500, 3000].map((target) => (
              <button
                key={target}
                onClick={() => setDailyTarget(target)}
                className={`px-2 py-1 text-[0.6rem] font-mono border transition-colors
                  ${dailyTarget === target
                    ? "bg-green-primary border-green-primary text-text-primary"
                    : "border-green-dark text-text-secondary"}`}
              >
                {target / 1000}L
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
