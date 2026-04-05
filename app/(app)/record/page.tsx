/* ============================================
   RECORD Page (Service Record)
   Shows rank, badges, and profile overview.
   Placeholder until Phase 5 builds gamification.
   ============================================ */

import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import ProgressBar from "@/components/ui/ProgressBar";
import { RANK_THRESHOLDS } from "@/types";
import { Settings, Download, Shield } from "lucide-react";
import Link from "next/link";

export default async function RecordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const { data: rank } = await supabase
    .from("ranks")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  const currentRank = RANK_THRESHOLDS[(rank?.current_rank ?? 1) - 1];
  const nextRank = RANK_THRESHOLDS[rank?.current_rank ?? 1];

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-heading uppercase tracking-wider text-sand">
        Service Record
      </h2>

      {/* Profile card */}
      <Card className="camo-bg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-heading uppercase tracking-wider text-sand">
                {profile?.name ?? "Operative"}
              </p>
              <Tag variant="gold">{currentRank?.title ?? "Recruit"}</Tag>
            </div>
            <Shield size={40} className="text-green-dark" />
          </div>

          {/* XP progress to next rank */}
          <ProgressBar
            value={rank?.total_xp ?? 0}
            max={nextRank?.xp ?? 200}
            color="bg-xp-gold"
            showLabel
          />
          <p className="text-[0.65rem] text-text-secondary font-mono mt-1">
            {rank?.total_xp ?? 0} / {nextRank?.xp ?? 200} XP to {nextRank?.title ?? "Private"}
          </p>
        </div>
      </Card>

      {/* Badges section — placeholder */}
      <div>
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand mb-3">
          Badges & Achievements
        </h3>
        <Card>
          <p className="text-xs text-text-secondary text-center py-4">
            Complete missions and hit milestones to earn badges.
          </p>
        </Card>
      </div>

      {/* Settings link */}
      <Link href="/record/settings">
        <Card className="flex items-center gap-3 hover:bg-bg-panel-alt transition-colors">
          <Settings size={18} className="text-green-primary" />
          <div>
            <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
              Base Operations
            </h3>
            <p className="text-xs text-text-secondary">Settings and preferences</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
