import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaCheck, FaPause, FaPlay, FaStepBackward, FaStepForward, FaUndo } from "react-icons/fa";

import { ExerciseQuickActionsBar } from "../components/ExerciseQuickActionsBar";
import { FavoriteExerciseButton } from "../components/FavoriteExerciseButton";
import { MediaControlsToolbar } from "../components/MediaControlsToolbar";
import { MobileExerciseContent } from "../components/MobileExerciseContent";
import { MobileInstructionsCard } from "../components/MobileInstructionsCard";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useTimerContext } from "../contexts/TimerContext";
import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";

interface LandscapeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  currentExercise: any;
  currentExerciseIndex: number;
  totalExercises: number;
  isLastExercise: boolean;
  isPlaying: boolean;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  metronome: any;
  effectiveBpm?: number;
  isMicEnabled: boolean;
  toggleMic: () => Promise<void>;
  isAudioMuted: boolean;
  setIsAudioMuted: (v: boolean) => void;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (v: boolean) => void;
  speedMultiplier?: number;
  onSpeedMultiplierChange?: (value: number) => void;
  hasGpFile?: boolean;
  pitchSemitones?: number;
  onPitchChange?: (value: number) => void;
  activeTablature?: any;
  isRiddleRevealed?: boolean;
  isRiddleGuessed?: boolean;
  hasPlayedRiddleOnce?: boolean;
  handleRevealRiddle?: () => void;
  handleNextRiddle?: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  onEarTrainingGuessed?: () => void;
  riddleProgress?: RiddleProgress | null;
  examMode?: boolean;
  isListening: boolean;
  frequencyRef?: React.RefObject<number>;
  volumeRef?: React.RefObject<number>;
  onRecalibrate?: () => void;
  gradientClasses: string;
  tabResetKey: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  handleToggleTimer: () => void;
  handleNextExerciseClick: () => void;
  handleBackExerciseClick: () => void;
  handleRestart: () => void;
}

export function LandscapeSessionModal({
  isOpen,
  onClose,
  onFinish,
  currentExercise,
  currentExerciseIndex,
  totalExercises,
  isLastExercise,
  isPlaying,
  isFinishing,
  isSubmittingReport,
  metronome,
  effectiveBpm,
  isMicEnabled,
  toggleMic,
  isAudioMuted,
  setIsAudioMuted,
  isMetronomeMuted,
  setIsMetronomeMuted,
  speedMultiplier,
  onSpeedMultiplierChange,
  hasGpFile,
  pitchSemitones,
  onPitchChange,
  activeTablature,
  isRiddleRevealed,
  isRiddleGuessed,
  hasPlayedRiddleOnce,
  handleRevealRiddle,
  handleNextRiddle,
  earTrainingScore,
  earTrainingHighScore,
  onEarTrainingGuessed,
  riddleProgress,
  examMode,
  isListening,
  frequencyRef,
  volumeRef,
  onRecalibrate,
  gradientClasses,
  tabResetKey,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  handleToggleTimer,
  handleNextExerciseClick,
  handleBackExerciseClick,
  handleRestart,
}: LandscapeSessionModalProps) {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const { gameState, sessionAccuracy } = useNoteMatchingContext();
  const { formattedTimeLeft } = useTimerContext();

  // If landscape was forced via RotateDeviceHint (fullscreen + orientation
  // lock), release both when the session closes so the app isn't stuck sideways.
  useEffect(() => () => {
    (screen.orientation as unknown as { unlock?: () => void }).unlock?.();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  return (
    <ModalWrapper zIndex='z-[9999999]'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("relative flex h-full flex-row overflow-hidden", gradientClasses)}
          >
            {/* Left panel: exercise content + timer underneath */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-2">
              {/* Scroll container + min-h-full inner wrapper: short content
                  (tablature) stays vertically centered, while tall exercises
                  (chord hunt, ear training) scroll instead of being clipped
                  top/bottom under the timer. */}
              <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
                <div className="flex min-h-full w-full items-center justify-center">
                  <MobileExerciseContent
                    currentExercise={currentExercise}
                    activeTablature={activeTablature}
                    effectiveBpm={effectiveBpm}
                    metronome={metronome}
                    isRiddleRevealed={isRiddleRevealed}
                    isRiddleGuessed={isRiddleGuessed}
                    hasPlayedRiddleOnce={hasPlayedRiddleOnce}
                    isPlaying={isPlaying}
                    isListening={isListening}
                    isMicEnabled={isMicEnabled}
                    frequencyRef={frequencyRef}
                    tabResetKey={tabResetKey}
                    setVideoDuration={setVideoDuration}
                    setTimerTime={setTimerTime}
                    startTimer={startTimer}
                    stopTimer={stopTimer}
                    onVideoEnd={handleNextExerciseClick}
                    earTrainingScore={earTrainingScore}
                    earTrainingHighScore={earTrainingHighScore}
                    handleRevealRiddle={handleRevealRiddle}
                    handleNextRiddle={handleNextRiddle}
                    onEarTrainingGuessed={onEarTrainingGuessed}
                    riddleProgress={riddleProgress}
                    onPlayRiddle={handleToggleTimer}
                  />
                </div>
              </div>

              {/* Timer — always visible, even with the details drawer collapsed */}
              <div className="flex shrink-0 items-center justify-center pt-1.5">
                <div className={cn(
                  "font-mono text-2xl font-black leading-none tracking-tighter transition-colors",
                  isPlaying ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" : "text-zinc-500"
                )}>
                  {formattedTimeLeft}
                </div>
              </div>
            </div>

            {/* Details drawer — overlays the tablature instead of squeezing it,
                sliding out from behind the always-visible controls strip. */}
            <AnimatePresence>
              {isPanelExpanded && (
                  <motion.div
                    key="details"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute bottom-0 right-14 top-0 z-10 flex w-[264px] flex-col overflow-y-auto overscroll-contain scrollbar-hide bg-zinc-950/90 shadow-2xl shadow-black/50 backdrop-blur-xl"
                  >
                    {/* Title + counter */}
                    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
                      <span className='flex-1 truncate text-[11px] font-bold text-foreground'>{currentExercise.title}</span>
                      {currentExercise.id && <FavoriteExerciseButton exerciseId={currentExercise.id} compact />}
                      <Badge variant='outline' className='shrink-0 text-[8px]'>{currentExerciseIndex + 1}/{totalExercises}</Badge>
                    </div>

                    {/* Mic stats */}
                    {isMicEnabled && (
                      <div className="px-3 py-1 space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-600 tracking-widest">Score</span>
                          <span className="font-black text-white tabular-nums">{gameState.score.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-600 tracking-widest">Acc</span>
                          <span className="font-black text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-zinc-600 tracking-widest">Streak</span>
                          <span className="font-black text-cyan-400 tabular-nums">{gameState.combo}×{gameState.multiplier}</span>
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="px-3 py-3 space-y-2">
                      <MediaControlsToolbar
                        hasMetronome={!!currentExercise.metronomeSpeed}
                        hasAudioTrack={!!(activeTablature?.length > 0 || currentExercise.gpFileUrl) && !currentExercise.disableBackingTrack}
                        hasMicControls={!!(activeTablature?.length > 0 || currentExercise.gpFileUrl || currentExercise.customGoal || currentExercise.strummingPatterns?.length > 0) && !currentExercise.disableMic}
                        speedMultiplier={speedMultiplier ?? 1}
                        onSpeedMultiplierChange={onSpeedMultiplierChange ?? (() => {})}
                        hasPitchControl={hasGpFile} pitchSemitones={pitchSemitones ?? 0}
                        onPitchChange={onPitchChange}
                        isAudioMuted={isAudioMuted}
                        isRiddleMode={currentExercise.riddleConfig?.mode === "sequenceRepeat"}
                        onAudioToggle={() => setIsAudioMuted(!isAudioMuted)}
                        isMicEnabled={isMicEnabled}
                        onMicToggle={toggleMic}
                        onRecalibrate={onRecalibrate ?? (() => {})}
                        frequencyRef={frequencyRef}
                        volumeRef={volumeRef}
                        disableTuner={currentExercise.disableTuner}
                        mobile
                      />
                      <ExerciseQuickActionsBar
                        exercise={currentExercise}
                        metronome={metronome}
                        isMetronomeMuted={isMetronomeMuted}
                        setIsMetronomeMuted={setIsMetronomeMuted}
                        examMode={examMode}
                        compact
                      />
                      <MobileInstructionsCard exercise={currentExercise} />
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>

            {/* Always-visible controls strip */}
            <div className="relative z-20 flex w-14 shrink-0 flex-col items-center gap-2 bg-zinc-950/80 py-2 backdrop-blur-xl">
                <Button variant='ghost' size='icon' onClick={onClose} className='h-8 w-8 shrink-0 text-zinc-500 hover:text-white'>
                  <X className='h-4 w-4' />
                </Button>

                <Button variant='ghost' size='icon'
                  onClick={() => setIsPanelExpanded(prev => !prev)}
                  className='h-8 w-8 shrink-0 text-zinc-400 hover:text-white'
                >
                  <motion.span
                    animate={{ rotate: isPanelExpanded ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <FaStepForward className='h-3 w-3' />
                  </motion.span>
                </Button>

                <div className="flex-1" />

                {currentExerciseIndex > 0 && (
                  <Button onClick={handleBackExerciseClick} variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg bg-white/5 text-zinc-400 hover:text-white">
                    <FaStepBackward className="h-3 w-3" />
                  </Button>
                )}
                {activeTablature && activeTablature.length > 0 && (
                  <Button onClick={handleRestart} variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg bg-white/5 text-amber-400 hover:text-amber-300">
                    <FaUndo className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  onClick={handleToggleTimer}
                  size="icon"
                  className={cn(
                    "h-11 w-11 shrink-0 rounded-lg transition-all click-behavior",
                    isPlaying ? "bg-white text-black shadow-lg" : "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                  )}
                >
                  {isPlaying ? <FaPause className='h-4 w-4' /> : <FaPlay className='h-4 w-4' />}
                </Button>

                {!examMode && (
                  <Button
                    onClick={isLastExercise ? onFinish : handleNextExerciseClick}
                    disabled={isFinishing || isSubmittingReport }
                    variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                  >
                    {isFinishing || isSubmittingReport
                      ? <div className="h-3 w-3 border-2 border-zinc-500/20 border-t-zinc-500 animate-spin rounded-lg" />
                      : isLastExercise ? <FaCheck className="h-4 w-4" /> : <FaStepForward className="h-4 w-4" />
                    }
                  </Button>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
}
