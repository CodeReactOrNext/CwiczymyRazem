import { cn } from "assets/lib/utils";
import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { FaCheck, FaStepBackward, FaStepForward } from "react-icons/fa";
import { MainTimerSection } from "./MainTimerSection";
import type { Exercise } from "../../../types/exercise.types";

interface SessionBottomBarProps {
  onClose?: () => void;
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
  timeLeft: number;
  currentExerciseIndex: number;
  onGoToPreviousExercise: () => void;
  isFinishing?: boolean;
  isSubmittingReport: boolean;
  onFinishSession: () => Promise<void>;
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
  timeLeft,
  currentExerciseIndex,
  onGoToPreviousExercise,
  isFinishing,
  isSubmittingReport,
  onFinishSession,
}: SessionBottomBarProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 border-t border-white/5 bg-zinc-950/60 backdrop-blur-3xl">
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">

        {/* Left: Exit */}
        <div className="flex-1 hidden xl:flex items-center justify-start gap-4">
          <Button
            size="sm"
            variant="ghost"
            className="radius-premium font-bold text-[10px] tracking-wide transition-all click-behavior text-zinc-500 hover:text-white"
            onClick={onClose}
          >
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
              className="radius-premium font-bold text-[11px] tracking-wide transition-all click-behavior text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
              onClick={onGoToPreviousExercise}
            >
              <FaStepBackward /> {t("common:back") || "Back"}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            loading={isFinishing || isSubmittingReport}
            className={cn(
              "radius-premium font-bold text-[11px] tracking-wide transition-all click-behavior",
              isLastExercise
                ? "h-12 px-6 bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 hover:text-black"
                : "text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2",
              !canSkipExercise && "opacity-50 cursor-not-allowed"
            )}
            onClick={isLastExercise ? onFinishSession : handleNextExerciseClick}
            disabled={!canSkipExercise}
          >
            {(isFinishing || isSubmittingReport) ? (
              <span>Saving...</span>
            ) : isLastExercise ? (
              <span className="flex items-center gap-2">{t("common:finish_session")} <FaCheck /></span>
            ) : (
              <span className="flex items-center gap-2">{t("common:skip")} <FaStepForward /></span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
