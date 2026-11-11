import { Button } from "assets/components/ui/button";
import { ChartContainer, ChartTooltip } from "assets/components/ui/chart";
import { cn } from "assets/lib/utils";
import confetti from "canvas-confetti";
import { accuracyToStars, EXAM_STAR_ACCURACY } from "feature/journey/services/journey.service";
import { animate, AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Check, Flame, Star, Target } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import type { RunNote, TimingCounts } from "../utils/timingGrade";
import type { TimingPrecision } from "../utils/timingPrecision";
import { chartValues, MIN_CHART_POINTS, NoteDeviationChart } from "./NoteDeviationChart";
import { QUARTER_TURN_STYLE } from "./tablatureDirection";
import { TimingBreakdown } from "./TimingBreakdown";

interface ExerciseStats {
  accuracy?: number;
  maxStreak?: number;
  perfectHits?: number;
  timingMsg?: string;
}

interface ExerciseSuccessViewProps {
  planTitle: string;
  onFinish: () => void | Promise<void>;
  onRestart?: () => void;
  isLoading?: boolean;
  examMode?: boolean;
  score?: number;
  maxScore?: number;
  /** Accuracy (0–100) the exam is judged on — the value handed to
   *  onExamComplete, so the verdict here matches the stars that get saved.
   *  Falls back to stats.accuracy. */
  examAccuracy?: number;
  stats?: ExerciseStats;
  timeline?: ('hit' | 'miss' | 'perfect' | 'early' | 'late')[];
  /** Hits per timing grade — shown under the stats when the run was timed. */
  timing?: TimingCounts | null;
  /** Where the run's timed notes leaned — adds an "early / late" line under the timing. */
  timingPrecision?: TimingPrecision | null;
  /** Hits per intonation grade, for exercises scored on pitch. When set the
   *  score came from these, so the summary is about intonation — timing
   *  stays on the tab's arrows but isn't summed up here. */
  intonation?: TimingCounts | null;
  /** Where the run's bends landed, median signed cents (+ = sharp). */
  intonationBiasCents?: number | null;
  /** Every graded note of the run, in order — charted note by note when the
   *  run was graded on intonation or timing. */
  noteLog?: RunNote[] | null;
  /** Overrides the default "Missed by X pts…" subtitle for a failed exam —
   *  used when the fail wasn't a score shortfall (e.g. the click-hunt mistake
   *  limit), where that message would be misleading. */
  failMessage?: ReactNode;
  /** Replaces "Congratulations!" above the title — goal mode names the run
   *  instead, since a run that missed the goal is nothing to congratulate. */
  eyebrow?: string;
  /** Shown under the stats — goal mode puts the run's verdict on the goal here. */
  extraContent?: ReactNode;
  /** The phone is upright with the practice screen laid on its side: lay this
   *  one the same way. */
  turned?: boolean;
  /** Offer "Try again" after any run, not only a failed exam — goal mode is
   *  played run after run. */
  offerRestart?: boolean;
}

type TierKey = 'S' | 'A' | 'B' | 'C' | 'D';

// Tier colours follow the app's rarity language: S = epic (purple), down to
// D = neutral. Keeps the grade badge inside the accepted semantic palette
// instead of an arbitrary red-to-cyan scale.
const TIERS: Record<TierKey, { color: string; bg: string }> = {
  S: { color: 'text-purple-300',  bg: 'bg-purple-500/10'  },
  A: { color: 'text-amber-300',   bg: 'bg-amber-500/10'   },
  B: { color: 'text-cyan-300',    bg: 'bg-cyan-500/10'    },
  C: { color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  D: { color: 'text-zinc-300',    bg: 'bg-zinc-800'       },
};

const getTierFromAccuracy = (accuracy: number): TierKey => {
  if (accuracy >= 95) return 'S';
  if (accuracy >= 90) return 'A';
  if (accuracy >= 80) return 'B';
  if (accuracy >= 70) return 'C';
  return 'D';
};

const SEGMENTS = 12;

function buildChartData(timeline: ('hit' | 'miss' | 'perfect' | 'early' | 'late')[]) {
  const size = Math.max(1, Math.ceil(timeline.length / SEGMENTS));
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const slice = timeline.slice(i * size, (i + 1) * size);
    if (slice.length === 0) return { seg: i + 1, accuracy: null as number | null };
    const hits = slice.filter(n => n === 'hit' || n === 'perfect').length;
    return { seg: i + 1, accuracy: Math.round((hits / slice.length) * 100) };
  }).filter(d => d.accuracy !== null);
}

// The supporting figures beside the headline one: a number and what it counts,
// on one line, so the row stays quieter than the accuracy above it.
function StatItem({ icon, value, label, accent }: { icon: ReactNode; value: string | number; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-zinc-400', accent)}>{icon}</span>
      <span className="text-base font-bold leading-none text-zinc-100 tabular-nums">{value}</span>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

const FINISHING_STEPS = ["counting", "crunching", "judging", "asking", "polishing"] as const;
const FINISHING_STEP_MS = 1400;

// What the Finish button says while the run is being saved: a line that keeps
// changing, so a slow connection reads as work being done rather than a dead tap.
function FinishingLabel() {
  const { t } = useTranslation("session");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(current => (current + 1) % FINISHING_STEPS.length), FINISHING_STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex h-5 items-center overflow-hidden" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}>
          {t(`finishing.${FINISHING_STEPS[step]}`)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export const ExerciseSuccessView = ({
  planTitle,
  onFinish,
  onRestart,
  isLoading = false,
  examMode = false,
  score,
  maxScore,
  examAccuracy,
  stats,
  timeline,
  timing,
  timingPrecision,
  intonation,
  intonationBiasCents,
  noteLog,
  failMessage,
  eyebrow,
  extraContent,
  offerRestart = false,
  turned = false,
}: ExerciseSuccessViewProps) => {
  const { t } = useTranslation(["common", "session"]);
  const [isVisible, setIsVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  // The tap itself: `isLoading` only turns on once the scores are saved and the
  // report goes out, which on a phone connection left the button looking dead.
  const [isPending, setIsPending] = useState(false);
  const isBusy = isLoading || isPending;

  const handleFinish = async () => {
    if (isBusy) return;
    setIsPending(true);
    try {
      await onFinish();
    } finally {
      setIsPending(false);
    }
  };

  const isExam = examMode && typeof score !== 'undefined' && typeof maxScore !== 'undefined';
  const hasStats = !!stats;
  const displayStats = stats ?? {};
  const accuracy = displayStats.accuracy ?? 0;
  const tierKey = getTierFromAccuracy(accuracy);
  const tier = TIERS[tierKey];

  // An exam is passed on accuracy alone, by the same rule that saves its stars
  // (accuracyToStars). The score still weighs timing and combo, but a clean run
  // that was early on the beat shouldn't read "failed" next to 98% accuracy.
  const passAccuracy = examAccuracy ?? accuracy;
  const stars = isExam ? accuracyToStars(passAccuracy) ?? 0 : 0;
  const isPassed = isExam ? stars > 0 : true;
  const accuracyToPass = isExam ? Math.max(0, Math.ceil(EXAM_STAR_ACCURACY[0] - passAccuracy)) : 0;

  let starProgress = 100;
  if (isExam && stars < 3) {
    const from = stars === 0 ? 0 : EXAM_STAR_ACCURACY[stars - 1];
    const to = EXAM_STAR_ACCURACY[stars as 0 | 1 | 2];
    starProgress = Math.min(100, Math.max(0, ((passAccuracy - from) / (to - from)) * 100));
  }

  const hasTimeline = !!timeline && timeline.length > 0;
  // Graded runs chart what they were graded on, note by note; exams keep the
  // accuracy curve with its pass line.
  const deviationChart: "intonation" | "timing" | null = isExam || !noteLog
    ? null
    : intonation && chartValues(noteLog, "intonation").length >= MIN_CHART_POINTS
      ? "intonation"
      : timing && chartValues(noteLog, "timing").length >= MIN_CHART_POINTS
        ? "timing"
        : null;
  const hasChart = !!deviationChart || hasTimeline;
  // Something for the second column of the sideways card.
  const hasDetail = hasChart || (hasStats && !!(intonation || timing));

  const chartData = useMemo(
    () => (hasTimeline ? buildChartData(timeline!) : []),
    [timeline, hasTimeline]
  );

  const chartStroke = accuracy >= 80 ? 'rgb(6,182,212)' : accuracy >= 60 ? 'rgb(251,146,60)' : 'rgb(239,68,68)';

  useEffect(() => {

    const timer = setTimeout(() => {
      setIsVisible(true);

      if (isExam && typeof score !== 'undefined') {
        animate(0, score, {
          duration: 1.5,
          ease: "easeOut",
          onUpdate: (val) => setDisplayScore(Math.round(val)),
        });
      }

      if (!isExam || isPassed) {
        const end = Date.now() + 3000;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const rnd = (a: number, b: number) => Math.random() * (b - a) + a;
        const colors = ["#22d3ee", "#a78bfa", "#f59e0b", "#34d399"];
        const iv = setInterval(() => {
          const left = end - Date.now();
          if (left <= 0) return clearInterval(iv);
          const n = 50 * (left / 3000);
          confetti({ ...defaults, particleCount: n, origin: { x: rnd(0.1, 0.3), y: Math.random() - 0.2 }, colors });
          confetti({ ...defaults, particleCount: n, origin: { x: rnd(0.7, 0.9), y: Math.random() - 0.2 }, colors });
        }, 250);
        return () => clearInterval(iv);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isExam, isPassed, score]);  

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
      className={cn(
        "inset-0 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm shortwide:p-3",
        // Turned, the box around it is the screen and carries the z-index.
        turned ? "absolute" : "fixed z-[99999999]",
      )}>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', damping: 28, stiffness: 120, delay: 0.05 }}
        className={cn("relative my-auto w-full max-w-lg", hasDetail && "shortwide:max-w-4xl")}>

        {/* Main card. Upright it is one column, in reading order. On a phone held
            sideways there is no height for that, so it splits in two: the result
            and the way out on the left, the detail beside them. The two halves
            are `contents` upright, which is what lets `order-*` put the actions
            last there while they sit in the left half sideways. */}
        <div className="relative flex flex-col overflow-hidden rounded-lg bg-zinc-900 shortwide:flex-row shortwide:items-stretch">
          <div className="contents shortwide:flex shortwide:min-w-0 shortwide:flex-1 shortwide:flex-col shortwide:justify-center">
          {/* Header */}
          <div className="relative order-1 px-7 pb-2 pt-9 shortwide:pt-5">
            {isExam ? (
              <div className="flex flex-col items-center gap-3 text-center">
                {/* Stars */}
                <div className="flex gap-2.5">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200, damping: 14 }}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full shortwide:h-9 shortwide:w-9',
                        i <= stars ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800 text-zinc-600'
                      )}>
                      <Star className="h-5 w-5" fill={i <= stars ? 'currentColor' : 'none'} />
                    </motion.div>
                  ))}
                </div>

                {/* Progress to next star */}
                {stars < 3 && (
                  <div className="w-36 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${starProgress}%` }}
                      transition={{ delay: 1.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                )}

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <h2 className={cn('text-2xl font-bold tracking-tight',
                    stars === 3 ? 'text-amber-400' : isPassed ? 'text-zinc-100' : 'text-red-400'
                  )}>
                    {stars === 3 ? t('session:success.mastered') : isPassed ? t('session:success.passed') : t('session:success.failed')}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-0.5">
                    {stars === 3
                      ? t('session:success.flawless')
                      : isPassed
                      ? t('session:success.nice_work')
                      : failMessage ?? (
                          <Interpolate
                            text={t('session:success.missed_by')}
                            values={{
                              points: <span className="text-zinc-200 font-semibold">{accuracyToPass}%</span>,
                            }}
                          />
                        )
                    }
                  </p>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="text-center">
                <p className="text-sm font-medium text-zinc-400">{eyebrow ?? t("practice.congratulations")}</p>
                <h2 className="mt-1 text-xl font-bold leading-tight text-zinc-100">{planTitle}</h2>
              </motion.div>
            )}
          </div>

          {/* Score + Stats — exam only or when real stats are available */}
          {(isExam || stats) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="relative order-2 px-7 pb-3 pt-6 shortwide:pt-3">

              {/* Score — exam only */}
              {isExam && (
                <div className="mb-8 flex items-end justify-between shortwide:mb-4">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 tracking-wide mb-1">{t("session:success.total_score")}</p>
                    <div className="font-teko text-5xl font-bold text-zinc-100 tabular-nums leading-none">{displayScore.toLocaleString()}</div>
                  </div>
                  {/* Tier badge */}
                  <div className={cn('flex flex-col items-center justify-center h-14 w-14 rounded-lg', tier.bg)}>
                    <span className={cn('text-2xl font-black leading-none', tier.color)}>{tierKey}</span>
                    <span className="text-zinc-500 text-[9px] tracking-wide mt-0.5">{t("session:success.grade")}</span>
                  </div>
                </div>
              )}

              {/* Accuracy / Combo / Score — grouped in one panel, not repeated cards.
                  Only shown when something was actually tracked (mic or click hunt) —
                  otherwise "Accuracy" would just be a stale/default 0%. */}
              {hasStats && (
                <div>
                  {/* Zones are set apart by space alone: a tinted panel here was
                      a card inside the card. */}
                  {isExam ? (
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      <StatItem icon={<Target className="h-4 w-4" />} value={`${accuracy}%`} label={t("session:success.accuracy")} />
                      <StatItem icon={<Flame className="h-4 w-4" />} value={displayStats.maxStreak ?? 0} label={t("session:success.max_combo")} accent="text-orange-400" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="font-teko text-8xl font-bold leading-[0.85] tabular-nums text-zinc-100 shortwide:text-7xl">{accuracy}%</div>
                      <div className="text-sm font-medium text-zinc-400">{t("session:success.accuracy")}</div>
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 shortwide:mt-4">
                        <StatItem icon={<Flame className="h-4 w-4" />} value={displayStats.maxStreak ?? 0} label={t("session:success.max_combo")} accent="text-orange-400" />
                        <StatItem icon={<Star className="h-4 w-4" />} value={(score ?? 0).toLocaleString()} label={t("session:success.score")} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {extraContent && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="relative order-4 px-7 py-2">
              {extraContent}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: hasChart ? 1.3 : 1 }}
            className="relative order-6 flex gap-3 px-7 pb-7 pt-5 shortwide:pb-5 shortwide:pt-3">
            {((isExam && !isPassed) || offerRestart) && onRestart && (
              <Button
                onClick={onRestart}
                disabled={isBusy}
                className="h-11 flex-1 rounded-lg bg-zinc-800 text-sm font-medium text-zinc-100 hover:bg-zinc-700">
                {t("session:timing.try_again")}
              </Button>
            )}
            {/* Not `disabled` while busy: that would dim the one thing on screen
                that says the tap landed. `handleFinish` ignores repeat taps. */}
            <Button
              onClick={handleFinish}
              aria-busy={isBusy}
              className={cn(
                'flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium',
                isExam && !isPassed
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                  : 'bg-white hover:bg-zinc-200 text-zinc-950 font-semibold',
                isBusy && 'pointer-events-none'
              )}>
              {isBusy ? (
                <>
                  <span className={cn(
                    "mr-2 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2",
                    isExam && !isPassed ? "border-zinc-600 border-t-zinc-100" : "border-zinc-400 border-t-zinc-950"
                  )} />
                  <FinishingLabel />
                </>
              ) : (
                <>
                  <span>{isExam && !isPassed ? t('session:success.back_to_menu') : t("practice.finish")}</span>
                  {/* The Button wraps its children, so its own gap never reaches them. */}
                  {(!isExam || isPassed) && <Check className="ml-2 h-4 w-4" />}
                </>
              )}
            </Button>
          </motion.div>
          </div>

          {/* The detail: how the timing split, and the run note by note. */}
          <div className="contents shortwide:flex shortwide:min-w-0 shortwide:flex-1 shortwide:flex-col shortwide:justify-center shortwide:py-2 shortwide:empty:hidden">
          {hasStats && (intonation || timing) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="relative order-3 px-7 pb-3 pt-7 shortwide:pt-3">
              {intonation ? (
                <TimingBreakdown timing={intonation} variant="intonation" biasCents={intonationBiasCents} />
              ) : (
                timing && <TimingBreakdown timing={timing} precision={timingPrecision} />
              )}
            </motion.div>
          )}

          {/* Performance Chart */}
          {deviationChart && noteLog && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="relative order-5 px-7 py-5 shortwide:py-3">
              <NoteDeviationChart variant={deviationChart} notes={noteLog} />
            </motion.div>
          )}
          {!deviationChart && hasTimeline && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="relative order-5 px-7 py-5 shortwide:py-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-zinc-500 tracking-wide">{t("session:success.over_time")}</p>
                <span className="text-[11px] text-zinc-600">{timeline!.length} notes</span>
              </div>

              <ChartContainer
                config={{ accuracy: { label: t("session:success.accuracy"), color: chartStroke } }}
                className="h-[90px] w-full shortwide:h-[64px]">
                <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartStroke} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartStroke} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="seg" hide />
                  <YAxis hide domain={[0, 100]} />
                  {isExam && (
                    <ReferenceLine
                      y={80}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="4 3"
                      label={{ value: t("session:success.pass"), position: 'right', fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                    />
                  )}
                  <ChartTooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
                    content={(props) => {
                      const { active, payload } = props;
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-lg bg-zinc-950/90 px-3 py-2 text-xs">
                            <span className="text-zinc-400">{t("session:success.accuracy")} </span>
                            <span className="text-zinc-100 font-bold">{payload[0].value}%</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    dataKey="accuracy"
                    type="monotone"
                    fill="url(#perfGrad)"
                    stroke={chartStroke}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ChartContainer>
            </motion.div>
          )}

          </div>

        </div>
      </motion.div>
    </motion.div>
  );

  // On an upright phone the practice screen is laid on its side, so the player
  // is holding the phone sideways when this opens: it turns the same way rather
  // than making them turn the phone back to read it.
  if (!turned) return overlay;
  return (
    <div
      className="sideways-screen fixed left-0 top-0 z-[99999999]"
      style={{ ...QUARTER_TURN_STYLE, width: "100dvh", height: "100dvw" }}>
      {overlay}
    </div>
  );
};
