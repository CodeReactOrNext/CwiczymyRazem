import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { HeroPattern } from "components/UI/HeroBanner";
import type { AchievementList } from "feature/achievements";
import { AchievementCard, useAchievementContext } from "feature/achievements";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Brain, Ear, Flame, Hand, Moon, Music, RotateCcw, Sparkles, Trophy } from "lucide-react";
import Router from "next/router";
import { useMemo } from "react";
import {
  Area, AreaChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, ResponsiveContainer, XAxis,
} from "recharts";
import type { StatisticsDataInterface } from "types/api.types";
import { getDailyStreakMultiplier, getReconciledStreak } from "utils/gameLogic";

import { useRatingPopUp } from "./hooks/useRatingPopUp";

// ─────────────────────────────────────────────────────────────────────────────
// Post-session summary. Styleguide: colour = meaning. Neutral zinc base, cyan as
// the single dominant accent (gems / level / XP / data). Sparing accents only
// where they carry meaning: amber = Fame, orange = streak, amber = achievements.
// ─────────────────────────────────────────────────────────────────────────────

const MIN = 60 * 1000;
const DAILY_GOAL_MIN = 30; // goal line on the weekly chart

type ActivityDay = {
  date: string;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
};

type CatKey = "technique" | "theory" | "hearing" | "creativity";

const CATS: { key: CatKey; label: string; field: keyof ActivityDay; Icon: typeof Hand }[] = [
  { key: "technique",  label: "Technique",  field: "techniqueTime",  Icon: Hand  },
  { key: "theory",     label: "Theory",     field: "theoryTime",     Icon: Brain },
  { key: "hearing",    label: "Hearing",    field: "hearingTime",    Icon: Ear   },
  { key: "creativity", label: "Creativity", field: "creativityTime", Icon: Music },
];

const CAT_BY_KEY = Object.fromEntries(CATS.map((c) => [c.key, c]));

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`);
const prettify = (id: string) => id.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const dayStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface RatingPopUpProps {
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  onClick?: (val: any) => void;
  activityData?: ActivityDay[];
  hideWrapper?: boolean;
  onRestart?: () => void;
  sessionTitle?: string;
  songTitle?: string;
  songArtist?: string;
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg bg-zinc-900/40 p-7 md:p-8", className)}>{children}</div>;
}

function CardHeading({ icon, children, suffix }: { icon?: React.ReactNode; children: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {icon && <span className="text-zinc-400">{icon}</span>}
      <h3 className="text-sm font-semibold text-zinc-300">{children}</h3>
      {suffix}
    </div>
  );
}

const RatingPopUpLayout = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  onClick,
  activityData = [],
  hideWrapper = false,
  onRestart,
  sessionTitle,
  songTitle,
  songArtist,
}: RatingPopUpProps) => {
  const {
    currentLevel,
    displayedPoints,
    topRef,
    isGetNewLevel,
    newAchievements,
    prevProgressPercent,
    currProgressPercent,
    sessionBreakdown,
  } = useRatingPopUp({ ratingData, currentUserStats, previousUserStats, activityData });

  const fame = ratingData.fameEarned ?? 0;
  const isRest = ratingData.totalPoints <= 0;

  const handleContinue = () => (onClick ? onClick(false) : Router.push("/dashboard"));

  // ── derived data ──
  // Same source of truth as the header / user tooltip: reconcile the stored
  // counter against the local-time activity log (getReconciledStreak).
  const { dayWithoutBreak: streak, didPracticeToday } = getReconciledStreak({
    actualDayWithoutBreak: currentUserStats.actualDayWithoutBreak ?? 0,
    lastReportDate: currentUserStats.lastReportDate ?? "",
    reportDates: activityData.map((d) => d.date),
  });
  const streakBonusPct = Math.round(getDailyStreakMultiplier(streak) * 100);

  const skillGains = Object.entries(ratingData.skillPointsGained ?? {}).filter(([, v]) => v > 0);

  const sessionTimeMs = ratingData.bonusPoints?.time ?? 0;

  // weekly chart — last 7 calendar days.
  // Timezone-safe: every report instant is bucketed by its *local* calendar day
  // (dayStr → getFullYear/Month/Date), the exact basis used by the activity
  // heatmap and getReconciledStreak — so a session never drifts to a neighbour
  // day when viewed from another timezone.
  const weekData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const d of activityData) {
      const key = dayStr(new Date(d.date));
      const mins = (d.techniqueTime + d.theoryTime + d.hearingTime + d.creativityTime) / MIN;
      byDay.set(key, (byDay.get(key) ?? 0) + mins);
    }
    const todayKey = dayStr(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const key = dayStr(d);
      return {
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: Math.round(byDay.get(key) ?? 0),
        isToday: key === todayKey,
      };
    });
  }, [activityData]);
  const weekTotalMin = weekData.reduce((acc, d) => acc + d.minutes, 0);

  // skill balance — last 7 days vs previous 7 days
  const { radarData, radarRows } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = (back: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - back);
      return dayStr(d);
    };
    const lastStart = start(6); // last 7 incl. today
    const prevStart = start(13);
    const prevEnd = start(7);

    const sum = (s: string, e: string) => {
      const acc: Record<CatKey, number> = { technique: 0, theory: 0, hearing: 0, creativity: 0 };
      for (const d of activityData) {
        const key = dayStr(new Date(d.date));
        if (key >= s && key <= e) {
          acc.technique += d.techniqueTime;
          acc.theory += d.theoryTime;
          acc.hearing += d.hearingTime;
          acc.creativity += d.creativityTime;
        }
      }
      return acc;
    };

    const cur = sum(lastStart, dayStr(today));
    const prv = sum(prevStart, prevEnd);

    const radarData = CATS.map((c) => {
      const max = Math.max(cur[c.key], prv[c.key], 1);
      return {
        cat: c.label,
        prev: Math.round((prv[c.key] / max) * 100),
        current: Math.round((cur[c.key] / max) * 100),
      };
    });
    const radarRows = CATS.map((c) => ({
      ...c,
      curMin: Math.round(cur[c.key] / MIN),
      deltaMin: Math.round((cur[c.key] - prv[c.key]) / MIN),
    }));
    return { radarData, radarRows };
  }, [activityData]);

  const dateLabel = new Date(ratingData.reportDate).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long",
  });

  // ── render helpers ──

  const renderWeeklyDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null || index !== weekData.length - 1) return <g key={`dot-${index}`} />;
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill="#22d3ee" stroke="#09090b" strokeWidth={2} />;
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8",
        !hideWrapper && "pb-32 pt-16 sm:pb-10 sm:pt-6"
      )}
    >
      <div ref={topRef} />

      {/* ── Session header ── */}
      <Card className="flex items-center justify-between gap-4 py-5">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-100">{sessionTitle || "Session summary"}</p>
          {songTitle && (
            <p className="truncate text-sm text-zinc-400">
              {songArtist ? `${songArtist} — ` : ""}{songTitle}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right text-sm">
          <p className="text-zinc-300">{dateLabel}</p>
        </div>
      </Card>

      {isRest ? (
        /* ── Rest-day hero ── */
        <div className="relative overflow-hidden rounded-lg bg-zinc-900/60 px-7 py-16 text-center md:px-10">
          <HeroPattern className="opacity-[0.03]" maskImage="radial-gradient(ellipse at top, black 10%, transparent 70%)" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
              <Moon className="h-7 w-7" />
            </div>
            <p className="text-xl font-semibold text-zinc-100">Rest day</p>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Recovery counts too — your {streak}-day streak is safe. Come back tomorrow for more points.
            </p>
            <Button onClick={handleContinue} className="mt-2 gap-2 bg-white font-semibold text-zinc-950 hover:bg-zinc-200">
              Back to dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Hero ── */}
          <div className="relative overflow-hidden rounded-lg bg-zinc-900/60 px-7 py-12 text-center md:px-10 md:py-16">
            <HeroPattern className="opacity-[0.035]" maskImage="radial-gradient(ellipse at top, black 10%, transparent 70%)" />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
            />

            <div className="relative">
              <p className="text-sm font-medium text-zinc-400">Great progress!</p>

              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="font-teko text-8xl font-bold leading-none tabular-nums text-cyan-400">
                  +{displayedPoints}
                </span>
                <img src="/images/points.png" alt="points" className="h-12 w-12 object-contain" />
              </div>

              {fame > 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-3 py-1 text-amber-400">
                  <img src="/images/coin.png" alt="Fame" className="h-4 w-4 object-contain" />
                  <span className="text-sm font-bold tabular-nums">+{fame}</span>
                  <span className="text-sm font-medium">Fame</span>
                </div>
              )}

              {skillGains.length > 0 && (
                <div className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-2.5">
                  {skillGains.map(([key, points], i) => {
                    const cat = CAT_BY_KEY[key];
                    const Icon = cat?.Icon;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="flex items-center gap-2 rounded bg-zinc-800/50 px-3.5 py-2"
                      >
                        {Icon && <Icon size={14} className="text-zinc-400" />}
                        <span className="text-sm text-zinc-300">{cat?.label ?? prettify(key)}</span>
                        <span className="text-sm font-bold tabular-nums text-cyan-400">+{points}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* level progress (XP = cyan) */}
              <div className="mx-auto mt-10 max-w-md">
                <div className="mb-2.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-zinc-300">
                    Level <span className="font-bold text-zinc-100">{currentLevel}</span>
                    <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-zinc-500" />
                    <span className="font-bold text-cyan-400">{currentLevel + 1}</span>
                  </span>
                  {isGetNewLevel ? (
                    <motion.span
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.1, type: "spring", stiffness: 220, damping: 12 }}
                      className="inline-flex items-center gap-1 rounded bg-cyan-500/15 px-2 py-0.5 text-xs font-bold text-cyan-300"
                    >
                      <Sparkles className="h-3 w-3" aria-hidden /> Level Up!
                    </motion.span>
                  ) : (
                    <span className="font-bold tabular-nums text-cyan-400">{Math.round(currProgressPercent)}%</span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className="h-full rounded-full bg-cyan-500"
                    initial={{ width: `${prevProgressPercent}%` }}
                    animate={{ width: `${currProgressPercent}%` }}
                    transition={{ delay: 0.8, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {onRestart && (
                  <Button
                    variant="ghost"
                    onClick={onRestart}
                    className="w-full gap-2 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Repeat session
                  </Button>
                )}
                <Button
                  onClick={handleContinue}
                  className="w-full gap-2 bg-white font-semibold text-zinc-950 hover:bg-zinc-200 sm:w-auto"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          {/* ── New achievements ── */}
          <AnimatePresence>
            {newAchievements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Achievements achievements={newAchievements} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Session time + Streak ── */}
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            {/* Session time */}
            <Card className="h-full">
              <CardHeading>Session time</CardHeading>
              <p className="font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100">{fmtMin(Math.round(sessionTimeMs / MIN))}</p>

              <div className="mt-8 space-y-5">
                {CATS.map((c) => ({ ...c, ms: sessionBreakdown[c.key] || 0 }))
                  .filter((c) => c.ms > 0)
                  .sort((a, b) => b.ms - a.ms)
                  .map((c) => {
                    const pct = sessionTimeMs > 0 ? (c.ms / sessionTimeMs) * 100 : 0;
                    return (
                      <div key={c.key} className="flex items-center gap-3">
                        <c.Icon size={15} className="shrink-0 text-zinc-400" />
                        <div className="flex-1">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-300">{c.label}</span>
                            <span className="font-semibold tabular-nums text-zinc-400">{fmtMin(Math.round(c.ms / MIN))}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-cyan-500/50" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {/* Streak */}
            <Card className="h-full">
              <CardHeading icon={<Flame className="h-4 w-4 text-orange-500" />}>Streak</CardHeading>

              <div className="flex items-baseline gap-2">
                <span className="font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100">{streak}</span>
                <span className="text-sm font-medium text-zinc-400">days in a row</span>
              </div>

              {streakBonusPct > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-orange-500/10 px-2.5 py-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden />
                  <span className="text-xs font-bold text-orange-400">+{streakBonusPct}% points</span>
                </div>
              )}

              <div className="mt-8 flex justify-between gap-2">
                {weekData.map((d, i) => {
                  const active = d.minutes > 0 || (d.isToday && didPracticeToday);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={cn(
                          "flex h-11 w-full items-center justify-center rounded",
                          active ? "bg-orange-500/15" : "bg-zinc-800",
                          d.isToday && "ring-1 ring-orange-400/70"
                        )}
                      >
                        {active && <Flame className="h-4 w-4 text-orange-400/80" aria-hidden />}
                      </div>
                      <span className={cn("text-[10px] font-medium", d.isToday ? "text-zinc-300" : "text-zinc-500")}>
                        {d.isToday ? "today" : d.label.slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── Weekly insight + Skill balance ── */}
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            {/* Weekly */}
            <Card className="h-full">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">This week</h3>
                <span className="font-teko text-3xl font-bold leading-none tabular-nums text-zinc-100">{fmtMin(weekTotalMin)}</span>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <ReferenceLine
                      y={DAILY_GOAL_MIN}
                      stroke="#3f3f46"
                      strokeDasharray="4 4"
                      label={{ value: "goal", position: "right", fontSize: 9, fill: "#52525b" }}
                    />
                    <Area dataKey="minutes" type="monotone" stroke="#22d3ee" strokeWidth={2} fill="url(#weekGrad)" dot={renderWeeklyDot} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Skill balance */}
            <Card className="h-full">
              <CardHeading suffix={<span className="text-xs text-zinc-500">· last 7 days</span>}>Skill balance</CardHeading>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="80%">
                    <PolarGrid stroke="#3f3f46" />
                    <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                    <Radar dataKey="prev" stroke="#52525b" fill="#52525b" fillOpacity={0.12} />
                    <Radar dataKey="current" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex justify-center gap-5">
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> This week
                </span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="h-2 w-2 rounded-full bg-zinc-600" /> Previous
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                {radarRows.map((c) => (
                  <div key={c.key} className="flex items-center gap-2.5">
                    <c.Icon size={14} className="shrink-0 text-zinc-400" />
                    <span className="flex-1 text-xs text-zinc-300">{c.label}</span>
                    <span className="text-xs font-semibold tabular-nums text-zinc-200">{fmtMin(c.curMin)}</span>
                    {c.deltaMin !== 0 && (
                      <span className={cn("text-[10px] font-bold tabular-nums", c.deltaMin > 0 ? "text-emerald-400" : "text-zinc-500")}>
                        {c.deltaMin > 0 ? "+" : ""}{c.deltaMin}min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );

  if (hideWrapper) return content;

  return <MainContainer noBorder>{content}</MainContainer>;
};

// ─── Achievements (reuses the real AchievementCard) ───────────────────────────

function Achievements({ achievements }: { achievements: AchievementList[] }) {
  const context = useAchievementContext();
  return (
    <Card>
      <CardHeading icon={<Trophy className="h-4 w-4 text-amber-500" />}>New achievements</CardHeading>
      <div className="flex flex-wrap gap-5">
        {achievements.map((id) => (
          <div key={id} className="h-16 w-16">
            <AchievementCard id={id} context={context} isUnlocked={true} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default RatingPopUpLayout;
