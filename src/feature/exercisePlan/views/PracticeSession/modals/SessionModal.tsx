import { cn } from "assets/lib/utils";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { motion } from "framer-motion";
import { useIsLandscape } from "hooks/useIsLandscape";
import React, { useState } from "react";

import { ExerciseQuickActionsBar } from "../components/ExerciseQuickActionsBar";
import { MediaControlsToolbar } from "../components/MediaControlsToolbar";
import { MobileExerciseContent } from "../components/MobileExerciseContent";
import { MobileMicGameHud } from "../components/MobileMicGameHud";
import { MobileTimerDisplay } from "../components/MobileTimerDisplay";
import { SessionModalControls } from "../components/SessionModalControls";
import { SessionModalHeader } from "../components/SessionModalHeader";
import { categoryGradients } from "../../../constants/categoryStyles";
import { LandscapeSessionModal } from "./LandscapeSessionModal";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  isMounted: boolean;
  currentExercise: any;
  currentExerciseIndex: number;
  totalExercises: number;
  isLastExercise: boolean;
  isPlaying: boolean;
  handleNextExercise: () => void;
  handleBackExercise: () => void;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
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
  examMode?: boolean;
}

const SessionModal = ({
  isOpen, onClose, onFinish, isMounted,
  currentExercise, currentExerciseIndex, totalExercises,
  isLastExercise, isPlaying,
  handleNextExercise, handleBackExercise,
  setVideoDuration, setTimerTime, startTimer, stopTimer,
  isFinishing, isSubmittingReport,
  metronome, effectiveBpm,
  isMicEnabled, toggleMic,
  frequencyRef, volumeRef, onRecalibrate,
  isListening,
  isAudioMuted, setIsAudioMuted,
  isMetronomeMuted, setIsMetronomeMuted,
  speedMultiplier, onSpeedMultiplierChange,
  activeTablature,
  isRiddleRevealed, isRiddleGuessed, hasPlayedRiddleOnce,
  handleNextRiddle, handleRevealRiddle,
  earTrainingScore, earTrainingHighScore, onEarTrainingGuessed,
  examMode,
}: SessionModalProps) => {
  const [tabResetKey, setTabResetKey] = useState(0);
  const isLandscape = useIsLandscape();

  if (!isOpen || !isMounted) return null;

  const handleToggleTimer = () => {
    if (isPlaying) {
      stopTimer();
      metronome.stopMetronome();
    } else {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
        metronome.startMetronome();
      }
    }
  };

  const handleNextExerciseClick = () => { stopTimer(); metronome.stopMetronome(); handleNextExercise(); };
  const handleBackExerciseClick = () => { stopTimer(); metronome.stopMetronome(); handleBackExercise(); };
  const handleRestart = () => {
    stopTimer(); metronome.restartMetronome(); setTimerTime(0); setTabResetKey(prev => prev + 1);
    setTimeout(() => {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") metronome.startMetronome();
    }, 100);
  };

  const category = currentExercise.category || "mixed";
  const gradientClasses = categoryGradients[category as keyof typeof categoryGradients];

  const hasMicControls = !!(currentExercise.tablature?.length > 0 || currentExercise.gpFileUrl);
  const hasAudioTrack  = hasMicControls;
  const isRiddleMode   = currentExercise.riddleConfig?.mode === "sequenceRepeat";

  if (isLandscape) {
    return (
      <LandscapeSessionModal
        isOpen={isOpen} onClose={onClose} onFinish={onFinish}
        currentExercise={currentExercise}
        currentExerciseIndex={currentExerciseIndex} totalExercises={totalExercises}
        isLastExercise={isLastExercise} isPlaying={isPlaying}
        isFinishing={isFinishing} isSubmittingReport={isSubmittingReport}
        metronome={metronome} effectiveBpm={effectiveBpm}
        isMicEnabled={isMicEnabled} toggleMic={toggleMic}
        isAudioMuted={isAudioMuted} setIsAudioMuted={setIsAudioMuted}
        isMetronomeMuted={isMetronomeMuted} setIsMetronomeMuted={setIsMetronomeMuted}
        speedMultiplier={speedMultiplier} onSpeedMultiplierChange={onSpeedMultiplierChange}
        activeTablature={activeTablature}
        isRiddleRevealed={isRiddleRevealed} isRiddleGuessed={isRiddleGuessed}
        hasPlayedRiddleOnce={hasPlayedRiddleOnce}
        handleRevealRiddle={handleRevealRiddle} handleNextRiddle={handleNextRiddle}
        earTrainingScore={earTrainingScore} earTrainingHighScore={earTrainingHighScore}
        onEarTrainingGuessed={onEarTrainingGuessed}
        examMode={examMode} isListening={isListening} frequencyRef={frequencyRef}
        volumeRef={volumeRef} onRecalibrate={onRecalibrate}
        gradientClasses={gradientClasses} tabResetKey={tabResetKey}
        setVideoDuration={setVideoDuration} setTimerTime={setTimerTime}
        startTimer={startTimer} stopTimer={stopTimer}
        handleToggleTimer={handleToggleTimer}
        handleNextExerciseClick={handleNextExerciseClick}
        handleBackExerciseClick={handleBackExerciseClick}
        handleRestart={handleRestart}
      />
    );
  }

  return (
    <div className={cn("fixed inset-0 z-[9999999] flex h-full flex-col overflow-hidden bg-zinc-950", gradientClasses)}>
      <SessionModalHeader
        exerciseTitle={currentExercise.title}
        currentExerciseIndex={currentExerciseIndex}
        totalExercises={totalExercises}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-background/10 to-background/5">
        <div className="space-y-4 p-4">

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
            onPlayRiddle={handleToggleTimer}
          />

          {currentExercise.customGoal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              key={currentExercise.customGoal}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative group">
                <div className="absolute -inset-6 bg-cyan-500/20 blur-[30px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
                <div className="relative w-24 h-24 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <span className="text-5xl font-extrabold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    {currentExercise.customGoal}
                  </span>
                </div>
              </div>
              {currentExercise.customGoalDescription && (
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {currentExercise.customGoalDescription}
                </p>
              )}
            </motion.div>
          )}

          {currentExercise.spotifyId && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <SpotifyPlayer trackId={currentExercise.spotifyId} height={80} />
            </div>
          )}

          {isMicEnabled && <MobileMicGameHud />}

          <MobileTimerDisplay isPlaying={isPlaying} />

          {/* Controls */}
          <MediaControlsToolbar
            hasMetronome={!!currentExercise.metronomeSpeed}
            hasAudioTrack={hasAudioTrack}
            hasMicControls={hasMicControls}
            speedMultiplier={speedMultiplier ?? 1}
            onSpeedMultiplierChange={onSpeedMultiplierChange ?? (() => {})}
            isAudioMuted={isAudioMuted}
            isRiddleMode={isRiddleMode}
            onAudioToggle={() => setIsAudioMuted(!isAudioMuted)}
            isMicEnabled={isMicEnabled}
            onMicToggle={toggleMic}
            onRecalibrate={onRecalibrate ?? (() => {})}
            frequencyRef={frequencyRef}
            volumeRef={volumeRef}
          />

          <ExerciseQuickActionsBar
            exercise={currentExercise}
            metronome={metronome}
            isMetronomeMuted={isMetronomeMuted}
            setIsMetronomeMuted={setIsMetronomeMuted}
            examMode={examMode}
          />

          {currentExercise.links && currentExercise.links.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-5 space-y-4 mb-20">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                <span>Support Author</span>
              </div>
              <div className="flex flex-col gap-2">
                {currentExercise.links.map((link: any, idx: number) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between group px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm"
                  >
                    <span className="text-zinc-300 group-hover:text-white font-medium">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SessionModalControls
        examMode={examMode}
        isPlaying={isPlaying}
        isLastExercise={isLastExercise}
        onClose={onClose}
        onFinish={onFinish}
        toggleTimer={handleToggleTimer}
        handleNextExercise={handleNextExerciseClick}
        handleBackExercise={handleBackExerciseClick}
        currentExerciseIndex={currentExerciseIndex}
        isFinishing={isFinishing}
        isSubmittingReport={isSubmittingReport}
        onRestart={activeTablature && activeTablature.length > 0 ? handleRestart : undefined}
      />
    </div>
  );
};

export default SessionModal;
