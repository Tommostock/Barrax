/* ============================================
   FUEL hub
   /intel/fuel

   Aggregator screen for everything nutrition-related
   that used to live on separate Intel links:

     - Today's calories vs target (headline)
     - Today's macros (protein / carbs / fat)
     - Water intake (ml vs target)
     - Deep links:
         /rations/diary        full food log
         /intel/nutrition      trend charts
         /rations/water        water log screen
         /rations/shopping     shopping list
         /intel/settings       macro split / calorie target settings

   One screen, glanceable. Users don't need to know
   which deep page holds what -- everything related
   to FUEL is reachable from here.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import BackLink from "@/components/ui/BackLink";
import PullToRefresh from "@/components/ui/PullToRefresh";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import {
  Utensils,
  Droplets,
  PieChart,
  ShoppingCart,
  Settings,
  ChevronRight,
} from "lucide-react";
import { calculateMacroTargets } from "@/lib/macros";

interface FuelSnapshot {
  caloriesToday: number;
  calorieTarget: number;
  proteinToday: number;
  carbsToday: number;
  fatToday: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterToday: number;
  waterTarget: number;
}

export default function FuelHubPage() {
  const supabase = createClient();
  const [data, setData] = useState<FuelSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [diaryRes, waterRes, profileRes] = await Promise.all([
      supabase
        .from("food_diary")
        .select("calories, protein_g, carbs_g, fat_g, quantity")
        .eq("user_id", user.id)
        .gte("logged_at", todayStart.toISOString())
        .lte("logged_at", todayEnd.toISOString()),
      supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", user.id)
        .gte("logged_at", todayStart.toISOString())
        .lte("logged_at", todayEnd.toISOString()),
      supabase
        .from("profiles")
        .select("calorie_target, protein_pct, carb_pct, fat_pct")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const rows = diaryRes.data ?? [];
    const caloriesToday = Math.round(
      rows.reduce((s, r) => s + (r.calories ?? 0), 0),
    );
    const proteinToday = Math.round(
      rows.reduce(
        (s, r) => s + (r.protein_g ?? 0) * (r.quantity ?? 1),
        0,
      ),
    );
    const carbsToday = Math.round(
      rows.reduce((s, r) => s + (r.carbs_g ?? 0) * (r.quantity ?? 1), 0),
    );
    const fatToday = Math.round(
      rows.reduce((s, r) => s + (r.fat_g ?? 0) * (r.quantity ?? 1), 0),
    );

    const calTarget = profileRes.data?.calorie_target ?? 2000;
    const proteinPct = profileRes.data?.protein_pct ?? 30;
    const carbPct = profileRes.data?.carb_pct ?? 40;
    const fatPct = profileRes.data?.fat_pct ?? 30;
    const macros = calculateMacroTargets(calTarget, proteinPct, carbPct, fatPct);

    const waterToday =
      (waterRes.data ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    // Water tracker hardcodes a 2L default, match that here
    const waterTarget = 2000;

    setData({
      caloriesToday,
      calorieTarget: calTarget,
      proteinToday,
      carbsToday,
      fatToday,
      proteinTarget: macros.protein,
      carbsTarget: macros.carbs,
      fatTarget: macros.fat,
      waterToday,
      waterTarget,
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh: load });

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  const caloriePct =
    data && data.calorieTarget > 0
      ? Math.min(100, Math.round((data.caloriesToday / data.calorieTarget) * 100))
      : 0;
  const waterPct =
    data && data.waterTarget > 0
      ? Math.min(100, Math.round((data.waterToday / data.waterTarget) * 100))
      : 0;

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <PullToRefresh pullDistance={pullDistance} refreshing={refreshing} />
      <BackLink href="/intel" label="Intel" />

      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Fuel
      </h2>

      {/* ---- Headline: calories vs target ---- */}
      <Card>
        <div className="flex items-center gap-3 mb-2">
          <Utensils size={18} className="text-green-primary" />
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
            Calories Today
          </h3>
        </div>
        <p className="text-3xl font-bold font-mono text-text-primary tabular-nums">
          {data?.caloriesToday.toLocaleString()}
          <span className="text-text-secondary text-xl">
            {" "}
            / {data?.calorieTarget.toLocaleString()}
          </span>
        </p>
        <div className="mt-3 h-2 bg-bg-input w-full overflow-hidden border border-green-dark">
          <div
            className="h-full bg-green-primary transition-all duration-500"
            style={{ width: `${caloriePct}%` }}
          />
        </div>
        <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider mt-1">
          {caloriePct}% of daily target
        </p>
      </Card>

      {/* ---- Macros grid ---- */}
      <Card>
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-3">
          Macros
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <MacroPill
            label="Protein"
            value={data?.proteinToday ?? 0}
            target={data?.proteinTarget ?? 0}
            colour="text-green-light"
            barColour="bg-green-light"
          />
          <MacroPill
            label="Carbs"
            value={data?.carbsToday ?? 0}
            target={data?.carbsTarget ?? 0}
            colour="text-xp-gold"
            barColour="bg-xp-gold"
          />
          <MacroPill
            label="Fat"
            value={data?.fatToday ?? 0}
            target={data?.fatTarget ?? 0}
            colour="text-sand"
            barColour="bg-sand"
          />
        </div>
      </Card>

      {/* ---- Water ---- */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-green-primary" />
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              Water
            </h3>
          </div>
          <p className="text-sm font-mono font-bold text-text-primary tabular-nums">
            {data?.waterToday.toLocaleString()}
            <span className="text-text-secondary">
              {" "}
              / {data?.waterTarget.toLocaleString()} ml
            </span>
          </p>
        </div>
        <div className="h-2 bg-bg-input w-full overflow-hidden border border-green-dark">
          <div
            className="h-full bg-green-primary transition-all duration-500"
            style={{ width: `${waterPct}%` }}
          />
        </div>
      </Card>

      {/* ---- Deep links ---- */}
      <h3 className="text-xs font-heading uppercase tracking-wider text-text-secondary pt-2">
        Detail
      </h3>
      <FuelLink
        href="/rations/diary"
        icon={Utensils}
        title="Food Diary"
        description="Full log of today's meals"
      />
      <FuelLink
        href="/intel/nutrition"
        icon={PieChart}
        title="Nutrition Trends"
        description="Weekly macro + calorie charts"
      />
      <FuelLink
        href="/rations/water"
        icon={Droplets}
        title="Hydration Protocol"
        description="Log water, adjust target"
      />
      <FuelLink
        href="/rations/shopping"
        icon={ShoppingCart}
        title="Shopping List"
        description="Supply requisition from meal plan"
      />
      <FuelLink
        href="/intel/settings"
        icon={Settings}
        title="Macro Split"
        description="Calorie target + macro ratios"
      />
    </div>
  );
}

// ---------- Subcomponents ----------

function MacroPill({
  label,
  value,
  target,
  colour,
  barColour,
}: {
  label: string;
  value: number;
  target: number;
  colour: string;
  barColour: string;
}) {
  const pct =
    target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <p className="text-[0.55rem] font-mono uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <p
        className={`text-lg font-mono font-bold tabular-nums ${colour}`}
      >
        {value}g
      </p>
      <p className="text-[0.55rem] font-mono text-text-secondary uppercase">
        / {target}g
      </p>
      <div className="mt-1 h-1 bg-bg-input w-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FuelLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="press-scale hover:bg-bg-panel-alt transition-colors">
        <div className="flex items-center gap-3">
          <div className="min-w-[36px] min-h-[36px] bg-bg-panel-alt border border-green-dark flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-green-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              {title}
            </h3>
            <p className="text-[0.65rem] text-text-secondary">{description}</p>
          </div>
          <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
