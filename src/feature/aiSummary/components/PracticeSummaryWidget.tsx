import { cn } from "assets/lib/utils";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import {
  usePracticeSummary,
  type SummaryMode,
} from "../hooks/usePracticeSummary";
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

// ─── Mood / Score config ───────────────────────────────────────────────────

const MOOD_CONFIG: Record<
  DailySummaryResponse["mood"],
  { label: string; color: string; gradient: string; icon: typeof Flame }
> = {
  excellent: {
    label: "On fire",
    color: "text-orange-400",
    gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    icon: Flame,
  },
  good: {
    label: "Great session",
    color: "text-emerald-400",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    icon: TrendingUp,
  },
  solid: {
    label: "Solid work",
    color: "text-cyan-400",
    gradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
    icon: Star,
  },
  light: {
    label: "Light day",
    color: "text-violet-400",
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
    icon: Zap,
  },
  rest: {
    label: "Rest day",
    color: "text-zinc-400",
    gradient: "from-zinc-700/20 to-transparent",
    icon: Brain,
  },
};

const WEEK_SCORE_CONFIG: Record<
  WeeklySummaryResponse["weekScore"],
  { label: string; color: string; gradient: string }
> = {
  excellent: {
    label: "Exceptional week",
    color: "text-orange-400",
    gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
  },
  strong: {
    label: "Strong week",
    color: "text-emerald-400",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  good: {
    label: "Good progress",
    color: "text-cyan-400",
    gradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
  },
  inconsistent: {
    label: "Inconsistent week",
    color: "text-yellow-400",
    gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
  },
  minimal: {
    label: "Minimal practice",
    color: "text-zinc-400",
    gradient: "from-zinc-700/20 to-transparent",
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3.5 w-3/4 rounded-full bg-zinc-700/60" />
      <div className="h-3.5 w-full rounded-full bg-zinc-700/60" />
      <div className="h-3.5 w-5/6 rounded-full bg-zinc-700/60" />
      <div className="mt-4 h-8 w-48 rounded-lg bg-zinc-700/40" />
    </div>
  );
}

// ─── Time badge ────────────────────────────────────────────────────────────

function TimeBadge({
  minutes,
  label,
  color,
}: {
  minutes: number;
  label: string;
  color: string;
}) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const display = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-base font-black tabular-nums", color)}>
        {display}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

// ─── Category bar ─────────────────────────────────────────────────────────

function CategoryBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  if (pct === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[10px] font-bold uppercase tracking-widest text-zinc-500 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-zinc-500 w-8 text-right tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

// ─── Daily content ────────────────────────────────────────────────────────

function DailyContent({
  summary,
}: {
  summary: DailySummaryResponse;
}) {
  const cfg = MOOD_CONFIG[summary.mood] ?? MOOD_CONFIG.solid;
  const Icon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Mood badge */}
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md bg-zinc-800/60", cfg.color)}>
          <Icon size={16} />
        </div>
        <span className={cn("text-sm font-semibold", cfg.color)}>
          {cfg.label}
        </span>
      </div>

      {/* AI narrative */}
      <p className="text-sm leading-relaxed text-zinc-300 font-medium">
        {summary.summary}
      </p>

      {/* Tip */}
      {summary.highlight && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 mt-4">
          <Sparkles size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-zinc-300 leading-snug">
            {summary.highlight}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Weekly bars ──────────────────────────────────────────────────────────

const SHORT_DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function WeeklyBars({ bestDay }: { bestDay: string | null }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div className="flex items-end gap-1 h-8">
      {days.map((day, i) => {
        const dayName = DAY_NAMES_FULL[day.getDay()];
        const isBest = bestDay && dayName === bestDay;
        const isToday = isSameDay(day, today);
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-0.5 flex-1"
          >
            <div
              className={cn(
                "w-full rounded-sm transition-all",
                isBest
                  ? "h-6 bg-orange-500/70"
                  : isToday
                  ? "h-4 bg-cyan-500/50"
                  : "h-2 bg-zinc-700/60"
              )}
            />
            <span
              className={cn(
                "text-[8px] font-bold",
                isToday ? "text-cyan-400" : "text-zinc-600"
              )}
            >
              {SHORT_DAYS[day.getDay()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Weekly content ───────────────────────────────────────────────────────

function WeeklyContent({
  summary,
}: {
  summary: WeeklySummaryResponse;
}) {
  const cfg =
    WEEK_SCORE_CONFIG[summary.weekScore] ?? WEEK_SCORE_CONFIG.good;

  return (
    <div className="space-y-4">
      {/* Week score badge */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-zinc-800/60">
          <CalendarDays size={16} className={cfg.color} />
        </div>
        <span className={cn("text-sm font-semibold", cfg.color)}>
          {cfg.label}
        </span>
      </div>

      {/* Mini week bars */}
      <WeeklyBars bestDay={summary.bestDay} />

      {/* AI narrative */}
      <p className="text-sm leading-relaxed text-zinc-300 font-medium">
        {summary.overview}
      </p>

      {/* Highlight tip */}
      {summary.highlight && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 mt-4">
          <Sparkles size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-zinc-300 leading-snug">
            {summary.highlight}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────

export const PracticeSummaryWidget = () => {
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

  const activeSummary = mode === "daily" ? dailySummary : weeklySummary;

  // Gradient based on current summary mood/score
  let gradientClass = "from-zinc-800/30 to-zinc-900/10";
  if (mode === "daily" && dailySummary) {
    gradientClass = MOOD_CONFIG[dailySummary.mood]?.gradient ?? gradientClass;
  } else if (mode === "weekly" && weeklySummary) {
    gradientClass =
      WEEK_SCORE_CONFIG[weeklySummary.weekScore]?.gradient ?? gradientClass;
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border border-white/[0.06] bg-gradient-to-br p-4 transition-all duration-700",
        "bg-zinc-900/60 backdrop-blur-sm shadow-lg",
        gradientClass
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-zinc-800/60">
            <Brain size={15} className="text-zinc-300" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-zinc-200">
            Practice Summary
          </span>
          <div className="flex items-center gap-1 opacity-80">
            <Sparkles size={11} className="text-violet-400" />
            <span className="text-xs font-medium text-violet-400 leading-none">
              AI
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-800/60 border border-white/5">
          <button
            onClick={() => setMode("daily")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              mode === "daily"
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Calendar size={12} />
            Yday
          </button>
          <button
            onClick={() => setMode("weekly")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              mode === "weekly"
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <CalendarDays size={12} />
            Week
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[120px]">
        {isLoading && <SummarySkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-xs text-zinc-500">{error}</p>
            <button
              onClick={regenerate}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {mode === "daily" &&
              (dailySummary ? (
                <DailyContent summary={dailySummary} />
              ) : null)}

            {mode === "weekly" &&
              (weeklySummary ? (
                <WeeklyContent summary={weeklySummary} />
              ) : null)}
          </>
        )}
      </div>

      {/* Footer: stats row + regenerate */}
      {activeSummary && !isLoading && (
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userStats && (
              <>
                <div className="flex items-center gap-1">
                  <Flame size={11} className="text-orange-400" />
                  <span className="text-[10px] font-black text-zinc-400">
                    {userStats.actualDayWithoutBreak}d streak
                  </span>
                </div>
                <div className="w-px h-3 bg-zinc-700" />
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-amber-400" />
                  <span className="text-[10px] font-black text-zinc-400">
                    Lv. {userStats.lvl}
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={regenerate}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors rounded-md px-2 py-1 hover:bg-zinc-800/60",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};
