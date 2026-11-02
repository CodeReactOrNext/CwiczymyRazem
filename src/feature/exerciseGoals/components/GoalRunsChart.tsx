import { format } from "date-fns";
import { PERFECT_TIMING_MS } from "feature/exercisePlan/views/PracticeSession/utils/timingGrade";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ExerciseRun } from "../types/exerciseGoal.types";

const COLORS = {
  line: "rgb(82, 82, 91)", // zinc-600
  practice: "rgb(161, 161, 170)", // zinc-400
  accuracy: "rgba(251, 191, 36, 0.75)", // amber-400
  clean: "rgb(52, 211, 153)", // emerald-400
  notClean: "rgb(113, 113, 122)", // zinc-500
  target: "rgba(52, 211, 153, 0.5)",
  stage: "rgba(212, 212, 216, 0.35)", // zinc-300
  tightZone: "rgba(52, 211, 153, 0.07)",
  grid: "rgba(255, 255, 255, 0.04)",
  axis: "rgb(113, 113, 122)",
};

/**
 * What the chart draws along its height.
 * - "tempo": the tempo each run earned, against the goal's.
 * - "timing": how far each run's notes typically landed from the beat — the
 *   precision of the playing, as opposed to how many notes were hit.
 */
export type GoalChartMetric = "tempo" | "timing";

interface ChartPoint {
  index: number;
  bpm: number;
  accuracy: number;
  timingOffsetMs: number | null;
  timingBiasMs: number | null;
  source: ExerciseRun["source"];
  clean: boolean | null;
  createdAt: number;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}

/** Runs a goal judged are the ones that can finish it, so they get the bigger mark. */
const RunDot = ({ cx, cy, payload }: DotProps) => {
  if (cx === undefined || cy === undefined || !payload) return null;
  if (payload.clean === null) {
    return <circle cx={cx} cy={cy} r={3} fill={COLORS.practice} />;
  }
  return payload.clean ? (
    <circle cx={cx} cy={cy} r={5} fill={COLORS.clean} />
  ) : (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill='rgb(24, 24, 27)'
      stroke={COLORS.notClean}
      strokeWidth={2}
    />
  );
};

/** Under this a lean is the measurement's own wobble, not the player's habit. */
const BIAS_NOTICE_MS = 10;

interface RunTooltipProps {
  active?: boolean;
  payload?: { payload?: ChartPoint }[];
  metric: GoalChartMetric;
}

const RunTooltip = ({ active, payload, metric }: RunTooltipProps) => {
  const { t } = useTranslation("goals");
  const dateLocale = useDateFnsLocale();
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;

  const kind =
    point.clean === null
      ? t("chart.practice_run")
      : point.clean
        ? t("chart.clean_goal_run")
        : t("chart.missed_goal_run");

  const lean =
    point.timingBiasMs === null || Math.abs(point.timingBiasMs) < BIAS_NOTICE_MS
      ? t("timing.centered")
      : point.timingBiasMs < 0
        ? t("timing.ahead", { ms: Math.abs(point.timingBiasMs) })
        : t("timing.behind", { ms: point.timingBiasMs });

  return (
    <div className='rounded-lg bg-zinc-950/95 px-3 py-2 text-xs'>
      {metric === "timing" && point.timingOffsetMs !== null ? (
        <>
          <p className='font-semibold tabular-nums text-zinc-100'>
            {t("timing.offset", { ms: point.timingOffsetMs })}
          </p>
          <p className='mt-0.5 text-zinc-400'>{lean}</p>
          <p className='mt-0.5 text-zinc-400'>
            {kind} · {point.bpm} BPM
          </p>
        </>
      ) : (
        <>
          <p className='font-semibold tabular-nums text-zinc-100'>
            {point.bpm} BPM
          </p>
          <p className='mt-0.5 text-zinc-400'>
            {kind} · {t("chart.accuracy", { accuracy: point.accuracy })}
          </p>
        </>
      )}
      <p className='mt-0.5 text-zinc-500'>
        {format(point.createdAt, "PP", { locale: dateLocale })}
      </p>
    </div>
  );
};

interface GoalRunsChartProps {
  runs: ExerciseRun[];
  /** The goal's tempo, drawn as the line to reach; leave out for an exercise without a goal. */
  targetBpm?: number;
  /** The milestone being played for — drawn as its own line while it is below the goal. */
  stageBpm?: number;
  /** Where the axis may start when there are no runs to set it — the exercise's own floor. */
  floorBpm?: number;
  metric?: GoalChartMetric;
  /** Draws each run's accuracy as a second line on the tempo chart, on its own % axis. */
  showAccuracy?: boolean;
  /** Off leaves the tempo line out — only with the accuracy line on. */
  showTempo?: boolean;
}

/** Round tick steps, so the axis reads 90 · 100 · 110 rather than 94 · 103 · 112. */
const TICK_STEPS = [5, 10, 20, 25, 50, 100];

export const bpmAxis = (
  bpms: number[],
  targetBpm?: number,
): { domain: [number, number]; ticks: number[] } => {
  const all = targetBpm === undefined ? bpms : [targetBpm, ...bpms];
  // Nothing to place at all: the metronome's fallback tempo.
  if (!all.length) all.push(60);
  const low = Math.min(...all);
  const high = Math.max(...all);
  const step =
    TICK_STEPS.find((candidate) => (high - low) / candidate <= 4) ?? 100;
  const from = Math.max(0, Math.floor((low - step / 2) / step) * step);
  const to = Math.ceil((high + step / 2) / step) * step;
  const ticks: number[] = [];
  for (let tick = from; tick <= to; tick += step) ticks.push(tick);
  return { domain: [from, to], ticks };
};

/**
 * The accuracy axis tops out at 100% and starts a round ten below the sloppiest
 * run, so the climb fills the height instead of hugging the top of 0–100.
 */
export const accuracyAxis = (
  accuracies: number[],
): { domain: [number, number]; ticks: number[] } => {
  const lowest = Math.min(100, ...accuracies);
  const from = Math.max(0, Math.floor((lowest - 5) / 10) * 10);
  const step = 100 - from > 40 ? 20 : 10;
  const ticks: number[] = [];
  for (let tick = 100; tick >= from; tick -= step) ticks.unshift(tick);
  return { domain: [ticks[0], 100], ticks };
};

/**
 * The timing axis runs from 0 ms (dead on the beat) down to the loosest run,
 * never shorter than 100 ms, so a tight first run doesn't fill the whole height
 * and read as sloppy.
 */
export const timingAxis = (
  offsetsMs: number[],
): { domain: [number, number]; ticks: number[] } => {
  const loosest = Math.max(100, ...offsetsMs);
  const step = loosest <= 100 ? 25 : loosest <= 200 ? 50 : 100;
  const to = Math.ceil(loosest / step) * step;
  const ticks: number[] = [];
  for (let tick = 0; tick <= to; tick += step) ticks.push(tick);
  return { domain: [0, to], ticks };
};

/**
 * Two invisible points: recharts draws no axes and no reference line over a
 * series without values, and the empty chart is there precisely to show them.
 */
const emptySpan = (value: number) => [
  { index: 0, value },
  { index: 1, value },
];

const LegendDot = ({ className }: { className: string }) => (
  <span className={className} aria-hidden />
);

/**
 * Every scored run of the exercise in the order it was played — its tempo
 * against the goal's, or how tightly it sat on the beat. Practice runs show the
 * climb; goal runs are marked clean or not.
 */
export const GoalRunsChart = ({
  runs,
  targetBpm,
  stageBpm,
  floorBpm,
  metric = "tempo",
  showAccuracy = false,
  showTempo = true,
}: GoalRunsChartProps) => {
  const { t } = useTranslation("goals");
  const isTiming = metric === "timing";

  // Runs from before timing was recorded have nothing to draw on the timing chart.
  const shown = isTiming
    ? runs.filter((run) => run.timingOffsetMs !== null)
    : runs;
  const data: ChartPoint[] = shown.map((run, index) => ({
    index,
    bpm: run.bpm,
    accuracy: run.accuracy,
    timingOffsetMs: run.timingOffsetMs,
    timingBiasMs: run.timingBiasMs,
    source: run.source,
    clean: run.clean,
    createdAt: run.createdAt,
  }));
  const isEmpty = data.length === 0;
  const chartData: Record<string, unknown>[] = isEmpty
    ? emptySpan(isTiming ? PERFECT_TIMING_MS : (targetBpm ?? floorBpm ?? 0))
    : data.map((point) => ({ ...point }));

  const showStage =
    stageBpm !== undefined && targetBpm !== undefined && stageBpm < targetBpm;
  const axis = isTiming
    ? timingAxis(shown.map((run) => run.timingOffsetMs ?? 0))
    : bpmAxis(
        [
          ...(isEmpty && floorBpm !== undefined
            ? [floorBpm]
            : shown.map((run) => run.bpm)),
          ...(showStage ? [stageBpm] : []),
        ],
        targetBpm,
      );
  const dataKey = isTiming ? "timingOffsetMs" : "bpm";
  const hasGoalRuns = shown.some((run) => run.clean !== null);
  const withAccuracy = showAccuracy && !isTiming && !isEmpty;
  // The run line stays whenever it is the only one there is to draw.
  const withMain = showTempo || !withAccuracy;
  const accuracy = accuracyAxis(shown.map((run) => run.accuracy));

  return (
    <div className='space-y-3'>
      {/* recharts makes the chart focusable and rings it on click — no line wanted */}
      <div className='relative h-56 w-full [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{
              top: 8,
              right: withAccuracy ? -8 : 12,
              bottom: 0,
              left: withMain ? -16 : 12,
            }}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey='index' hide padding={{ left: 8, right: 8 }} />
            <YAxis
              domain={axis.domain}
              ticks={axis.ticks}
              // Timing: tighter is better, so tighter sits higher — the line
              // climbs as the playing cleans up, the same way the tempo line does.
              reversed={isTiming}
              hide={!withMain}
              allowDecimals={false}
              tick={{ fill: COLORS.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            {withAccuracy && (
              <YAxis
                yAxisId='accuracy'
                orientation='right'
                domain={accuracy.domain}
                ticks={accuracy.ticks}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: COLORS.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
            )}
            {isTiming ? (
              <ReferenceArea
                y1={0}
                y2={PERFECT_TIMING_MS}
                fill={COLORS.tightZone}
                strokeOpacity={0}
              />
            ) : (
              withMain &&
              targetBpm !== undefined && (
                <ReferenceLine
                  y={targetBpm}
                  stroke={COLORS.target}
                  strokeDasharray='5 4'
                />
              )
            )}
            {!isTiming && withMain && showStage && (
              <ReferenceLine
                y={stageBpm}
                stroke={COLORS.stage}
                strokeDasharray='2 4'
              />
            )}
            {!isEmpty && (
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                content={<RunTooltip metric={metric} />}
              />
            )}
            {withAccuracy && (
              <Line
                yAxisId='accuracy'
                dataKey='accuracy'
                // Straight segments: a smoothed curve swings past the runs and
                // draws waves the playing never had.
                type='linear'
                stroke={COLORS.accuracy}
                strokeWidth={1.5}
                dot={{ r: 2.5, fill: COLORS.accuracy, strokeWidth: 0 }}
                activeDot={false}
                isAnimationActive={false}
              />
            )}
            {withMain && (
              <Line
                dataKey={isEmpty ? "value" : dataKey}
                type='monotone'
                stroke={isEmpty ? "transparent" : COLORS.line}
                strokeWidth={1.5}
                dot={isEmpty ? false : <RunDot />}
                activeDot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {isEmpty && (
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center pl-8'>
            <p className='max-w-xs rounded-lg bg-zinc-950/80 px-4 py-3 text-center text-sm text-zinc-400'>
              {isTiming
                ? t("timing.empty")
                : t(
                    targetBpm === undefined
                      ? "chart.empty_history"
                      : "chart.empty",
                  )}
            </p>
          </div>
        )}
      </div>
      <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400'>
        {isTiming ? (
          <span className='flex items-center gap-2'>
            <LegendDot className='h-2.5 w-4 rounded bg-emerald-400/20' />
            {t("timing.tight_zone", { ms: PERFECT_TIMING_MS })}
          </span>
        ) : (
          withMain &&
          targetBpm !== undefined && (
            <span className='flex items-center gap-2'>
              <LegendDot className='w-4 border-t-2 border-dashed border-emerald-400/60' />
              {t("chart.target", { bpm: targetBpm })}
            </span>
          )
        )}
        {!isTiming && withMain && showStage && (
          <span className='flex items-center gap-2'>
            <LegendDot className='w-4 border-t-2 border-dotted border-zinc-300/50' />
            {t("chart.stage", { bpm: stageBpm })}
          </span>
        )}
        {withMain && (
          <span className='flex items-center gap-2'>
            <LegendDot className='h-1.5 w-1.5 rounded-full bg-zinc-400' />
            {t("chart.practice_run")}
          </span>
        )}
        {withAccuracy && (
          <span className='flex items-center gap-2'>
            <LegendDot className='w-4 border-t-2 border-amber-400/75' />
            {t("chart.accuracy_line")}
          </span>
        )}
        {withMain && hasGoalRuns && (
          <>
            <span className='flex items-center gap-2'>
              <LegendDot className='h-2.5 w-2.5 rounded-full bg-emerald-400' />
              {t("chart.clean_goal_run")}
            </span>
            <span className='flex items-center gap-2'>
              <LegendDot className='h-2.5 w-2.5 rounded-full ring-2 ring-inset ring-zinc-500' />
              {t("chart.missed_goal_run")}
            </span>
          </>
        )}
      </div>
      {isTiming && !isEmpty && (
        <p className='text-xs text-zinc-500'>{t("timing.explainer")}</p>
      )}
    </div>
  );
};
