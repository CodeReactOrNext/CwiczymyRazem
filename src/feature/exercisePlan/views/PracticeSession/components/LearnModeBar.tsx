import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { RotateCcw, SkipForward } from "lucide-react";
import { memo } from "react";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";

/**
 * The strip above the tab while learn mode is on: what the tab is waiting for,
 * how far along the pass is, and the two ways out of a stuck note — skip it, or
 * start the pass over.
 */
export const LearnModeBar = memo(function LearnModeBar() {
  const { t } = useTranslation("session");
  const { learn } = useNoteMatchingContext();
  if (!learn?.enabled) return null;

  const { stepIndex, totalSteps, passes } = learn;

  return (
    <div className='mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg bg-zinc-900/40 px-5 py-4'>
      <div className='min-w-0'>
        <p className='text-sm font-semibold text-zinc-100'>{t("learn.title")}</p>
        <p className='mt-1 text-xs text-zinc-400'>{t("learn.waiting")}</p>
      </div>

      <div className='flex items-center gap-6'>
        <div className='text-right'>
          <p className='font-mono text-sm font-semibold tabular-nums text-zinc-100'>
            {t("learn.progress", { current: Math.min(stepIndex + 1, totalSteps), total: totalSteps })}
          </p>
          {passes > 0 && <p className='mt-1 text-xs text-emerald-400'>{t("learn.passes", { count: passes })}</p>}
        </div>

        <div className='flex items-center gap-2'>
          <Button type='button' variant='ghost' onClick={learn.skip}>
            <SkipForward className='text-zinc-400' />
            {t("learn.skip")}
          </Button>
          <Button type='button' variant='ghost' size='icon' onClick={learn.restart} aria-label={t("learn.restart")} title={t("learn.restart")}>
            <RotateCcw className='text-zinc-400' />
          </Button>
        </div>
      </div>
    </div>
  );
});
