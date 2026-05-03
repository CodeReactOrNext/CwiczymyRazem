import React from "react";
import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { useSessionUI } from "../contexts/SessionUIContext";
import { EarTrainingView } from "./EarTrainingView";
import { ExerciseImage } from "./ExerciseImage";
import { ImprovPromptView } from "./ImprovPromptView";
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
  onPlayRiddle,
}: MobileExerciseContentProps) {
  const { openLeaderboard } = useSessionUI();
  const { hitNotes, missedNotes } = useNoteMatchingContext();

  return (
    <>
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
          onRecordsClick={openLeaderboard}
        />
      )}
      {currentExercise.riddleConfig?.mode === 'improvPrompt' && (
        <ImprovPromptView config={currentExercise.riddleConfig} isRunning={isPlaying} />
      )}
      {activeTablature && activeTablature.length > 0 && (currentExercise.riddleConfig?.mode !== 'sequenceRepeat' || isRiddleRevealed) ? (
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
        />
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
      ) : (currentExercise.imageUrl || currentExercise.image) ? (
        <ExerciseImage
          image={currentExercise.imageUrl || currentExercise.image || ""}
          title={currentExercise.title}
          isMobileView={true}
        />
      ) : null}
    </>
  );
}
