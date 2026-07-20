import "react-circular-progressbar/dist/styles.css";

import { saveLastSession } from "feature/practice/utils/lastSession";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { selectUserInfo} from "feature/user/store/userSlice";
import { useGuitarAudioInput } from "hooks/useGuitarAudioInput";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import Head from "next/head";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "store/hooks";

import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import type { ExercisePlan } from "../../types/exercise.types";
import { DesktopSessionView } from "./components/DesktopSessionView";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { GeneratedExerciseDialogs } from "./components/GeneratedExerciseDialogs";
import { GpLoadingOverlay } from "./components/GpLoadingOverlay";
import { PracticeLoadingScreen } from "./components/PracticeLoadingScreen";
import { SessionDialogs } from "./components/SessionDialogs";
import { TuningSettingsModal } from "./components/TuningSettingsModal";
import { BpmProgressProvider } from "./contexts/BpmProgressContext";
import { GuitarTuningProvider } from "./contexts/GuitarTuningContext";
import type { NoteMatchingHandle, NoteMatchingSnapshot } from "./contexts/NoteMatchingContext";
import { NoteMatchingProvider } from "./contexts/NoteMatchingContext";
import { SessionUIProvider } from "./contexts/SessionUIContext";
import { TimerProvider, useTimerContext } from "./contexts/TimerContext";
import { loadGuitarPlaybackPreference } from "./helpers/guitarPlaybackPreference";
import {
  loadGlobalMasterVolume,
  loadGlobalMetronomeVolume,
  loadPracticeSessionSettings,
  saveGlobalMasterVolume,
  saveGlobalMetronomeVolume,
  savePracticeSessionSettings,
} from "./helpers/practiceSessionSettings";
import { useCalibration } from "./hooks/useCalibration";
import { useEarTraining } from "./hooks/useEarTraining";
import { useGeneratedExercise } from "./hooks/useGeneratedExercise";
import { useGpFileLoader } from "./hooks/useGpFileLoader";
import { useGuitarTuning } from "./hooks/useGuitarTuning";
import { useNoteHuntRotation } from "./hooks/useNoteHuntRotation";
import { usePlaybackReducer } from "./hooks/usePlaybackReducer";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import { useRiddleSequenceMatcher } from "./hooks/useRiddleSequenceMatcher";
import { useScoreSaving } from "./hooks/useScoreSaving";
import { useSessionAudio } from "./hooks/useSessionAudio";
import { useSessionControls } from "./hooks/useSessionControls";
import SessionModal from "./modals/SessionModal";

// ── Props ─────────────────────────────────────────────────────────────────────

interface PracticeSessionProps {
  plan:                ExercisePlan;
  rawGpFile?:          File;
  onFinish:            () => void;
  onClose:             () => void;
  isFinishing?:        boolean;
  autoReport?:         boolean;
  forceFullDuration?:  boolean;
  freeMode?:           boolean;
  skillRewardSkillId?: string;
  skillRewardAmount?:  number;
  examMode?:           boolean | { requiredBpm: number; nodeId?: string };
  examBpm?:            number;
  onExamComplete?:     (accuracy: number) => void;
  skipExitDialog?:     boolean;
}

const SessionPageHead = ({ exerciseTitle }: { exerciseTitle: string }) => {
  const { formattedTimeLeft } = useTimerContext();
  return <Head><title>{formattedTimeLeft} | {exerciseTitle}</title></Head>;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const PracticeSession = ({
  plan, rawGpFile, onFinish, onClose, isFinishing, autoReport,
  forceFullDuration, freeMode, skillRewardSkillId, skillRewardAmount,
  examMode, examBpm, onExamComplete, skipExitDialog = false,
}: PracticeSessionProps) => {
  const router = useRouter();

  const {
    currentExerciseIndex, exerciseKey, showCompleteDialog, isMobileView,
    isFullSessionModalOpen, isMounted, currentExercise,
    isLastExercise, setShowCompleteDialog, handleNextExercise,
    startTimer, stopTimer, resetTimer, showSuccessView, resetSuccessView,
    videoDuration, setVideoDuration, setTimerTime, autoSubmitReport,
    isSubmittingReport, reportResult, currentUserStats, previousUserStats,
    planTitleString,  timer, activityDataToUse,
    jumpToExercise,  canFinishSession, isSkillExercise,
    completedExercises, restartFullSession,
  } = usePracticeSessionState({ plan, onFinish, autoReport, forceFullDuration, freeMode, skillRewardSkillId, skillRewardAmount });

  const isPlaying = timer.timerEnabled;
  const isExamMode = typeof examMode === 'boolean' ? examMode : !!examMode;
  const examModeObject = typeof examMode === 'object' ? examMode : undefined;
  // In exam mode the metronome tempo is fixed: lock min === max === bpm so it
  // can't be changed (slider/±/edit all clamp to this single value).
  const lockedExamBpm = examModeObject ? examModeObject.requiredBpm : (isExamMode ? examBpm : undefined);
  // Scale (theory) exams keep the metronome and backing-track controls visible —
  // unlike regular exercise exams, the metronome is the audible guide here.
  const isScaleExam = isExamMode && currentExercise.category === "theory";

  const userInfo   = useAppSelector(selectUserInfo);
  const isPremium  = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const planHasGpFile = !!rawGpFile || plan.exercises.some(ex => !!ex.gpFileUrl);

  if (planHasGpFile && !isPremium) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500">
          <PremiumGate feature="gp-practice" children={<div />} />
          <button onClick={() => router.back()} className="mt-8 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors w-full font-bold capitalize tracking-widest text-[10px]">
            ← Return
          </button>
        </div>
      </div>
    );
  }

  // ── GP file loading ───────────────────────────────────────────────────────

  const { effectiveRawGpFile, isFetchingGpFile, parsedGpTracks } = useGpFileLoader({
    rawGpFile, gpFileUrl: currentExercise.gpFileUrl, exerciseTitle: currentExercise.title,
  });

  // ── Guitar tuning (pitch detection + background guitar match the player's own tuning) ──
  // Locked to Standard for Guitar Pro imports (the file already encodes its own tuning)
  // and during exams (prepared only for standard tuning).
  const isGpFile = !!effectiveRawGpFile || !!currentExercise.gpFileUrl;
  const guitarTuning = useGuitarTuning({ isGpFile, isExamMode });

  useEffect(() => {
    posthog.capture("practice_session_started", { plan_title: plan.title, exercise_count: plan.exercises.length });
    // Feed the "Last Session" shortcuts (dashboard + practice hub). Exams are
    // deliberately excluded — re-entering an exam is not "practicing again".
    if (!isExamMode) {
      saveLastSession({ title: planTitleString, href: router.asPath });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Playback settings (Reducer) ──────────────────────────────────────────

  const {
    isAudioMuted, isMetronomeMuted, speedMultiplier, showAlphaTabScore, show3dHighway, selectedGpTrackIdx,
    setIsAudioMuted, setIsMetronomeMuted, setSpeedMultiplier, setSelectedGpTrackIdx,
    toggleAlphaTabScore, toggle3dHighway, resetForExercise
  } = usePlaybackReducer();
  const [tabRepeatCount] = useState(0);
  const loopsCompletedRef = useRef(0);
  // Suppresses the settings-save effect's first run right after an exercise
  // switch loads persisted values — otherwise it would immediately overwrite
  // the just-loaded settings with the stale pre-load state.
  const skipNextSettingsSaveRef = useRef(false);

  // ── Generated exercise ────────────────────────────────────────────────────

  const { showScaleDialog, setShowScaleDialog, showChordDialog, setShowChordDialog, activeExercise, handleGenerated } =
    useGeneratedExercise({ currentExercise });

  // ── AlphaTab AudioContext + metronome bridge ───────────────────────────────

  const tabTickBridgeRef = useRef<(() => void) | null>(null);
  const [audioSystem, setAudioSystem] = useState<{ context: AudioContext | null; isActive: boolean }>({
    context: null,
    isActive: false,
  });
  useEffect(() => { setAudioSystem(prev => ({ ...prev, context: null })); }, [effectiveRawGpFile]);

  const metronome = useDeviceMetronome({
    initialBpm:     lockedExamBpm ?? (activeExercise.metronomeSpeed?.recommended || 60),
    minBpm:         lockedExamBpm ?? activeExercise.metronomeSpeed?.min,
    maxBpm:         lockedExamBpm ?? activeExercise.metronomeSpeed?.max,
    recommendedBpm: lockedExamBpm ?? activeExercise.metronomeSpeed?.recommended,
    isMuted:        isMetronomeMuted || audioSystem.isActive,
    // While notation is shown, AlphaTab's own built-in metronome click takes over as the
    // single source of truth (see AlphaTabScoreViewer) once it actually starts playing —
    // it's driven by the exact same clock as the notation playback, so it can't drift
    // from it the way this separate device-metronome click (a different audio clock
    // entirely) otherwise could. But AlphaTab only starts playing *after* the count-in
    // finishes (see isAudioPlaying below), so muting this metronome's click unconditionally
    // for the whole `showAlphaTabScore` duration left the count-in completely silent.
    // Only mute the *steady* click post-count-in; count-in beeps stay on this metronome.
    mutePlaybackClick: showAlphaTabScore,
    speedMultiplier: speedMultiplier,
    onTick:         useCallback(() => { tabTickBridgeRef.current?.(); }, []),
    externalAudioContext: effectiveRawGpFile ? audioSystem.context : undefined,
  });

  // Must NOT be rounded: the metronome schedules its clicks from the exact
  // `bpm * speedMultiplier`, so the tablature audio + visual cursor (which use
  // effectiveBpm) must use the same exact value or they drift apart at non-100%
  // speeds (e.g. 55 × 0.75 = 41.25 vs rounded 41).
  const effectiveBpm           = metronome.bpm * speedMultiplier;
  const isAudioPlaying         = metronome.isPlaying && metronome.countInRemaining === 0 && !!metronome.startTime;

  // ── Ear training ──────────────────────────────────────────────────────────

  const {
    riddleMeasures, isRiddleRevealed, isRiddleGuessed, setIsRiddleGuessed,
    earTrainingScore, setEarTrainingScore, earTrainingHighScore,
    hasPlayedRiddleOnce, setHasPlayedRiddleOnce, tabResetKey,
    handleNextRiddle, handleRevealRiddle,
  } = useEarTraining({ currentExercise, restartMetronome: metronome.restartMetronome, startMetronome: metronome.startMetronome, currentBpm: metronome.bpm, setBpm: metronome.setBpm });

  useEffect(() => {
    // Dynamic customGoal (e.g. Random Note Hunt): pick a fresh target on entry,
    // then keep it fixed for the session so pausing never changes it. This runs
    // once per exercise and the resetForExercise() below re-renders to show it.
    currentExercise.rerollCustomGoal?.();

    let nextAudioMuted = true;
    if (isExamMode) {
      nextAudioMuted = true;
    } else if (currentExercise.riddleConfig?.mode === "sequenceRepeat") {
      nextAudioMuted = false;
    } else {
      const pref = loadGuitarPlaybackPreference();
      nextAudioMuted = pref !== null ? !pref : !(currentExercise.tablature && currentExercise.tablature.length > 0);
    }

    // In exam mode with a backing track, the backing guides the tempo, so the
    // metronome click is redundant — mute it (it still runs to keep timing/sync).
    let nextMetronomeMuted = isExamMode && !!currentExercise.examBacking;
    let nextSpeedMultiplier = 1;

    // Exam mode has its own fixed rules above (and a locked BPM), so per-exercise
    // persisted settings only apply to regular practice.
    if (!isExamMode) {
      const persisted = loadPracticeSessionSettings(currentExercise.id);
      if (persisted?.isAudioMuted !== undefined) nextAudioMuted = persisted.isAudioMuted;
      if (persisted?.isMetronomeMuted !== undefined) nextMetronomeMuted = persisted.isMetronomeMuted;
      if (persisted?.speedMultiplier !== undefined) nextSpeedMultiplier = persisted.speedMultiplier;
      if (persisted?.metronomeBpm !== undefined) metronome.setBpm(persisted.metronomeBpm);
    }

    skipNextSettingsSaveRef.current = true;
    resetForExercise({
      isAudioMuted: nextAudioMuted, isMetronomeMuted: nextMetronomeMuted, speedMultiplier: nextSpeedMultiplier,
      // Exams never expose the notation toggle (see DesktopSessionView), but force it off here
      // too in case it was left on from a prior non-exam exercise in the same session.
      ...(isExamMode ? { showAlphaTabScore: false } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise.id]);

  // Metronome volume is a device-wide preference, not per-exercise — restore it once on mount.
  useEffect(() => {
    const persistedVolume = loadGlobalMetronomeVolume();
    if (persistedVolume !== null) metronome.setVolume(persistedVolume);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Master volume boosts the Guitar Pro (MIDI) playback above its normal 100% level —
  // a device-wide preference, so it's lazily restored from storage on the first render.
  const [masterVolume, setMasterVolume] = useState(() => loadGlobalMasterVolume() ?? 1);

  const activeTablature = riddleMeasures
    || (parsedGpTracks ? parsedGpTracks[selectedGpTrackIdx]?.measures : undefined)
    || activeExercise.tablature;

  const dynamicBackingTracks = useMemo(() => {
    if (parsedGpTracks && parsedGpTracks.length > 1) return parsedGpTracks.filter((_, idx) => idx !== selectedGpTrackIdx);
    return activeExercise.backingTracks;
  }, [parsedGpTracks, selectedGpTrackIdx, activeExercise.backingTracks]);

  const planHasTablature = useMemo(() => plan.exercises.some(ex => (ex.tablature && ex.tablature.length > 0) || ex.riddleConfig?.mode === "sequenceRepeat"), [plan.exercises]);
  const planHasStrumming = useMemo(() => plan.exercises.some(ex => ex.strummingPatterns && ex.strummingPatterns.length > 0), [plan.exercises]);

  // ── Audio subsystem ───────────────────────────────────────────────────────

  const [tabRestartKey, setTabRestartKey] = useState(0);

  const { audioTracks, trackConfigs, setTrackConfigs, backingTrackIds, gpAudioActive, effectiveAudioStartTime, tabSchedulerTickRef } = useSessionAudio({
    activeTablature, dynamicBackingTracks, effectiveRawGpFile,
    isAudioMuted, isAudioPlaying, effectiveBpm, masterVolume,
    currentExerciseId: currentExercise.id, selectedGpTrackIdx, tabRepeatCount, loopsCompletedRef,
    isMetronomeMuted, showAlphaTabScore, examMode: isExamMode,
    examBacking: activeExercise.examBacking,
    metronomeAudioContext: metronome.audioContext,
    metronomeStartTime: metronome.startTime,
    metronomeAudioStartTime: metronome.audioStartTime,
    stopMetronome: metronome.stopMetronome, stopTimer, setTimerTime, setHasPlayedRiddleOnce,
    onAlphaTabAudioContextReady: useCallback((ctx: AudioContext) => setAudioSystem(prev => ({ ...prev, context: ctx })), []),
    tabRestartKey,
    pendingSeekBeatRef: metronome.pendingSeekBeatRef,
    tuningOffsets: guitarTuning.tuning.offsets,
  });

  useEffect(() => { setAudioSystem(prev => ({ ...prev, isActive: gpAudioActive })); }, [gpAudioActive]);
  tabTickBridgeRef.current = () => tabSchedulerTickRef.current?.();

  // ── Calibration + mic ─────────────────────────────────────────────────────

  const { isListening, init: initAudio, close: closeAudio, audioRefs, getLatencyMs, inputGain, setInputGain, isNative, selectDevice } = useGuitarAudioInput();

  const {
    sessionPhase, isMicEnabled: _isMicEnabled, handleEnableMic, handleSkipMic,
    handleReuseCalibration, handleRecalibrate, handleCalibrationComplete, handleCalibrationCancel,
    getAdjustedTargetFreq, existingCalibrationTimestamp, setIsMicEnabled: updateMicPersistence, setSessionPhase,
  } = useCalibration(planHasTablature);

  const isMicEnabled = _isMicEnabled && !currentExercise.isPlayalong;
  useEffect(() => { if (isExamMode && !_isMicEnabled) setSessionPhase("mic_prompt"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if (isMicEnabled && !isListening) initAudio(); }, [isMicEnabled]);

  // Restore this exercise's persisted pitch-detection preference (exam mode
  // manages mic enablement itself via the mic_prompt flow above).
  useEffect(() => {
    if (isExamMode) return;
    const persisted = loadPracticeSessionSettings(currentExercise.id);
    if (persisted?.isMicEnabled !== undefined && persisted.isMicEnabled !== _isMicEnabled) {
      updateMicPersistence(persisted.isMicEnabled);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise.id]);

  // Persist Practice Session settings per exercise, so reopening the same
  // exercise restores its own metronome/playback/mic preferences.
  useEffect(() => {
    if (isExamMode) return;
    if (skipNextSettingsSaveRef.current) { skipNextSettingsSaveRef.current = false; return; }
    savePracticeSessionSettings(currentExercise.id, {
      isAudioMuted, isMetronomeMuted, speedMultiplier,
      metronomeBpm: metronome.bpm,
      isMicEnabled: _isMicEnabled,
    });
  }, [currentExercise.id, isExamMode, isAudioMuted, isMetronomeMuted, speedMultiplier, metronome.bpm, _isMicEnabled]);

  // Metronome volume is a device-wide preference — persist it independently of the exercise.
  useEffect(() => {
    saveGlobalMetronomeVolume(metronome.volume);
  }, [metronome.volume]);

  // Master volume is a device-wide preference — persist it independently of the exercise.
  useEffect(() => {
    saveGlobalMasterVolume(masterVolume);
  }, [masterVolume]);

  // ── Note matching ─────────────────────────────────────────────────────────

  const activeStrumPattern = currentExercise.strummingPatterns?.[0];
  // Rotating hunts: the provider flips this to true once the whole goal is solved,
  // so the rotation hook can fast-forward to the next target.
  const huntSolvedRef = useRef(false);
  const { target: huntTarget, secondsLeft: noteHuntSecondsLeft, advance: advanceHunt } = useNoteHuntRotation(currentExercise, isPlaying, huntSolvedRef);
  const noteMatchingHandle = useRef<NoteMatchingHandle | null>(null);
  const [successSnapshot, setSuccessSnapshot] = useState<NoteMatchingSnapshot | null>(null);
  useEffect(() => { if (showSuccessView) setSuccessSnapshot(noteMatchingHandle.current?.snapshot() ?? null); }, [showSuccessView]);

  // ── Score saving ──────────────────────────────────────────────────────────

  const { saveCurrentScores, exerciseRecordsRef } = useScoreSaving({
    activeExercise, currentExercise, isMicEnabled, earTrainingScore, noteMatchingHandle,
  });

  // ── Controls & handlers ───────────────────────────────────────────────────

  const {
    handleToggleTimer, handleRestart, handleRestartFullSession, handleSpeedMultiplierChange,
    handleNextExerciseClick, handleMicToggle, handleAudioToggle,
    handleExerciseSelect, handleEarTrainingGuessed, handleNoteMatchingReset,
  } = useSessionControls({
    isPlaying, stopTimer, startTimer, resetTimer, metronome,
    currentExercise, currentExerciseIndex, isLastExercise, jumpToExercise,
    handleNextExercise, restartFullSession,
    isMicEnabled, closeAudio, updateMicPersistence,
    isAudioMuted, setIsAudioMuted, speedMultiplier, setSpeedMultiplier,
    setEarTrainingScore, setIsRiddleGuessed, handleRevealRiddle,
    saveCurrentScores, noteMatchingHandle, loopsCompletedRef,
    tabRestartKey, setTabRestartKey,
  });

  // ── Ear training: mic answer matching ─────────────────────────────────────

  // Armed only while playback is fully stopped — otherwise the mic would hear
  // the riddle itself coming from the speakers and solve it on its own.
  const riddleProgress = useRiddleSequenceMatcher({
    measures: riddleMeasures,
    active: isMicEnabled && isListening && hasPlayedRiddleOnce && !isRiddleRevealed && !isPlaying && !metronome.isPlaying,
    frequencyRef: audioRefs.frequencyRef,
    volumeRef: audioRefs.volumeRef,
    tuningOffsets: guitarTuning.tuning.offsets,
    onComplete: handleEarTrainingGuessed,
  });

  // Next riddle auto-plays its melody; if the player answered while stopped
  // (mic flow), restart the timer too so the Play/Stop button and the answer
  // matcher stay consistent with the audible playback.
  const handleNextRiddleClick = useCallback(() => {
    if (!isPlaying) startTimer();
    handleNextRiddle();
  }, [isPlaying, startTimer, handleNextRiddle]);

  // ── Misc effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    const duration = videoDuration !== null ? videoDuration : (activeExercise.timeInMinutes || 0) * 60;
    if (freeMode || duration === 0) return;

    return timer.subscribe((time) => {
      const remaining = Math.max(0, Math.floor((duration * 1000 - time) / 1000));
      if (remaining > 0) return;
      if (isPlaying) stopTimer();
      if (metronome.isPlaying) metronome.toggleMetronome();
    });
  }, [timer, isPlaying, metronome, stopTimer, freeMode, videoDuration, activeExercise.timeInMinutes]);

  useEffect(() => {
    const header = document.querySelector("header.sticky") as HTMLElement | null;
    if (header) header.style.display = "none";
    return () => { if (header) header.style.display = ""; };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <GuitarTuningProvider value={guitarTuning}>
    <NoteMatchingProvider
      handleRef={noteMatchingHandle} isPlaying={isPlaying} startTime={metronome.startTime}
      audioContext={metronome.audioContext} audioStartTime={metronome.audioStartTime}
      effectiveBpm={effectiveBpm} rawBpm={metronome.bpm} activeTablature={activeTablature}
      isMicEnabled={isMicEnabled} currentExerciseIndex={currentExerciseIndex}
      speedMultiplier={speedMultiplier} getLatencyMs={getLatencyMs} audioRefs={audioRefs}
      getAdjustedTargetFreq={getAdjustedTargetFreq} tuningOffsets={guitarTuning.tuning.offsets}
      activeStrumPattern={activeStrumPattern}
      customGoal={huntTarget ? huntTarget.goal : currentExercise.customGoal}
      customGoalRegion={huntTarget ? huntTarget.region : currentExercise.customGoalRegion}
      customGoalPrompt={huntTarget ? huntTarget.prompt : currentExercise.customGoalPrompt}
      noteHuntMode={currentExercise.noteHuntConfig?.mode}
      noteHuntSecondsLeft={noteHuntSecondsLeft}
      solvedRef={huntSolvedRef}
      onAdvanceHunt={advanceHunt}
      onEnableMic={handleMicToggle}
      onReset={handleNoteMatchingReset}
    >
    <TimerProvider timer={timer} durationInSeconds={videoDuration !== null ? videoDuration : (activeExercise.timeInMinutes || 0) * 60} freeMode={freeMode}>
    <BpmProgressProvider exercise={currentExercise}>
    <SessionUIProvider>
    <>
      {/* Intro splash that always plays on session mount, then parts open
          (door-reveal) to show the session beneath. */}
      <PracticeLoadingScreen isReady />

      <SessionPageHead exerciseTitle={activeExercise.title} />

      <GeneratedExerciseDialogs
        showScaleDialog={showScaleDialog} setShowScaleDialog={setShowScaleDialog}
        showChordDialog={showChordDialog} setShowChordDialog={setShowChordDialog}
        onExerciseGenerated={handleGenerated}
      />

      {isMobileView && reportResult && currentUserStats && previousUserStats && (
        <div className="fixed inset-0 z-[999999999] overflow-y-auto bg-zinc-950">
          <RatingPopUp ratingData={reportResult} currentUserStats={currentUserStats} previousUserStats={previousUserStats}
            onClick={onClose} activityData={activityDataToUse} onRestart={handleRestartFullSession}
          />
        </div>
      )}

      <GpLoadingOverlay isLoading={isFetchingGpFile} />

      {showSuccessView && !reportResult && successSnapshot && (
        <ExerciseSuccessView
          planTitle={planTitleString} examMode={isExamMode}
          score={successSnapshot.score} maxScore={successSnapshot.maxPossibleScore}
          stats={{ accuracy: successSnapshot.accuracy, maxStreak: successSnapshot.maxCombo }}
          timeline={successSnapshot.noteTimeline}
          onFinish={async () => {
            metronome.stopMetronome(); await saveCurrentScores();
            autoSubmitReport(exerciseRecordsRef.current,
              isMicEnabled ? { score: successSnapshot.score, accuracy: successSnapshot.accuracy } : null,
              currentExercise.riddleConfig?.mode === "sequenceRepeat" ? { score: earTrainingScore } : null);
            if (isExamMode) onExamComplete?.(successSnapshot.accuracy);
          }}
          onRestart={() => {
            resetSuccessView(); resetTimer(); metronome.restartMetronome(); startTimer();
            if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") metronome.startMetronome();
          }}
          isLoading={isFinishing || isSubmittingReport}
        />
      )}

      {isMobileView && createPortal(
        <SessionModal
          examMode={isExamMode}
          isOpen={isFullSessionModalOpen && !showCompleteDialog && !reportResult && !showSuccessView}
          onClose={onClose}
          onFinish={isLastExercise ? async () => {
            const snap = noteMatchingHandle.current?.snapshot();
            metronome.stopMetronome(); await saveCurrentScores();
            autoSubmitReport(exerciseRecordsRef.current,
              isMicEnabled && snap ? { score: snap.score, accuracy: snap.accuracy } : null,
              currentExercise.riddleConfig?.mode === "sequenceRepeat" ? { score: earTrainingScore } : null);
            if (isExamMode && snap) onExamComplete?.(snap.accuracy);
          } : onFinish}
          isMounted={isMounted} currentExercise={currentExercise}
          currentExerciseIndex={currentExerciseIndex} totalExercises={plan.exercises.length}
          isLastExercise={isLastExercise} isPlaying={isPlaying}
          handleNextExercise={handleNextExerciseClick}
          handleBackExercise={() => { stopTimer(); metronome.restartMetronome(); jumpToExercise(currentExerciseIndex - 1); }}
          setVideoDuration={setVideoDuration} setTimerTime={setTimerTime}
          startTimer={startTimer} stopTimer={stopTimer}
          isFinishing={isFinishing} isSubmittingReport={isSubmittingReport}
          metronome={metronome} effectiveBpm={effectiveBpm}
          isMicEnabled={isMicEnabled} toggleMic={handleMicToggle}
          frequencyRef={audioRefs.frequencyRef} volumeRef={audioRefs.volumeRef} isListening={isListening}
          onRecalibrate={handleRecalibrate}
          isAudioMuted={isAudioMuted} setIsAudioMuted={setIsAudioMuted}
          isMetronomeMuted={isMetronomeMuted} setIsMetronomeMuted={setIsMetronomeMuted}
          audioTracks={audioTracks} setTrackConfigs={setTrackConfigs}
          masterVolume={masterVolume} setMasterVolume={setMasterVolume}
          speedMultiplier={speedMultiplier} onSpeedMultiplierChange={handleSpeedMultiplierChange}
          activeTablature={activeTablature} isRiddleRevealed={isRiddleRevealed}
          isRiddleGuessed={isRiddleGuessed} hasPlayedRiddleOnce={hasPlayedRiddleOnce}
          handleNextRiddle={handleNextRiddleClick} handleRevealRiddle={handleRevealRiddle}
          earTrainingScore={earTrainingScore} earTrainingHighScore={earTrainingHighScore}
          onEarTrainingGuessed={handleEarTrainingGuessed}
          riddleProgress={riddleProgress}
        />,
        document.body,
      )}

      <DesktopSessionView
        reportResult={reportResult}
        currentUserStats={currentUserStats} previousUserStats={previousUserStats}
        activityDataToUse={activityDataToUse} router={router}
        handleRestartFullSession={handleRestartFullSession}
        plan={plan} currentExercise={currentExercise} activeExercise={activeExercise}
        category={currentExercise.category || "mixed"}
        currentExerciseIndex={currentExerciseIndex} completedExercises={completedExercises}
        handleExerciseSelect={handleExerciseSelect} isMicEnabled={isMicEnabled}
        allGpTracks={parsedGpTracks} showAlphaTabScore={showAlphaTabScore}
        show3dHighway={show3dHighway} handleToggle3dHighway={toggle3dHighway}
        selectedGpTrackIdx={selectedGpTrackIdx} setSelectedGpTrackIdx={setSelectedGpTrackIdx}
        handleToggleAlphaTabScore={toggleAlphaTabScore}
        effectiveRawGpFile={effectiveRawGpFile} activeTablature={activeTablature}
        isAudioPlaying={isAudioPlaying} metronomeStartTime={metronome.startTime}
        effectiveBpm={effectiveBpm} isAudioMuted={isAudioMuted}
      
        countInRemaining={(metronome as any).countInRemaining ?? 0}
        frequencyRef={audioRefs.frequencyRef} volumeRef={audioRefs.volumeRef}
        isListening={isListening} metronomeAudioContext={metronome.audioContext}
        effectiveAudioStartTime={effectiveAudioStartTime}
        tabResetKey={tabResetKey + tabRestartKey}
        isRiddleRevealed={isRiddleRevealed} isRiddleGuessed={isRiddleGuessed}
        hasPlayedRiddleOnce={hasPlayedRiddleOnce} earTrainingScore={earTrainingScore}
        earTrainingHighScore={earTrainingHighScore}
        handleRevealRiddle={handleRevealRiddle} handleNextRiddle={handleNextRiddleClick}
        handleEarTrainingGuessed={handleEarTrainingGuessed}
        riddleProgress={riddleProgress}
        isPlaying={isPlaying} handleToggleTimer={handleToggleTimer}
        startTimer={startTimer} stopTimer={stopTimer}
        setVideoDuration={setVideoDuration} setTimerTime={setTimerTime}
        handleNextExerciseClick={handleNextExerciseClick}
        onAudioToggle={handleAudioToggle} onMicToggle={handleMicToggle}
        onRecalibrate={handleRecalibrate} speedMultiplier={speedMultiplier}
        handleSpeedMultiplierChange={handleSpeedMultiplierChange}
        metronome={metronome} isMetronomeMuted={isMetronomeMuted}
        setIsMetronomeMuted={setIsMetronomeMuted} audioTracks={audioTracks}
        trackConfigs={trackConfigs} setTrackConfigs={setTrackConfigs}
        backingTrackIds={backingTrackIds}
        masterVolume={masterVolume} setMasterVolume={setMasterVolume}
        examMode={examModeObject} isExamMode={isExamMode} isScaleExam={isScaleExam} exerciseKey={exerciseKey} isLastExercise={isLastExercise}
        handleRestart={handleRestart}
        canFinishSession={canFinishSession} isSkillExercise={isSkillExercise}
        jumpToExercise={jumpToExercise} isFinishing={isFinishing}
        isSubmittingReport={isSubmittingReport}
        onFinishSession={async () => { metronome.stopMetronome(); await saveCurrentScores(); autoSubmitReport(exerciseRecordsRef.current); }}
        onClose={onClose} skipExitDialog={skipExitDialog}
        planHasTablature={planHasTablature} planHasGpFile={planHasGpFile} planHasStrumming={planHasStrumming}
        skillRewardSkillId={skillRewardSkillId} skillRewardAmount={skillRewardAmount}
      />

      <SessionDialogs
        showCompleteDialog={showCompleteDialog} setShowCompleteDialog={setShowCompleteDialog}
        exerciseTitle={currentExercise.title} exerciseDuration={currentExercise.timeInMinutes}
        onFinish={onFinish} handleRestart={handleRestart}
        sessionPhase={sessionPhase} examMode={isExamMode}
        handleEnableMic={handleEnableMic} handleSkipMic={handleSkipMic}
        existingCalibrationTimestamp={existingCalibrationTimestamp}
        handleReuseCalibration={handleReuseCalibration} handleRecalibrate={handleRecalibrate}
        handleCalibrationCancel={handleCalibrationCancel} handleCalibrationComplete={handleCalibrationComplete}
        audioInit={initAudio} audioClose={closeAudio} audioRefs={audioRefs}
        isListening={isListening} inputGain={inputGain} setInputGain={setInputGain}
        isNative={isNative} onSelectDevice={selectDevice}
        exerciseId={activeExercise.id} isMounted={isMounted}
        hasReportResult={!!reportResult} showSuccessView={showSuccessView}
        isLastExercise={isLastExercise}
      />

      <TuningSettingsModal />
    </>
    </SessionUIProvider>
    </BpmProgressProvider>
    </TimerProvider>
    </NoteMatchingProvider>
    </GuitarTuningProvider>
  );
};

