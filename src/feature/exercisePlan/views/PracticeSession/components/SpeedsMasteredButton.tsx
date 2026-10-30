import { PRESSABLE_KEY } from "assets/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
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

  const h = compact ? "h-8" : "h-12";

  return (
    <>
      {!compact && <div className="h-7 w-px bg-white/10 self-center" aria-hidden />}
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className={cn(
          PRESSABLE_KEY,
          "flex items-center gap-2 rounded-lg font-bold transition-colors",
          h,
          compact ? "px-2" : "px-4",
          isOpen
            ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
            : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
        )}
        title={t("speeds_mastered.hint")}
      >
        <Check size='1em' className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        {!compact && <span className="text-[10px] font-semibold tracking-wide">{t("speeds_mastered.label")}</span>}
        <span
          className={cn(
            "rounded bg-zinc-900 font-mono",
            compact ? "px-1 text-[10px]" : "px-1.5 py-0.5 text-xs",
            completedBpms.length > 0 ? "text-emerald-400" : "text-zinc-500"
          )}
        >
          {completedBpms.length}/{bpmStages.length}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* z-index must beat the session view, overlay included, or this dialog
            opens invisibly behind it. Centred card at every width — the base
            dialog goes full-screen on phones, far too much for a row of chips. */}
        <DialogContent
          hideCloseButton
          className='left-[50%] top-[50%] z-[99999999] h-auto w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 rounded-lg border-0 bg-zinc-900 p-5 text-white shadow-none sm:p-6'
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
              className='-mr-2 ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
              <X className='h-4 w-4' />
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
        </DialogContent>
      </Dialog>
    </>
  );
});
