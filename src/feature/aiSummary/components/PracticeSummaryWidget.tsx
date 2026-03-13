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
import { useEffect, useState } from "react";
import {
  Brain,
  Calendar,
  CalendarDays,
  Flame,
  RefreshCw,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import type { DailySummaryResponse, PromptConfig, WeeklySummaryResponse } from "../types/summary.types";

const PROMPT_CONFIG_KEY = "practice-summary-prompt-config";
const GOAL_MAX_LENGTH = 150;

const DEFAULT_CONFIG: PromptConfig = {
  practiceStyle: "hobby",
  goal: "",
};

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
    color: "text-main",
    gradient: "from-main/10 via-main/5 to-transparent",
    icon: Star,
  },
  light: {
    label: "Light day",
    color: "text-yellow-400",
    gradient: "from-yellow-500/10 via-yellow-500/5 to-transparent",
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
    color: "text-main",
    gradient: "from-main/10 via-main/5 to-transparent",
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
      {/* Week score + best day */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="p-1.5 rounded-md bg-zinc-800/60">
          <CalendarDays size={16} className={cfg.color} />
        </div>
        <span className={cn("text-sm font-semibold", cfg.color)}>
          {cfg.label}
        </span>
        {summary.bestDay && (
          <>
            <div className="w-px h-3 bg-zinc-700" />
            <span className="text-xs text-zinc-500">
              Best: <span className="font-medium text-zinc-400">{summary.bestDay}</span>
            </span>
          </>
        )}
      </div>

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

// ─── Config panel ─────────────────────────────────────────────────────────

function ConfigPanel({
  config,
  onSave,
  onClose,
}: {
  config: PromptConfig;
  onSave: (c: PromptConfig) => void;
  onClose: () => void;
}) {
  const [style, setStyle] = useState(config.practiceStyle);
  const [goal, setGoal] = useState(config.goal);

  const handleSave = () => {
    onSave({ practiceStyle: style, goal: goal.slice(0, GOAL_MAX_LENGTH) });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-200">AI Coach Settings</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Practice style */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Practice style</span>
        <div className="flex gap-2">
          <button
            onClick={() => setStyle("hobby")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all",
              style === "hobby"
                ? "bg-link/15 border-link/40 text-link"
                : "bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300"
            )}
          >
            Hobby
          </button>
          <button
            onClick={() => setStyle("professional")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all",
              style === "professional"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300"
            )}
          >
            Professional
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 leading-snug">
          {style === "professional"
            ? "Coach will be direct, technically precise, and hold you to a high standard."
            : "Coach will be warm, encouraging, and focused on fun and consistency."}
        </p>
      </div>

      {/* Goal */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your goal</span>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value.slice(0, GOAL_MAX_LENGTH))}
          placeholder="e.g. I want to learn fingerpicking and play folk songs"
          className="w-full bg-zinc-800/60 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 resize-none outline-none focus:border-link/40 transition-colors"
          rows={2}
        />
        <div className="flex justify-between">
          <p className="text-[10px] text-zinc-600">AI won&apos;t criticize areas outside your goal.</p>
          <span className="text-[10px] text-zinc-600 tabular-nums">{goal.length}/{GOAL_MAX_LENGTH}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 rounded-lg text-xs font-bold bg-link/20 border border-link/30 text-link hover:bg-link/30 transition-colors"
      >
        Save & regenerate
      </button>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────

export const PracticeSummaryWidget = () => {
  const [mode, setMode] = useState<SummaryMode>("daily");
  const [showConfig, setShowConfig] = useState(false);
  const [promptConfig, setPromptConfig] = useState<PromptConfig>(DEFAULT_CONFIG);
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROMPT_CONFIG_KEY);
      if (stored) setPromptConfig(JSON.parse(stored) as PromptConfig);
    } catch {
      // ignore
    }
  }, []);

  const handleSaveConfig = (newConfig: PromptConfig) => {
    setPromptConfig(newConfig);
    try {
      localStorage.setItem(PROMPT_CONFIG_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const { dailySummary, weeklySummary, isLoading, error, regenerate } =
    usePracticeSummary({
      userAuth: userAuth ?? "",
      userLevel: userStats?.lvl ?? 1,
      streak: userStats?.actualDayWithoutBreak ?? 0,
      mode,
      promptConfig,
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
            <Sparkles size={11} className="text-link" />
            <span className="text-xs font-medium text-link leading-none">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Config button */}
          <button
            onClick={() => setShowConfig((v) => !v)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              showConfig
                ? "bg-link/20 text-link"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
            )}
            title="AI Coach settings"
          >
            <Settings size={13} />
          </button>

          {/* Mode toggle */}
          {!showConfig && (
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
                Yesterday
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
          )}
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <ConfigPanel
          config={promptConfig}
          onSave={(newConfig) => {
            handleSaveConfig(newConfig);
            setShowConfig(false);
            regenerate();
          }}
          onClose={() => setShowConfig(false)}
        />
      )}

      {/* Content */}
      {!showConfig && (
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
      )}

      {/* Footer: stats row + regenerate */}
      {!showConfig && activeSummary && !isLoading && (
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
