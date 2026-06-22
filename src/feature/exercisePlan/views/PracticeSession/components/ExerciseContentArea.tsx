import { cn } from "assets/lib/utils";
import React, { memo, useEffect } from "react";
import { useSessionUI } from "../contexts/SessionUIContext";
import { BackingTrackPicker, BackingVideoPlayer } from "./BackingTrackPicker";

import type { Exercise, TablatureMeasure } from "../../../types/exercise.types";
import { ExerciseImage } from "./ExerciseImage";
import { EarTrainingView } from "./EarTrainingView";
import { ImprovPromptView } from "./ImprovPromptView";
import { StrummingSection } from "./StrummingSection";
import { TablatureSection } from "./TablatureSection";
import { VideoSection } from "./VideoSection";
import { ExerciseInstructionsInline } from "./ExerciseInstructionsInline";

interface ExerciseContentAreaProps {
  activeTablature: TablatureMeasure[] | null | undefined;
  currentExercise: Exercise;
  activeExercise: Exercise;
  rawGpFile?: File;
  showAlphaTabScore: boolean;
  onToggleAlphaTabScore: () => void;
  isAudioPlaying: boolean;
  startTime: number | null;
  effectiveBpm: number;
  isAudioMuted: boolean;

  // Tablature
  isMetronomePlaying: boolean;
  countInRemaining: number;
  frequencyRef?: React.MutableRefObject<number>;
  isListening: boolean;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  tabResetKey: number;

  // Ear training
  isRiddleRevealed: boolean;
  isRiddleGuessed: boolean;
  hasPlayedRiddleOnce: boolean;
  earTrainingScore: number;
  earTrainingHighScore: number | null;
  onPlayRiddle: () => void;
  onRevealRiddle: () => void;
  onNextRiddle: () => void;
  onEarTrainingGuessed: () => void;
  onLeaderboardClick: () => void;


  // Rhythm detection
  isMicEnabled?: boolean;
  volumeRef?: React.MutableRefObject<number>;
  onSeek?: (beatPosition: number) => void;
  onLoopRestart?: (loopStartBeat: number) => void;
  isExamMode?: boolean;

  // Video / playalong
  startTimer: () => void;
  stopTimer: () => void;
  setVideoDuration: (d: number) => void;
  setTimerTime: (t: number) => void;
  onVideoEnd: () => void;
  isPlaying: boolean;
  rewardSkillId?: string;
  rewardAmount?: number;
  /** Playback controls (media toolbar + metronome) docked under the player, above the instructions. */
  controlsSlot?: React.ReactNode;
}

export const ExerciseContentArea = memo(function ExerciseContentArea({
  activeTablature,
  currentExercise,
  activeExercise,
  rawGpFile,
  showAlphaTabScore,
  onToggleAlphaTabScore,
  isAudioPlaying,
  startTime,
  effectiveBpm,
  isAudioMuted,
  isMetronomePlaying,
  countInRemaining,
  frequencyRef,
  isListening,
  audioContext,
  audioStartTime,
  tabResetKey,
  isRiddleRevealed,
  isRiddleGuessed,
  hasPlayedRiddleOnce,
  earTrainingScore,
  earTrainingHighScore,
  onPlayRiddle,
  onRevealRiddle,
  onNextRiddle,
  onEarTrainingGuessed,
  onLeaderboardClick,
  startTimer,
  stopTimer,
  setVideoDuration,
  setTimerTime,
  onVideoEnd,
  isPlaying,
  isMicEnabled,
  volumeRef,
  onSeek,
  onLoopRestart,
  isExamMode,
  rewardSkillId,
  rewardAmount,
  controlsSlot,
}: ExerciseContentAreaProps) {
  const { backingVideoId, setBackingVideoId } = useSessionUI();

  useEffect(() => {
    setBackingVideoId(null);
  }, [currentExercise.id, setBackingVideoId]);

  const hasTablature =
    activeTablature &&
    activeTablature.length > 0 &&
    (currentExercise.riddleConfig?.mode !== "sequenceRepeat" || isRiddleRevealed);

  return (
    <div className={cn(
      "relative w-full overflow-hidden rounded-xl bg-[#1a1a1d] shadow-xl shadow-black/40"
    )}>

      {/* Ear Training */}
      {currentExercise.riddleConfig?.mode === "sequenceRepeat" && (
        <div className="p-4">
          <EarTrainingView
            difficulty={currentExercise.riddleConfig.difficulty}
            isRevealed={isRiddleRevealed}
            isGuessed={isRiddleGuessed}
            isPlaying={isPlaying}
            onPlayRiddle={onPlayRiddle}
            onReveal={onRevealRiddle}
            onNextRiddle={onNextRiddle}
            onGuessed={onEarTrainingGuessed}
            score={earTrainingScore}
            highScore={earTrainingHighScore}
            canGuess={hasPlayedRiddleOnce}
            onRecordsClick={onLeaderboardClick}
          />
        </div>
      )}

      {/* Improv Prompt */}
      {currentExercise.riddleConfig?.mode === "improvPrompt" && (
        <div className="p-4">
          <ImprovPromptView config={currentExercise.riddleConfig} isRunning={isPlaying} />
        </div>
      )}

      {/* Content: tablature / video / strumming / image */}
      {hasTablature ? (
        <TablatureSection
          activeTablature={activeTablature!}
          rawGpFile={rawGpFile}
          showAlphaTabScore={showAlphaTabScore}
          onSeek={onSeek}
          isAudioPlaying={isAudioPlaying}
          startTime={startTime}
          effectiveBpm={effectiveBpm}
          isAudioMuted={isAudioMuted}
          isMetronomePlaying={isMetronomePlaying}
          countInRemaining={countInRemaining}
          frequencyRef={frequencyRef}
          isListening={isListening}
          audioContext={audioContext}
          audioStartTime={audioStartTime}
          tabResetKey={tabResetKey}
          hideNotes={activeExercise.hideTablatureNotes}
          hideDynamicsLane={!!rawGpFile}
          volumeRef={volumeRef}
          isExamMode={isExamMode}
          onLoopRestart={onLoopRestart}
        />
      ) : currentExercise.isPlayalong || currentExercise.videoUrl ? (
        <VideoSection
          youtubeVideoId={currentExercise.youtubeVideoId}
          videoUrl={currentExercise.videoUrl}
          isPlayalong={currentExercise.isPlayalong}
          isPlaying={isPlaying}
          isMobileView={false}
          startTimer={startTimer}
          stopTimer={stopTimer}
          setVideoDuration={setVideoDuration}
          setTimerTime={setTimerTime}
          onVideoEnd={onVideoEnd}
        />
      ) : currentExercise.requiresBackingTrack ? (
        backingVideoId
          ? <BackingVideoPlayer videoId={backingVideoId} onChangeClick={() => setBackingVideoId(null)} />
          : <BackingTrackPicker exerciseTitle={currentExercise.title} />
      ) : currentExercise.strummingPatterns && currentExercise.strummingPatterns.length > 0 ? (
        <StrummingSection
          patterns={currentExercise.strummingPatterns}
          bpm={effectiveBpm}
          isPlaying={isMetronomePlaying}
          startTime={startTime}
          countInRemaining={countInRemaining}
          isMicEnabled={isMicEnabled}
          audioContext={audioContext}
        />
      ) : (
        <ExerciseImage
          image={currentExercise.imageUrl || currentExercise.image || ""}
          title={currentExercise.title}
          isMobileView={false}
        />
      )}
      
      {controlsSlot && (
        <div
          style={{ zoom: 0.9 }}
          className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-white/5 px-4 py-3.5 [&>*]:!mb-0"
        >
          {controlsSlot}
        </div>
      )}

      <ExerciseInstructionsInline
        exercise={activeExercise}
        isPlaying={isPlaying}
        rewardSkillId={rewardSkillId}
        rewardAmount={rewardAmount}
      />
    </div>
  );
});
