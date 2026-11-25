import type { AudioInitResult, AudioRefs, WebAudioInput } from "hooks/useAudioAnalyzer";
import { useEffect } from "react";
import { playCompletionSound } from "utils/audioUtils";

import { EarTrainingLeaderboardDialog } from "../../../components/EarTrainingLeaderboardDialog";
import { ExerciseCompleteDialog } from "../../../components/ExerciseCompleteDialog";
import { useSessionUI } from "../contexts/SessionUIContext";
import { useTimerContext } from "../contexts/TimerContext";
import { CalibrationChoiceDialog } from "./CalibrationChoiceDialog";
import { CalibrationWizard } from "./CalibrationWizard";
import { MicModeDialog } from "./MicModeDialog";

interface SessionDialogsProps {
  /** The start gate asks about the mic, so the prompt stays away. */
  micAskedOnGate: boolean;
  // ExerciseCompleteDialog
  showCompleteDialog: boolean;
  setShowCompleteDialog: (open: boolean) => void;
  exerciseTitle: string;
  exerciseDuration: number;
  onFinish?: () => void;
  /** Full exercise restart: resets metronome timing accumulators + tab cursor, then starts with count-in. */
  handleRestart: () => void;

  // Mic / Calibration
  sessionPhase: string;
  examMode?: boolean;
  /** The phone screen laid on its side on an upright phone — the mic prompt lies with it. */
  turned?: boolean;
  handleEnableMic: () => void;
  handleSkipMic: () => void;
  /** Leaves the session from the exam mic prompt, which has no skip. */
  onLeave?: () => void;
  existingCalibrationTimestamp: number | null;
  handleReuseCalibration: () => void;
  handleRecalibrate: () => void;
  handleCalibrationCancel: () => void;
  handleCalibrationComplete: () => void;
  audioInit: () => Promise<AudioInitResult | void>;
  audioRefs: AudioRefs;
  isListening: boolean;
  inputGain: number;
  setInputGain: (v: number) => void;
  isNative: boolean;
  onSelectDevice?: (deviceId: number) => Promise<void>;
  onSelectChannel?: (channel: number) => Promise<void>;
  /** The browser path's device and jack picker; undefined in the desktop app. */
  webInput?: WebAudioInput;
  /** The session metronome's context — the wizard's timing step clicks on it. */
  timingAudioContext: AudioContext | null;
  estimateLatencyMs: () => number;
  onBeforeTimingRun: () => void;

  // Leaderboard
  exerciseId: string;

  // Completion notification
  isMounted: boolean;
  hasReportResult: boolean;
  showSuccessView: boolean;
  isLastExercise: boolean;
}

export const SessionDialogs = ({
  micAskedOnGate,
  showCompleteDialog,
  setShowCompleteDialog,
  exerciseTitle,
  exerciseDuration,
  onFinish,
  handleRestart,
  sessionPhase,
  examMode,
  turned,
  handleEnableMic,
  handleSkipMic,
  onLeave,
  existingCalibrationTimestamp,
  handleReuseCalibration,
  handleRecalibrate,
  handleCalibrationCancel,
  handleCalibrationComplete,
  audioInit,
  audioRefs,
  isListening,
  inputGain,
  setInputGain,
  isNative,
  onSelectDevice,
  onSelectChannel,
  webInput,
  timingAudioContext,
  estimateLatencyMs,
  onBeforeTimingRun,
  exerciseId,
  isMounted,
  hasReportResult,
  showSuccessView,
  isLastExercise,
}: SessionDialogsProps) => {
  const { isLeaderboardOpen, closeLeaderboard } = useSessionUI();
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
      // What happened is on the session's own bar (SessionVerdict).
      playCompletionSound();
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
          handleRestart();
        }}
        exerciseTitle={exerciseTitle}
        duration={exerciseDuration}
      />

      <MicModeDialog
        isOpen={sessionPhase === "mic_prompt" && !micAskedOnGate}
        examMode={examMode}
        turned={turned}
        onEnableMic={handleEnableMic}
        onSkipMic={handleSkipMic}
        onLeave={onLeave}
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
        audioRefs={audioRefs}
        isListening={isListening}
        inputGain={inputGain}
        onInputGainChange={setInputGain}
        isNative={isNative}
        onSelectDevice={onSelectDevice}
        onSelectChannel={onSelectChannel}
        webInput={webInput}
        timingAudioContext={timingAudioContext}
        estimateLatencyMs={estimateLatencyMs}
        onBeforeTimingRun={onBeforeTimingRun}
      />

      <EarTrainingLeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={closeLeaderboard}
        exerciseId={exerciseId}
        exerciseTitle={exerciseTitle}
      />
    </>
  );
};
