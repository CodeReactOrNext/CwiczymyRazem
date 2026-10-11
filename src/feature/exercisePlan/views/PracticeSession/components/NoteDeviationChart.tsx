import { ChartContainer, ChartTooltip } from "assets/components/ui/chart";
import { useTranslation } from "hooks/useTranslation";
import { translateOr } from "lib/i18n/translate";
import { useMemo } from "react";
import { ReferenceArea, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from "recharts";

import type { RunNote } from "../utils/timingGrade";

// Same three colours the tab paints a note with: in the band, a little out,
// further out.
const IN_BAND = "#10b981";
const CLOSE = "#f59e0b";
const OFF = "#f97316";

interface Scale {
  /** The top grade's band, either side of zero. */
  band: number;
  /** The middle grade's band. */
  close: number;
  /** How far the chart reaches; further points sit on its edge. */
  range: number;
}

const SCALES: Record<NoteDeviationChartProps["variant"], Scale> = {
  // pitchScoring.ts IN_TUNE_CENTS / CLOSE_CENTS.
  intonation: { band: 20, close: 40, range: 60 },
  // timingGrade.ts: on time / close for any note longer than a fast sixteenth.
  timing: { band: 100, close: 200, range: 300 },
};

interface Point {
  n: number;
  y: number;
  value: number;
  color: string;
}

/** Fewer points than this make a dot, not a picture of the run. */
export const MIN_CHART_POINTS = 2;

/** The values a run would chart for `variant` — exported so the caller can
 *  decide whether there is a chart to show at all. */
export const chartValues = (notes: readonly RunNote[], variant: NoteDeviationChartProps["variant"]): number[] =>
  notes.flatMap((note) => {
    const value = variant === "intonation" ? note.cents : note.timingMs;
    return value === null ? [] : [value];
  });

/** A dot in the colour of the grade it got. */
const GradeDot = (props: { cx?: number; cy?: number; payload?: Point }) => (
  <circle cx={props.cx} cy={props.cy} r={3.5} fill={props.payload?.color ?? IN_BAND} />
);

interface DeviationTooltipProps {
  active?: boolean;
  payload?: { payload?: Point }[];
  noteLabel: (n: number) => string;
  format: (value: number) => string;
}

const DeviationTooltip = ({ active, payload, noteLabel, format }: DeviationTooltipProps) => {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className='rounded-lg bg-zinc-950/90 px-3 py-2 text-xs'>
      <span className='text-zinc-400'>{noteLabel(point.n)} </span>
      <span className='font-bold' style={{ color: point.color }}>{format(point.value)}</span>
    </div>
  );
};

interface NoteDeviationChartProps {
  variant: "intonation" | "timing";
  notes: readonly RunNote[];
}

/**
 * The run note by note: how far each note sat from its pitch (intonation) or
 * from its beat (timing), in the order it was played, loops included. The band
 * across the middle is the top grade; dots take the colour of the grade they
 * got, and a faint line joins them so a drift — bends sagging flat as the hand
 * tires, rushing as the tempo climbs — reads at a glance.
 */
export const NoteDeviationChart = ({ variant, notes }: NoteDeviationChartProps) => {
  const { t } = useTranslation("session");
  const scale = SCALES[variant];

  const points = useMemo<Point[]>(
    () =>
      chartValues(notes, variant).map((value, i) => {
        const off = Math.abs(value);
        return {
          n: i + 1,
          y: Math.max(-scale.range, Math.min(scale.range, value)),
          value,
          color: off <= scale.band ? IN_BAND : off <= scale.close ? CLOSE : OFF,
        };
      }),
    [notes, variant, scale],
  );

  const format = (value: number) => {
    const rounded = Math.round(Math.abs(value));
    if (variant === "intonation") return `${value > 0 ? "+" : value < 0 ? "−" : ""}${rounded}¢`;
    if (rounded === 0) return translateOr(t, "success.chart_on_beat", "on the beat");
    return value < 0
      ? translateOr(t, "success.chart_early", "{{ms}} ms early", { ms: rounded })
      : translateOr(t, "success.chart_late", "{{ms}} ms late", { ms: rounded });
  };

  const title = variant === "intonation"
    ? t("success.intonation_over_time", "Intonation, note by note")
    : t("success.timing_over_time", "Timing, note by note");
  const [above, below] = variant === "intonation"
    ? [t("success.chart_sharp", "sharp"), t("success.chart_flat", "flat")]
    : [t("success.chart_late_axis", "late"), t("success.chart_early_axis", "early")];

  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <p className='text-[11px] font-semibold tracking-wide text-zinc-500'>{title}</p>
        <span className='text-[11px] text-zinc-500'>
          {translateOr(t, "success.chart_notes", "{{count}} notes", { count: points.length })}
        </span>
      </div>

      <div className='relative'>
        <span className='pointer-events-none absolute right-0 top-0 text-[11px] text-zinc-500'>{above}</span>
        <span className='pointer-events-none absolute bottom-0 right-0 text-[11px] text-zinc-500'>{below}</span>
        <ChartContainer config={{ value: { label: title, color: IN_BAND } }} className='h-[120px] w-full'>
          <ScatterChart margin={{ top: 8, right: 40, left: 4, bottom: 8 }}>
            <XAxis type='number' dataKey='n' hide domain={[1, Math.max(2, points.length)]} />
            <YAxis type='number' dataKey='y' hide domain={[-scale.range, scale.range]} />
            <ReferenceArea y1={-scale.band} y2={scale.band} fill={IN_BAND} fillOpacity={0.08} stroke='none' />
            <ReferenceLine y={0} stroke='rgba(255,255,255,0.14)' strokeDasharray='4 3' />
            <ChartTooltip
              cursor={false}
              content={
                <DeviationTooltip
                  noteLabel={(n) => translateOr(t, "success.chart_note", "Note {{n}}", { n })}
                  format={format}
                />
              }
            />
            <Scatter
              data={points}
              line={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1 }}
              animationDuration={1200}
              shape={GradeDot}
            />
          </ScatterChart>
        </ChartContainer>
      </div>
    </div>
  );
};
