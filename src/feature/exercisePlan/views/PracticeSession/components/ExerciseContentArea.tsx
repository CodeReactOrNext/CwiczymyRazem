import { cn } from "assets/lib/utils";
import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";
import type { NoteData } from "utils/audio/noteUtils";
import { EarTrainingView } from "./EarTrainingView";
import { ExerciseImage } from "./ExerciseImage";
import { ImprovPromptView } from "./ImprovPromptView";
import { TablatureViewer } from "./TablatureViewer";
import { AlphaTabScoreViewer } from "./AlphaTabScoreViewer";
import type { Exercise, TablatureMeasure } from "../../../types/exercise.types";

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
  isMobileView: boolean;

  // Tablature viewer
  isMetronomePlaying: boolean;
  countInRemaining: number;
  detectedNoteData: NoteData | null;
  isListening: boolean;
  hitNotes: Record<string, boolean>;
  currentBeatsElapsed: number;
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

  // Image
  imageScale: number;
  setImageScale: (scale: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setIsImageModalOpen: (open: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resetImagePosition: () => void;

  // Video / playalong
  startTimer: () => void;
  stopTimer: () => void;
  setVideoDuration: (d: number) => void;
  setTimerTime: (t: number) => void;
  onVideoEnd: () => void;
  isPlaying: boolean;
}

/**
 * The main content area of the practice session:
 * ear training → improv → tablature/notation → video → image.
 */
export const ExerciseContentArea = ({
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
  isMobileView,
  isMetronomePlaying,
  countInRemaining,
  detectedNoteData,
  isListening,
  hitNotes,
  currentBeatsElapsed,
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
  imageScale,
  setImageScale,
  containerRef,
  setIsImageModalOpen,
  handleZoomIn,
  handleZoomOut,
  resetImagePosition,
  startTimer,
  stopTimer,
  setVideoDuration,
  setTimerTime,
  onVideoEnd,
  isPlaying,
}: ExerciseContentAreaProps) => {
  const hasTablature =
    activeTablature &&
    activeTablature.length > 0 &&
    (currentExercise.riddleConfig?.mode !== "sequenceRepeat" || isRiddleRevealed);

  return (
    <div className={cn(
      "relative w-full overflow-hidden radius-premium bg-zinc-900 shadow-2xl",
      currentExercise.isPlayalong ? "" : "border border-white/10 glass-card"
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

      {/* Tablature / Notation / Video / Image */}
      {hasTablature ? (
        <div className="relative w-full">
          {rawGpFile && (
            <button
              onClick={onToggleAlphaTabScore}
              className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
              title={showAlphaTabScore ? "Przełącz na tabulaturę" : "Przełącz na notację"}
            >
              {showAlphaTabScore ? "TAB" : "♩ Notacja"}
            </button>
          )}
          {showAlphaTabScore && rawGpFile ? (
            <AlphaTabScoreViewer
              rawGpFile={rawGpFile}
              mode="score"
              isPlaying={isAudioPlaying}
              startTime={startTime}
              bpm={effectiveBpm}
              volume={isAudioMuted ? 0 : 1}
              className="w-full"
            />
          ) : (
            <TablatureViewer
              measures={activeTablature!}
              bpm={effectiveBpm}
              isPlaying={isMetronomePlaying}
              startTime={startTime}
              countInRemaining={countInRemaining}
              className="w-full"
              detectedNote={detectedNoteData}
              isListening={isListening}
              hitNotes={hitNotes}
              currentBeatsElapsed={currentBeatsElapsed}
              hideNotes={activeExercise.hideTablatureNotes}
              audioContext={audioContext}
              audioStartTime={audioStartTime}
              resetKey={tabResetKey}
              hideDynamicsLane={!!rawGpFile}
            />
          )}
        </div>
      ) : currentExercise.isPlayalong && currentExercise.youtubeVideoId ? (
        !isMobileView && (
          <YouTubePlayalong
            videoId={currentExercise.youtubeVideoId}
            isPlaying={isPlaying}
            onEnd={onVideoEnd}
            onReady={(duration) => setVideoDuration(duration)}
            onSeek={(time) => setTimerTime(time * 1000)}
            onStateChange={(state) => {
              if (state === 1) startTimer();
              if (state === 2) stopTimer();
            }}
          />
        )
      ) : currentExercise.videoUrl ? (
        <div className="aspect-video w-full">
          {(() => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
            const match  = currentExercise.videoUrl?.match(regExp);
            const videoId = (match && match[2].length === 11) ? match[2] : null;
            if (videoId) {
              return (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            }
            return (
              <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">
                Video not available
              </div>
            );
          })()}
        </div>
      ) : (
        <ExerciseImage
          image={currentExercise.imageUrl || currentExercise.image || ""}
          title={currentExercise.title}
          isMobileView={isMobileView}
          imageScale={imageScale}
          containerRef={containerRef}
          setImageModalOpen={setIsImageModalOpen}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          resetImagePosition={resetImagePosition}
          setImageScale={setImageScale}
        />
      )}
    </div>
  );
};
