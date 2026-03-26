import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BpmProgressGrid } from "feature/exercisePlan/components/BpmProgressGrid";
import { Metronome } from "feature/exercisePlan/components/Metronome/Metronome";
import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { EarTrainingView } from "../components/EarTrainingView";
import { ImprovPromptView } from "../components/ImprovPromptView";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useIsLandscape } from "hooks/useIsLandscape";
import Image from "next/image";
import {  useState } from "react";
import { FaCheck, FaExpand, FaPause, FaPlay, FaStepBackward, FaStepForward, FaUndo, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { FaExternalLinkAlt,FaFacebook, FaHeart, FaInfoCircle, FaInstagram, FaLightbulb, FaTwitter } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";
import { Minus, Plus, Volume2, VolumeX, X } from "lucide-react";
import { Slider } from "assets/components/ui/slider";

import { categoryGradients } from "../../../constants/categoryStyles";
import { MobileTimerDisplay } from "../components/MobileTimerDisplay";
import { SessionModalControls } from "../components/SessionModalControls";
import { SessionModalHeader } from "../components/SessionModalHeader";
import { TablatureViewer } from "../components/TablatureViewer";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  onImageClick: () => void;
  isMounted: boolean;
  currentExercise: any;
  nextExercise: any | null;
  currentExerciseIndex: number;
  totalExercises: number;
  isLastExercise: boolean;
  isPlaying: boolean;
  formattedTimeLeft: string;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  handleBackExercise: () => void;
  sessionTimerData: any;
  exerciseTimeSpent: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  canSkipExercise?: boolean;
  // Shared Tracking & Metronome Props
  metronome: any;
  effectiveBpm?: number;
  isMicEnabled: boolean;
  toggleMic: () => Promise<void>;
  gameState: any;
  maxPossibleScore?: number;
  sessionAccuracy: number;
  detectedNoteData: any;
  isListening: boolean;
  hitNotes: Record<string, boolean>;
  missedNotes: Record<string, boolean>;
  currentBeatsElapsed: number;
  isAudioMuted: boolean;
  setIsAudioMuted: (bool: boolean) => void;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (bool: boolean) => void;
  isHalfSpeed?: boolean;
  onHalfSpeedToggle?: (value: boolean) => void;
  // Riddle Props
  activeTablature?: any;
  isRiddleRevealed?: boolean;
  isRiddleGuessed?: boolean;
  hasPlayedRiddleOnce?: boolean;
  handleNextRiddle?: () => void;
  earTrainingScore?: number;
  earTrainingHighScore?: number | null;
  exerciseUrl?: string;
  handleRevealRiddle?: () => void;
  onEarTrainingGuessed?: () => void;
  // BPM Progress Props
  bpmStages?: number[];
  completedBpms?: number[];
  isBpmLoading?: boolean;
  onBpmToggle?: (bpm: number) => void;
  onRecordsClick?: () => void;
}

const SessionModal = ({
  isOpen,
  onClose,
  onFinish,
  onImageClick,
  isMounted,
  currentExercise,
  nextExercise,
  currentExerciseIndex,
  totalExercises,
  isLastExercise,
  isPlaying,
  formattedTimeLeft,
  toggleTimer,
  handleNextExercise,
  handleBackExercise,
  sessionTimerData,
  exerciseTimeSpent,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  isFinishing,
  isSubmittingReport,
  canSkipExercise,
  metronome,
  effectiveBpm,
  isMicEnabled,
  toggleMic,
  gameState,
  maxPossibleScore,
  sessionAccuracy,
  detectedNoteData,
  isListening,
  hitNotes,
  missedNotes,
  currentBeatsElapsed,
  isAudioMuted,
  setIsAudioMuted,
  isMetronomeMuted,
  setIsMetronomeMuted,
  isHalfSpeed,
  onHalfSpeedToggle,
  activeTablature,
  isRiddleRevealed,
  isRiddleGuessed,
  hasPlayedRiddleOnce,
  handleNextRiddle,
  handleRevealRiddle,
  earTrainingScore,
  earTrainingHighScore,
  exerciseUrl,
  onEarTrainingGuessed,
  bpmStages,
  completedBpms,
  isBpmLoading,
  onBpmToggle,
  onRecordsClick
}: SessionModalProps) => {
  if (!isOpen || !isMounted) return null;

  const { t } = useTranslation(["exercises", "common"]);
  const [tabResetKey, setTabResetKey] = useState(0);
  const isLandscape = useIsLandscape();
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  const handleToggleTimer = () => {
    if (isPlaying) {
      stopTimer();
      metronome.stopMetronome();
    } else {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === 'sequenceRepeat') {
        metronome.startMetronome();
      }
    }
  };

  const handleBpmChange = (newBpm: number) => {
    if (isPlaying) {
      handleToggleTimer();
    }
    metronome.setBpm(newBpm);
  };

  const handleNextExerciseClick = () => {
    stopTimer();
    metronome.stopMetronome();
    handleNextExercise();
  };

  const handleBackExerciseClick = () => {
    stopTimer();
    metronome.stopMetronome();
    handleBackExercise();
  };

  const handleRestart = () => {
    stopTimer();
    metronome.restartMetronome();
    setTimerTime(0);
    setTabResetKey(prev => prev + 1);
    
    setTimeout(() => {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === 'sequenceRepeat') {
        metronome.startMetronome();
      }
    }, 100);
  };

  const mobileFeedbackStyles: Record<string, { color: string; dropShadow: string; scale: number }> = {
    "NICE!":          { color: "text-emerald-400", dropShadow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]", scale: 1.15 },
    "GREAT!":         { color: "text-cyan-400",    dropShadow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]", scale: 1.2 },
    "AMAZING!":       { color: "text-purple-400",  dropShadow: "drop-shadow-[0_0_12px_rgba(192,132,252,0.6)]", scale: 1.25 },
    "ON FIRE!":       { color: "text-orange-400",  dropShadow: "drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]", scale: 1.3 },
    "UNSTOPPABLE!":   { color: "text-amber-400",   dropShadow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]", scale: 1.35 },
    "MULTIPLIER UP!": { color: "text-main",        dropShadow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]", scale: 1.3 },
  };

  const getPerformanceGrade = (accuracy: number) => {
    if (accuracy >= 95) return { letter: 'S', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' };
    if (accuracy >= 85) return { letter: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: '' };
    if (accuracy >= 70) return { letter: 'B', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: '' };
    if (accuracy >= 50) return { letter: 'C', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: '' };
    return { letter: 'D', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: '' };
  };

  const category = currentExercise.category || "mixed";

  const gradientClasses =
    categoryGradients[category as keyof typeof categoryGradients];

  const exerciseMainContent = (
    <>
      {currentExercise.riddleConfig?.mode === 'sequenceRepeat' && (
        <EarTrainingView
          difficulty={currentExercise.riddleConfig.difficulty}
          isRevealed={isRiddleRevealed || false}
          isGuessed={isRiddleGuessed || false}
          isPlaying={isPlaying}
          onPlayRiddle={handleToggleTimer}
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
            onEnd={handleNextExerciseClick}
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

  if (isLandscape) {
    return (
      <ModalWrapper zIndex='z-[9999999]'>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("flex h-full flex-row overflow-hidden", gradientClasses)}
            >
              {/* Left panel: exercise content fills all available space */}
              <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
                <div className="w-full h-full flex items-center justify-center">
                  {exerciseMainContent}
                </div>
              </div>

              {/* Right panel */}
              <motion.div
                animate={{ width: isPanelExpanded ? 240 : 56 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative flex shrink-0 flex-row border-l border-white/10 bg-zinc-950/80 backdrop-blur-xl overflow-hidden"
              >
                {/* Scrollable details — visible only when expanded */}
                <AnimatePresence>
                  {isPanelExpanded && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex w-[184px] shrink-0 flex-col overflow-y-auto overscroll-contain scrollbar-hide border-r border-white/5"
                    >
                      {/* Title + counter */}
                      <div className="flex items-center gap-1 border-b border-white/5 px-2 py-2">
                        <span className='flex-1 truncate text-[10px] font-bold text-foreground'>{currentExercise.title}</span>
                        <Badge variant='outline' className='shrink-0 text-[8px]'>{currentExerciseIndex + 1}/{totalExercises}</Badge>
                      </div>

                      {/* Timer */}
                      <div className="flex items-center justify-center px-2 pt-3 pb-1">
                        <div className={cn(
                          "text-3xl font-mono font-black tracking-tighter leading-none transition-colors",
                          isPlaying ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" : "text-zinc-500"
                        )}>
                          {formattedTimeLeft}
                        </div>
                      </div>

                      {/* Mic stats */}
                      {isMicEnabled && (
                        <div className="px-2 py-1 space-y-1 border-b border-white/5">
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-zinc-600 uppercase tracking-widest">Score</span>
                            <span className="font-black text-white tabular-nums">{gameState.score.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-zinc-600 uppercase tracking-widest">Acc</span>
                            <span className="font-black text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-zinc-600 uppercase tracking-widest">Streak</span>
                            <span className="font-black text-cyan-400 tabular-nums">{gameState.combo}×{gameState.multiplier}</span>
                          </div>
                        </div>
                      )}

                      {/* Metronome — compact inline */}
                      {currentExercise.metronomeSpeed && (
                        <div className="px-2 py-2 border-b border-white/5 space-y-2">
                          {/* BPM row */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 w-6">BPM</span>
                            <span className="text-sm font-black text-white tabular-nums w-8 text-center">{metronome.bpm}</span>
                            <Button variant="outline" size="icon"
                              className="h-6 w-6 shrink-0 p-0"
                              onClick={() => metronome.setBpm(Math.max(metronome.minBpm, metronome.bpm - 1))}
                              disabled={metronome.bpm <= metronome.minBpm}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="flex-1">
                              <Slider
                                value={[metronome.bpm]}
                                min={metronome.minBpm}
                                max={metronome.maxBpm}
                                step={1}
                                onValueChange={(v) => metronome.setBpm(v[0])}
                                className="py-1"
                              />
                            </div>
                            <Button variant="outline" size="icon"
                              className="h-6 w-6 shrink-0 p-0"
                              onClick={() => metronome.setBpm(Math.min(metronome.maxBpm, metronome.bpm + 1))}
                              disabled={metronome.bpm >= metronome.maxBpm}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Range + actions row */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-zinc-600 tabular-nums">{metronome.minBpm}–{metronome.maxBpm}</span>
                            <div className="flex-1" />
                            {/* Mute metronome */}
                            <Button variant="ghost" size="icon"
                              className={cn("h-6 w-6", isMetronomeMuted ? "text-zinc-500" : "text-cyan-400")}
                              onClick={() => setIsMetronomeMuted(!isMetronomeMuted)}>
                              {isMetronomeMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </Button>
                            {/* Recommended */}
                            {currentExercise.metronomeSpeed.recommended !== metronome.bpm && (
                              <Button variant="ghost" size="sm"
                                className="h-6 px-1.5 text-[8px] font-bold text-zinc-400 hover:text-white"
                                onClick={metronome.handleSetRecommendedBpm}>
                                Rec {currentExercise.metronomeSpeed.recommended}
                              </Button>
                            )}
                          </div>

                          {/* Half speed */}
                          {onHalfSpeedToggle && (
                            <Button variant="ghost" size="sm"
                              className={cn("w-full h-6 text-[9px] font-bold uppercase tracking-widest",
                                isHalfSpeed ? "text-cyan-400 bg-cyan-500/10" : "text-zinc-500")}
                              onClick={() => onHalfSpeedToggle(!isHalfSpeed)}>
                              ½× Half Speed
                            </Button>
                          )}

                          {/* Guitar / mic toggles */}
                          {currentExercise.tablature && currentExercise.tablature.length > 0 && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm"
                                className={cn("flex-1 gap-1 h-6 text-[9px] font-bold uppercase tracking-widest",
                                  isAudioMuted ? "text-zinc-500" : "text-cyan-400 bg-cyan-500/10")}
                                onClick={() => setIsAudioMuted(!isAudioMuted)}>
                                <GiGuitar className="text-xs" />
                                {isAudioMuted ? <FaVolumeMute className="h-2.5 w-2.5" /> : <FaVolumeUp className="h-2.5 w-2.5" />}
                              </Button>
                              <Button variant="ghost" size="sm"
                                className={cn("flex-1 gap-1 h-6 text-[9px] font-bold uppercase tracking-widest",
                                  !isMicEnabled ? "text-zinc-500" : "text-emerald-400 bg-emerald-500/10")}
                                onClick={toggleMic}>
                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMicEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
                                {isMicEnabled ? "Mic On" : "Mic Off"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* BPM Progress */}
                      {currentExercise.metronomeSpeed && bpmStages && bpmStages.length > 0 && onBpmToggle && !currentExercise.gpFileUrl && (
                        <div className="px-2 py-2 border-b border-white/5">
                          <BpmProgressGrid
                            bpmStages={bpmStages}
                            completedBpms={completedBpms || []}
                            recommendedBpm={currentExercise.metronomeSpeed.recommended}
                            onToggle={onBpmToggle}
                            isLoading={isBpmLoading}
                          />
                        </div>
                      )}

                      {/* Instructions */}
                      {currentExercise.instructions?.length > 0 && (
                        <div className="px-2 py-2 border-b border-white/5">
                          <div className="flex items-center gap-1 mb-1.5">
                            <FaInfoCircle className="h-3 w-3 text-cyan-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{t("exercises:instructions")}</span>
                          </div>
                          <div className="space-y-1">
                            {currentExercise.instructions.map((ins: string, idx: number) => (
                              <p key={idx} className="text-[9px] text-zinc-500 leading-relaxed">{ins}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      {currentExercise.tips?.length > 0 && (
                        <div className="px-2 py-2 pb-4">
                          <div className="flex items-center gap-1 mb-1.5">
                            <FaLightbulb className="h-3 w-3 text-amber-400" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{t("exercises:hints")}</span>
                          </div>
                          <ul className="space-y-1 list-disc list-inside marker:text-amber-500/50">
                            {currentExercise.tips.map((tip: string, idx: number) => (
                              <li key={idx} className="text-[9px] text-zinc-500 leading-relaxed">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Always-visible controls strip */}
                <div className="flex w-14 shrink-0 flex-col items-center gap-2 py-2">
                  {/* Close */}
                  <Button variant='ghost' size='icon' onClick={onClose} className='h-8 w-8 shrink-0 text-zinc-500 hover:text-white'>
                    <X className='h-4 w-4' />
                  </Button>

                  {/* Expand / collapse toggle */}
                  <Button
                    variant='ghost' size='icon'
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

                  {/* Navigation */}
                  {currentExerciseIndex > 0 && (
                    <Button onClick={handleBackExerciseClick} variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white">
                      <FaStepBackward className="h-3 w-3" />
                    </Button>
                  )}
                  {activeTablature && activeTablature.length > 0 && (
                    <Button onClick={handleRestart} variant="ghost" size="icon"
                      className="h-9 w-9 shrink-0 rounded-full border border-white/5 bg-white/5 text-amber-400 hover:text-amber-300">
                      <FaUndo className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Play / Pause */}
                  <Button
                    onClick={handleToggleTimer}
                    size="icon"
                    className={cn(
                      "h-11 w-11 shrink-0 rounded-2xl transition-all click-behavior",
                      isPlaying ? "bg-white text-black shadow-lg" : "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                    )}
                  >
                    {isPlaying ? <FaPause className='h-4 w-4' /> : <FaPlay className='h-4 w-4' />}
                  </Button>

                  {/* Next / Finish */}
                  <Button
                    onClick={isLastExercise ? onFinish : handleNextExerciseClick}
                    disabled={isFinishing || isSubmittingReport || !canSkipExercise}
                    variant="ghost" size="icon"
                    className="h-9 w-9 shrink-0 rounded-full border border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                  >
                    {isFinishing || isSubmittingReport
                      ? <div className="h-3 w-3 border-2 border-zinc-500/20 border-t-zinc-500 animate-spin rounded-full" />
                      : isLastExercise ? <FaCheck className="h-4 w-4" /> : <FaStepForward className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper zIndex='z-[9999999]'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex h-full flex-col overflow-hidden",
              gradientClasses
            )}>
            <SessionModalHeader
              exerciseTitle={currentExercise.title}
              currentExerciseIndex={currentExerciseIndex}
              totalExercises={totalExercises}
              onClose={onClose}
            />

            <div className='flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-background/10 to-background/5 pb-[76px]'>
              <div className='space-y-6 p-4'>
                {exerciseMainContent}

                {currentExercise.customGoal && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={currentExercise.customGoal}
                    className="mb-8 flex flex-col items-center gap-3"
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
                  <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <SpotifyPlayer trackId={currentExercise.spotifyId} height={80} />
                    <div className="mt-2 flex items-center gap-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-zinc-400 font-semibold italic">
                            For full tracks, log in to <a href="https://www.spotify.com" target="_blank" className="text-emerald-500 underline decoration-emerald-500/20">Spotify.com</a>
                        </p>
                    </div>
                  </div>
                )}

                {isMicEnabled && (
                  <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Score</span>
                        <div className="flex items-baseline gap-1">
                          <motion.span
                            key={gameState.score}
                            initial={{ scale: 1.12 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className="text-2xl font-black text-white tabular-nums tracking-tighter inline-block"
                          >
                            {gameState.score.toLocaleString()}
                          </motion.span>
                          {maxPossibleScore != null && maxPossibleScore > 0 && (
                            <span className="text-[10px] font-bold text-zinc-600 tabular-nums">/ {maxPossibleScore.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Accuracy</span>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-xl font-bold text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
                          <AnimatePresence mode="wait">
                            {(() => {
                              const grade = getPerformanceGrade(sessionAccuracy);
                              return (
                                <motion.span
                                  key={grade.letter}
                                  initial={{ scale: 1.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  className={cn(
                                    "inline-flex items-center justify-center w-6 h-6 rounded-md border text-[10px] font-black",
                                    grade.color, grade.bg, grade.border, grade.glow
                                  )}
                                >
                                  {grade.letter}
                                </motion.span>
                              );
                            })()}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Streak</span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-2xl font-black text-cyan-400 tabular-nums">{gameState.combo}</span>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-main/20 border border-main/20">
                            <span className="text-xs font-black text-white italic">x{gameState.multiplier}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative h-10 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                          {gameState.lastFeedback && (() => {
                              const style = mobileFeedbackStyles[gameState.lastFeedback] || { color: "text-cyan-400", dropShadow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]", scale: 1.2 };
                              return (
                                  <motion.div
                                      key={gameState.feedbackId}
                                      initial={{ y: 20, opacity: 0, scale: 0.5 }}
                                      animate={{ y: 0, opacity: 1, scale: style.scale }}
                                      exit={{ y: -20, opacity: 0, scale: style.scale + 0.3 }}
                                      className={cn(
                                          "text-xl font-black uppercase italic tracking-tighter",
                                          style.color,
                                          style.dropShadow
                                      )}
                                  >
                                      {gameState.lastFeedback}
                                  </motion.div>
                              );
                          })()}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                  <MobileTimerDisplay
                    formattedTimeLeft={formattedTimeLeft}
                    isPlaying={isPlaying}
                    sessionTimerData={sessionTimerData}
                    exerciseTimeSpent={exerciseTimeSpent}
                  />

                {currentExercise.metronomeSpeed && (
                  <div className='mb-6'>
                    <Metronome
                      metronome={metronome}
                      isMuted={isMetronomeMuted}
                      onMuteToggle={setIsMetronomeMuted}
                      isHalfSpeed={isHalfSpeed}
                      onHalfSpeedToggle={onHalfSpeedToggle}
                    />
                    {currentExercise.tablature && currentExercise.tablature.length > 0 && (
                      <div className="mt-4 flex justify-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "gap-2 text-[10px] font-bold uppercase tracking-widest transition-all h-9",
                            isAudioMuted ? "text-zinc-500 hover:text-zinc-400" : "text-cyan-400 hover:text-cyan-300 bg-cyan-500/10"
                          )}
                          onClick={() => setIsAudioMuted(!isAudioMuted)}
                        >
                          <GiGuitar className="text-base" />
                          {isAudioMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                          {isAudioMuted ? "Guitar Off" : "Guitar On"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "gap-2 text-[10px] font-bold uppercase tracking-widest transition-all h-9",
                            !isMicEnabled ? "text-zinc-500 hover:text-zinc-400" : "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10"
                          )}
                          onClick={toggleMic}
                        >
                          <div className={cn("h-1.5 w-1.5 rounded-full", isMicEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
                          {isMicEnabled ? "Tracking On" : "Tracking Off"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {currentExercise.metronomeSpeed && bpmStages && bpmStages.length > 0 && onBpmToggle && !currentExercise.gpFileUrl && (
                  <div className="mb-6">
                    <BpmProgressGrid
                      bpmStages={bpmStages}
                      completedBpms={completedBpms || []}
                      recommendedBpm={currentExercise.metronomeSpeed.recommended}
                      onToggle={onBpmToggle}
                      isLoading={isBpmLoading}
                    />
                  </div>
                )}

                <Accordion type="single" collapsible defaultValue="instructions" className="w-full space-y-3">
                    <AccordionItem value="instructions" className="border-none rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/5">
                        <AccordionTrigger className="px-4 py-3 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                    <FaInfoCircle className="h-4 w-4" />
                                </div>
                                <span className="font-bold tracking-wide text-sm text-zinc-200 group-hover:text-white">{t("exercises:instructions")}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                                <div className={cn(
                                "prose prose-invert max-w-none prose-p:text-sm prose-p:text-zinc-400 prose-p:leading-relaxed",
                                )}>
                                {currentExercise.instructions.map((instruction: string, idx: number) => (
                                    <p key={idx} className="mb-2 last:mb-0">
                                        {instruction}
                                    </p>
                                ))}
                                </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tips" className="border-none rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/5">
                        <AccordionTrigger className="px-4 py-3 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                    <FaLightbulb className="h-4 w-4" />
                                </div>
                                <span className="font-bold tracking-wide text-sm text-zinc-200 group-hover:text-white">{t("exercises:hints")}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                                <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-400 marker:text-amber-500/50">
                                {currentExercise.tips?.length > 0 && (
                                    currentExercise.tips.map((tip: string, idx: number) => (
                                        <li key={idx}>
                                            {tip}
                                        </li>
                                    ))
                                )}
                                </ul>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>


                {currentExercise.links && currentExercise.links.length > 0 && (
                     <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-5 backdrop-blur-sm space-y-4 mb-20">
                         <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                             <FaHeart className="animate-pulse" />
                             <span>Support Author</span>
                         </div>
                         <div className="flex flex-col gap-2">
                             {currentExercise.links.map((link: any, idx: number) => {
                                 let Icon = FaExternalLinkAlt;
                                 if (link.url.includes("facebook")) Icon = FaFacebook;
                                 if (link.url.includes("instagram")) Icon = FaInstagram;
                                 if (link.url.includes("twitter") || link.url.includes("x.com")) Icon = FaTwitter;
                                 if (link.url.includes("patreon")) Icon = FaHeart;

                                 return (
                                     <a 
                                         key={idx}
                                         href={link.url}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="flex items-center justify-between group px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm"
                                     >
                                         <div className="flex items-center gap-3">
                                             <Icon className={cn(
                                                 "h-4 w-4",
                                                 link.url.includes("patreon") ? "text-red-500" : "text-zinc-400 group-hover:text-white"
                                             )} />
                                             <span className="text-zinc-300 group-hover:text-white font-medium">{link.label}</span>
                                         </div>
                                         <FaExternalLinkAlt className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
                                     </a>
                                 );
                             })}
                         </div>
                     </div>
                )}
              </div>
            </div>

            <SessionModalControls
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
              canSkipExercise={canSkipExercise}
              onRestart={activeTablature && activeTablature.length > 0 ? handleRestart : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
};

export default SessionModal;
