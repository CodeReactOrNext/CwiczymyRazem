import { cn } from "assets/lib/utils";
import type { DailyBoardPlace } from "feature/dailyExercise/types/dailyExercise.types";
import { dailyResultRows } from "feature/dailyExercise/utils/dailyExercise";
import type { Translate } from "lib/i18n/translate";

/**
 * The closed board under an exercise-of-the-day result: its top five, and for
 * a player who finished below them, a gap and their own row — so the
 * notification shows the race and where the recipient ended up in it.
 */
export const DailyResultBoard = ({
  board,
  place,
  score,
  t,
}: {
  board: DailyBoardPlace[];
  place: number;
  score?: number;
  t: Translate;
}) => {
  const own = score !== undefined ? { place, displayName: t("bell.daily_you"), score } : null;

  return (
    <ol className='mt-2.5 space-y-0.5'>
      {dailyResultRows(board, own).map((row, i) =>
        row ? (
          <li
            key={row.place}
            className={cn(
              "flex items-center gap-2.5 rounded px-2 py-1 text-xs",
              row.place === place ? "bg-cyan-500/10 font-semibold text-cyan-300" : "text-zinc-400",
            )}>
            <span className='w-5 shrink-0 text-right tabular-nums'>{row.place}</span>
            <span className='min-w-0 flex-1 truncate'>{row.displayName}</span>
            <span className='shrink-0 tabular-nums'>{row.score.toLocaleString()}</span>
          </li>
        ) : (
          <li key={`gap-${i}`} aria-hidden='true' className='px-2 text-xs leading-none text-zinc-600'>
            <span className='inline-block w-5 text-right'>⋯</span>
          </li>
        ),
      )}
    </ol>
  );
};
