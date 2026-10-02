import { Button } from "assets/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "assets/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { memo, useRef, useState } from "react";
import { FaCheck, FaFlagCheckered, FaSignOutAlt,FaStepBackward, FaStepForward } from "react-icons/fa";

import type { Exercise } from "../../../types/exercise.types";
import { sumSessionTime, useSessionTimeStore } from "../hooks/sessionTimeStore";
import { FinishSessionDialog } from "./FinishSessionDialog";
import { MainTimerSection } from "./MainTimerSection";
import { ShortcutsLegend } from "./ShortcutsLegend";

interface SessionBottomBarProps {
  /** Song practice with a backing track — surfaces its nudge keys in the legend. */
  hasBackingTrack?: boolean;
  onClose?: () => void;
  skipExitDialog?: boolean;
  exerciseKey: number;
  currentExercise: Exercise;
  isLastExercise: boolean;
  isPlaying: boolean;
  toggleTimer: () => void;
  handleRestart: () => void;
  handleNextExerciseClick: () => Promise<void>;

  /** The session's own bar is met — finishing awards skill points as usual. */
  canFinishSession: boolean;
  /** At least one exercise got its 20s, so there is something worth logging. */
  hasLoggedPractice: boolean;
  currentExerciseIndex: number;
  totalExercises: number;
  onGoToPreviousExercise: () => void;
  isFinishing?: boolean;
  isSubmittingReport: boolean;
  onFinishSession: (options?: { earlyFinish?: boolean }) => Promise<void>;
  examMode?: boolean;
}

/**
 * Fixed bottom navigation bar: exit button, timer, back/next controls.
 */
const SessionBottomBarComponent = ({
  onClose,
  exerciseKey,
  currentExercise,
  isLastExercise,
  isPlaying,
  toggleTimer,
  handleRestart,
  handleNextExerciseClick,
  canFinishSession,
  hasLoggedPractice,
  currentExerciseIndex,
  totalExercises,
  onGoToPreviousExercise,
  isFinishing,
  isSubmittingReport,
  onFinishSession,
  skipExitDialog = false,
  examMode = false,
  hasBackingTrack = false,
}: SessionBottomBarProps) => {
  const { t } = useTranslation(["common"]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const hasTempoControl = !!currentExercise.metronomeSpeed;
  const [showFinishEarlyDialog, setShowFinishEarlyDialog] = useState(false);
  // Only meaningful mid-plan: the last exercise already has its own "Finish
  // Session" action, and a single-exercise plan has nothing to skip ahead of.
  const canFinishEarly = !examMode && !isLastExercise && totalExercises > 1;
  // Below the session's own bar — a skill exercise that wasn't played out, or a
  // plan whose exercises never got their 20s. Finishing from here is still
  // allowed, it just doesn't earn the skill points; the dialog spells that out.
  const isEarlyFinish = !canFinishSession;
  const finishDisabled = !hasLoggedPractice;

  // Nothing was practised yet (timer never ran) — there is no progress to lose,
  // so Exit leaves straight away instead of warning about an unsaved session.
  const handleExitClick = () => {
    const hasPractised = isPlaying || sumSessionTime(useSessionTimeStore.getState().time) > 0;
    if (skipExitDialog || !hasPractised) {
      onClose?.();
      return;
    }
    setShowExitDialog(true);
  };

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">

        {/* Left: Exit */}
        <div className="flex-1 flex items-center justify-start gap-4">
          <Button
            variant="ghost"
            onClick={handleExitClick}
            className="rounded-lg font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
          >
            <FaSignOutAlt />
            {t("common:practice.exit")}
          </Button>
          <ShortcutsLegend hasTempoControl={hasTempoControl} hasBackingTrack={hasBackingTrack} />
        </div>

        {/* Center: Timer */}
        <div className="flex-none flex justify-center">
          <MainTimerSection
            exerciseKey={exerciseKey}
            currentExercise={currentExercise}
            isLastExercise={isLastExercise}
            isPlaying={isPlaying}
            toggleTimer={toggleTimer}
            handleRestart={handleRestart}
            handleNextExercise={handleNextExerciseClick}
            showExerciseInfo={false}
            variant="compact"
          />
        </div>

        {/* Right: Back / Next / Finish */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {currentExerciseIndex > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
              onClick={onGoToPreviousExercise}
            >
              <FaStepBackward /> {t("common:back") || "Back"}
            </Button>
          )}
          {canFinishEarly && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={finishDisabled ? 0 : -1}>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={isFinishing || isSubmittingReport}
                    className={cn(
                      "rounded-lg font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2",
                      finishDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={finishDisabled}
                    onClick={() => setShowFinishEarlyDialog(true)}
                  >
                    <FaFlagCheckered className="mr-2" /> {t("common:practice.finish_plan_early")}
                  </Button>
                </span>
              </TooltipTrigger>
              {finishDisabled && (
                <TooltipContent side="top">
                  {t("common:practice.finish_early.blocked")}
                </TooltipContent>
              )}
            </Tooltip>
          )}
          {!examMode && (
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="ghost"
                loading={isFinishing || isSubmittingReport}
                className={cn(
                  "rounded-lg font-bold text-[11px] tracking-wide transition-all click-behavior",
                  isLastExercise
                    ? "h-12 px-6 bg-white text-black shadow-lg shadow-white/20 hover:bg-zinc-200 hover:text-black"
                    : "text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2",
                  isLastExercise && finishDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={
                  !isLastExercise
                    ? handleNextExerciseClick
                    : isEarlyFinish
                      // Below the bar — never finish on the first click, the
                      // dialog has to state what the player is giving up first.
                      ? () => setShowFinishEarlyDialog(true)
                      : () => onFinishSession()
                }
                disabled={isLastExercise ? finishDisabled : false}
              >
                {(isFinishing || isSubmittingReport) ? (
                  <span>Saving...</span>
                ) : isLastExercise ? (
                  <>
                    <span className="flex items-center gap-2">{t("common:finish_session")}</span> <FaCheck />
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">{t("next") || "Next"}</span> <FaStepForward />
                  </>
                )}
              </Button>
              {isLastExercise && isEarlyFinish && (
                <span className="text-[11px] text-zinc-500 tracking-wide">
                  {finishDisabled
                    ? t("common:practice.finish_early.blocked")
                    : t("common:practice.finish_early.hint")}
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>

    <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      {/* z-index must beat the session view, overlay included, or this dialog
          opens invisibly behind it. */}
      <DialogContent
        className='max-w-md bg-zinc-900 text-white sm:p-8 z-[99999999]'
        overlayClassName='z-[99999998]'
        // Radix would focus the first button — Exit — so a stray Enter threw the
        // session away. Land on the harmless choice instead.
        onOpenAutoFocus={(e) => { e.preventDefault(); stayButtonRef.current?.focus(); }}>
        <DialogHeader className='space-y-3 pr-10'>
          <DialogTitle className='text-xl font-bold tracking-tight'>Leave the session?</DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
            {finishDisabled
              ? "You've practised less than 20 seconds, so there's no time to save yet. Keep playing to log this session, or leave without it."
              : "Your practice time is saved only when you finish the session. If you exit now, it won't be logged."}
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6 flex flex-col gap-3'>
          {!finishDisabled && (
            <div className='flex flex-col gap-2'>
              <Button
                className='h-10 w-full rounded-lg bg-white text-sm font-bold text-black shadow-none transition-background hover:bg-zinc-200'
                loading={isFinishing || isSubmittingReport}
                onClick={async () => { setShowExitDialog(false); await onFinishSession({ earlyFinish: isEarlyFinish }); }}>
                <FaCheck className='mr-2' />
                Finish &amp; save time
              </Button>
              {isEarlyFinish && (
                <p className='text-center text-xs text-zinc-400'>
                  {t("common:practice.finish_early.hint")}
                </p>
              )}
            </div>
          )}

          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <Button
              variant='ghost'
              className='flex-1 rounded-lg bg-white/5 text-sm font-semibold text-zinc-400 transition-background hover:bg-red-500/10 hover:text-red-400'
              onClick={() => { setShowExitDialog(false); onClose?.(); }}>
              <FaSignOutAlt className='mr-2' />
              {finishDisabled ? "Exit" : "Exit without saving"}
            </Button>
            <Button
              ref={stayButtonRef}
              variant='ghost'
              className={cn(
                "flex-1 rounded-lg text-sm font-semibold transition-background",
                finishDisabled
                  ? "bg-white font-bold text-black hover:bg-zinc-200 hover:text-black"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white",
              )}
              onClick={() => setShowExitDialog(false)}>
              Stay in session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <FinishSessionDialog
      open={showFinishEarlyDialog}
      onOpenChange={setShowFinishEarlyDialog}
      mode={isEarlyFinish ? "early" : "plan"}
      disabled={finishDisabled}
      isLoading={isFinishing || isSubmittingReport}
      onConfirm={async () => {
        setShowFinishEarlyDialog(false);
        await onFinishSession({ earlyFinish: isEarlyFinish });
      }}
    />

    </>
  );
};

export const SessionBottomBar = memo(SessionBottomBarComponent);
SessionBottomBar.displayName = "SessionBottomBar";
