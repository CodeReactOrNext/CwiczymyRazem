import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Kostek } from "components/Mascot/Kostek";
import { useTranslation } from "hooks/useTranslation";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { DRILL_PASSES } from "../utils/barPasses";
import type { RunVerdict } from "../utils/runVerdict";

/** The strip's ground: green for a run worth it, plain for everything else. */
export type VerdictTone = "good" | "plain";

export const getVerdictTone = (verdict: RunVerdict): VerdictTone =>
  verdict.kind === "rough" ? "plain" : "good";

export const VERDICT_GROUND: Record<VerdictTone, string> = {
  good: "bg-emerald-950",
  plain: "bg-zinc-900",
};

interface StripProps {
  tone: VerdictTone;
  mascot?: ReactNode;
  title: string;
  detail: string;
  /** The detail is a sentence to read, so it may take a second line. */
  wrapDetail?: boolean;
  children: ReactNode;
}

/** What happened on the left, what next on the right — the same on every strip. */
export const Strip = ({ tone, mascot, title, detail, wrapDetail, children }: StripProps) => (
  <div className='flex min-w-0 flex-1 items-center gap-3 duration-slow animate-in fade-in slide-in-from-bottom-4 sm:gap-4'>
    {mascot}
    <div className='min-w-0 flex-1' aria-live='polite'>
      <p className={cn("truncate text-base font-bold sm:text-xl shortwide:text-base", tone === "good" ? "text-emerald-300" : "text-zinc-100")}>
        {title}
      </p>
      <p className={cn("text-xs text-zinc-300 sm:text-sm shortwide:text-xs", wrapDetail ? "line-clamp-2 leading-snug" : "truncate")}>{detail}</p>
    </div>
    <div className='flex shrink-0 items-center gap-2 sm:gap-3'>{children}</div>
  </div>
);

interface RunVerdictStripProps {
  verdict: RunVerdict;
  /** Minutes of the exercise's clock, for a run nothing listened to. */
  minutes: number;
  nextTitle: string;
  onAgain: () => void;
  /** Loops the weak bar on its own; left out where the session can't. */
  onDrill?: (measure: number) => void;
  onContinue: () => void;
  isBusy?: boolean;
}

/**
 * The session's answer to an exercise that ran its clock down, in the place the
 * transport stood: Continue is where Start and Pause were.
 */
export const RunVerdictStrip = ({
  verdict, minutes, nextTitle, onAgain, onDrill, onContinue, isBusy,
}: RunVerdictStripProps) => {
  const { t } = useTranslation("session");
  const tone = getVerdictTone(verdict);
  const weakMeasure = verdict.kind === "rough" ? verdict.weakMeasure : null;
  const canDrill = weakMeasure !== null && !!onDrill;

  const title =
    verdict.kind === "time"
      ? t("verdict.time", { minutes })
      : verdict.kind === "clean"
        ? t("verdict.clean")
        : weakMeasure !== null
          ? t("verdict.weak_bar", { bar: weakMeasure + 1 })
          : t("verdict.rough");
  const detail =
    verdict.kind === "time"
      ? t("verdict.next", { title: nextTitle })
      : t("verdict.stats", { accuracy: verdict.accuracy, count: verdict.streak });

  return (
    <Strip
      tone={tone}
      title={title}
      detail={detail}
      mascot={
        <Kostek
          mood={tone === "good" ? "approve" : "idle"}
          short
          className='-my-2 h-14 shrink-0 sm:h-16 shortwide:h-11'
        />
      }>
      <Button
        variant='secondary'
        size='lg'
        onClick={onAgain}
        disabled={isBusy}
        aria-label={t("verdict.again")}
        className={cn("aspect-square px-0", !canDrill && "sm:aspect-auto sm:px-6 shortwide:aspect-square shortwide:px-0")}>
        <RotateCcw />
        {!canDrill && <span className='hidden sm:inline shortwide:hidden'>{t("verdict.again")}</span>}
      </Button>
      {canDrill && (
        <Button variant='secondary' size='lg' onClick={() => onDrill(weakMeasure)} disabled={isBusy}>
          {t("verdict.drill", { bar: weakMeasure + 1 })}
        </Button>
      )}
      {/* Focused, so Space and Enter carry on the way Space started the run. */}
      <Button size='lg' autoFocus onClick={onContinue} loading={isBusy}>
        {t("verdict.continue")}
      </Button>
    </Strip>
  );
};

interface BarDrillStripProps {
  /** The bar's number as the player counts, from 1. */
  bar: number;
  bpm: number;
  passes: number;
  isPlaying: boolean;
  onToggle: () => void;
  onLeave: () => void;
}

/** The weak bar on its own: a dot for every clean pass, then the way back. */
export const BarDrillStrip = ({ bar, bpm, passes, isPlaying, onToggle, onLeave }: BarDrillStripProps) => {
  const { t } = useTranslation("session");
  const isDone = passes >= DRILL_PASSES;

  return (
    <Strip
      tone={isDone ? "good" : "plain"}
      title={isDone ? t("drill.done") : t("drill.title", { bar })}
      detail={isDone ? t("drill.done_detail", { bar, bpm }) : t("drill.detail", { count: DRILL_PASSES, bpm })}
      mascot={isDone ? <Kostek mood='approve' short className='-my-2 h-14 shrink-0 sm:h-16 shortwide:h-11' /> : undefined}>
      {isDone ? (
        <Button size='lg' autoFocus onClick={onLeave}>{t("verdict.continue")}</Button>
      ) : (
        <>
          <div className='mr-1 flex gap-2 sm:mr-3' role='img' aria-label={t("drill.passes", { done: passes, total: DRILL_PASSES })}>
            {Array.from({ length: DRILL_PASSES }, (_, i) => (
              <span
                key={i}
                className={cn("h-4 w-4 rounded-full transition-colors duration-base", i < passes ? "bg-emerald-400" : "bg-zinc-700")}
              />
            ))}
          </div>
          <Button variant='ghost' size='lg' onClick={onLeave} className='text-zinc-400'>{t("drill.skip")}</Button>
          <Button size='lg' onClick={onToggle}>
            {isPlaying ? <Pause /> : <Play />}
            {isPlaying ? t("controls.pause") : t("start_gate.start")}
          </Button>
        </>
      )}
    </Strip>
  );
};
