import { Button } from "assets/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
DialogHeader, DialogTitle, } from "assets/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { memo, useState } from "react";
import { FaCheck, FaFlagCheckered, FaSignOutAlt,FaStepBackward, FaStepForward } from "react-icons/fa";

import type { Exercise } from "../../../types/exercise.types";
import { MainTimerSection } from "./MainTimerSection";
import { ShortcutsLegend } from "./ShortcutsLegend";
import { useTimerContext } from "../contexts/TimerContext";

interface SessionBottomBarProps {
  onClose?: () => void;
  skipExitDialog?: boolean;
  exerciseKey: number;
  currentExercise: Exercise;
  isLastExercise: boolean;
  isPlaying: boolean;
  toggleTimer: () => void;
  handleRestart: () => void;
  handleNextExerciseClick: () => Promise<void>;

  canFinishSession: boolean;
  isSkillExercise: boolean;
  currentExerciseIndex: number;
  totalExercises: number;
  onGoToPreviousExercise: () => void;
  isFinishing?: boolean;
  isSubmittingReport: boolean;
  onFinishSession: () => Promise<void>;
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
  isSkillExercise,
  currentExerciseIndex,
  totalExercises,
  onGoToPreviousExercise,
  isFinishing,
  isSubmittingReport,
  onFinishSession,
  skipExitDialog = false,
  examMode = false,
}: SessionBottomBarProps) => {
  const { t } = useTranslation(["common"]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const hasTempoControl = !!currentExercise.metronomeSpeed;
  const [showFinishEarlyDialog, setShowFinishEarlyDialog] = useState(false);
  // Only meaningful mid-plan: the last exercise already has its own "Finish
  // Session" action, and a single-exercise plan has nothing to skip ahead of.
  const canFinishEarly = !examMode && !isLastExercise && totalExercises > 1;

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">

        {/* Left: Exit */}
        <div className="flex-1 flex items-center justify-start gap-4">
          <Button
            variant="ghost"
            onClick={skipExitDialog ? onClose : () => setShowExitDialog(true)}
            className="rounded-lg font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
          >
            <FaSignOutAlt />
            {t("common:practice.exit")}
          </Button>
          <ShortcutsLegend hasTempoControl={hasTempoControl} />
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
                <span tabIndex={canFinishSession ? -1 : 0}>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={isFinishing || isSubmittingReport}
                    className={cn(
                      "rounded-lg font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2",
                      !canFinishSession && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!canFinishSession}
                    onClick={() => setShowFinishEarlyDialog(true)}
                  >
                    <FaFlagCheckered className="mr-2" /> {t("common:practice.finish_plan_early")}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canFinishSession && (
                <TooltipContent side="top">
                  {isSkillExercise
                    ? t("common:practice.finish_plan_early_disabled_skill")
                    : t("common:practice.finish_plan_early_disabled_time")}
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
                  isLastExercise && !canFinishSession && "opacity-50 cursor-not-allowed"
                )}
                onClick={isLastExercise ? onFinishSession : handleNextExerciseClick}
                disabled={isLastExercise ? !canFinishSession : false}
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
              {isLastExercise && !canFinishSession && (
                <span className="text-[11px] text-zinc-500 tracking-wide">
                  {isSkillExercise ? "Complete the full exercise to finish" : "Practice at least 20s to finish"}
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>

    <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      {/* z-index must beat the session view or this dialog opens invisibly behind it. */}
      <DialogContent className="max-w-md bg-zinc-900 text-white z-[99999999]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Leave the session?</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm mt-1">
            Your progress won&apos;t be saved if you exit now. Would you like to finish the session and save your practice time instead?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="ghost"
            className="flex-1 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 font-semibold text-sm"
            onClick={() => { setShowExitDialog(false); onClose?.(); }}
          >
            <FaSignOutAlt className="mr-2" />
            Exit without saving
          </Button>
          <Button
            className="flex-1 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-lg shadow-white/20"
            loading={isFinishing || isSubmittingReport}
            disabled={!canFinishSession}
            onClick={async () => { setShowExitDialog(false); await onFinishSession(); }}
          >
            <FaCheck className="mr-2" />
            Finish &amp; save time
          </Button>
        </DialogFooter>
        {!canFinishSession && (
          <p className="text-[11px] text-zinc-500 text-center -mt-2">
            {isSkillExercise ? "Complete the full exercise to save" : "Practice at least 20s to save"}
          </p>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={showFinishEarlyDialog} onOpenChange={setShowFinishEarlyDialog}>
      {/* z-index must beat the session view or this dialog opens invisibly behind it. */}
      <DialogContent className="max-w-md bg-zinc-900 text-white z-[99999999]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">{t("common:practice.finish_plan_early_title")}</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm mt-1">
            {t("common:practice.finish_plan_early_description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="ghost"
            className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-sm"
            onClick={() => setShowFinishEarlyDialog(false)}
          >
            {t("common:cancel")}
          </Button>
          <Button
            className="flex-1 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow-lg shadow-white/20"
            loading={isFinishing || isSubmittingReport}
            disabled={!canFinishSession}
            onClick={async () => { setShowFinishEarlyDialog(false); await onFinishSession(); }}
          >
            <FaFlagCheckered className="mr-2" />
            {t("common:practice.finish_plan_early_action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </>
  );
};

export const SessionBottomBar = memo(SessionBottomBarComponent);
SessionBottomBar.displayName = "SessionBottomBar";
