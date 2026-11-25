import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Heart } from "lucide-react";

/** Solved rounds in a row from which the streak is worth a word. */
const MIN_SHOWN_STREAK = 3;

interface HuntRoundBarProps {
  /** `null` when the drill isn't on a rotation timer. */
  secondsLeft: number | null;
  secondsTotal: number | null;
  complete: boolean;
  /** Wrong clicks against the exam's limit; left out everywhere else. */
  mistakes?: { count: number; limit: number };
  /** Solved rounds in a row. */
  streak?: number;
  /** Moves past the round; the row keeps its place when there is nothing to skip. */
  onSkip?: () => void;
  canSkip?: boolean;
}

/**
 * The round's one line: the time draining away, what is left of it in seconds,
 * and the lives of an exam or the streak of a practice run. The score is not
 * here — it is the session's, and the session has its own readout for it.
 */
export const HuntRoundBar = ({
  secondsLeft,
  secondsTotal,
  complete,
  mistakes,
  streak = 0,
  onSkip,
  canSkip = true,
}: HuntRoundBarProps) => {
  const { t } = useTranslation("session");
  const isCritical = !complete && secondsLeft !== null && secondsLeft <= 3;
  const isLow = !complete && secondsLeft !== null && secondsLeft <= 5;
  const fraction =
    complete || secondsLeft === null || !secondsTotal
      ? 1
      : Math.max(0, Math.min(1, secondsLeft / secondsTotal));
  const lives = mistakes ? Math.max(0, mistakes.limit - mistakes.count) : 0;

  return (
    <div className='flex w-full items-center gap-4 shortwide:gap-3'>
      {secondsLeft !== null && (
        <>
          <div
            role='progressbar'
            aria-label={t("hunt.time_left")}
            aria-valuemin={0}
            aria-valuemax={secondsTotal ?? undefined}
            aria-valuenow={secondsLeft}
            className='h-4 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-zinc-800 shortwide:h-3'>
            <div
              className={cn(
                "relative h-full rounded-full transition-[width,background-color] duration-1000 ease-linear motion-reduce:transition-none",
                complete ? "bg-emerald-500" : isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-cyan-500",
              )}
              style={{ width: `${fraction * 100}%` }}>
              <span aria-hidden className='light-hide absolute inset-x-2 top-1 h-1 rounded-full bg-white/30 shortwide:top-[3px] shortwide:h-[3px]' />
            </div>
          </div>
          <span
            className={cn(
              "min-w-8 pt-1 text-right font-teko text-4xl font-semibold leading-none tabular-nums shortwide:text-2xl",
              isCritical ? "text-red-400" : "text-zinc-100",
            )}>
            {secondsLeft}
          </span>
        </>
      )}

      {mistakes ? (
        <span role='img' aria-label={t("interval_click.lives", { count: lives, limit: mistakes.limit })} className='flex gap-1'>
          {Array.from({ length: mistakes.limit }, (_, i) => (
            <Heart
              key={i}
              aria-hidden
              strokeWidth={0}
              className={cn("h-6 w-6 fill-current transition-colors duration-base shortwide:h-5 shortwide:w-5", i < lives ? "text-red-400" : "text-zinc-700")}
            />
          ))}
        </span>
      ) : (
        streak >= MIN_SHOWN_STREAK && (
          <span className='whitespace-nowrap text-sm font-bold text-orange-400'>{t("combo.in_a_row", { count: streak })}</span>
        )
      )}

      {onSkip && (
        // Kept in the row through a verdict, so the bar doesn't change its length.
        <Button type='button' variant='ghost' size='sm' onClick={onSkip} className={cn(!canSkip && "invisible")}>
          {t("note_hunt.skip")}
        </Button>
      )}
    </div>
  );
};
