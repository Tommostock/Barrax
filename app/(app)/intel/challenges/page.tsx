/* ============================================
   CHALLENGE EVENTS Page
   Multi-day missions with progress tracking.
   Users can create and track challenges.
   ============================================ */

"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import { ArrowLeft, Plus, Trophy } from "lucide-react";
import Link from "next/link";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  target_type: string;
  start_date: string;
  end_date: string;
  completed: boolean;
  xp_reward: number;
}

const TARGET_TYPES = ["workouts", "runs", "distance_km", "xp", "meals"] as const;

const DURATION_OPTIONS = [
  { label: "7 DAYS", days: 7, xp: 100 },
  { label: "14 DAYS", days: 14, xp: 200 },
  { label: "30 DAYS", days: 30, xp: 500 },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ChallengesPage() {
  const supabase = createClient();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<string>("workouts");
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [xpReward, setXpReward] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadChallenges() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("challenge_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setChallenges(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!title.trim() || !targetValue) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    await supabase.from("challenge_events").insert({
      user_id: user.id,
      title: title.trim(),
      description: `${targetValue} ${targetType} in ${durationDays} days`,
      target_value: parseInt(targetValue, 10),
      target_type: targetType,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      xp_reward: xpReward,
    });

    // Reset form
    setTitle("");
    setTargetValue("");
    setTargetType("workouts");
    setDurationDays(7);
    setXpReward(100);
    setShowForm(false);
    setSubmitting(false);

    loadChallenges();
  }

  // Separate active and completed challenges
  const activeChallenges = challenges.filter((c) => !c.completed);
  const completedChallenges = challenges.filter((c) => c.completed);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/intel"
            className="text-text-secondary hover:text-green-light transition-colors min-h-[44px] flex items-center"
          >
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
            Challenge Events
          </h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-green-light hover:text-green-primary transition-colors"
          aria-label="Create challenge"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Create challenge form */}
      {showForm && (
        <Card className="space-y-4">
          <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
            New Challenge
          </h3>

          {/* Title */}
          <div>
            <label className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider block mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Workouts in a Week"
              className="w-full bg-bg-panel-alt border border-green-dark p-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-green-primary outline-none"
            />
          </div>

          {/* Target type */}
          <div>
            <label className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider block mb-1">
              Target Type
            </label>
            <div className="flex flex-wrap gap-2">
              {TARGET_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetType(t)}
                  className={`px-3 py-1.5 border text-xs font-mono uppercase tracking-wider transition-colors ${
                    targetType === t
                      ? "bg-green-primary border-green-primary text-text-primary"
                      : "bg-bg-panel border-green-dark text-text-secondary hover:border-green-primary"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Target value */}
          <div>
            <label className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider block mb-1">
              Target Value
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="e.g. 10"
              min="1"
              className="w-full bg-bg-panel-alt border border-green-dark p-3 font-mono text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-green-primary outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider block mb-1">
              Duration
            </label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => {
                    setDurationDays(opt.days);
                    setXpReward(opt.xp);
                  }}
                  className={`flex-1 px-3 py-2 border text-xs font-mono uppercase tracking-wider transition-colors ${
                    durationDays === opt.days
                      ? "bg-green-primary border-green-primary text-text-primary"
                      : "bg-bg-panel border-green-dark text-text-secondary hover:border-green-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* XP reward preview */}
          <div className="flex items-center justify-between border border-xp-gold bg-bg-panel p-3">
            <span className="text-xs font-heading uppercase tracking-wider text-xp-gold">
              XP Reward
            </span>
            <span className="font-mono text-lg font-bold text-xp-gold">+{xpReward}</span>
          </div>

          {/* Submit */}
          <Button
            fullWidth
            onClick={handleCreate}
            disabled={submitting || !title.trim() || !targetValue}
          >
            {submitting ? "DEPLOYING..." : "CREATE CHALLENGE"}
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      )}

      {/* Empty state */}
      {!loading && challenges.length === 0 && !showForm && (
        <Card>
          <div className="text-center py-8">
            <Trophy size={32} className="text-text-secondary mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-4">
              No challenges yet. Create your first mission.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <span className="flex items-center gap-2">
                <Plus size={16} /> CREATE CHALLENGE
              </span>
            </Button>
          </div>
        </Card>
      )}

      {/* Active challenges */}
      {!loading && activeChallenges.length > 0 && (
        <div className="space-y-2">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            Active Missions
          </p>
          {activeChallenges.map((c) => (
            <Card key={c.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                      {c.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">{c.description}</p>
                  </div>
                  <Tag variant="active">ACTIVE</Tag>
                </div>

                {/* Progress */}
                <ProgressBar
                  value={c.current_value}
                  max={c.target_value}
                  showLabel
                />

                {/* Footer info */}
                <div className="flex items-center justify-between">
                  <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                    {formatDate(c.start_date)} - {formatDate(c.end_date)}
                  </span>
                  <span className="text-xs font-mono font-bold text-xp-gold">
                    +{c.xp_reward} XP
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Completed challenges */}
      {!loading && completedChallenges.length > 0 && (
        <div className="space-y-2">
          <p className="text-[0.55rem] font-mono text-text-secondary uppercase tracking-wider">
            Completed
          </p>
          {completedChallenges.map((c) => (
            <Card key={c.id} className="border-xp-gold">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
                      {c.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">{c.description}</p>
                  </div>
                  <Tag variant="gold">COMPLETE</Tag>
                </div>

                <ProgressBar
                  value={c.current_value}
                  max={c.target_value}
                  color="bg-xp-gold"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[0.55rem] font-mono text-text-secondary uppercase">
                    {formatDate(c.start_date)} - {formatDate(c.end_date)}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-xp-gold">
                    <Trophy size={12} /> +{c.xp_reward} XP
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
