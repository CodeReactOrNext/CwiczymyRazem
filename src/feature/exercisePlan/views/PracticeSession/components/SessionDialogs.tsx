import { AnimatePresence,motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

import { EarTrainingLeaderboardDialog } from "../../../components/EarTrainingLeaderboardDialog";
import { ExerciseCompleteDialog } from "../../../components/ExerciseCompleteDialog";
import { CalibrationChoiceDialog } from "./CalibrationChoiceDialog";
import { CalibrationWizard } from "./CalibrationWizard";
import { MicModeDialog } from "./MicModeDialog";

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
  leaderboardOpen: boolean;
  setLeaderboardOpen: (open: boolean) => void;
  exerciseId: string;

  // Completion notification
  showCompletionNotification: boolean;
}

/**
 * All session-level dialogs + the "Exercise Finished!" toast notification.
 */
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
  leaderboardOpen,
  setLeaderboardOpen,
  exerciseId,
  showCompletionNotification,
}: SessionDialogsProps) => (
  <>
    <ExerciseCompleteDialog
      isOpen={showCompleteDialog}
      onClose={() => { setShowCompleteDialog(false); onFinish?.(); }}
      onRestart={() => { setShowCompleteDialog(false); resetTimer(); startTimer(); }}
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
      isOpen={leaderboardOpen}
      onClose={() => setLeaderboardOpen(false)}
      exerciseId={exerciseId}
      exerciseTitle={exerciseTitle}
    />

    {/* Completion toast */}
    <AnimatePresence>
      {showCompletionNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 50, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          className="fixed top-0 left-1/2 z-[99999] px-8 py-4 bg-cyan-500 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.5)] border border-white/20"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <FaCheck className="text-black h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-black tracking-tight leading-none">Exercise Finished!</h4>
              <p className="text-[10px] font-semibold text-black/60 tracking-wide mt-1">Great job on this one!</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
