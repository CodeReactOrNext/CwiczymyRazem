import { Button } from "assets/components/ui/button";
import { chipVariants } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { Kostek } from "components/Mascot/Kostek";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { HeroPattern } from "components/UI/HeroBanner";
import { TIME_POINTS_VALUE } from "constants/ratingValue";
import { STREAK_MILESTONES } from "constants/streakMilestones";
import type { AchievementList } from "feature/achievements";
import { AchievementCard, useAchievementContext } from "feature/achievements";
import type { ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { NextReward, PaidLevels, useHasNextReward } from "feature/progression/components/NextUpCard";
import type { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { AnimatePresence, motion } from "framer-motion";
import { useAutoClaimLevels } from "hooks/useRewardLedger";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { fadeUp } from "lib/motion/motion";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { ArrowRight, Brain, Check, Ear, Hand, Music, NotebookPen, RotateCcw, Sparkles, Timer } from "lucide-react";
import Router from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { StatisticsDataInterface } from "types/api.types";
import {
  getDailyStreakMultiplier,
  getReconciledStreak,
  hasRestDays,
} from "utils/gameLogic";

import { RecentRunsCard } from "./components/RecentRunsCard";
import { MASCOT_LAYOUT_ID, SessionCelebration } from "./components/SessionCelebration";
import { SessionDetails } from "./components/SessionDetails";
import { SessionLeaderboardCard } from "./components/SessionLeaderboardCard";
import { SessionNoteForm, type SessionNoteHandle } from "./components/SessionNoteForm";
import { SessionTiles, TileTime } from "./components/SessionTiles";
import { StreakWeek } from "./components/StreakWeek";
import { useRatingPopUp } from "./hooks/useRatingPopUp";
import { buildFameBreakdown, buildPointsBreakdown } from "./utils/rewardBreakdown";

// ─────────────────────────────────────────────────────────────────────────────
// Post-session summary: one thing on the screen at a time, in at most three
// steps — what the session came to, how the exercise went (only where one was
// scored), and what comes next. Where the numbers came from stands under them.
// Styleguide: colour = meaning — cyan points and level, amber Fame and rewards,
// orange streak.
// ─────────────────────────────────────────────────────────────────────────────

const MIN = 60 * 1000;
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

type SummaryStep = "result" | "exercise" | "next";

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
  return <div className={cn("rounded-lg bg-zinc-800/40 p-7 md:p-8", className)}>{children}</div>;
}

function CardHeading({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <SectionHeader
      as="h3"
      className="mb-6"
      title={
        icon ? (
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-zinc-400">{icon}</span>
            {children}
          </span>
        ) : (
          children
        )
      }
    />
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
  const streakMilestone =
    STREAK_MILESTONES.includes(currentUserStats.actualDayWithoutBreak ?? 0) &&
    (currentUserStats.actualDayWithoutBreak ?? 0) > (previousUserStats.actualDayWithoutBreak ?? 0);
  const [celebrating, setCelebrating] = useState(!isRest && !examFailed);

  // Levels are paid by the summary opening, whichever step the player leaves on.
  const collected = useAutoClaimLevels();
  const paidLevels = collected && collected.levels.length > 0 ? collected : null;
  const hasNextReward = useHasNextReward();

  const handleContinue = () => (onClick ? onClick(false) : Router.push("/dashboard"));

  // The report's doc id is its reportDate as an ISO string. It arrives as a JSON
  // string despite the Date type, so parse before serialising it back.
  const reportDate = new Date(ratingData.reportDate);
  const reportId = Number.isNaN(reportDate.getTime()) ? null : reportDate.toISOString();

  const noteRef = useRef<SessionNoteHandle>(null);
  const noteCard = reportId && (
    <Card className="w-full text-left shortwide:p-5">
      <CardHeading icon={<NotebookPen className="h-4 w-4" />}>{t("notes_heading")}</CardHeading>
      <SessionNoteForm ref={noteRef} reportId={reportId} />
    </Card>
  );

  // ── Steps ──
  const steps: SummaryStep[] = [
    "result",
    ...(scoredRuns.length > 0 ? ["exercise" as const] : []),
    ...(hasNextReward || noteCard ? ["next" as const] : []),
  ];
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLastStep = stepIndex >= steps.length - 1;
  const [isLeaving, setIsLeaving] = useState(false);

  const handleNext = async () => {
    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      topRef.current?.scrollIntoView({ block: "start" });
      return;
    }
    // What was typed into the note is not lost for want of its own Save.
    setIsLeaving(true);
    const noteKept = (await noteRef.current?.save()) ?? true;
    setIsLeaving(false);
    if (noteKept) handleContinue();
  };

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

  const shownFameRows = fame > 0 ? fameRows : [];

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

  const streakDays = weekData.map((day) => ({
    label: day.label,
    isToday: day.isToday,
    practised: day.minutes > 0 || (day.isToday && didPracticeToday),
  }));
  const timeLines = CATS.map((c) => ({ ...c, ms: sessionBreakdown[c.key] || 0 }))
    .filter((c) => c.ms > 0)
    .sort((a, b) => b.ms - a.ms)
    .map((c) => ({ key: c.key, label: t(`cat.${c.key}`), value: fmtMin(Math.round(c.ms / MIN)) }));
  const skillLines = skillGains.map(([key, points]) => ({
    key,
    label: CAT_BY_KEY[key] ? t(`cat.${key}`) : prettify(key),
    value: `+${points}`,
  }));

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-0 pt-6 md:px-8 shortwide:gap-3 shortwide:pb-0 shortwide:pt-4",
        // Tall enough that the way on stands at the bottom of the screen.
        hideWrapper ? "min-h-[calc(100dvh-2rem)] shortwide:min-h-full" : "min-h-[70dvh] shortwide:min-h-0",
        isRest && "pb-32 sm:pb-10"
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
                  size="lg"
                  onClick={onRestart}
                  className="w-full text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto shortwide:w-auto"
                >
                  <RotateCcw aria-hidden />
                  {restartLabel ?? t("practise_more")}
                </Button>
              )}
              <Button
                size="lg"
                onClick={handleContinue}
                className="w-full sm:w-auto shortwide:w-auto"
              >
                {t("continue")}
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRest && noteCard}

      {!isRest && (
        <>
          {steps.length > 1 && (
            <ol className="flex gap-1.5" aria-label={t("step_of", { step: stepIndex + 1, count: steps.length })}>
              {steps.map((key, i) => (
                <li key={key} className={cn("h-2 flex-1 rounded-full transition-colors duration-slow", i <= stepIndex ? "bg-cyan-500" : "bg-zinc-800")} />
              ))}
            </ol>
          )}

          <div className="flex flex-1 flex-col items-center justify-center py-4 shortwide:py-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex w-full flex-col items-center gap-8 shortwide:gap-5">
                {step === "result" ? (
                  <>
                    {/* The slot keeps its height while the celebration is up, so the
                        screen does not jump when Kostek flies in from it. A phone
                        held sideways has the height for the numbers only. */}
                    <div className={cn("flex h-24 justify-center md:h-28 shortwide:h-20", !examFailed && "shortwide:hidden")}>
                      {examFailed ? (
                        <Kostek mood="sad" delay={0.3} className="h-full" />
                      ) : (
                        !celebrating && (
                          <motion.div layoutId={MASCOT_LAYOUT_ID} transition={{ type: "spring", stiffness: 140, damping: 20 }} className="h-full">
                            <Kostek lively arrive className="h-full" />
                          </motion.div>
                        )
                      )}
                    </div>
                    <div className="space-y-1 text-center">
                      <h1 className={cn("font-display text-3xl font-extrabold tracking-tight sm:text-4xl shortwide:text-2xl", examFailed ? "text-red-400" : "text-zinc-50 shortwide:sr-only")}>
                        {examFailed ? t("exam_failed") : t("great_progress")}
                      </h1>
                      {examFailed && <p className="text-sm text-zinc-400">{t("exam_failed_body")}</p>}
                    </div>

                    <div className="flex w-full max-w-3xl flex-col gap-6 shortwide:gap-4">
                      <SessionTiles
                        tiles={[
                          { label: t("points"), value: `+${displayedPoints}`, icon: <img src="/images/tokens/pick.png" alt="" className="h-full w-full object-contain" />, tone: "points" as const },
                          ...(fame > 0 ? [{ label: t("fame"), value: `+${fame}`, icon: <img src="/images/tokens/coin.png" alt="" className="h-full w-full object-contain" />, tone: "fame" as const }] : []),
                          { label: t("time"), icon: <Timer className="h-full w-full text-zinc-400" aria-hidden />, value: <TileTime minutes={Math.round(sessionTimeMs / MIN)} /> },
                        ]}
                      />

                      <div className="flex flex-col gap-6 shortwide:flex-row shortwide:items-center">
                      {/* level progress (XP = cyan) */}
                      <div className="shortwide:flex-1">
                        <div className="mb-2.5 flex items-baseline justify-between text-sm">
                          <span className="font-medium text-zinc-300">
                            {t("level")} <span className="font-bold text-zinc-100">{currentLevel}</span>
                          </span>
                          {isGetNewLevel ? (
                            <span className={chipVariants({ color: "cyan", size: "sm" })}>
                              <Sparkles className="h-3 w-3" aria-hidden /> {t("level_up")}
                            </span>
                          ) : (
                            <span className="font-bold tabular-nums text-cyan-400">{Math.round(currProgressPercent)}%</span>
                          )}
                        </div>
                        <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800">
                          <motion.div
                            className="relative h-full rounded-full bg-cyan-500"
                            initial={{ width: `${prevProgressPercent}%` }}
                            animate={{ width: `${currProgressPercent}%` }}
                            transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
                            <span aria-hidden className="light-hide absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
                          </motion.div>
                        </div>
                      </div>

                      <StreakWeek streak={streak} week={streakDays} bonusPct={streakBonusPct} />
                      </div>
                      {paidLevels && <PaidLevels paid={paidLevels} />}
                      <SessionDetails pointRows={pointRows} fameRows={shownFameRows} time={timeLines} skills={skillLines} />
                    </div>

                    {newAchievements.length > 0 && <Achievements achievements={newAchievements} />}
                  </>
                ) : step === "exercise" ? (
                  /* Where the run stands, and how the last ones went. Either can
                     have nothing to show, and the other then takes the row. */
                  <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row shortwide:flex-row">
                    <SessionLeaderboardCard runs={scoredRuns} className="min-w-0 lg:flex-1 shortwide:flex-1" />
                    <RecentRunsCard runs={scoredRuns} className="min-w-0 lg:flex-1 shortwide:flex-1" />
                    <p className="hidden w-full text-center text-lg font-semibold text-zinc-200 only:block">{t("run_saved")}</p>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-12 shortwide:flex-row shortwide:gap-8">
                    {hasNextReward && (
                      <div className="flex w-full flex-1 flex-col items-center gap-6 shortwide:gap-3">
                        <h2 className="font-display text-2xl font-extrabold tracking-tight text-zinc-50 shortwide:text-xl">{t("next_reward")}</h2>
                        <NextReward className="shortwide:[zoom:0.75]" />
                      </div>
                    )}
                    {noteCard && <div className="w-full flex-1">{noteCard}</div>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── The way on, always in reach at the bottom edge ── */}
          <div className={cn(
            "sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 px-4 py-3 md:-mx-8 md:px-8",
            hideWrapper ? "bg-zinc-950 pb-5 shortwide:pb-3" : "bg-zinc-950 lg:bg-transparent",
          )}>
            {isLastStep && onRestart ? (
              <Button variant="ghost" size="lg" onClick={onRestart} className="min-w-0 px-5">
                <RotateCcw className="shrink-0" aria-hidden />
                <span className="truncate">{restartLabel ?? t("repeat_session")}</span>
              </Button>
            ) : (
              <span />
            )}
            <Button size="xl" autoFocus loading={isLeaving} onClick={() => void handleNext()} className="min-w-40 max-sm:flex-1">
              {isLastStep ? t("done") : t("continue")}
              {isLastStep ? <Check aria-hidden /> : <ArrowRight aria-hidden />}
            </Button>
          </div>
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
            streakMilestone={streakMilestone}
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
    <div className="flex flex-wrap items-center justify-center gap-4">
      <span className="text-sm font-semibold text-zinc-300">{t("new_achievements")}</span>
      <div className="flex flex-wrap gap-4">
        {achievements.map((id) => (
          <div key={id} className="h-16 w-16">
            <AchievementCard id={id} context={context} isUnlocked={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RatingPopUpLayout;
