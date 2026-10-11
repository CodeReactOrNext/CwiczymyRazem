import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { translateOr } from "lib/i18n/translate";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { MIN_INTONATION_LEAN_CENTS } from "../utils/pitchScoring";
import type { TimingCounts, TimingGrade } from "../utils/timingGrade";
import type { TimingPrecision } from "../utils/timingPrecision";

const GRADES: TimingGrade[] = [3, 2, 1];

// Only the top grade gets a colour — the tab's own hit green. The rest stay
// neutral: a beginner should read them as room to grow, not as a warning.
const GRADE_STYLE: Record<TimingGrade, { bar: string; chip: string }> = {
  3: { bar: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-400" },
  2: { bar: "bg-zinc-500",    chip: "bg-zinc-800 text-zinc-300" },
  1: { bar: "bg-zinc-700",    chip: "bg-zinc-800 text-zinc-400" },
};

const COPY = {
  timing: {
    namespace: "timing_breakdown",
    title: "Timing",
    share: "{{pct}}% on time",
    grades: { 3: "On time", 2: "Close", 1: "Loose" },
    note: "A note off the beat still counts, but for less: a 2 keeps two thirds of its points, a 1 keeps a third.",
  },
  intonation: {
    namespace: "intonation_breakdown",
    title: "Intonation",
    share: "{{pct}}% in tune",
    grades: { 3: "In tune", 2: "Close", 1: "Off" },
    note: "A note or bend off its pitch still counts, but for less: within 40 cents keeps two thirds of its points, further off a third.",
  },
} as const;

/** Below this a lean is inside what the detector itself can't tell apart. */
const MIN_LEAN_MS = 15;

interface TimingBreakdownProps {
  timing: TimingCounts;
  /** "intonation" reads the counts as how close bends got to their pitch. */
  variant?: "timing" | "intonation";
  /** Where the run's notes leaned — adds an "early / late" line. Timing only. */
  precision?: TimingPrecision | null;
  /** Where the run's notes landed (median signed cents) — adds a "flat /
   *  sharp" line. Intonation only. */
  biasCents?: number | null;
  className?: string;
}

/**
 * How the run's hits split across grades — and why the score came out lower
 * than the hit count suggests when some of them were off.
 */
export const TimingBreakdown = ({ timing, variant = "timing", precision, biasCents, className }: TimingBreakdownProps) => {
  const { t } = useTranslation("session");
  const copy = COPY[variant];
  const total = timing[3] + timing[2] + timing[1];
  if (total === 0) return null;
  const topPct = Math.round((timing[3] / total) * 100);
  const lean = variant === "timing" && precision && Math.abs(precision.biasMs) >= MIN_LEAN_MS ? precision.biasMs : null;
  const pitchLean = variant === "intonation" && typeof biasCents === "number" && Math.abs(biasCents) >= MIN_INTONATION_LEAN_CENTS
    ? biasCents
    : null;

  return (
    <div className={className}>
      <div className='flex items-baseline justify-between'>
        <p className='text-[11px] font-semibold tracking-wide text-zinc-500'>{t(`${copy.namespace}.title`, copy.title)}</p>
        <p className='text-[11px] tabular-nums text-zinc-400'>
          {translateOr(t, `${copy.namespace}.share`, copy.share, { pct: topPct })}
        </p>
      </div>

      <div className='mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full' aria-hidden>
        {GRADES.filter((grade) => timing[grade] > 0).map((grade) => (
          <div key={grade} className={cn("h-full", GRADE_STYLE[grade].bar)} style={{ flexGrow: timing[grade] }} />
        ))}
      </div>

      <div className='mt-4 grid grid-cols-3 gap-2'>
        {GRADES.map((grade) => (
          <div key={grade} className='flex items-center gap-2.5'>
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                GRADE_STYLE[grade].chip
              )}>
              {grade}
            </span>
            <div>
              <div className='text-sm font-bold leading-none tabular-nums text-zinc-100'>{timing[grade]}</div>
              <div className='mt-1 text-[11px] text-zinc-500'>{t(`${copy.namespace}.grades.${grade}`, copy.grades[grade])}</div>
            </div>
          </div>
        ))}
      </div>

      {lean !== null && (
        // Same direction the tab's arrows point: early is ahead of the beat, to the left.
        <p className='mt-4 flex items-center gap-2 text-xs text-zinc-300'>
          {lean < 0 ? <ArrowLeft className='h-3.5 w-3.5 shrink-0' aria-hidden /> : <ArrowRight className='h-3.5 w-3.5 shrink-0' aria-hidden />}
          {lean < 0
            ? translateOr(t, "timing_breakdown.lean_early", "Mostly early — about {{ms}} ms ahead of the beat", { ms: Math.abs(lean) })
            : translateOr(t, "timing_breakdown.lean_late", "Mostly late — about {{ms}} ms behind the beat", { ms: lean })}
        </p>
      )}

      {pitchLean !== null && (
        <p className='mt-4 text-xs text-zinc-300'>
          {pitchLean < 0
            ? translateOr(t, "intonation_breakdown.lean_flat", "Mostly flat — your notes land about {{cents}} cents under the pitch", { cents: Math.abs(pitchLean) })
            : translateOr(t, "intonation_breakdown.lean_sharp", "Mostly sharp — your notes land about {{cents}} cents over the pitch", { cents: pitchLean })}
        </p>
      )}

      {timing[3] < total && (
        <p className='mt-4 text-xs leading-relaxed text-zinc-400'>{t(`${copy.namespace}.note`, copy.note)}</p>
      )}
    </div>
  );
};
