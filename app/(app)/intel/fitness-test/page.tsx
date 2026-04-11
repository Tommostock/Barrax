/* ============================================
   Physical Fitness Test (PFT) Hub
   /intel/fitness-test

   Three independent tests, each on its own card:
   - Push-Up Max   (count-based, opens PushUpTestModal)
   - Plank Hold    (timer-based, opens PlankTestModal)
   - 1.5-Mile Run  (deep-links to the run tracker with
                    ?challenge=2414&source=pft so the result
                    writes both a runs row AND a
                    fitness_test_results row)

   Each card shows current PR, last-taken date, and a mini
   trajectory sparkline. Header paints an OVERDUE tag when
   any test is >= 90 days old.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import PushUpTestModal from "@/components/fitness/PushUpTestModal";
import PlankTestModal from "@/components/fitness/PlankTestModal";
import {
  ArrowLeft,
  Dumbbell,
  Timer,
  Footprints,
  Calendar,
  TrendingUp,
  Target as TargetIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import {
  loadFitnessTestSummaries,
  formatTestValue,
  hasOverdueTest,
} from "@/lib/fitness/tests";
import { FITNESS_TEST_META, type FitnessTestType, type FitnessTestSummary } from "@/types";
import { notifyPersonalRecord } from "@/lib/notifications";

const TEST_ICON: Record<FitnessTestType, React.ComponentType<{ size?: number; className?: string }>> = {
  push_up_max: Dumbbell,
  plank_hold: Timer,
  run_1500m: Footprints,
};

const TEST_ORDER: FitnessTestType[] = ["push_up_max", "plank_hold", "run_1500m"];

function daysAgoLabel(days: number | null): string {
  if (days === null) return "Never taken";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

export default function FitnessTestHubPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<FitnessTestType, FitnessTestSummary> | null>(null);
  const [pushUpOpen, setPushUpOpen] = useState(false);
  const [plankOpen, setPlankOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const s = await loadFitnessTestSummaries(user.id);
    setSummaries(s);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  function onTestSaved(type: FitnessTestType) {
    return ({ value, isPR }: { value: number; isPR: boolean }) => {
      const meta = FITNESS_TEST_META[type];
      const display = formatTestValue(value, meta.unit);
      if (isPR) {
        notifyPersonalRecord(meta.label, display);
        setFlash(`NEW PR — ${meta.label}: ${display}`);
      } else {
        setFlash(`${meta.label} logged: ${display}`);
      }
      setTimeout(() => setFlash(null), 4000);
      load();
    };
  }

  function startTest(type: FitnessTestType) {
    if (type === "push_up_max") setPushUpOpen(true);
    else if (type === "plank_hold") setPlankOpen(true);
    else router.push("/missions/run?challenge=2414&source=pft");
  }

  const overdue = summaries ? hasOverdueTest(summaries) : false;

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-36 w-full" />
        <div className="skeleton h-36 w-full" />
        <div className="skeleton h-36 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <button
        onClick={() => router.push("/intel")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft size={18} />
        <span className="text-xs font-mono uppercase">Intel</span>
      </button>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
          Physical Assessment
        </h2>
        {overdue ? (
          <Tag variant="danger">OVERDUE</Tag>
        ) : (
          <Tag variant="active">CURRENT</Tag>
        )}
      </div>

      <p className="text-xs text-text-secondary">
        Three benchmark tests measure your baseline fitness. Retest every 90 days to track trajectory.
      </p>

      {flash && (
        <div className="bg-bg-panel border border-xp-gold p-3">
          <p className="text-xs font-mono uppercase tracking-wider text-xp-gold">{flash}</p>
        </div>
      )}

      <div className="space-y-3">
        {TEST_ORDER.map((type) => {
          const meta = FITNESS_TEST_META[type];
          const summary = summaries?.[type];
          const Icon = TEST_ICON[type];
          const bestValue = summary?.best?.value ?? null;
          const isOverdue =
            (summary?.days_since_latest ?? Number.MAX_SAFE_INTEGER) >= 90;

          return (
            <Card key={type}>
              <div className="flex items-start gap-3">
                <div className="min-w-[44px] min-h-[44px] bg-bg-panel-alt border border-green-dark flex items-center justify-center">
                  <Icon size={20} className="text-xp-gold" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                      {meta.label}
                    </h3>
                    {isOverdue && summary?.latest && (
                      <Tag variant="danger">DUE</Tag>
                    )}
                  </div>

                  {/* Best value */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-heading text-xp-gold tabular-nums">
                      {bestValue !== null ? formatTestValue(bestValue, meta.unit) : "—"}
                    </span>
                    <span className="text-[0.65rem] font-mono uppercase tracking-wider text-text-secondary">
                      {bestValue !== null ? "BEST" : "NO RECORD"}
                    </span>
                  </div>

                  {/* Last taken */}
                  <p className="text-[0.6rem] font-mono text-text-secondary flex items-center gap-1 mt-1 uppercase tracking-wider">
                    <Calendar size={10} />
                    {daysAgoLabel(summary?.days_since_latest ?? null)}
                  </p>

                  {/* Trajectory sparkline (only if >=2 results) */}
                  {summary && summary.history.length >= 2 && (
                    <div className="mt-3 h-10 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.history}>
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#B8A04A"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {summary && summary.history.length < 2 && (
                    <p className="text-[0.6rem] font-mono text-text-secondary uppercase tracking-wider mt-3 flex items-center gap-1">
                      <TrendingUp size={10} /> Take the test {summary.history.length === 0 ? "to set your baseline" : "again to see your trajectory"}
                    </p>
                  )}

                  {/* START button */}
                  <div className="mt-3">
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => startTest(type)}
                    >
                      START TEST
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <TargetIcon size={18} className="text-green-light mt-1" />
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              How to use this
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Take each test under fresh conditions (morning, well-rested, warmed up) so results
              stay comparable. The 1.5-mile run uses the run tracker with auto-stop at 2,414 m.
              Every attempt is saved — the sparkline shows your trajectory over time.
            </p>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <PushUpTestModal
        isOpen={pushUpOpen}
        onClose={() => setPushUpOpen(false)}
        onSaved={onTestSaved("push_up_max")}
      />
      <PlankTestModal
        isOpen={plankOpen}
        onClose={() => setPlankOpen(false)}
        onSaved={onTestSaved("plank_hold")}
      />
    </div>
  );
}
