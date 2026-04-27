import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";
import Image from "next/image";
import { Button } from "assets/components/ui/button";
import { FaExpand } from "react-icons/fa";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { EarTrainingView } from "./EarTrainingView";
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
  detectedNoteData: any;
  tabResetKey: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  onVideoEnd: () => void;
  onImageClick: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  exerciseUrl?: string;
  handleRevealRiddle?: () => void;
  handleNextRiddle?: () => void;
  onEarTrainingGuessed?: () => void;
  onRecordsClick?: () => void;
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
  detectedNoteData,
  tabResetKey,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  onVideoEnd,
  onImageClick,
  earTrainingScore,
  earTrainingHighScore,
  exerciseUrl,
  handleRevealRiddle,
  handleNextRiddle,
  onEarTrainingGuessed,
  onRecordsClick,
  onPlayRiddle,
}: MobileExerciseContentProps) {
  const { hitNotes, missedNotes, currentBeatsElapsed } = useNoteMatchingContext();

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
          exerciseUrl={exerciseUrl}
          canGuess={hasPlayedRiddleOnce || false}
          onRecordsClick={onRecordsClick}
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
          detectedNote={detectedNoteData}
          isListening={isListening}
          hitNotes={hitNotes}
          missedNotes={missedNotes}
          currentBeatsElapsed={currentBeatsElapsed}
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
        <div className='relative w-full cursor-pointer overflow-hidden rounded-xl border border-muted/30 bg-white/5 shadow-md' onClick={onImageClick}>
          <div className='relative aspect-[3.5/1] w-full'>
            <Image
              src={currentExercise.imageUrl || currentExercise.image}
              alt={currentExercise.title}
              className='h-full w-full object-contain'
              fill priority quality={80}
            />
            <div className='absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]'>
              <Button variant='secondary' size='sm' className='pointer-events-none opacity-90 shadow-lg'>
                <span className='mr-2'>Zoom</span>
                <FaExpand className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
