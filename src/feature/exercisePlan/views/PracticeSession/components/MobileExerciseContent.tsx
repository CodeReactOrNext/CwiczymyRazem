import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";
import React from "react";

import { isOpenExercise } from "../../../utils/isOpenExercise";
import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useSessionUI } from "../contexts/SessionUIContext";
import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";
import { ChordHuntPanel } from "./ChordHuntPanel";
import { EarTrainingView } from "./EarTrainingView";
import { ExerciseImage } from "./ExerciseImage";
import { ImprovPromptView } from "./ImprovPromptView";
import { MetronomeGapTest } from "./MetronomeGapTest";
import { NoteHuntDetector } from "./NoteHuntDetector";
import { OpenExercisePanel } from "./OpenExercisePanel";
import { StrummingSection } from "./StrummingSection";
import { TablatureViewer } from "./TablatureViewer";

interface MobileExerciseContentProps {
  currentExercise: any;
  activeTablature?: any;
  effectiveBpm?: number;
  metronome: any;
  isRiddleRevealed?: boolean;
  isRiddleGuessed?: boolean;
  hasPlayedRiddleOnce?: boolean;
  isPlaying: boolean;
  isListening: boolean;
  isMicEnabled?: boolean;
  frequencyRef?: React.MutableRefObject<number>;
  tabResetKey: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  onVideoEnd: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  handleRevealRiddle?: () => void;
  handleNextRiddle?: () => void;
  onEarTrainingGuessed?: () => void;
  riddleProgress?: RiddleProgress | null;
  onPlayRiddle: () => void;
}

export function MobileExerciseContent({
  currentExercise,
  activeTablature,
  effectiveBpm,
  metronome,
  isRiddleRevealed,
  isRiddleGuessed,
  hasPlayedRiddleOnce,
  isPlaying,
  isListening,
  isMicEnabled,
  frequencyRef,
  tabResetKey,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  onVideoEnd,
  earTrainingScore,
  earTrainingHighScore,
  handleRevealRiddle,
  handleNextRiddle,
  onEarTrainingGuessed,
  riddleProgress,
  onPlayRiddle,
}: MobileExerciseContentProps) {
  const { openLeaderboard } = useSessionUI();
  const { hitNotes, missedNotes } = useNoteMatchingContext();

  return (
    <>
      {currentExercise.customGoal && (
        <div className="flex w-full justify-center py-2" key={currentExercise.customGoal}>
          {currentExercise.noteHuntConfig?.mode === "chord" ? (
            <ChordHuntPanel
              chordName={currentExercise.customGoal}
              description={currentExercise.customGoalDescription}
              isMicEnabled={!!isMicEnabled}
              isListening={isListening}
            />
          ) : (
            <NoteHuntDetector
              targetNote={currentExercise.customGoal}
              description={currentExercise.customGoalDescription}
              isMicEnabled={!!isMicEnabled}
              isListening={isListening}
            />
          )}
        </div>
      )}
      {currentExercise.riddleConfig?.mode === 'sequenceRepeat' && (
        <EarTrainingView
          difficulty={currentExercise.riddleConfig.difficulty}
          isRevealed={isRiddleRevealed || false}
          isGuessed={isRiddleGuessed || false}
          isPlaying={isPlaying}
          onPlayRiddle={onPlayRiddle}
          onReveal={handleRevealRiddle || (() => {})}
          onNextRiddle={handleNextRiddle || (() => {})}
          onGuessed={() => { if (onEarTrainingGuessed) onEarTrainingGuessed(); }}
          score={earTrainingScore || 0}
          highScore={earTrainingHighScore}
          canGuess={hasPlayedRiddleOnce || false}
          isMicEnabled={!!isMicEnabled}
          riddleProgress={riddleProgress}
          onRecordsClick={openLeaderboard}
        />
      )}
      {currentExercise.riddleConfig?.mode === 'improvPrompt' && (
        <ImprovPromptView config={currentExercise.riddleConfig} isRunning={isPlaying} />
      )}
      {currentExercise.id === "metronome_gap_test" ? (
        <MetronomeGapTest compact />
      ) : activeTablature && activeTablature.length > 0 && (currentExercise.riddleConfig?.mode !== 'sequenceRepeat' || isRiddleRevealed) ? (
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#09090b] shadow-lg">
          <TablatureViewer
            measures={activeTablature}
            bpm={effectiveBpm || metronome.bpm}
            isPlaying={metronome.isPlaying}
            startTime={metronome.startTime || null}
            countInRemaining={(metronome as any).countInRemaining}
            className="w-full"
            frequencyRef={frequencyRef}
            isListening={isListening}
            hitNotes={hitNotes}
            missedNotes={missedNotes}
            currentBeatsElapsed={0}
            resetKey={tabResetKey}
            // Phones hit the 120px/beat floor of the beat-width formula, which
            // shows barely ~1 measure. 0.75 fits ~a third more tab while 16th
            // notes (0.25 beat) still get their 22px minimum pill without
            // overlapping.
            zoom={0.75}
          />
        </div>
      ) : currentExercise.youtubeVideoId && !currentExercise.riddleConfig ? (
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10">
          <YouTubePlayalong
            videoId={currentExercise.youtubeVideoId}
            isPlaying={isPlaying}
            onEnd={onVideoEnd}
            onReady={(duration: number) => setVideoDuration(duration)}
            onSeek={(time: number) => setTimerTime(time * 1000)}
            onProgressUpdate={(currentTime: number) => setTimerTime(currentTime * 1000)}
            onStateChange={(state: number) => {
              if (state === 1) startTimer();
              if (state === 2) stopTimer();
            }}
            resetKey={tabResetKey}
          />
        </div>
      ) : currentExercise.videoUrl ? (
        <div className='relative w-full overflow-hidden rounded-xl border border-muted/30 bg-zinc-900 shadow-md'>
          <div className='aspect-video w-full'>
            {(() => {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
              const match = currentExercise.videoUrl?.match(regExp);
              const videoId = match && match[2].length === 11 ? match[2] : null;
              if (videoId) {
                return (
                  <iframe width='100%' height='100%'
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title='YouTube video player' frameBorder='0'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen />
                );
              }
              return <div className='flex h-full items-center justify-center text-xs text-zinc-500'>Invalid YouTube URL</div>;
            })()}
          </div>
        </div>
      ) : currentExercise.strummingPatterns && currentExercise.strummingPatterns.length > 0 ? (
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 shadow-lg">
          <StrummingSection
            patterns={currentExercise.strummingPatterns}
            bpm={effectiveBpm || metronome.bpm}
            isPlaying={metronome.isPlaying}
            startTime={metronome.startTime || null}
            countInRemaining={(metronome as any).countInRemaining}
            isMicEnabled={isMicEnabled}
            audioContext={metronome.audioContext}
          />
        </div>
      ) : (currentExercise.imageUrl || currentExercise.image) ? (
        <ExerciseImage
          image={currentExercise.imageUrl || currentExercise.image || ""}
          title={currentExercise.title}
          isMobileView={true}
        />
      ) : isOpenExercise(currentExercise) ? (
        <OpenExercisePanel compact />
      ) : null}
    </>
  );
}
