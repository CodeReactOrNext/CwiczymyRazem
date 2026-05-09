import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import type { ExercisePlan, Exercise } from "feature/exercisePlan/types/exercise.types";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import type { NextRouter } from "next/router";
import React, { Dispatch, RefObject, SetStateAction } from "react";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { BackingTrack, TablatureMeasure } from "../../../types/exercise.types";
import { BackgroundAmbiance } from "./BackgroundAmbiance";
import { ExamModeBanner } from "./ExamModeBanner";
import { ExerciseContentArea } from "./ExerciseContentArea";
import { ExerciseHeroHeader } from "./ExerciseHeroHeader";
import { ExerciseInfoGrid } from "./ExerciseInfoGrid";
import { ExerciseProgress } from "./ExerciseProgress";
import { ExerciseQuickActionsBar } from "./ExerciseQuickActionsBar";
import { GpTrackSelector } from "./GpTrackSelector";
import { MediaControlsToolbar } from "./MediaControlsToolbar";
import { MicHud } from "./MicHud";
import { SessionBottomBar } from "./SessionBottomBar";
import { SessionSidebar } from "./SessionSidebar";
import { useSessionUI } from "../contexts/SessionUIContext";

interface DesktopSessionViewProps {
  reportResult:             any;
  currentUserStats:         any;
  previousUserStats:        any;
  activityDataToUse:        any;
  router:                   NextRouter;
  handleRestartFullSession: () => void;
  plan:                     ExercisePlan;
  currentExercise:          Exercise;
  activeExercise:           Exercise;
  category:                 string;
  currentExerciseIndex:     number;
  completedExercises:       number[];
  handleExerciseSelect:     (idx: number) => void;
  isMicEnabled:             boolean;
  allGpTracks:              BackingTrack[] | null;
  showAlphaTabScore:        boolean;
  selectedGpTrackIdx:       number;
  setSelectedGpTrackIdx:    (idx: number) => void;
  handleToggleAlphaTabScore:() => void;
  effectiveRawGpFile:       File | undefined;
  activeTablature:          TablatureMeasure[] | undefined;
  isAudioPlaying:           boolean;
  metronomeStartTime:       number | null;
  effectiveBpm:             number;
  isAudioMuted:             boolean;
  countInRemaining:         number;
  frequencyRef:             React.MutableRefObject<number>;
  volumeRef:                React.MutableRefObject<number>;
  isListening:              boolean;
  metronomeAudioContext:    AudioContext | null | undefined;
  effectiveAudioStartTime:  number | null;
  tabResetKey:              number;
  isRiddleRevealed:         boolean;
  isRiddleGuessed:          boolean;
  hasPlayedRiddleOnce:      boolean;
  earTrainingScore:         number;
  earTrainingHighScore:     number | null;
  handleRevealRiddle:       () => void;
  handleNextRiddle:         () => void;
  handleEarTrainingGuessed: () => void;
  isPlaying:                boolean;
  handleToggleTimer:        () => void;
  startTimer:               () => void;
  stopTimer:                () => void;
  setVideoDuration:         (d: number | null) => void;
  setTimerTime:             (t: number) => void;
  handleNextExerciseClick:  () => Promise<void>;
  onAudioToggle:            () => void;
  onMicToggle:              () => void;
  onRecalibrate:            () => void;
  speedMultiplier:              number;
  handleSpeedMultiplierChange:    (v: number) => void;
  metronome:                any;
  isMetronomeMuted:         boolean;
  setIsMetronomeMuted:      (v: boolean) => void;
  audioTracks:              AudioTrackConfig[];
  trackConfigs:             Record<string, { volume: number; isMuted: boolean }>;
  setTrackConfigs:          Dispatch<SetStateAction<Record<string, { volume: number; isMuted: boolean }>>>;
  examMode:                 { requiredBpm: number; nodeId?: string } | undefined;
  exerciseKey:              number;
  isLastExercise:           boolean;
  handleRestart:            () => void;
  canFinishSession:         boolean;
  isSkillExercise:          boolean;
  jumpToExercise:           (idx: number) => void;
  isFinishing:              boolean | undefined;
  isSubmittingReport:       boolean;
  onFinishSession:          () => Promise<void>;
  onClose:                  () => void;
  skipExitDialog:           boolean;
  planHasTablature:         boolean;
  planHasGpFile:            boolean;
  planHasStrumming:         boolean;
}

export const DesktopSessionView = React.memo(function DesktopSessionView(p: DesktopSessionViewProps) {
  const { openLeaderboard } = useSessionUI();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className={cn("font-openSans fixed inset-0 z-[999999] bg-zinc-950", "overflow-y-auto", isMobile && "hidden")}>
      <BackgroundAmbiance category={p.category as any} isPlayalong={p.currentExercise.isPlayalong} visible={!p.reportResult} />
      {p.examMode && (
        <ExamModeBanner
          examMode={p.examMode}
          exerciseId={p.activeExercise.id}
          exerciseTitle={p.currentExercise.title}
        />
      )}
      <TooltipProvider>
        <div>
          <div className={cn("mx-auto max-w-[2400px] px-6 pb-64 pt-4 relative z-10", p.reportResult && "max-w-7xl px-4 pt-8")}>
            {p.reportResult && p.currentUserStats && p.previousUserStats ? (
              <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                <RatingPopUp
                  ratingData={p.reportResult} currentUserStats={p.currentUserStats}
                  previousUserStats={p.previousUserStats} onClick={() => p.router.push("/dashboard")}
                  activityData={p.activityDataToUse} hideWrapper={true}
                  onRestart={p.handleRestartFullSession}
                />
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <ExerciseProgress
                    plan={p.plan} currentExerciseIndex={p.currentExerciseIndex}
                    completedExercises={p.completedExercises} onExerciseSelect={p.handleExerciseSelect}
                  />
                </div>

                <div className={cn("flex flex-col items-center justify-center text-center", p.currentExercise.isPlayalong ? "mb-6 mt-0" : "mb-12 mt-8")}>
                  <ExerciseHeroHeader exercise={p.currentExercise} activeExercise={p.activeExercise} plan={p.plan} />
                  {p.isMicEnabled && <MicHud />}
                  {p.allGpTracks && !p.showAlphaTabScore && (
                    <GpTrackSelector tracks={p.allGpTracks} selectedIdx={p.selectedGpTrackIdx} onChange={p.setSelectedGpTrackIdx} />
                  )}
                  <MediaControlsToolbar
                    hasMetronome={!!p.currentExercise.metronomeSpeed}
                    hasAudioTrack={!!((p.currentExercise.tablature && p.currentExercise.tablature.length > 0) || p.planHasTablature || p.planHasGpFile || p.planHasStrumming)}
                    hasMicControls={p.planHasTablature || p.planHasGpFile || p.planHasStrumming}
                    speedMultiplier={p.speedMultiplier} onSpeedMultiplierChange={p.handleSpeedMultiplierChange}
                    isAudioMuted={p.isAudioMuted} isRiddleMode={p.currentExercise.riddleConfig?.mode === "sequenceRepeat"}
                    onAudioToggle={p.onAudioToggle} isMicEnabled={p.isMicEnabled}
                    onMicToggle={p.onMicToggle} onRecalibrate={p.onRecalibrate}
                    frequencyRef={p.frequencyRef} volumeRef={p.volumeRef}
                  />
                  <ExerciseQuickActionsBar
                    exercise={p.currentExercise}
                    metronome={p.metronome}
                    isMetronomeMuted={p.isMetronomeMuted}
                    setIsMetronomeMuted={p.setIsMetronomeMuted}
                    examMode={!!p.examMode}
                  />
                  <ExerciseContentArea
                    activeTablature={p.activeTablature} currentExercise={p.currentExercise}
                    activeExercise={p.activeExercise} rawGpFile={p.effectiveRawGpFile}
                    showAlphaTabScore={p.showAlphaTabScore} onToggleAlphaTabScore={p.handleToggleAlphaTabScore}
                    isAudioPlaying={p.isAudioPlaying} startTime={p.metronomeStartTime}
                    effectiveBpm={p.effectiveBpm} isAudioMuted={p.isAudioMuted}
                    isMetronomePlaying={p.metronome.isPlaying}
                    countInRemaining={p.countInRemaining} frequencyRef={p.frequencyRef}
                    isListening={p.isListening} audioContext={p.metronomeAudioContext}
                    audioStartTime={p.effectiveAudioStartTime} tabResetKey={p.tabResetKey}
                    isRiddleRevealed={p.isRiddleRevealed} isRiddleGuessed={p.isRiddleGuessed}
                    hasPlayedRiddleOnce={p.hasPlayedRiddleOnce} earTrainingScore={p.earTrainingScore}
                    earTrainingHighScore={p.earTrainingHighScore} onPlayRiddle={p.handleToggleTimer}
                    onRevealRiddle={p.handleRevealRiddle} onNextRiddle={p.handleNextRiddle}
                    onEarTrainingGuessed={p.handleEarTrainingGuessed}
                    onLeaderboardClick={() => openLeaderboard()}
                    startTimer={p.startTimer} stopTimer={p.stopTimer}
                    setVideoDuration={p.setVideoDuration} setTimerTime={p.setTimerTime}
                    onVideoEnd={p.handleNextExerciseClick} isPlaying={p.isPlaying}
                    isMicEnabled={p.isMicEnabled} volumeRef={p.volumeRef}
                  />
                </div>

                <ExerciseInfoGrid exercise={p.activeExercise} isPlayalong={p.currentExercise.isPlayalong} hasMetronome={!!p.currentExercise.metronomeSpeed}>
                  <SessionSidebar
                    currentExercise={p.currentExercise} activeExercise={p.activeExercise}
                    metronome={p.metronome} isMetronomeMuted={p.isMetronomeMuted}
                    setIsMetronomeMuted={p.setIsMetronomeMuted}
                    audioTracks={p.audioTracks}
                    trackConfigs={p.trackConfigs} setTrackConfigs={p.setTrackConfigs}
                    examMode={!!p.examMode}
                  />
                </ExerciseInfoGrid>

                {!p.reportResult && (
                  <SessionBottomBar
                    examMode={!!p.examMode} onClose={p.onClose} skipExitDialog={p.skipExitDialog}
                    exerciseKey={p.exerciseKey} currentExercise={p.currentExercise}
                    isLastExercise={p.isLastExercise} isPlaying={p.isPlaying}
                    toggleTimer={p.handleToggleTimer} handleRestart={p.handleRestart}
                    handleNextExerciseClick={p.handleNextExerciseClick}
                  
                    canFinishSession={p.canFinishSession}
                    isSkillExercise={p.isSkillExercise}
                    currentExerciseIndex={p.currentExerciseIndex}
                    onGoToPreviousExercise={() => {
                      p.stopTimer(); p.metronome.restartMetronome(); p.jumpToExercise(p.currentExerciseIndex - 1);
                    }}
                    isFinishing={p.isFinishing} isSubmittingReport={p.isSubmittingReport}
                    onFinishSession={p.onFinishSession}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
});
