import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "assets/components/ui/dialog";
import { useTranslation } from "hooks/useTranslation";
import { FaCheck, FaStepBackward, FaStepForward, FaSignOutAlt } from "react-icons/fa";
import { useState } from "react";
import { MainTimerSection } from "./MainTimerSection";
import type { Exercise } from "../../../types/exercise.types";

interface SessionBottomBarProps {
  onClose?: () => void;
  skipExitDialog?: boolean;
  exerciseKey: number;
  currentExercise: Exercise;
  isLastExercise: boolean;
  isPlaying: boolean;
  timerProgressValue: number;
  formattedTimeLeft: string;
  toggleTimer: () => void;
  handleRestart: () => void;
  handleNextExerciseClick: () => Promise<void>;
  sessionTimerData: any;
  exerciseTimeSpent: number;
  canSkipExercise: boolean;
  canFinishSession: boolean;
  isSkillExercise: boolean;
  timeLeft: number;
  currentExerciseIndex: number;
  onGoToPreviousExercise: () => void;
  isFinishing?: boolean;
  isSubmittingReport: boolean;
  onFinishSession: () => Promise<void>;
  examMode?: boolean;
}

/**
 * Fixed bottom navigation bar: exit button, timer, back/next controls.
 */
export const SessionBottomBar = ({
  onClose,
  exerciseKey,
  currentExercise,
  isLastExercise,
  isPlaying,
  timerProgressValue,
  formattedTimeLeft,
  toggleTimer,
  handleRestart,
  handleNextExerciseClick,
  sessionTimerData,
  exerciseTimeSpent,
  canSkipExercise,
  canFinishSession,
  isSkillExercise,
  timeLeft,
  currentExerciseIndex,
  onGoToPreviousExercise,
  isFinishing,
  isSubmittingReport,
  onFinishSession,
  skipExitDialog = false,
  examMode = false,
}: SessionBottomBarProps) => {
  const { t } = useTranslation(["common"]);
  const [showExitDialog, setShowExitDialog] = useState(false);

  return (
    <>
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-zinc-950/60 backdrop-blur-3xl">
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">

        {/* Left: Exit */}
        <div className="flex-1 flex items-center justify-start gap-4">
          <Button
            variant="ghost"
            onClick={skipExitDialog ? onClose : () => setShowExitDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 font-bold text-sm tracking-wide transition-all border border-white/10 hover:border-red-500/30"
          >
            <FaSignOutAlt />
            {t("common:practice.exit")}
          </Button>
        </div>

        {/* Center: Timer */}
        <div className="flex-none flex justify-center">
          <MainTimerSection
            exerciseKey={exerciseKey}
            currentExercise={currentExercise}
            isLastExercise={isLastExercise}
            isPlaying={isPlaying}
            timerProgressValue={timerProgressValue}
            formattedTimeLeft={formattedTimeLeft}
            toggleTimer={toggleTimer}
            handleRestart={handleRestart}
            handleNextExercise={handleNextExerciseClick}
            showExerciseInfo={false}
            variant="compact"
            sessionTimerData={sessionTimerData}
            exerciseTimeSpent={exerciseTimeSpent}
            canSkipExercise={canSkipExercise}
            isFinished={timeLeft === 0}
          />
        </div>

        {/* Right: Back / Next / Finish */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {currentExerciseIndex > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-2xl font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
              onClick={onGoToPreviousExercise}
            >
              <FaStepBackward /> {t("common:back") || "Back"}
            </Button>
          )}
          {!examMode && (
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="ghost"
                loading={isFinishing || isSubmittingReport}
                className={cn(
                  "rounded-2xl font-bold text-[11px] tracking-wide transition-all click-behavior",
                  isLastExercise
                    ? "h-12 px-6 bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 hover:text-black"
                    : "text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2",
                  isLastExercise && !canFinishSession && "opacity-50 cursor-not-allowed"
                )}
                onClick={isLastExercise ? onFinishSession : handleNextExerciseClick}
                disabled={isLastExercise ? !canFinishSession : false}
              >
                {(isFinishing || isSubmittingReport) ? (
                  <span>Saving...</span>
                ) : isLastExercise ? (
                  <span className="flex items-center gap-2">{t("common:finish_session")} <FaCheck /></span>
                ) : (
                  <span className="flex items-center gap-2">{t("common:skip")} <FaStepForward /></span>
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
      <DialogContent className="max-w-md bg-zinc-900 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Leave the session?</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm mt-1">
            Your progress won't be saved if you exit now. Would you like to finish the session and save your practice time instead?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 border border-white/10 hover:border-red-500/30 font-semibold text-sm"
            onClick={() => { setShowExitDialog(false); onClose?.(); }}
          >
            <FaSignOutAlt className="mr-2" />
            Exit without saving
          </Button>
          <Button
            className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/20"
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

    </>
  );
};
