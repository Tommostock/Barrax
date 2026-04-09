/* ============================================
   Body Tracking Page
   Log weight and body measurements over time.
   Displays trend with a simple chart.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefresh from "@/components/ui/PullToRefresh";
import { ArrowLeft, Plus, Scale } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { WeightLog } from "@/types";

export default function BodyTrackingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(30);

    if (data) setWeightLogs(data as WeightLog[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: loadData });

  async function logWeight() {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: weight,
    });

    if (error) {
      alert(`Failed to log weight: ${error.message}`);
      return;
    }

    // Award XP for logging weight
    await fetch("/api/award-xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10, source: "weight_logged" }),
    });

    setNewWeight("");
    setShowInput(false);
    loadData();
  }

  const latestWeight = weightLogs[0]?.weight_kg;
  const previousWeight = weightLogs[1]?.weight_kg;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  if (loading) {
    return <div className="px-4 py-4 space-y-4"><div className="skeleton h-6 w-32" /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <button onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]">
        <ArrowLeft size={18} /> <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">Body Tracking</h2>
        <Button onClick={() => setShowInput(!showInput)} className="text-xs px-3 py-2">
          <span className="flex items-center gap-1"><Plus size={14} /> LOG</span>
        </Button>
      </div>

      {/* Weight input */}
      {showInput && (
        <Card tag="LOG WEIGHT" tagVariant="active">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Weight in kg"
              className="flex-1 px-4 py-3 bg-bg-input border border-green-dark text-text-primary focus:border-green-primary focus:outline-none text-sm"
            />
            <Button onClick={logWeight} className="px-4">SAVE</Button>
          </div>
        </Card>
      )}

      {/* Current weight */}
      <div className="bg-bg-panel border border-green-dark p-4 text-center">
        <Scale size={24} className="text-green-primary mx-auto mb-2" />
        <p className="text-3xl font-bold font-mono text-text-primary">
          {latestWeight ? `${latestWeight} kg` : "-- kg"}
        </p>
        {weightChange !== null && (
          <p className={`text-sm font-mono mt-1 ${weightChange < 0 ? "text-green-light" : weightChange > 0 ? "text-danger" : "text-text-secondary"}`}>
            {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
          </p>
        )}
        <p className="text-[0.6rem] font-mono text-text-secondary mt-1">CURRENT WEIGHT</p>
      </div>

      {/* Weight trend chart */}
      {weightLogs.length >= 2 && (
        <div className="bg-bg-panel border border-green-dark p-4">
          <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary mb-3">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={[...weightLogs].reverse().map((log) => ({
              date: new Date(log.logged_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              weight: log.weight_kg,
            }))}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7A7A6E" }} axisLine={{ stroke: "#2D4220" }} tickLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#7A7A6E" }} axisLine={{ stroke: "#2D4220" }} tickLine={false} width={35} />
              <Tooltip contentStyle={{ backgroundColor: "#141A14", border: "1px solid #2D4220", fontSize: 12 }} labelStyle={{ color: "#C4B090" }} />
              <Line type="monotone" dataKey="weight" stroke="#4A6B3A" strokeWidth={2} dot={{ fill: "#4A6B3A", r: 3 }} activeDot={{ fill: "#6B8F5A", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight history */}
      <h3 className="text-sm font-heading uppercase tracking-wider text-text-secondary">History</h3>
      {weightLogs.length === 0 ? (
        <Card><p className="text-xs text-text-secondary text-center py-4">No weight entries yet. Log your first weight above.</p></Card>
      ) : (
        <div className="space-y-1">
          {weightLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-bg-panel border border-green-dark/50">
              <span className="text-xs font-mono text-text-secondary">
                {new Date(log.logged_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
              <span className="text-sm font-mono font-bold text-text-primary">{log.weight_kg} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
