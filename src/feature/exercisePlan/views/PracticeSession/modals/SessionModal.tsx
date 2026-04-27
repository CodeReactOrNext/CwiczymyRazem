import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BpmProgressGrid } from "feature/exercisePlan/components/BpmProgressGrid";
import { Metronome } from "feature/exercisePlan/components/Metronome/Metronome";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { motion } from "framer-motion";
import { useIsLandscape } from "hooks/useIsLandscape";
import { useTranslation } from "hooks/useTranslation";
import { useState } from "react";
import { FaInfoCircle, FaLightbulb, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

import { categoryGradients } from "../../../constants/categoryStyles";
import { MobileExerciseContent } from "../components/MobileExerciseContent";
import { MobileMicGameHud } from "../components/MobileMicGameHud";
import { MobileTimerDisplay } from "../components/MobileTimerDisplay";
import { SessionModalControls } from "../components/SessionModalControls";
import { SessionModalHeader } from "../components/SessionModalHeader";
import { LandscapeSessionModal } from "./LandscapeSessionModal";

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
  metronome: any;
  effectiveBpm?: number;
  isMicEnabled: boolean;
  toggleMic: () => Promise<void>;
  detectedNoteData: any;
  isListening: boolean;
  isAudioMuted: boolean;
  setIsAudioMuted: (bool: boolean) => void;
  isMetronomeMuted: boolean;
  setIsMetronomeMuted: (bool: boolean) => void;
  isHalfSpeed?: boolean;
  onHalfSpeedToggle?: (value: boolean) => void;
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
  bpmStages?: number[];
  completedBpms?: number[];
  isBpmLoading?: boolean;
  onBpmToggle?: (bpm: number) => void;
  onRecordsClick?: () => void;
  examMode?: boolean;
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
  detectedNoteData,
  isListening,
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
  onRecordsClick,
  examMode,
}: SessionModalProps) => {
  // Hooks must be above any early returns
  const { t } = useTranslation(["exercises", "common"]);
  const [tabResetKey, setTabResetKey] = useState(0);
  const isLandscape = useIsLandscape();

  if (!isOpen || !isMounted) return null;

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

  const category = currentExercise.category || "mixed";
  const gradientClasses = categoryGradients[category as keyof typeof categoryGradients];

  if (isLandscape) {
    return (
      <LandscapeSessionModal
        isOpen={isOpen}
        onClose={onClose}
        onFinish={onFinish}
        currentExercise={currentExercise}
        currentExerciseIndex={currentExerciseIndex}
        totalExercises={totalExercises}
        isLastExercise={isLastExercise}
        isPlaying={isPlaying}
        formattedTimeLeft={formattedTimeLeft}
        isFinishing={isFinishing}
        isSubmittingReport={isSubmittingReport}
        canSkipExercise={canSkipExercise}
        metronome={metronome}
        effectiveBpm={effectiveBpm}
        isMicEnabled={isMicEnabled}
        toggleMic={toggleMic}
        isAudioMuted={isAudioMuted}
        setIsAudioMuted={setIsAudioMuted}
        isMetronomeMuted={isMetronomeMuted}
        setIsMetronomeMuted={setIsMetronomeMuted}
        isHalfSpeed={isHalfSpeed}
        onHalfSpeedToggle={onHalfSpeedToggle}
        activeTablature={activeTablature}
        isRiddleRevealed={isRiddleRevealed}
        isRiddleGuessed={isRiddleGuessed}
        hasPlayedRiddleOnce={hasPlayedRiddleOnce}
        handleRevealRiddle={handleRevealRiddle}
        handleNextRiddle={handleNextRiddle}
        earTrainingScore={earTrainingScore}
        earTrainingHighScore={earTrainingHighScore}
        exerciseUrl={exerciseUrl}
        onEarTrainingGuessed={onEarTrainingGuessed}
        onRecordsClick={onRecordsClick}
        bpmStages={bpmStages}
        completedBpms={completedBpms}
        isBpmLoading={isBpmLoading}
        onBpmToggle={onBpmToggle}
        examMode={examMode}
        isListening={isListening}
        detectedNoteData={detectedNoteData}
        gradientClasses={gradientClasses}
        tabResetKey={tabResetKey}
        setVideoDuration={setVideoDuration}
        setTimerTime={setTimerTime}
        startTimer={startTimer}
        stopTimer={stopTimer}
        handleToggleTimer={handleToggleTimer}
        handleNextExerciseClick={handleNextExerciseClick}
        handleBackExerciseClick={handleBackExerciseClick}
        handleRestart={handleRestart}
      />
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[9999999] flex h-full flex-col overflow-hidden",
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
            detectedNoteData={detectedNoteData}
            tabResetKey={tabResetKey}
            setVideoDuration={setVideoDuration}
            setTimerTime={setTimerTime}
            startTimer={startTimer}
            stopTimer={stopTimer}
            onVideoEnd={handleNextExerciseClick}
            onImageClick={onImageClick}
            earTrainingScore={earTrainingScore}
            earTrainingHighScore={earTrainingHighScore}
            exerciseUrl={exerciseUrl}
            handleRevealRiddle={handleRevealRiddle}
            handleNextRiddle={handleNextRiddle}
            onEarTrainingGuessed={onEarTrainingGuessed}
            onRecordsClick={onRecordsClick}
            onPlayRiddle={handleToggleTimer}
          />

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

          {isMicEnabled && <MobileMicGameHud />}

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
                    variant="ghost" size="sm"
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
                    variant="ghost" size="sm"
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
                <div className="prose prose-invert max-w-none prose-p:text-sm prose-p:text-zinc-400 prose-p:leading-relaxed">
                  {currentExercise.instructions.map((instruction: string, idx: number) => (
                    <p key={idx} className="mb-2 last:mb-0">{instruction}</p>
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
                  {currentExercise.tips?.length > 0 && currentExercise.tips.map((tip: string, idx: number) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {currentExercise.links && currentExercise.links.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-5 backdrop-blur-sm space-y-4 mb-20">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                <span>Support Author</span>
              </div>
              <div className="flex flex-col gap-2">
                {currentExercise.links.map((link: any, idx: number) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
        canSkipExercise={canSkipExercise}
        onRestart={activeTablature && activeTablature.length > 0 ? handleRestart : undefined}
      />
    </div>
  );
};

export default SessionModal;
