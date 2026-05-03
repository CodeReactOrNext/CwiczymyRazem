import { cn } from "assets/lib/utils";
import React, { memo } from "react";

import type { Exercise, TablatureMeasure } from "../../../types/exercise.types";
import { ExerciseImage } from "./ExerciseImage";
import { EarTrainingView } from "./EarTrainingView";
import { ImprovPromptView } from "./ImprovPromptView";
import { StrummingSection } from "./StrummingSection";
import { TablatureSection } from "./TablatureSection";
import { VideoSection } from "./VideoSection";

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

  // Video / playalong
  startTimer: () => void;
  stopTimer: () => void;
  setVideoDuration: (d: number) => void;
  setTimerTime: (t: number) => void;
  onVideoEnd: () => void;
  isPlaying: boolean;
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
}: ExerciseContentAreaProps) {
  const hasTablature =
    activeTablature &&
    activeTablature.length > 0 &&
    (currentExercise.riddleConfig?.mode !== "sequenceRepeat" || isRiddleRevealed);

  return (
    <div className={cn(
      "relative w-full overflow-hidden rounded-xl bg-[#0a0a0a] shadow-2xl",
      currentExercise.isPlayalong ? "" : "border border-white/10"
    )}>

      {/* Ear Training */}
      {currentExercise.riddleConfig?.mode === "sequenceRepeat" && (
        <div className="p-4 border-b border-white/5">
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
            exerciseUrl={`/exercises/${activeExercise.id.replace(/_/g, "-")}`}
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
          onToggleAlphaTabScore={onToggleAlphaTabScore}
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
    </div>
  );
});
