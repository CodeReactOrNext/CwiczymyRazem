import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { Kostek } from "components/Mascot/Kostek";
import { HeroPattern } from "components/UI/HeroBanner";
import { TIME_POINTS_VALUE } from "constants/ratingValue";
import type { AchievementList } from "feature/achievements";
import { AchievementCard, useAchievementContext } from "feature/achievements";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { NextUpCard } from "feature/progression/components/NextUpCard";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { ArrowRight, Brain, Check, Ear, Flame, Hand, Music, NotebookPen, RotateCcw, Sparkles, Trophy } from "lucide-react";
import Router from "next/router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { StatisticsDataInterface } from "types/api.types";
import {
  getDailyStreakMultiplier,
  getReconciledStreak,
  hasRestDays,
} from "utils/gameLogic";

import { RecentRunsCard } from "./components/RecentRunsCard";
import { RewardBreakdown } from "./components/RewardBreakdown";
import { MASCOT_LAYOUT_ID, SessionCelebration } from "./components/SessionCelebration";
import { SessionLeaderboardCard } from "./components/SessionLeaderboardCard";
import { SessionNoteForm } from "./components/SessionNoteForm";
import { useRatingPopUp } from "./hooks/useRatingPopUp";
import { buildFameBreakdown, buildPointsBreakdown } from "./utils/rewardBreakdown";

// ─────────────────────────────────────────────────────────────────────────────
// Post-session summary. Styleguide: colour = meaning. Neutral zinc base, cyan as
// the single dominant accent (gems / level / XP / data). Sparing accents only
// where they carry meaning: amber = Fame, orange = streak, amber = achievements.
// ─────────────────────────────────────────────────────────────────────────────

const MIN = 60 * 1000;
// Streak lengths worth a headline of their own on the celebration screen.
const STREAK_MILESTONES = [7, 30, 100, 365];
// Time points are floor(ms × TIME_POINTS_VALUE), so this is the practice time the
// *first* point actually costs (~3min). Derived from the rate in
// constants/ratingValue so the "no points" screen can never quote a stale number.
const FIRST_POINT_MS = Math.ceil(1 / TIME_POINTS_VALUE);

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

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60} min` : `${m} min`);
// Sub-minute precision — the no-points screen quotes sessions that fmtMin would
// flatten to a confusing "0min".
const fmtShort = (ms: number) => {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const sec = totalSec % 60;
  return sec > 0 ? `${Math.floor(totalSec / 60)}min ${sec}s` : `${Math.floor(totalSec / 60)}min`;
};
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
  /** Overrides the restart button's label, e.g. when it starts a new log instead. */
  restartLabel?: string;
  /** Scored exercises of this session — each gets its leaderboard placing. */
  scoredRuns?: ScoredRun[];
  /** Set only after an exam: false turns the celebration into a plain "not passed". */
  examPassed?: boolean;
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

/** A duration as big digits with small units, so the number leads and "min" follows. */
function BigTime({ minutes }: { minutes: number }) {
  const hours = Math.floor(minutes / 60);
  const unit = "text-3xl font-semibold text-zinc-400";
  return (
    <p className="flex items-baseline gap-1.5 font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100">
      {hours > 0 && (
        <>
          <span>{hours}</span>
          <span className={cn(unit, "mr-1.5")}>h</span>
        </>
      )}
      <span>{minutes % 60}</span>
      <span className={unit}>min</span>
    </p>
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
  restartLabel,
  scoredRuns = [],
  examPassed,
}: RatingPopUpProps) => {
  const { t } = useTranslation("session_summary");
  const intlLocale = useIntlLocale();
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

  // A failed exam still logs its practice, but nothing about it is a win:
  // no fanfare, no full-screen celebration, and Kostek says so.
  const examFailed = examPassed === false;

  // One cue as the summary lands — the biggest thing that happened wins.
  const summaryCue = isGetNewLevel ? "levelUp" : newAchievements.length > 0 ? "reward" : examFailed ? null : "sessionComplete";
  useEffect(() => {
    if (summaryCue) playUiSound(summaryCue);
    // Once per summary, not again when the cue would read differently later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every component of it is *inside* this number, never on top of it — which is
  // the whole reason the breakdown exists. See `utils/rewardBreakdown`.
  const fame = ratingData.fameEarned ?? 0;
  const isRest = ratingData.totalPoints <= 0;
  // A session that earned something opens on the full-screen celebration first.
  const [celebrating, setCelebrating] = useState(!isRest && !examFailed);

  const handleContinue = () => (onClick ? onClick(false) : Router.push("/dashboard"));

  // The report's doc id is its reportDate as an ISO string. It arrives as a JSON
  // string despite the Date type, so parse before serialising it back.
  const reportDate = new Date(ratingData.reportDate);
  const reportId = Number.isNaN(reportDate.getTime()) ? null : reportDate.toISOString();

  const noteCard = reportId && (
    <Card>
      <CardHeading icon={<NotebookPen className="h-4 w-4" />}>{t("notes_heading")}</CardHeading>
      <SessionNoteForm reportId={reportId} />
    </Card>
  );

  // ── derived data ──
  // Same source of truth as the header / user tooltip: reconcile the stored
  // counter against the local-time activity log (getReconciledStreak).
  // `assumePracticedToday` is safe here — this popup only ever renders right
  // after a report was just submitted, so today's practice is a given even if
  // the (fetched-once, locally-patched) activity log hasn't caught up yet.
  const { dayWithoutBreak: streak, didPracticeToday } = getReconciledStreak({
    actualDayWithoutBreak: currentUserStats.actualDayWithoutBreak ?? 0,
    lastReportDate: currentUserStats.lastReportDate ?? "",
    reportDates: activityData.map((d) => d.date),
    assumePracticedToday: true,
    restDays: hasRestDays(currentUserStats),
  });
  const streakBonusPct = Math.round(getDailyStreakMultiplier(streak) * 100);

  // Both headlines get their parts spelled out underneath, because both were
  // being read as sums of the chips beside them. Habits pay points and never
  // fame, the rig pays fame and never points — which is precisely what a player
  // cannot work out from two bare totals.
  const pointRows = buildPointsBreakdown(
    {
      totalPoints: ratingData.totalPoints,
      timePoints: ratingData.bonusPoints?.timePoints,
      habitPoints: ratingData.bonusPoints?.additionalPoints,
      streakMultiplier: ratingData.bonusPoints?.multiplier,
    },
    t,
  );
  const fameRows = buildFameBreakdown({
    fame,
    streakBonus: ratingData.fameStreakBonus,
    streakDays: streak,
    rigBonus: ratingData.fameRigBonus,
    chainBonus: ratingData.fameChainBonus,
    traitBonus: ratingData.fameTraitBonus,
    accuracyBonus: ratingData.fameAccuracyBonus,
  }, t);

  const skillGains = Object.entries(ratingData.skillPointsGained ?? {}).filter(([, v]) => v > 0);

  const sessionTimeMs = ratingData.bonusPoints?.time ?? 0;
  // How close the session got to the first point — shown on the no-points screen
  // so "0" reads as "not yet", not as a bug.
  const firstPointPct = Math.min(100, Math.round((sessionTimeMs / FIRST_POINT_MS) * 100));

  // streak row — last 7 calendar days.
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
        label: d.toLocaleDateString(intlLocale ?? "en-US", { weekday: "short" }),
        minutes: Math.round(byDay.get(key) ?? 0),
        isToday: key === todayKey,
      };
    });
  }, [activityData, intlLocale]);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8",
        !hideWrapper && "pb-32 pt-16 sm:pb-10 sm:pt-6 shortwide:pb-10 shortwide:pt-4"
      )}
    >
      <div ref={topRef} />

      {isRest && (
        /* ── No-points hero ──
           The session was too short to earn anything. Say that outright and name
           the threshold — a silent "0" reads like a scoring bug, not a rule. */
        <div className="relative overflow-hidden rounded-lg bg-zinc-900/60 px-7 py-16 text-center md:px-10">
          <HeroPattern className="opacity-[0.03]" maskImage="radial-gradient(ellipse at top, black 10%, transparent 70%)" />
          <div className="relative flex flex-col items-center gap-5">
            {/* Nothing counted: Kostek glances aside and shrugs — no blame, just "not yet". */}
            <Kostek mood={examFailed ? "sad" : "shrug"} lookAt="left" delay={0.3} className="h-28" />

            <div className="flex flex-col items-center gap-3">
              <p className="text-xl font-semibold text-zinc-100">{t("no_points_title")}</p>
              <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                {t("no_points_body", {
                  time: fmtShort(sessionTimeMs),
                  threshold: fmtMin(Math.round(FIRST_POINT_MS / MIN)),
                })}
              </p>
            </div>

            {/* progress toward the first point */}
            <div className="mt-2 w-full max-w-xs">
              <div className="mb-2 flex items-baseline justify-between text-xs">
                <span className="font-medium text-zinc-400">{t("next_point")}</span>
                <span className="font-semibold tabular-nums text-zinc-400">
                  {fmtShort(sessionTimeMs)} / {fmtMin(Math.round(FIRST_POINT_MS / MIN))}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-cyan-500/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${firstPointPct}%` }}
                  transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-zinc-500">
              {t("streak_safe", { days: streak })}
            </p>

            <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row shortwide:w-auto shortwide:flex-row">
              {onRestart && (
                <Button
                  variant="ghost"
                  onClick={onRestart}
                  className="w-full text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto shortwide:w-auto"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  {restartLabel ?? t("practise_more")}
                </Button>
              )}
              <Button
                onClick={handleContinue}
                className="w-full bg-white font-semibold text-zinc-950 hover:bg-zinc-200 sm:w-auto shortwide:w-auto"
              >
                {t("back_to_dashboard")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRest && noteCard}

      {!isRest && (
        <>
          {/* ── Hero ── */}
          <div className="relative overflow-hidden rounded-lg bg-zinc-900/60 px-7 py-12 text-center md:px-10 md:py-14 shortwide:py-8">
            <HeroPattern className="opacity-[0.035]" maskImage="radial-gradient(ellipse at top, black 10%, transparent 70%)" />

            <div className="relative">
              {/* The slot keeps its height while the celebration is up, so the
                  card does not jump when Kostek flies in from it. */}
              <div className="mx-auto mb-4 flex h-28 justify-center md:h-32">
                {examFailed ? (
                  <Kostek mood="sad" delay={0.3} className="h-28 md:h-32" />
                ) : (
                  !celebrating && (
                    <motion.div layoutId={MASCOT_LAYOUT_ID} transition={{ type: "spring", stiffness: 140, damping: 20 }}>
                      <Kostek lively arrive className="h-28 md:h-32" />
                    </motion.div>
                  )
                )}
              </div>
              {examFailed ? (
                <div className="space-y-1">
                  <p className="text-xl font-semibold text-red-400">{t("exam_failed")}</p>
                  <p className="text-sm text-zinc-400">{t("exam_failed_body")}</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-zinc-400">{t("great_progress")}</p>
              )}

              {/* The two rewards stand side by side once there is room: stacked,
                  the Fame receipt pushed Continue below the fold of a laptop. Each
                  headline keeps its own height, so the two receipts start level. */}
              <div
                className={cn(
                  "mx-auto mt-4 grid grid-cols-1 gap-x-16 gap-y-10",
                  fame > 0 && "max-w-3xl md:grid-cols-2 shortwide:grid-cols-2",
                )}>
                <div>
                  <div className="flex h-24 items-end justify-center gap-4">
                    <span className="font-teko text-8xl font-bold leading-none tabular-nums text-cyan-400">
                      +{displayedPoints}
                    </span>
                    <img src="/images/tokens/pick.png" alt="points" className="mb-2 h-12 w-12 object-contain" />
                  </div>

                  <RewardBreakdown rows={pointRows} delay={0.5} className="mt-7" />
                </div>

                {fame > 0 && (
                  <div>
                    <div className="flex items-end justify-center gap-2.5 md:h-24 md:pb-2 shortwide:h-24 shortwide:pb-2">
                      <img src="/images/tokens/coin.png" alt="" className="mb-1 h-7 w-7 object-contain md:mb-2 md:h-9 md:w-9 shortwide:mb-2 shortwide:h-9 shortwide:w-9" />
                      <span className="font-teko text-5xl font-bold leading-none tabular-nums text-amber-400 md:text-7xl shortwide:text-7xl">
                        +{fame}
                      </span>
                      <span className="mb-1 text-base font-semibold text-amber-400 md:mb-2.5 shortwide:mb-2.5">{t("fame")}</span>
                    </div>

                    <RewardBreakdown rows={fameRows} delay={0.8} className="mt-7" />
                  </div>
                )}
              </div>

              {skillGains.length > 0 && (
                <div className="mx-auto mt-10 flex max-w-md flex-wrap justify-center gap-2.5">
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
                        <span className="text-sm text-zinc-300">{cat ? t(`cat.${cat.key}`) : prettify(key)}</span>
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
                    {t("level")} <span className="font-bold text-zinc-100">{currentLevel}</span>
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
                      <Sparkles className="h-3 w-3" aria-hidden /> {t("level_up")}
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

              {/* CTA — on a phone it lives in the bar pinned to the bottom of
                  the screen instead (see below), where it needs no scrolling. */}
              <div className={cn(
                "mt-10 flex-col items-center justify-center gap-3 sm:flex-row shortwide:flex-row",
                hideWrapper ? "flex" : "hidden lg:flex",
              )}>
                {onRestart && (
                  <Button
                    variant="ghost"
                    onClick={onRestart}
                    className="w-full text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto shortwide:w-auto"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    {restartLabel ?? t("repeat_session")}
                  </Button>
                )}
                <Button
                  onClick={handleContinue}
                  className="w-full bg-white font-semibold text-zinc-950 hover:bg-zinc-200 sm:w-auto shortwide:w-auto"
                >
                  {t("continue")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Note + new achievements ──
              A flex row, not a grid: whichever is missing leaves the other the
              whole width instead of an empty column. */}
          <div className="flex flex-col items-stretch gap-6 empty:hidden md:flex-row shortwide:flex-row">
            {noteCard && <div className="min-w-0 md:flex-[2] shortwide:flex-[2] [&>*]:h-full">{noteCard}</div>}
            <AnimatePresence>
              {newAchievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 md:flex-1 shortwide:flex-1 [&>*]:h-full">
                  <Achievements achievements={newAchievements} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── The exercise: where the run stands, and how the last ones went ──
              Both are about the same exercise, so they share a row; either can
              render nothing, and the other then takes the row. */}
          <div className="flex flex-col items-stretch gap-6 empty:hidden lg:flex-row shortwide:flex-row">
            {scoredRuns.length > 0 && <SessionLeaderboardCard runs={scoredRuns} className="min-w-0 lg:flex-1 shortwide:flex-1" />}
            <RecentRunsCard runs={scoredRuns} className="min-w-0 lg:flex-1 shortwide:flex-1" />
          </div>

          {/* ── Session time + Streak ── */}
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 shortwide:grid-cols-2">
            {/* Session time */}
            <Card className="h-full">
              <CardHeading>{t("session_time")}</CardHeading>
              <BigTime minutes={Math.round(sessionTimeMs / MIN)} />

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
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-300">{t(`cat.${c.key}`)}</span>
                            <span className="font-semibold tabular-nums text-zinc-100">{fmtMin(Math.round(c.ms / MIN))}</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div className="relative h-full rounded-full bg-cyan-600" style={{ width: `${pct}%` }}>
                              <span aria-hidden className="absolute inset-x-1.5 top-[3px] h-[3px] rounded-full bg-white/20" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {/* Streak */}
            <Card className="h-full">
              <CardHeading>{t("streak")}</CardHeading>

              <div className="flex items-baseline gap-2">
                <Flame className="h-10 w-10 shrink-0 self-center fill-orange-400 text-orange-400" aria-hidden />
                <span className="font-teko text-6xl font-bold leading-none tabular-nums text-orange-400">{streak}</span>
                <span className="text-sm font-medium text-zinc-400">{t("days_in_a_row", { count: streak })}</span>
              </div>

              {streakBonusPct > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-orange-500/10 px-2.5 py-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden />
                  <span className="text-xs font-bold text-orange-400">{t("streak_bonus_points", { pct: streakBonusPct })}</span>
                </div>
              )}

              <div className="mt-8 flex justify-between gap-2">
                {weekData.map((d, i) => {
                  const active = d.minutes > 0 || (d.isToday && didPracticeToday);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2.5">
                      <div
                        className={cn(
                          "flex aspect-square w-full max-w-[2.5rem] items-center justify-center rounded-full",
                          active ? "bg-orange-500" : "bg-zinc-800/60"
                        )}
                      >
                        {active && <Check className="h-5 w-5 text-zinc-950" strokeWidth={3} aria-hidden />}
                      </div>
                      <span className={cn("text-xs", d.isToday ? "font-bold text-zinc-100" : "font-medium text-zinc-500")}>
                        {d.isToday ? t("today") : d.label.slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── The climb ahead, and anything already owed ── */}
          <NextUpCard />

          {/* ── Way out, always in reach ──
              The summary is several screens long on a phone and Continue sat
              under the rewards, a scroll away. Pinned to the bottom edge it is
              where the thumb already is, whatever the player is reading. */}
          {!hideWrapper && (
            <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 bg-zinc-950/95 px-4 py-3 backdrop-blur-sm md:-mx-8 md:px-8 lg:hidden">
              {onRestart && (
                <Button
                  variant="ghost"
                  onClick={onRestart}
                  className="h-11 flex-1 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{restartLabel ?? t("repeat_session")}</span>
                </Button>
              )}
              <Button
                onClick={handleContinue}
                className="h-11 flex-1 bg-white font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                {t("continue")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  // Portalled to <body> so no transformed ancestor can trap the fixed overlay.
  const celebration =
    typeof document !== "undefined" &&
    createPortal(
      <AnimatePresence>
        {celebrating && (
          <SessionCelebration
            points={ratingData.totalPoints}
            fame={fame}
            streak={streak}
            levelUp={isGetNewLevel}
            streakMilestone={STREAK_MILESTONES.includes(streak) && streak > (previousUserStats.actualDayWithoutBreak ?? 0)}
            onDone={() => setCelebrating(false)}
          />
        )}
      </AnimatePresence>,
      document.body,
    );

  if (hideWrapper) {
    return (
      <>
        {celebration}
        {content}
      </>
    );
  }

  return (
    <>
      {celebration}
      <MainContainer noBorder>{content}</MainContainer>
    </>
  );
};

// ─── Achievements (reuses the real AchievementCard) ───────────────────────────

function Achievements({ achievements }: { achievements: AchievementList[] }) {
  const { t } = useTranslation("session_summary");
  const context = useAchievementContext();
  return (
    <Card>
      <CardHeading icon={<Trophy className="h-4 w-4 text-amber-500" />}>{t("new_achievements")}</CardHeading>
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
