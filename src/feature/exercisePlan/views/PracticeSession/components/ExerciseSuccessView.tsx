import { Button } from "assets/components/ui/button";
import { ChartContainer, ChartTooltip } from "assets/components/ui/chart";
import { cn } from "assets/lib/utils";
import confetti from "canvas-confetti";
import { animate, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Check, Flame, Star, Target, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

interface ExerciseStats {
  accuracy?: number;
  maxStreak?: number;
  perfectHits?: number;
  timingMsg?: string;
}

interface ExerciseSuccessViewProps {
  planTitle: string;
  onFinish: () => void;
  onRestart?: () => void;
  isLoading?: boolean;
  examMode?: boolean;
  score?: number;
  maxScore?: number;
  stats?: ExerciseStats;
  timeline?: ('hit' | 'miss' | 'perfect' | 'early' | 'late')[];
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

function StatItem({ icon, value, label, accent }: { icon: ReactNode; value: string | number; label: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={cn('text-zinc-400', accent)}>{icon}</span>
      <div className="text-lg font-bold leading-none text-zinc-100 tabular-nums">{value}</div>
      <div className="text-[11px] text-zinc-500">{label}</div>
    </div>
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
  stats,
  timeline,
}: ExerciseSuccessViewProps) => {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const isExam = examMode && typeof score !== 'undefined' && typeof maxScore !== 'undefined';
  const passThreshold = isExam ? Math.ceil(maxScore! * 0.85) : 0;
  const isPassed = isExam ? score! >= passThreshold : true;
  const nextStarDist = isExam ? Math.max(0, passThreshold - score!) : 0;

  const displayStats = stats ?? {};
  const accuracy = displayStats.accuracy ?? 0;
  const tierKey = getTierFromAccuracy(accuracy);
  const tier = TIERS[tierKey];

  let stars = 0;
  let starProgress = 0;

  if (isExam && maxScore! > 0) {
    if (score! >= maxScore! * 0.95) {
      stars = 3; starProgress = 100;
    } else if (score! >= maxScore! * 0.9) {
      stars = 2;
      starProgress = ((score! - maxScore! * 0.9) / (maxScore! * 0.05)) * 100;
    } else if (score! >= maxScore! * 0.8) {
      stars = 1;
      starProgress = ((score! - maxScore! * 0.8) / (maxScore! * 0.1)) * 100;
    } else {
      starProgress = (score! / (maxScore! * 0.8)) * 100;
    }
  }

  const hasTimeline = !!timeline && timeline.length > 0;

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
  }, [isExam, isPassed, score]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
      className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', damping: 28, stiffness: 120, delay: 0.05 }}
        className="relative w-full max-w-lg my-auto">

        {/* Main card */}
        <div className="relative overflow-hidden rounded-lg bg-zinc-900">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
          />

          {/* Header */}
          <div className="relative px-7 pt-7 pb-5">
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
                        'h-12 w-12 flex items-center justify-center rounded-full',
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
                    {stars === 3 ? 'Mastered!' : isPassed ? 'Exam Passed!' : 'Exam Failed'}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-0.5">
                    {stars === 3
                      ? 'Flawless performance.'
                      : isPassed
                      ? 'Nice work — a couple more runs and you\'ll nail every note.'
                      : <>Missed by <span className="text-zinc-200 font-semibold">{Math.ceil(nextStarDist)}</span> pts. Give it another shot!</>
                    }
                  </p>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-cyan-500/10 shrink-0">
                  <Trophy className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 tracking-wide">{t("practice.congratulations")}</p>
                  <h2 className="text-lg font-bold text-zinc-100 leading-tight">{planTitle}</h2>
                </div>
              </motion.div>
            )}
          </div>

          {/* Score + Stats — exam only or when real stats are available */}
          {(isExam || stats) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="relative px-7 py-5">

              {/* Score — exam only */}
              {isExam && (
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 tracking-wide mb-1">Total score</p>
                    <div className="font-teko text-5xl font-bold text-zinc-100 tabular-nums leading-none">{displayScore.toLocaleString()}</div>
                  </div>
                  {/* Tier badge */}
                  <div className={cn('flex flex-col items-center justify-center h-14 w-14 rounded-lg', tier.bg)}>
                    <span className={cn('text-2xl font-black leading-none', tier.color)}>{tierKey}</span>
                    <span className="text-zinc-500 text-[9px] tracking-wide mt-0.5">Grade</span>
                  </div>
                </div>
              )}

              {/* Accuracy / Combo / Score — grouped in one panel, not repeated cards */}
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-800/40 px-4 py-4">
                <StatItem icon={<Target className="h-4 w-4" />} value={`${accuracy}%`} label="Accuracy" accent="text-cyan-400" />
                <StatItem icon={<Flame className="h-4 w-4" />} value={displayStats.maxStreak ?? 0} label="Max combo" accent="text-orange-400" />
                {!isExam && (
                  <StatItem icon={<Star className="h-4 w-4" />} value={(score ?? 0).toLocaleString()} label="Score" />
                )}
              </div>
            </motion.div>
          )}

          {/* Performance Chart */}
          {hasTimeline && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="relative px-7 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-zinc-500 tracking-wide">Performance over time</p>
                <span className="text-[11px] text-zinc-600">{timeline!.length} notes</span>
              </div>

              <ChartContainer
                config={{ accuracy: { label: "Accuracy", color: chartStroke } }}
                className="h-[90px] w-full">
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
                      label={{ value: "Pass", position: 'right', fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                    />
                  )}
                  <ChartTooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
                    content={(props) => {
                      const { active, payload } = props;
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-lg bg-zinc-950/90 px-3 py-2 text-xs">
                            <span className="text-zinc-400">Accuracy </span>
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

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: hasTimeline ? 1.3 : 1 }}
            className="relative px-7 py-5 flex gap-2.5">
            {isExam && !isPassed && onRestart && (
              <Button
                onClick={onRestart}
                disabled={isLoading}
                className="flex-1 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium">
                Try Again
              </Button>
            )}
            <Button
              onClick={onFinish}
              disabled={isLoading}
              className={cn(
                'flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                isExam && !isPassed
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                  : 'bg-white hover:bg-zinc-200 text-zinc-950 font-semibold'
              )}>
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <span>{isExam && !isPassed ? 'Back to Menu' : t("practice.finish")}</span>
                  {(!isExam || isPassed) && <Check className="h-3.5 w-3.5" />}
                </>
              )}
            </Button>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
};
