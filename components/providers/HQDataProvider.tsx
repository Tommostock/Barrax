/* ============================================
   HQDataProvider
   Context owner for the HQ (dashboard) data slice.
   Lives at the (app)/layout.tsx level so it survives
   tab switches: when the user navigates HQ -> ASSAULT
   -> HQ, the HQ children unmount and remount but the
   provider persists, so they get the last-known data
   instantly instead of firing a fresh Supabase round
   trip on every mount.

   What it caches:
     - rank               (rank row for RankStrip)
     - todayWorkout       (scheduled workout for TodayStrip)
     - caloriesToday      (food diary sum for TodayStrip)
     - calorieTarget      (profile calorie target)
     - contract           (today's daily contract)
     - op                 (this month's classified op)

   Refresh policy:
     - Fetch once on mount
     - Re-fetch after TTL (30s) if the cache is stale and
       a consumer requests data
     - Re-fetch on mutation events (workout/contract/op
       completion) via CustomEvent listeners
     - Manual refresh() available on the context for
       pull-to-refresh

   Scope discipline: this provider only holds DATA that
   HQ cards display. Mutations (log food, tap Supps,
   etc.) still go through their existing code paths;
   they just fire the relevant event which triggers a
   re-fetch here.
   ============================================ */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  todayLocalISO,
  monthStartLocalISO,
} from "@/lib/missions/date";
import type { Workout } from "@/types";
import type { DailyContract, ClassifiedOp } from "@/types/missions";

interface RankRow {
  current_rank: number;
  total_xp: number;
}

export interface HQSnapshot {
  rank: RankRow | null;
  todayWorkout: Workout | null;
  caloriesToday: number;
  calorieTarget: number;
  contract: DailyContract | null;
  op: ClassifiedOp | null;
  /** User's rank level -- exposed separately because multiple consumers gate on it. */
  rankLevel: number;
}

interface HQDataContextValue {
  /** The cached snapshot, or null if we haven't loaded anything yet. */
  data: HQSnapshot | null;
  /** True while the FIRST fetch is in flight -- consumers use this for skeleton UI. */
  loading: boolean;
  /** Force a re-fetch right now (used by pull-to-refresh). */
  refresh: () => Promise<void>;
}

const EMPTY_SNAPSHOT: HQSnapshot = {
  rank: null,
  todayWorkout: null,
  caloriesToday: 0,
  calorieTarget: 2000,
  contract: null,
  op: null,
  rankLevel: 1,
};

const CACHE_TTL_MS = 30 * 1000;

const HQDataContext = createContext<HQDataContextValue>({
  data: null,
  loading: true,
  refresh: async () => {},
});

/**
 * Hook for HQ components to read the cached snapshot. Returns `data`
 * (which may be stale up to CACHE_TTL_MS), `loading` (true only on
 * the first fetch), and `refresh` for manual reloads.
 */
export function useHQData(): HQDataContextValue {
  return useContext(HQDataContext);
}

export default function HQDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<HQSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  // The actual fetch. Deduped via fetchInFlightRef so concurrent
  // callers share one in-flight request instead of thrashing the
  // network. setData is called once at the end with a fresh snapshot.
  const runFetch = useCallback(async (): Promise<void> => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current;

    const promise = (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setData(EMPTY_SNAPSHOT);
        setLoading(false);
        lastFetchRef.current = Date.now();
        return;
      }

      const today = todayLocalISO();
      const monthStart = monthStartLocalISO();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Load rank first -- contract gating depends on it.
      const rankRes = await supabase
        .from("ranks")
        .select("current_rank, total_xp")
        .eq("user_id", user.id)
        .maybeSingle();
      const rank: RankRow | null = rankRes.data
        ? {
            current_rank: rankRes.data.current_rank,
            total_xp: rankRes.data.total_xp,
          }
        : null;
      const rankLevel = rank?.current_rank ?? 1;

      // Fire everything else in parallel
      const [
        workoutRes,
        profileRes,
        diaryRes,
        contractRes,
        opRes,
      ] = await Promise.all([
        supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .eq("scheduled_date", today)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("calorie_target")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("food_diary")
          .select("calories")
          .eq("user_id", user.id)
          .gte("logged_at", todayStart.toISOString())
          .lte("logged_at", todayEnd.toISOString()),
        rankLevel >= 2
          ? supabase
              .from("daily_contracts")
              .select("*")
              .eq("user_id", user.id)
              .eq("date", today)
              .maybeSingle()
          : Promise.resolve({ data: null as DailyContract | null }),
        supabase
          .from("classified_ops")
          .select("*")
          .eq("user_id", user.id)
          .eq("month_start", monthStart)
          .maybeSingle(),
      ]);

      const caloriesToday = Math.round(
        (diaryRes.data ?? []).reduce((s, r) => s + (r.calories ?? 0), 0),
      );

      setData({
        rank,
        rankLevel,
        todayWorkout: (workoutRes.data as Workout | null) ?? null,
        caloriesToday,
        calorieTarget: profileRes.data?.calorie_target ?? 2000,
        contract: (contractRes.data as DailyContract | null) ?? null,
        op: (opRes.data as ClassifiedOp | null) ?? null,
      });
      setLoading(false);
      lastFetchRef.current = Date.now();
    })().finally(() => {
      fetchInFlightRef.current = null;
    });

    fetchInFlightRef.current = promise;
    return promise;
  }, []);

  // Public refresh -- always bypasses the TTL.
  const refresh = useCallback(async () => {
    await runFetch();
  }, [runFetch]);

  // First load on mount.
  useEffect(() => {
    runFetch();
  }, [runFetch]);

  // Refresh on mutation events. The progress engine and various
  // completion handlers dispatch these -- we hook them all to keep
  // the cache in sync.
  useEffect(() => {
    const events = [
      "contract-complete",
      "classified-op-complete",
      "workout-complete",
      "meal-logged",
      "hq-refresh", // generic "something changed, please reload"
    ];
    function handler() {
      runFetch();
    }
    for (const e of events) {
      window.addEventListener(e, handler);
    }
    return () => {
      for (const e of events) {
        window.removeEventListener(e, handler);
      }
    };
  }, [runFetch]);

  // TTL-based background refresh: if the tab regains visibility and
  // the cache is older than the TTL, re-fetch. This is the "feels
  // instant on tab switch" trick -- the stale data paints first,
  // then the refresh comes in.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      const age = Date.now() - lastFetchRef.current;
      if (age > CACHE_TTL_MS) runFetch();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [runFetch]);

  return (
    <HQDataContext.Provider value={{ data, loading, refresh }}>
      {children}
    </HQDataContext.Provider>
  );
}
