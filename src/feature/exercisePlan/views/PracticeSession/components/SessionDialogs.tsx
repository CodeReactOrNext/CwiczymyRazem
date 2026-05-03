import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { playCompletionSound } from "utils/audioUtils";

import { EarTrainingLeaderboardDialog } from "../../../components/EarTrainingLeaderboardDialog";
import { ExerciseCompleteDialog } from "../../../components/ExerciseCompleteDialog";
import { CalibrationChoiceDialog } from "./CalibrationChoiceDialog";
import { CalibrationWizard } from "./CalibrationWizard";
import { MicModeDialog } from "./MicModeDialog";
import { useTimerContext } from "../contexts/TimerContext";
import { useSessionUI } from "../contexts/SessionUIContext";

interface SessionDialogsProps {
  // ExerciseCompleteDialog
  showCompleteDialog: boolean;
  setShowCompleteDialog: (open: boolean) => void;
  exerciseTitle: string;
  exerciseDuration: number;
  onFinish?: () => void;
  resetTimer: () => void;
  startTimer: () => void;

  // Mic / Calibration
  sessionPhase: string;
  examMode?: boolean;
  handleEnableMic: () => void;
  handleSkipMic: () => void;
  existingCalibrationTimestamp: number | null;
  handleReuseCalibration: () => void;
  handleRecalibrate: () => void;
  handleCalibrationCancel: () => void;
  handleCalibrationComplete: (data: any) => void;
  audioInit: () => Promise<void>;
  audioClose: () => void;
  audioRefs: any;
  isListening: boolean;
  inputGain: number;
  setInputGain: (v: number) => void;

  // Leaderboard
  exerciseId: string;

  // Completion notification
  isMounted: boolean;
  hasReportResult: boolean;
  showSuccessView: boolean;
  isLastExercise: boolean;
}

export const SessionDialogs = ({
  showCompleteDialog,
  setShowCompleteDialog,
  exerciseTitle,
  exerciseDuration,
  onFinish,
  resetTimer,
  startTimer,
  sessionPhase,
  examMode,
  handleEnableMic,
  handleSkipMic,
  existingCalibrationTimestamp,
  handleReuseCalibration,
  handleRecalibrate,
  handleCalibrationCancel,
  handleCalibrationComplete,
  audioInit,
  audioClose,
  audioRefs,
  isListening,
  inputGain,
  setInputGain,
  exerciseId,
  isMounted,
  hasReportResult,
  showSuccessView,
  isLastExercise,
}: SessionDialogsProps) => {
  const { isLeaderboardOpen, closeLeaderboard } = useSessionUI();
  const [showCompletionNotification, setShowCompletionNotification] = useState(false);
  const { timeLeft } = useTimerContext();

  useEffect(() => {


    if (
      timeLeft <= 0 &&
      isMounted &&
      !showCompleteDialog &&
      !hasReportResult &&
      !showSuccessView &&
      !isLastExercise
    ) {
      playCompletionSound();
      setShowCompletionNotification(true);
      const timer = setTimeout(() => setShowCompletionNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isMounted, showCompleteDialog, hasReportResult, showSuccessView, isLastExercise]);

  return (
    <>
      <ExerciseCompleteDialog
        isOpen={showCompleteDialog}
        onClose={() => {
          setShowCompleteDialog(false);
          onFinish?.();
        }}
        onRestart={() => {
          setShowCompleteDialog(false);
          resetTimer();
          startTimer();
        }}
        exerciseTitle={exerciseTitle}
        duration={exerciseDuration}
      />

      <MicModeDialog
        isOpen={sessionPhase === "mic_prompt"}
        examMode={examMode}
        onEnableMic={handleEnableMic}
        onSkipMic={handleSkipMic}
      />

      <CalibrationChoiceDialog
        isOpen={sessionPhase === "calibration_choice"}
        calibrationTimestamp={existingCalibrationTimestamp ?? 0}
        onReuse={handleReuseCalibration}
        onRecalibrate={handleRecalibrate}
        onCancel={handleCalibrationCancel}
      />

      <CalibrationWizard
        isOpen={sessionPhase === "calibrating"}
        onComplete={handleCalibrationComplete}
        onCancel={handleCalibrationCancel}
        audioInit={audioInit}
        audioClose={audioClose}
        audioRefs={audioRefs}
        isListening={isListening}
        inputGain={inputGain}
        onInputGainChange={setInputGain}
      />

      <EarTrainingLeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={closeLeaderboard}
        exerciseId={exerciseId}
        exerciseTitle={exerciseTitle}
      />

      <AnimatePresence>
        {showCompletionNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 50, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className='fixed left-1/2 top-0 z-[99999] rounded-xl border border-white/20 bg-cyan-500 px-8 py-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]'>
            <div className='flex items-center gap-4'>
              <div className='rounded-lg bg-white/20 p-2'>
                <FaCheck className='h-6 w-6 text-black' />
              </div>
              <div>
                <h4 className='text-lg font-bold tracking-tight text-black leading-none'>Exercise Finished!</h4>
                <p className='mt-1 text-[10px] font-semibold text-black/60 tracking-wide'>Great job on this one!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
