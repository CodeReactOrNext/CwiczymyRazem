import { useTranslation } from "hooks/useTranslation";
import { RotateCcw, SkipForward } from "lucide-react";
import { memo } from "react";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useTimerContext } from "../contexts/TimerContext";

const actionClass =
  "flex h-9 items-center gap-2 rounded-lg bg-zinc-800 px-3 text-xs font-semibold text-zinc-300 outline-none transition-colors hover:bg-zinc-700 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400/50";

/**
 * The strip above the tab while learn mode is on: what the tab is waiting for,
 * how far along the pass is, and the two ways out of a stuck note — skip it, or
 * start the pass over.
 */
export const LearnModeBar = memo(function LearnModeBar() {
  const { t } = useTranslation("session");
  const { learn } = useNoteMatchingContext();
  const { isRunning } = useTimerContext();
  if (!learn?.enabled) return null;

  const { stepIndex, totalSteps, passes } = learn;

  return (
    <div className='mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg bg-zinc-900/40 px-5 py-4'>
      <div className='min-w-0'>
        <p className='text-sm font-semibold text-zinc-100'>{t("learn.title")}</p>
        <p className='mt-1 text-xs text-zinc-400'>{isRunning ? t("learn.waiting") : t("learn.press_play")}</p>
      </div>

      <div className='flex items-center gap-6'>
        <div className='text-right'>
          <p className='font-mono text-sm font-semibold tabular-nums text-zinc-100'>
            {t("learn.progress", { current: Math.min(stepIndex + 1, totalSteps), total: totalSteps })}
          </p>
          {passes > 0 && <p className='mt-1 text-xs text-emerald-400'>{t("learn.passes", { count: passes })}</p>}
        </div>

        <div className='flex items-center gap-2'>
          <button type='button' onClick={learn.skip} className={actionClass}>
            <SkipForward className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
            {t("learn.skip")}
          </button>
          <button type='button' onClick={learn.restart} aria-label={t("learn.restart")} title={t("learn.restart")} className={actionClass}>
            <RotateCcw className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
          </button>
        </div>
      </div>
    </div>
  );
});
