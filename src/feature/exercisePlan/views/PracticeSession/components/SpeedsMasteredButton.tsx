import { buttonVariants,PRESSABLE_KEY } from "assets/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { RunHistory } from "feature/exerciseGoals/components/RunHistory";
import { useTranslation } from "hooks/useTranslation";
import { Check,X } from "lucide-react";
import { memo, useState } from "react";

import { BpmProgressGrid } from "../../../components/BpmProgressGrid";
import type { Exercise } from "../../../types/exercise.types";
import { useBpmProgressContext } from "../contexts/BpmProgressContext";

interface SpeedsMasteredButtonProps {
  exercise: Exercise;
  examMode?: boolean;
  compact?: boolean;
}

export const SpeedsMasteredButton = memo(function SpeedsMasteredButton({
  exercise,
  examMode = false,
  compact = false,
}: SpeedsMasteredButtonProps) {
  const { t } = useTranslation("session");
  const [isOpen, setIsOpen] = useState(false);
  const { bpmStages, completedBpms, isBpmLoading, onBpmToggle } = useBpmProgressContext();

  const hasBpmProgress =
    !!exercise.metronomeSpeed && bpmStages.length > 0 && !exercise.gpFileUrl && !examMode;

  if (!hasBpmProgress) return null;

  const h = compact ? "h-8" : "h-9";

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className={cn(
          PRESSABLE_KEY,
          "flex items-center gap-2 rounded-lg font-medium transition-colors",
          h,
          compact ? "px-2" : "px-2.5",
          isOpen
            ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
            : "bg-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700"
        )}
        title={t("speeds_mastered.hint")}
      >
        {compact ? (
          <>
            <Check size='1em' className='h-3 w-3 shrink-0' />
            <span
              className={cn(
                "rounded bg-zinc-900 px-1 font-mono text-[11px] tabular-nums",
                completedBpms.length > 0 ? "text-emerald-400" : "text-zinc-500"
              )}>
              {completedBpms.length}/{bpmStages.length}
            </span>
          </>
        ) : (
          <>
            <span className="text-[13px] font-medium">{t("toolbar.progress")}</span>
            {/* The app's progress bar in small: a thick fill with the white glint on top. */}
            <span aria-hidden className='relative h-2 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-700'>
              <span
                className='absolute inset-y-0 left-0 rounded-full bg-emerald-500'
                style={{ width: `${(completedBpms.length / bpmStages.length) * 100}%` }}
              />
              {completedBpms.length > 0 && (
                <span className='light-hide absolute left-[3px] top-[2px] h-0.5 w-[7px] rounded-full bg-white/50' />
              )}
            </span>
            <span className='text-[13px] font-semibold tabular-nums text-zinc-100'>
              {completedBpms.length}/{bpmStages.length}
            </span>
          </>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* z-index must beat the session view, overlay included, or this dialog
            opens invisibly behind it. Centred card at every width — the base
            dialog goes full-screen on phones, far too much for a row of chips. */}
        <DialogContent
          hideCloseButton
          className='left-[50%] top-[50%] z-[99999999] h-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 overflow-y-auto rounded-lg border-0 bg-zinc-900 p-5 text-white shadow-none sm:p-6'
          overlayClassName='z-[99999998]'>
          <div className='flex items-center gap-3'>
            <DialogTitle className='text-base font-semibold tracking-normal text-zinc-100'>
              {t("speeds_mastered.label")}
            </DialogTitle>
            <span
              className={cn(
                "rounded bg-zinc-800/60 px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums",
                completedBpms.length > 0 ? "text-emerald-400" : "text-zinc-400"
              )}>
              {completedBpms.length}/{bpmStages.length}
            </span>
            <DialogDescription className='sr-only'>
              {t("speeds_mastered.hint")}
            </DialogDescription>
            <DialogClose
              aria-label={t("close")}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-mr-2 ml-auto")}>
              <X />
            </DialogClose>
          </div>
          <BpmProgressGrid
            bpmStages={bpmStages}
            completedBpms={completedBpms}
            recommendedBpm={exercise.metronomeSpeed!.recommended}
            onToggle={onBpmToggle}
            isLoading={isBpmLoading}
            hideHeader
          />
          <RunHistory
            exerciseId={exercise.id}
            floorBpm={exercise.metronomeSpeed!.min}
          />
        </DialogContent>
      </Dialog>
    </>
  );
});
