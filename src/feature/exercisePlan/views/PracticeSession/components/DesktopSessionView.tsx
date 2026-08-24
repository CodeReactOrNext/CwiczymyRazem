import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import type { Exercise,ExercisePlan, ScoredRun } from "feature/exercisePlan/types/exercise.types";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import type { NextRouter } from "next/router";
import type { Dispatch, SetStateAction } from "react";
import React from "react";

import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import type { BackingTrack, TablatureMeasure } from "../../../types/exercise.types";
import { useSessionUI } from "../contexts/SessionUIContext";
import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";
import { BackgroundAmbiance } from "./BackgroundAmbiance";
import { ExerciseContentArea } from "./ExerciseContentArea";
import { ExerciseHeroHeader } from "./ExerciseHeroHeader";
import { ExerciseProgress } from "./ExerciseProgress";
import { ExerciseQuickActionsBar } from "./ExerciseQuickActionsBar";
import { GpTrackSelector } from "./GpTrackSelector";
import { MediaControlsToolbar, SpeedDropdown } from "./MediaControlsToolbar";
import { SessionBottomBar } from "./SessionBottomBar";
import { SpeedsMasteredButton } from "./SpeedsMasteredButton";
import { TablatureViewMenu } from "./TablatureViewMenu";

interface DesktopSessionViewProps {
  reportResult:             any;
  scoredRuns:               ScoredRun[];
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
  /** Ear training's own Play/Stop — replays the phrase from the top, unlike the session toggle. */
  onPlayRiddle:             () => void;
  riddleProgress:           RiddleProgress | null;
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
  /** Dynamic backing-track ids (e.g. other Guitar Pro tracks), used to map `trackConfigs`
   *  onto the notation viewer's underlying score tracks. */
  backingTrackIds:          string[];
  masterVolume:             number;
  setMasterVolume:          (v: number) => void;
  examMode:                 { requiredBpm: number; nodeId?: string } | undefined;
  isExamMode:               boolean;
  /** Dev-only (non-production): fast-tracks the exam-finish flow instantly, using
   *  whatever score/accuracy has been racked up so far. Undefined outside exam mode. */
  onDevPassExam?:           () => void;
  isScaleExam:              boolean;
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
  /** Backing-track bar — only a song practice session passes one. Rendered above
   *  the tablature, but owned by PracticeSession, since it drives real audio. */
  backingTrackSlot?:        React.ReactNode;
  /** Cinema mode — the backing video fills the session behind the notation. */
  backingCinema?:           boolean;
  /** The backing-track alignment screen is open over the whole session. It plays
   *  the session's own audio, so playback runs on — the notation just stops
   *  drawing frames into pixels the overlay is covering. */
  backingAligning?:         boolean;
  skillRewardSkillId?:      string;
  skillRewardAmount?:       number;
}

export const DesktopSessionView = React.memo(function DesktopSessionView(p: DesktopSessionViewProps) {
  const { openLeaderboard } = useSessionUI();
  const [isMobile, setIsMobile] = React.useState(false);
  // The Electron desktop shell draws its own always-on-top titlebar (h-10,
  // see ElectronTitleBar) that's portalled to document.body above every
  // in-app z-index — this view's own `pt-4` isn't enough to clear it, so the
  // hero header rendered underneath. Add the extra 40px only when running
  // inside Electron; the web build has no titlebar and needs none of this.
  const { isElectron } = useElectronWindowControls();

  const handleTablatureSeek = React.useCallback((beatPosition: number) => {
    if (!p.metronome.isPlaying) {
      p.metronome.seekToBeats?.(beatPosition);
    } else if (!p.isExamMode) {
      // Live seek during playback: restart at the new position (same pattern as loop restart).
      // Ignoring the seek while the visuals still jump desyncs the playhead from the audio.
      p.metronome.stopMetronome();
      p.metronome.seekToBeats(beatPosition);
      setTimeout(() => p.metronome.startMetronome({ skipCountIn: true }), 0);
    }
  }, [p.metronome, p.isExamMode]);

  const handleLoopRestart = React.useCallback((loopStartBeat: number) => {
    p.metronome.stopMetronome();
    p.metronome.seekToBeats(loopStartBeat);
    setTimeout(() => p.metronome.startMetronome({ skipCountIn: true }), 0);
  }, [p.metronome]);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const hasMetronome  = !!p.currentExercise.metronomeSpeed;
  const hasAudioTrack =
    !!((p.currentExercise.tablature && p.currentExercise.tablature.length > 0) || p.planHasTablature || p.planHasGpFile || p.planHasStrumming) &&
    !p.currentExercise.disableBackingTrack;
  const hasMicControls =
    (p.planHasTablature || p.planHasGpFile || p.planHasStrumming || !!p.currentExercise.customGoal) && !p.currentExercise.disableMic;
  const hasPlaybackControls = hasMetronome || hasAudioTrack || hasMicControls;

  const playbackControls = hasPlaybackControls ? (
    <>
      <MediaControlsToolbar
        hasMetronome={hasMetronome}
        hasAudioTrack={hasAudioTrack}
        hasMicControls={hasMicControls}
        speedMultiplier={p.speedMultiplier} onSpeedMultiplierChange={p.handleSpeedMultiplierChange}
        isAudioMuted={p.isAudioMuted} isRiddleMode={p.currentExercise.riddleConfig?.mode === "sequenceRepeat"}
        onAudioToggle={p.onAudioToggle} isMicEnabled={p.isMicEnabled}
        onMicToggle={p.onMicToggle} onRecalibrate={p.onRecalibrate}
        // Master volume only boosts the AlphaTab (Guitar Pro) synth — no GP file, no control.
        masterVolume={p.effectiveRawGpFile ? p.masterVolume : undefined}
        onMasterVolumeChange={p.effectiveRawGpFile ? p.setMasterVolume : undefined}
        metronome={p.metronome} isMetronomeMuted={p.isMetronomeMuted} setIsMetronomeMuted={p.setIsMetronomeMuted}
        audioTracks={p.audioTracks} setTrackConfigs={p.setTrackConfigs}
        frequencyRef={p.frequencyRef} volumeRef={p.volumeRef}
        disableTuner={p.currentExercise.disableTuner}
        baseBpm={p.metronome?.bpm}
        examMode={p.isExamMode}
        showBackingInExam={p.isScaleExam}
        trailing={
          <>
            {/* One menu for every tab view: flat tablature, notation.
                Notation is a practice-only convenience, so it's dropped in exams. */}
            {/* An ear-training riddle keeps its tab hidden until the answer is in, and
                its melody is played by the session's own synth — notation would both
                spoil the phrase and take the sound away with it. */}
            {p.currentExercise.riddleConfig?.mode !== "sequenceRepeat"
              && (!!p.activeTablature?.length || (!p.isExamMode && !!p.effectiveRawGpFile)) && (
              <TablatureViewMenu
                showAlphaTabScore={p.showAlphaTabScore}
                hasTablature={!!p.activeTablature?.length}
                canNotation={!p.isExamMode && (!!p.effectiveRawGpFile || !!p.activeTablature?.length)}
                onToggleNotation={p.handleToggleAlphaTabScore}
              />
            )}
            <SpeedsMasteredButton exercise={p.currentExercise} examMode={p.isExamMode} />
          </>
        }
      />
      {/* TEMPO island: playback speed lives next to the BPM slider — one axis, one place. */}
      {hasMetronome && !p.isExamMode && (
        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/40 p-1.5">
          <SpeedDropdown
            speedMultiplier={p.speedMultiplier}
            onSpeedMultiplierChange={p.handleSpeedMultiplierChange}
            baseBpm={p.metronome?.bpm}
            isSlowed={p.speedMultiplier < 1}
            h="h-12"
          />
          <div className="w-[360px] max-w-full [&>*]:!mb-0">
            <ExerciseQuickActionsBar
              exercise={p.currentExercise}
              metronome={p.metronome}
              examMode={p.isExamMode}
            />
          </div>
        </div>
      )}
    </>
  ) : undefined;

  return (
    <div className={cn("font-openSans fixed inset-0 z-[999999] bg-zinc-950", "overflow-y-auto", isMobile && "hidden")}>
      <BackgroundAmbiance category={p.category as any} isPlayalong={p.currentExercise.isPlayalong} visible={!p.reportResult} />
      <TooltipProvider>
        <div>
          <div className={cn("mx-auto max-w-[2400px] px-6 pb-64 pt-4 relative z-10", p.reportResult && "max-w-7xl px-4 pt-8", isElectron && (p.reportResult ? "pt-[72px]" : "pt-[56px]"))}>
            {p.reportResult && p.currentUserStats && p.previousUserStats ? (
              <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                <RatingPopUp
                  ratingData={p.reportResult} currentUserStats={p.currentUserStats}
                  previousUserStats={p.previousUserStats} onClick={p.onClose}
                  activityData={p.activityDataToUse} hideWrapper={true}
                  scoredRuns={p.scoredRuns}
                  onRestart={p.handleRestartFullSession}
                />
              </div>
            ) : (
              <>
                {!p.backingCinema && (
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <ExerciseHeroHeader
                      variant="header"
                      exercise={p.currentExercise}
                      activeExercise={p.activeExercise}
                      plan={p.plan}
                    />
                  </div>
                  <div className="w-full sm:max-w-sm">
                    <ExerciseProgress
                      plan={p.plan} currentExerciseIndex={p.currentExerciseIndex}
                      completedExercises={p.completedExercises} onExerciseSelect={p.handleExerciseSelect}
                    />
                  </div>
                </div>
                )}

                <div className={cn("flex flex-col items-center justify-center text-center", p.currentExercise.isPlayalong ? "mb-6 mt-0" : "mb-12 mt-4")}>
                  {!p.backingCinema && (
                    <ExerciseHeroHeader
                      variant="goals"
                      exercise={p.currentExercise}
                      activeExercise={p.activeExercise}
                      plan={p.plan}
                    />
                  )}
                  {p.allGpTracks && !p.showAlphaTabScore && !p.backingCinema && (
                    <GpTrackSelector tracks={p.allGpTracks} selectedIdx={p.selectedGpTrackIdx} onChange={p.setSelectedGpTrackIdx} />
                  )}
                  <ExerciseContentArea
                    activeTablature={p.activeTablature} currentExercise={p.currentExercise}
                    activeExercise={p.activeExercise} rawGpFile={p.effectiveRawGpFile}
                    showAlphaTabScore={p.showAlphaTabScore} onToggleAlphaTabScore={p.handleToggleAlphaTabScore}
                    isAudioPlaying={p.isAudioPlaying} startTime={p.metronomeStartTime}
                    effectiveBpm={p.effectiveBpm} isAudioMuted={p.isAudioMuted}
                    isMetronomeMuted={p.isMetronomeMuted}
                    masterVolume={p.masterVolume}
                    trackConfigs={p.trackConfigs}
                    backingTrackIds={p.backingTrackIds}
                    isMetronomePlaying={p.metronome.isPlaying}
                    countInRemaining={p.countInRemaining} frequencyRef={p.frequencyRef}
                    isListening={p.isListening} audioContext={p.metronomeAudioContext}
                    audioStartTime={p.effectiveAudioStartTime} tabResetKey={p.tabResetKey}
                    isRiddleRevealed={p.isRiddleRevealed} isRiddleGuessed={p.isRiddleGuessed}
                    hasPlayedRiddleOnce={p.hasPlayedRiddleOnce} earTrainingScore={p.earTrainingScore}
                    earTrainingHighScore={p.earTrainingHighScore} onPlayRiddle={p.onPlayRiddle}
                    onRevealRiddle={p.handleRevealRiddle} onNextRiddle={p.handleNextRiddle}
                    onEarTrainingGuessed={p.handleEarTrainingGuessed}
                    riddleProgress={p.riddleProgress}
                    onLeaderboardClick={() => openLeaderboard()}
                    startTimer={p.startTimer} stopTimer={p.stopTimer}
                    setVideoDuration={p.setVideoDuration} setTimerTime={p.setTimerTime}
                    onVideoEnd={p.handleNextExerciseClick} isPlaying={p.isPlaying}
                    isMicEnabled={p.isMicEnabled} volumeRef={p.volumeRef}
                    onSeek={handleTablatureSeek}
                    onLoopRestart={handleLoopRestart}
                    isExamMode={p.isExamMode}
                    onDevPassExam={p.onDevPassExam}
                    rewardSkillId={p.skillRewardSkillId}
                    rewardAmount={p.skillRewardAmount}
                    controlsSlot={playbackControls}
                    backingTrackSlot={p.backingTrackSlot}
                    cinema={p.backingCinema}
                    obscured={p.backingAligning}
                  />
                </div>

                {!p.reportResult && (
                  <SessionBottomBar
                    examMode={!!p.examMode} onClose={p.onClose} skipExitDialog={p.skipExitDialog}
                    exerciseKey={p.exerciseKey} currentExercise={p.currentExercise}
                    isLastExercise={p.isLastExercise} isPlaying={p.isPlaying}
                    toggleTimer={p.handleToggleTimer} handleRestart={p.handleRestart}
                    handleNextExerciseClick={p.handleNextExerciseClick}
                    hasBackingTrack={!!p.backingTrackSlot}
                  
                    canFinishSession={p.canFinishSession}
                    isSkillExercise={p.isSkillExercise}
                    currentExerciseIndex={p.currentExerciseIndex}
                    totalExercises={p.plan.exercises.length}
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
