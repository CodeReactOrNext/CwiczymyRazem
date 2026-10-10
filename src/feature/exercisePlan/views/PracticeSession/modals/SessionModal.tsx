import { getCountInDurationMs } from "feature/exercisePlan/components/Metronome/utils/countInDuration";
import { useIsLandscape } from "hooks/useIsLandscape";
import type { Dispatch, SetStateAction } from "react";
import React, { useState } from "react";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import { FinishSessionDialog } from "../components/FinishSessionDialog";
import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";
import { PhoneSessionModal } from "./PhoneSessionModal";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (options?: { earlyFinish?: boolean }) => void;
  isMounted: boolean;
  /** The session's own bar is met — finishing awards skill points as usual. */
  canFinishSession?: boolean;
  /** At least one exercise got its 20s, so there is something worth logging. */
  hasLoggedPractice?: boolean;
  currentExercise: any;
  currentExerciseIndex: number;
  totalExercises: number;
  isLastExercise: boolean;
  isPlaying: boolean;
  handleNextExercise: () => void;
  handleBackExercise: () => void;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: (delayMs?: number) => void;
  stopTimer: () => void;
  /** Clears the run's score — a restart starts a new run. */
  resetScore: () => void;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  metronome: any;
  effectiveBpm?: number;
  isMicEnabled: boolean;
  toggleMic: () => Promise<void>;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  onRecalibrate?: () => void;
  isListening: boolean;
  isAudioMuted: boolean;
  setIsAudioMuted: (bool: boolean) => void;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (bool: boolean) => void;
  audioTracks?: AudioTrackConfig[];
  setTrackConfigs?: Dispatch<SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  masterVolume?: number;
  setMasterVolume?: (v: number) => void;
  speedMultiplier?: number;
  onSpeedMultiplierChange?: (value: number) => void;
  activeTablature?: any;
  isRiddleRevealed?: boolean;
  isRiddleGuessed?: boolean;
  hasPlayedRiddleOnce?: boolean;
  handleNextRiddle?: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  handleRevealRiddle?: () => void;
  onEarTrainingGuessed?: () => void;
  /** Ear training's own Play/Stop — replays the phrase from the top, unlike the session toggle. */
  onPlayRiddle?: () => void;
  riddleProgress?: RiddleProgress | null;
  examMode?: boolean;
  /** See MobileExerciseContent — a song item's section map, mounted once. */
  songSectionMapSlot?: React.ReactNode;
}

const SessionModal = ({
  isOpen, onClose, onFinish, isMounted,
  canFinishSession = true, hasLoggedPractice = true,
  currentExercise, currentExerciseIndex, totalExercises,
  isLastExercise, isPlaying,
  handleNextExercise, handleBackExercise,
  setVideoDuration, setTimerTime, startTimer, stopTimer, resetScore,
  isFinishing, isSubmittingReport,
  metronome, effectiveBpm,
  isMicEnabled, toggleMic,
  frequencyRef, volumeRef, onRecalibrate,
  isListening,
  isAudioMuted, setIsAudioMuted,
  isMetronomeMuted, setIsMetronomeMuted,
  audioTracks, setTrackConfigs, masterVolume, setMasterVolume,
  speedMultiplier, onSpeedMultiplierChange,
  activeTablature,
  isRiddleRevealed, isRiddleGuessed, hasPlayedRiddleOnce,
  handleNextRiddle, handleRevealRiddle,
  earTrainingScore, earTrainingHighScore, onEarTrainingGuessed,
  riddleProgress, onPlayRiddle,
  examMode,
  songSectionMapSlot,
}: SessionModalProps) => {
  const [tabResetKey, setTabResetKey] = useState(0);
  const [showFinishEarlyDialog, setShowFinishEarlyDialog] = useState(false);
  const isLandscape = useIsLandscape();

  // The phone's Finish button goes through the same gate the desktop bar uses:
  // below the session's own bar, the player is shown what an early finish costs
  // before it happens. Exams have no early finish to offer.
  const isEarlyFinish = !examMode && !canFinishSession;
  const handleFinishRequest = () => {
    if (isEarlyFinish) setShowFinishEarlyDialog(true);
    else onFinish();
  };

  if (!isOpen || !isMounted) return null;

  // Only these exercises start the metronome on Play, so only they get a count-in —
  // and the timer is held for its length so it doesn't eat practice time.
  const startsMetronome =
    !!currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat";
  const countInDelayMs = () => (
    startsMetronome
      ? getCountInDurationMs(effectiveBpm ?? metronome.bpm)
      : 0
  );

  const handleToggleTimer = () => {
    if (isPlaying) {
      stopTimer();
      metronome.stopMetronome();
    } else {
      startTimer(countInDelayMs());
      if (startsMetronome) {
        metronome.startMetronome();
      }
    }
  };

  const handleNextExerciseClick = () => { stopTimer(); metronome.stopMetronome(); handleNextExercise(); };
  const handleBackExerciseClick = () => { stopTimer(); metronome.stopMetronome(); handleBackExercise(); };
  const handleRestart = () => {
    stopTimer(); metronome.restartMetronome(); setTimerTime(0); setTabResetKey(prev => prev + 1);
    resetScore();
    setTimeout(() => {
      startTimer(countInDelayMs());
      if (startsMetronome) metronome.startMetronome();
    }, 100);
  };

  const finishEarlyDialog = (
    <FinishSessionDialog
      open={showFinishEarlyDialog}
      onOpenChange={setShowFinishEarlyDialog}
      mode='early'
      disabled={!hasLoggedPractice}
      isLoading={isFinishing || isSubmittingReport}
      onConfirm={() => {
        setShowFinishEarlyDialog(false);
        onFinish({ earlyFinish: true });
      }}
    />
  );

  // One screen for both ways of holding the phone: turning it only re-lays the controls strip,
  // so the exercise stays mounted — a tab keeps its place instead of restarting.
  return (
    <>
      <PhoneSessionModal
        orientation={isLandscape ? "landscape" : "portrait"}
        isOpen={isOpen} onClose={onClose} onFinish={handleFinishRequest}
        currentExercise={currentExercise}
        currentExerciseIndex={currentExerciseIndex} totalExercises={totalExercises}
        isLastExercise={isLastExercise} isPlaying={isPlaying}
        isFinishing={isFinishing} isSubmittingReport={isSubmittingReport}
        metronome={metronome} effectiveBpm={effectiveBpm}
        isMicEnabled={isMicEnabled} toggleMic={toggleMic}
        isAudioMuted={isAudioMuted} setIsAudioMuted={setIsAudioMuted}
        isMetronomeMuted={isMetronomeMuted} setIsMetronomeMuted={setIsMetronomeMuted}
        audioTracks={audioTracks} setTrackConfigs={setTrackConfigs}
        masterVolume={masterVolume} setMasterVolume={setMasterVolume}
        speedMultiplier={speedMultiplier} onSpeedMultiplierChange={onSpeedMultiplierChange}
        activeTablature={activeTablature}
        isRiddleRevealed={isRiddleRevealed} isRiddleGuessed={isRiddleGuessed}
        hasPlayedRiddleOnce={hasPlayedRiddleOnce}
        handleRevealRiddle={handleRevealRiddle} handleNextRiddle={handleNextRiddle}
        earTrainingScore={earTrainingScore} earTrainingHighScore={earTrainingHighScore}
        onEarTrainingGuessed={onEarTrainingGuessed}
        riddleProgress={riddleProgress} onPlayRiddle={onPlayRiddle}
        examMode={examMode} isListening={isListening} frequencyRef={frequencyRef}
        volumeRef={volumeRef} onRecalibrate={onRecalibrate}
        tabResetKey={tabResetKey}
        setVideoDuration={setVideoDuration} setTimerTime={setTimerTime}
        startTimer={startTimer} stopTimer={stopTimer}
        handleToggleTimer={handleToggleTimer}
        handleNextExerciseClick={handleNextExerciseClick}
        handleBackExerciseClick={handleBackExerciseClick}
        handleRestart={handleRestart}
        songSectionMapSlot={songSectionMapSlot}
      />
      {finishEarlyDialog}
    </>
  );
};

export default SessionModal;
