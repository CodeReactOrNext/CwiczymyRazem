import { cn } from "assets/lib/utils";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { usePracticeSummary, type SummaryMode } from "../hooks/usePracticeSummary";
import { useState } from "react";
import {
  Brain,
  Calendar,
  CalendarDays,
  Flame,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { DailySummaryResponse, WeeklySummaryResponse } from "../types/summary.types";

const MOOD_CONFIG: Record<
  DailySummaryResponse["mood"],
  { label: string; color: string; bg: string; icon: typeof Flame }
> = {
  excellent: { label: "On fire",      color: "text-orange-400", bg: "bg-orange-500/10", icon: Flame },
  good:      { label: "Great session",color: "text-emerald-400",bg: "bg-emerald-500/10",icon: TrendingUp },
  solid:     { label: "Solid work",   color: "text-main",       bg: "bg-main/10",       icon: Star },
  light:     { label: "Light day",    color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Zap },
  rest:      { label: "Rest day",     color: "text-zinc-400",   bg: "bg-zinc-700/30",   icon: Brain },
};

const WEEK_CONFIG: Record<
  WeeklySummaryResponse["weekScore"],
  { label: string; color: string; bg: string }
> = {
  excellent:    { label: "Exceptional week", color: "text-orange-400",  bg: "bg-orange-500/10" },
  strong:       { label: "Strong week",      color: "text-emerald-400", bg: "bg-emerald-500/10" },
  good:         { label: "Good progress",    color: "text-main",        bg: "bg-main/10" },
  inconsistent: { label: "Inconsistent",     color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  minimal:      { label: "Minimal practice", color: "text-zinc-400",    bg: "bg-zinc-700/30" },
};

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-2.5 w-3/4 rounded-full bg-zinc-700/60" />
      <div className="h-2.5 w-full rounded-full bg-zinc-700/60" />
      <div className="h-2.5 w-2/3 rounded-full bg-zinc-700/60" />
    </div>
  );
}

export const SidebarSummaryCard = () => {
  const [mode, setMode] = useState<SummaryMode>("daily");
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);

  const { dailySummary, weeklySummary, isLoading, error, regenerate } =
    usePracticeSummary({
      userAuth: userAuth ?? "",
      userLevel: userStats?.lvl ?? 1,
      streak: userStats?.actualDayWithoutBreak ?? 0,
      mode,
    });

  const daily = dailySummary;
  const weekly = weeklySummary;
  const moodCfg = daily ? MOOD_CONFIG[daily.mood] : null;
  const weekCfg = weekly ? WEEK_CONFIG[weekly.weekScore] : null;
  const MoodIcon = moodCfg?.icon ?? Brain;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-900/50 p-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain size={13} className="text-zinc-400" />
          <span className="text-xs font-semibold tracking-wide text-zinc-300">
            Summary
          </span>
          <div className="flex items-center gap-0.5 opacity-80">
            <Sparkles size={10} className="text-link" />
            <span className="text-[10px] font-medium text-link leading-none">AI</span>
          </div>
        </div>

        <button
          onClick={regenerate}
          disabled={isLoading}
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
          title="Regenerate"
        >
          <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-0.5 p-0.5 rounded-lg bg-zinc-800/60 border border-white/5">
        <button
          onClick={() => setMode("daily")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-medium transition-all",
            mode === "daily"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Calendar size={12} />
          Yesterday
        </button>
        <button
          onClick={() => setMode("weekly")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-medium transition-all",
            mode === "weekly"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <CalendarDays size={12} />
          Week
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[60px]">
        {isLoading && <Skeleton />}

        {!isLoading && error && (
          <p className="text-[10px] text-zinc-500 leading-snug">{error}</p>
        )}

        {!isLoading && !error && mode === "daily" && daily && (
          <div className="space-y-2">
            {/* Mood badge */}
            <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md", moodCfg?.bg)}>
              <MoodIcon size={10} className={moodCfg?.color} />
              <span className={cn("text-[10px] font-semibold", moodCfg?.color)}>
                {moodCfg?.label}
              </span>
            </div>

            {/* Summary text - truncated to 2 lines */}
            <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3">
              {daily.summary}
            </p>

            {/* Tip */}
            {daily.highlight && (
              <div className="flex items-start gap-1.5 rounded-lg bg-zinc-800/50 px-2 py-1.5">
                <Sparkles size={9} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2">
                  {daily.highlight}
                </p>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && mode === "weekly" && weekly && (
          <div className="space-y-2">
            {/* Week score badge */}
            <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md", weekCfg?.bg)}>
              <CalendarDays size={10} className={weekCfg?.color} />
              <span className={cn("text-[10px] font-semibold", weekCfg?.color)}>
                {weekCfg?.label}
              </span>
            </div>

            {/* Summary text */}
            <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3">
              {weekly.overview}
            </p>

            {/* Tip */}
            {weekly.highlight && (
              <div className="flex items-start gap-1.5 rounded-lg bg-zinc-800/50 px-2 py-1.5">
                <Sparkles size={9} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2">
                  {weekly.highlight}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {userStats && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
          <div className="flex items-center gap-1">
            <Flame size={9} className="text-orange-400" />
            <span className="text-[9px] font-black text-zinc-500">
              {userStats.actualDayWithoutBreak}d
            </span>
          </div>
          <div className="w-px h-2.5 bg-zinc-700" />
          <div className="flex items-center gap-1">
            <Star size={9} className="text-amber-400" />
            <span className="text-[9px] font-black text-zinc-500">
              Lv.{userStats.lvl}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
