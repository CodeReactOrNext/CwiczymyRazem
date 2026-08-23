import "react-circular-progressbar/dist/styles.css";

import { BackingTrackBar } from "feature/backingTrack/components/BackingTrackBar";
import { useBackingTrackSession } from "feature/backingTrack/hooks/useBackingTrackSession";
import { barBeatsOf } from "feature/backingTrack/utils/alignment";
import { saveLastSession } from "feature/practice/utils/lastSession";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { selectUserAuth,selectUserInfo} from "feature/user/store/userSlice";
import { useGuitarAudioInput } from "hooks/useGuitarAudioInput";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import Head from "next/head";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "store/hooks";

import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import { getCountInDurationMs } from "../../components/Metronome/utils/countInDuration";
import type { ExercisePlan } from "../../types/exercise.types";
import { isClickAnsweredMode } from "../../utils/huntModes";
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
import { CLICK_EXAM_MISTAKE_LIMIT, NoteMatchingProvider } from "./contexts/NoteMatchingContext";
import { SessionUIProvider } from "./contexts/SessionUIContext";
import { TimerProvider, useTimerContext } from "./contexts/TimerContext";
import { withBackingTempo } from "./helpers/backingTempoOverlay";
import { loadGuitarPlaybackPreference } from "./helpers/guitarPlaybackPreference";
import {
  loadGlobalMasterVolume,
  loadGlobalMetronomeVolume,
  loadPracticeSessionSettings,
  saveGlobalMasterVolume,
  saveGlobalMetronomeVolume,
  savePracticeSessionSettings,
} from "./helpers/practiceSessionSettings";
import type { TempoRuler } from "./hooks/tempoBeatClock";
import { createTempoRulerFromMeasures } from "./hooks/tempoBeatClock";
import { useCalibration } from "./hooks/useCalibration";
import { useDesktopSessionIntegration } from "./hooks/useDesktopSessionIntegration";
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
import { useUpdateRequiredGate } from "./hooks/useUpdateRequiredGate";
import SessionModal from "./modals/SessionModal";

/** How long a solved ear-training riddle stays on screen before the next one is dealt. */
const RIDDLE_AUTO_ADVANCE_MS = 1500;

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
  const userId     = useAppSelector(selectUserAuth);
  const isPremium  = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const planHasGpFile = !!rawGpFile || plan.exercises.some(ex => !!ex.gpFileUrl);

  // Desktop-only: a downloaded update sat unapplied too long (see
  // useUpdateRequiredGate). Checked once at session start, never mid-session.
  const updateRequired = useUpdateRequiredGate();

  if (updateRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500 space-y-6 text-center">
          <h1 className="text-xl font-semibold text-zinc-100">Update ready</h1>
          <p className="text-sm text-zinc-400">
            A new version of riff.quest has been ready to install for a while. Restart the app to keep practicing.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => window.electronApp?.installUpdate()}
              className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-cyan-400">
              Restart now
            </button>
            <button onClick={onClose} className="mt-2 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors w-full font-bold capitalize tracking-widest text-[10px]">
              ← Return
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const { effectiveRawGpFile, isFetchingGpFile, parsedGpTracks, gpTempo } = useGpFileLoader({
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
    isAudioMuted, isMetronomeMuted, speedMultiplier, showAlphaTabScore, selectedGpTrackIdx,
    setIsAudioMuted, setIsMetronomeMuted, setSpeedMultiplier, setSelectedGpTrackIdx,
    toggleAlphaTabScore, resetForExercise
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

  /**
   * Tempo curve the click follows, filled in further down once the aligned
   * backing track has been folded into the tablature.
   *
   * A ref breaks a genuine cycle: the metronome owns the session clock, the
   * backing track is positioned against that clock, and the curve comes from the
   * backing track. The scheduler only reads it at tick time, by which point it
   * is set.
   */
  const tempoRulerRef = useRef<TempoRuler | null>(null);

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
    tempoRulerRef,
    onTick:         useCallback(() => { tabTickBridgeRef.current?.(); }, []),
    externalAudioContext: effectiveRawGpFile ? audioSystem.context : undefined,
  });

  // Must NOT be rounded: the metronome schedules its clicks from the exact
  // `bpm * speedMultiplier`, so the tablature audio + visual cursor (which use
  // effectiveBpm) must use the same exact value or they drift apart at non-100%
  // speeds (e.g. 55 × 0.75 = 41.25 vs rounded 41).
  const effectiveBpm           = metronome.bpm * speedMultiplier;
  const isAudioPlaying         = metronome.isPlaying && metronome.countInRemaining === 0 && !!metronome.startTime;

  // ── Aligning a backing track is start-stop-start work ─────────────────────
  //
  // A count-in before every attempt costs more time than the alignment does, and
  // it puts four clicks between the player and the thing they are listening for.
  // Practice keeps its count-in; this transport does not.
  /** True while the backing-track editor covers the session. */
  const [isAligningBacking, setIsAligningBacking] = useState(false);

  const toggleWithoutCountIn = useCallback(() => {
    if (metronome.isPlaying) metronome.stopMetronome();
    else metronome.startMetronome({ skipCountIn: true });
  }, [metronome]);

  /** Clicking the tab in the alignment screen plays from there. Mirrors the
   *  session's own bar-click seek, count-in skipped for the same reason. */
  const handleAlignSeek = useCallback(
    (beat: number) => {
      const at = Math.max(0, beat);
      if (!metronome.isPlaying) {
        metronome.seekToBeats?.(at);
        return;
      }
      if (isExamMode) return;
      metronome.stopMetronome();
      metronome.seekToBeats(at);
      setTimeout(() => metronome.startMetronome({ skipCountIn: true }), 0);
    },
    [metronome, isExamMode],
  );

  // ── Backing track (song practice only) ────────────────────────────────────
  // Owns an <audio> element / YouTube iframe, so it lives here rather than in a
  // view: the desktop and mobile views mount simultaneously, and two copies
  // would play the same recording twice. Idle unless the plan is a song.
  const backingTrack = useBackingTrackSession({
    songId:       plan.song?.id ?? null,
    userId:       userId ?? null,
    gpTempo,
    isPlaying:    isAudioPlaying,
    startTime:    metronome.startTime,
    // The same ruler the metronome schedules against. Elapsed time from
    // `startTime` counts warped beats, so without this the recording chases a
    // bar of the tab that is not the one being played — a whole beat out per
    // bar of automation, growing, and unreachable by any offset.
    scoreClockRef: tempoRulerRef,
    // So Stop leaves the playhead on the spot the next Play will pick up from,
    // instead of throwing it — and the view following it — back to bar 1.
    getResumeBeat: metronome.getResumeBeat,
    effectiveBpm,
    sessionBpm:   metronome.bpm,
  });

  // ── Ear training ──────────────────────────────────────────────────────────

  const {
    riddleMeasures, isRiddleRevealed, isRiddleGuessed, setIsRiddleGuessed,
    earTrainingScore, setEarTrainingScore, earTrainingHighScore,
    hasPlayedRiddleOnce, setHasPlayedRiddleOnce, tabResetKey,
    handleNextRiddle, handleReplayRiddle, handleRevealRiddle,
  } = useEarTraining({ currentExercise, isRiddleSounding: isAudioPlaying, restartMetronome: metronome.restartMetronome, startMetronome: metronome.startMetronome, currentBpm: metronome.bpm, setBpm: metronome.setBpm });

  // Ear-training riddles have their own untimed matcher (useRiddleSequenceMatcher
  // below) that ignores wrong notes — the generic tempo-locked note matching
  // must stay out of it, or it silently scores the melody's own demo playback
  // (and any free-form listening) as missed notes before the player ever guesses.
  const isEarTrainingRiddle = currentExercise.riddleConfig?.mode === "sequenceRepeat";

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
      // Exams and ear-training riddles never expose the notation toggle (see
      // DesktopSessionView), but force it off here too in case it was left on by an
      // earlier exercise in the same session — or by the global default-view setting.
      // Notation is fatal to a riddle: it hands its synth to AlphaTab, which has no GP
      // file to play here, so the melody never sounds and the answer matcher (which
      // waits for the melody) never arms.
      ...(isExamMode || isEarTrainingRiddle ? { showAlphaTabScore: false } : {}),
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

  const rawTablature = riddleMeasures
    || (parsedGpTracks ? parsedGpTracks[selectedGpTrackIdx]?.measures : undefined)
    || activeExercise.tablature;

  /**
   * The recording's tempo curve, one step behind the hand that is dragging it.
   *
   * Dragging a bar line on the Align screen rewrites this on every pointer move,
   * and everything below re-walks the whole song when it does: the measures are
   * re-stamped, the ruler is rebuilt, the audio's track configs are rebuilt and
   * the notation's alphaTex is regenerated. At sixty pointer moves a second that
   * is not a slow session, it is a frozen one.
   *
   * None of that work is wanted *during* the gesture — only at the end of it.
   * Deferring lets React render the drag at full rate against the curve it
   * already had, and do the expensive re-derivation once the values stop
   * changing. The Align screen's own lanes read the live map, so the grid still
   * follows the pointer exactly.
   */
  const settledTempoMap = useDeferredValue(backingTrack.tempoMap);

  /**
   * The tablature the session actually plays, with the aligned recording's tempo
   * curve stamped onto it.
   *
   * Everything downstream — the cursor, the note matcher, the tab's own audio —
   * already reads per-measure tempo, so bending the band's drift into the
   * measures here is what makes the whole session follow a recording that was
   * never played to a click. Without an aligned backing track this is the same
   * array it was, identity included.
   */
  const activeTablature = useMemo(
    () =>
      withBackingTempo(
        rawTablature,
        settledTempoMap.isConstant
          ? null
          : (beat: number) => settledTempoMap.ratioAtBeat(beat),
      ),
    [rawTablature, settledTempoMap],
  );

  // Same curve the cursor reads, in the form the click's scheduler needs.
  const sessionTempoRuler = useMemo(
    () => createTempoRulerFromMeasures(activeTablature),
    [activeTablature],
  );
  useEffect(() => {
    tempoRulerRef.current = sessionTempoRuler.isConstant ? null : sessionTempoRuler;
  }, [sessionTempoRuler]);

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
    autoStopAfterFirstLoop: isEarTrainingRiddle,
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

  /**
   * One instrument level, changed from the alignment screen's mixer.
   *
   * A track that has never been touched has no entry in `trackConfigs` at all —
   * its level lives in the defaults `audioTracks` fills in. Writing only the
   * field that changed would therefore save an `isMuted` next to an undefined
   * volume, so the current effective value is read back for the other half.
   */
  const handleMixerChange = useCallback(
    (id: string, next: { volume?: number; isMuted?: boolean }) => {
      const current = audioTracks.find(track => track.id === id);
      setTrackConfigs(prev => ({
        ...prev,
        [id]: {
          volume:  next.volume  ?? prev[id]?.volume  ?? current?.volume  ?? 1,
          isMuted: next.isMuted ?? prev[id]?.isMuted ?? current?.isMuted ?? false,
        },
      }));
    },
    [audioTracks, setTrackConfigs],
  );

  useEffect(() => { setAudioSystem(prev => ({ ...prev, isActive: gpAudioActive })); }, [gpAudioActive]);
  tabTickBridgeRef.current = () => tabSchedulerTickRef.current?.();

  // ── Calibration + mic ─────────────────────────────────────────────────────

  const { isListening, init: initAudio, close: closeAudio, audioRefs, getLatencyMs, inputGain, setInputGain, isNative, selectDevice, selectChannel } = useGuitarAudioInput();

  const {
    sessionPhase, isMicEnabled: _isMicEnabled, handleEnableMic, handleSkipMic,
    handleReuseCalibration, handleRecalibrate, handleCalibrationComplete, handleCalibrationCancel,
    getAdjustedTargetFreq, existingCalibrationTimestamp, setIsMicEnabled: updateMicPersistence, setSessionPhase,
  } = useCalibration(planHasTablature);

  // disableMic marks exercises with nothing to detect (click drills, improv
  // prompts, backing-track jams). It has to gate the mic HERE, not just the mic
  // controls in SessionModal/DesktopSessionView — the mic preference is global
  // (mic_tracking_enabled in localStorage), so once enabled anywhere it would
  // otherwise open a real getUserMedia stream in every exercise, guitar or not.
  const isMicEnabled = _isMicEnabled && !currentExercise.isPlayalong && !currentExercise.disableMic;
  // Click-answered hunts are scored from mouse clicks, so their snapshot is a
  // real performance worth reporting even though the mic never opens
  // (useScoreSaving persists them on its own click branch). Everything else only
  // has a snapshot worth submitting when the mic was actually listening.
  const hasTrackedPerformance = isMicEnabled || isClickAnsweredMode(currentExercise.noteHuntConfig?.mode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isExamMode && !_isMicEnabled && !currentExercise.disableMic) setSessionPhase("mic_prompt"); }, []);
  // No cleanup here used to mean React StrictMode's dev-only double-invoke
  // (mount → cleanup → mount, meant to catch exactly this class of bug) had
  // nothing to undo between its two invocations — both ran initAudio() with
  // isListening still false in both closures, so BOTH opened a real native
  // stream and BOTH registered their own native.onFrame listener. Since those
  // listeners write into the SAME shared windowBufRef/windowPosRef/processRef
  // (one useNativeAudioAnalyzer instance, not two), every captured block then
  // got appended into the analysis window twice — corrupting every 2048-sample
  // window aubio ever saw. The cleanup makes the dance start→stop→start
  // (closeAudio is idempotent — safe even if the corresponding initAudio
  // hadn't opened anything yet) instead of start→start, so only the second
  // invocation's stream ends up live.
  //
  // isListening is deliberately not a dependency: it's read as a guard, not a
  // trigger — adding it would re-run this effect (cleanup first) the instant
  // initAudio() flips it to true, immediately closing the stream that was just
  // opened. initAudio/closeAudio are stable (useCallback, see useAudioAnalyzer
  // / useNativeAudioAnalyzer) so omitting them changes nothing.
  useEffect(() => {
    if (isMicEnabled && !isListening) initAudio();
    return () => { closeAudio(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMicEnabled]);

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
  const { target: huntTarget, secondsLeft: noteHuntSecondsLeft, advance: advanceHunt } = useNoteHuntRotation(currentExercise, isPlaying, huntSolvedRef, isExamMode);
  const noteMatchingHandle = useRef<NoteMatchingHandle | null>(null);
  const [successSnapshot, setSuccessSnapshot] = useState<NoteMatchingSnapshot | null>(null);
  useEffect(() => { if (showSuccessView) setSuccessSnapshot(noteMatchingHandle.current?.snapshot() ?? null); }, [showSuccessView]);
  // Set by the click-hunt mistake-limit fail path below — shows the same
  // success/fail modal as a normal exam finish, forced into its failed state,
  // instead of redirecting away before the player sees why they failed.
  const [examMistakeFailed, setExamMistakeFailed] = useState(false);

  // ── Score saving ──────────────────────────────────────────────────────────

  const { saveCurrentScores, exerciseRecordsRef } = useScoreSaving({
    activeExercise, currentExercise, isMicEnabled, earTrainingScore, noteMatchingHandle,
  });

  // Exam mode, hunt exercises only (customGoal set — there's no tablature to
  // "finish" by playing through it): auto-run the same finish sequence the
  // manual Finish button uses, the moment the exercise's own timer
  // (Exercise.timeInMinutes) runs out — a real "beat the clock" exam instead of
  // requiring the player to press Finish themselves.
  const examAutoFinishedRef = useRef(false);
  useEffect(() => {
    if (!showSuccessView || !isExamMode || !currentExercise.customGoal) return;
    if (examAutoFinishedRef.current) return;
    examAutoFinishedRef.current = true;
    (async () => {
      const snap = noteMatchingHandle.current?.snapshot();
      metronome.stopMetronome();
      await saveCurrentScores();
      autoSubmitReport(
        exerciseRecordsRef.current,
        hasTrackedPerformance && snap ? { score: snap.score, accuracy: snap.accuracy } : null,
        null,
      );
      onExamComplete?.(snap?.accuracy ?? 0);
    })();
    // Intentionally narrow deps — this should fire exactly once per showSuccessView
    // transition, not re-run when metronome/save/report identities change each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessView, isExamMode, currentExercise.customGoal]);

  // Dev-only shortcut: skip waiting for the exam timer and run the exact same
  // finish sequence right now, with whatever score/accuracy has been racked up
  // so far — lets us test the pass/stars/journey-completion flow without
  // playing out the full exam duration.
  const handleDevCompleteExam = useCallback(async () => {
    if (examAutoFinishedRef.current) return;
    examAutoFinishedRef.current = true;
    const snap = noteMatchingHandle.current?.snapshot();
    metronome.stopMetronome();
    stopTimer();
    await saveCurrentScores();
    // Force a clean pass (100%) regardless of actual progress — this is a
    // "skip to the end and pass" dev shortcut, not a snapshot of real play.
    autoSubmitReport(
      exerciseRecordsRef.current,
      hasTrackedPerformance && snap ? { score: snap.maxPossibleScore, accuracy: 100 } : null,
      null,
    );
    onExamComplete?.(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exam mode, click hunts only: 3 wrong clicks ends the exam immediately as a
  // failure instead of just diluting accuracy (see NoteMatchingProvider's
  // mistake-tracking effect, which calls this once the limit is hit). Freezes
  // the session and shows the same success/fail modal as a normal finish,
  // forced into its failed state — score saving, report submission, and
  // navigation only happen once the player acknowledges the modal, instead of
  // silently redirecting away before they see why they failed.
  const handleExamMistakeFail = useCallback(() => {
    if (examAutoFinishedRef.current) return;
    examAutoFinishedRef.current = true;
    metronome.stopMetronome();
    stopTimer();
    setSuccessSnapshot(noteMatchingHandle.current?.snapshot() ?? null);
    setExamMistakeFailed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Controls & handlers ───────────────────────────────────────────────────

  const {
    handleToggleTimer, handleRestart, handleRestartFullSession, handleSpeedMultiplierChange,
    handleNextExerciseClick, handleMicToggle, handleAudioToggle,
    handleExerciseSelect, handleEarTrainingGuessed, handleNoteMatchingReset,
  } = useSessionControls({
    shortcutsDisabled: isAligningBacking,
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

  const riddleAutoAdvanceRef = useRef<number | null>(null);
  const cancelRiddleAutoAdvance = useCallback(() => {
    if (riddleAutoAdvanceRef.current === null) return;
    window.clearTimeout(riddleAutoAdvanceRef.current);
    riddleAutoAdvanceRef.current = null;
  }, []);
  // Leaving the exercise (or the session) must not deal a riddle into a screen
  // that has moved on.
  useEffect(() => cancelRiddleAutoAdvance, [currentExercise.id, cancelRiddleAutoAdvance]);

  // Next riddle auto-plays its melody; if the player answered while stopped
  // (mic flow), restart the timer too so the Play/Stop button and the answer
  // matcher stay consistent with the audible playback.
  const handleNextRiddleClick = useCallback(() => {
    cancelRiddleAutoAdvance();
    if (!isPlaying) startTimer();
    handleNextRiddle();
  }, [cancelRiddleAutoAdvance, isPlaying, startTimer, handleNextRiddle]);

  // Ear training gets its own Play/Stop instead of the session's toggle, which
  // resumes the metronome at the offset the last stop left behind: a player who
  // stopped the moment they had heard enough would get the tail of the phrase back,
  // not the phrase. Here Play always means "play it again from the first note".
  const handlePlayRiddle = useCallback(() => {
    cancelRiddleAutoAdvance();
    if (isPlaying || metronome.isPlaying) { stopTimer(); metronome.stopMetronome(); return; }
    startTimer();
    handleReplayRiddle();
  }, [cancelRiddleAutoAdvance, isPlaying, metronome, stopTimer, startTimer, handleReplayRiddle]);

  // The mic heard the whole answer, so nothing is left for the player to click:
  // bank the point, hold the green state long enough to read, then deal and play
  // the next phrase. Only this path auto-advances — a player who pressed "Stuck?
  // Reveal" wants to study the tab, not watch it disappear.
  const handleRiddleMatched = useCallback(() => {
    handleEarTrainingGuessed();
    cancelRiddleAutoAdvance();
    riddleAutoAdvanceRef.current = window.setTimeout(() => {
      riddleAutoAdvanceRef.current = null;
      handleNextRiddleClick();
    }, RIDDLE_AUTO_ADVANCE_MS);
  }, [handleEarTrainingGuessed, cancelRiddleAutoAdvance, handleNextRiddleClick]);

  // Armed only while playback is fully stopped — otherwise the mic would hear
  // the riddle itself coming from the speakers and solve it on its own.
  const riddleProgress = useRiddleSequenceMatcher({
    measures: riddleMeasures,
    active: isMicEnabled && isListening && hasPlayedRiddleOnce && !isRiddleRevealed && !isPlaying && !metronome.isPlaying,
    frequencyRef: audioRefs.frequencyRef,
    volumeRef: audioRefs.volumeRef,
    tuningOffsets: guitarTuning.tuning.offsets,
    onComplete: handleRiddleMatched,
  });

  // ── Misc effects ──────────────────────────────────────────────────────────

  // Electron shell: keep the display awake + taskbar progress (web: no-op).
  useDesktopSessionIntegration({
    timer,
    durationInSeconds: videoDuration !== null ? videoDuration : (activeExercise.timeInMinutes || 0) * 60,
    freeMode,
  });

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
      effectiveBpm={effectiveBpm} rawBpm={metronome.bpm}
      activeTablature={isEarTrainingRiddle ? undefined : activeTablature}
      isMicEnabled={isMicEnabled} currentExerciseIndex={currentExerciseIndex}
      speedMultiplier={speedMultiplier} getLatencyMs={getLatencyMs} audioRefs={audioRefs}
      getAdjustedTargetFreq={getAdjustedTargetFreq} tuningOffsets={guitarTuning.tuning.offsets}
      activeStrumPattern={activeStrumPattern}
      customGoal={huntTarget ? huntTarget.goal : currentExercise.customGoal}
      customGoalRegion={huntTarget ? huntTarget.region : currentExercise.customGoalRegion}
      customGoalPrompt={huntTarget ? huntTarget.prompt : currentExercise.customGoalPrompt}
      customGoalStrings={currentExercise.customGoalStrings}
      noteHuntMode={currentExercise.noteHuntConfig?.mode}
      noteHuntSecondsLeft={noteHuntSecondsLeft}
      solvedRef={huntSolvedRef}
      onAdvanceHunt={advanceHunt}
      onEnableMic={handleMicToggle}
      onReset={handleNoteMatchingReset}
      isExamMode={isExamMode}
      onExamFail={handleExamMistakeFail}
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

      {(showSuccessView || examMistakeFailed) && !reportResult && successSnapshot && (
        <ExerciseSuccessView
          planTitle={planTitleString} examMode={isExamMode}
          score={examMistakeFailed ? 0 : successSnapshot.score} maxScore={successSnapshot.maxPossibleScore}
          stats={{ accuracy: examMistakeFailed ? 0 : successSnapshot.accuracy, maxStreak: successSnapshot.maxCombo }}
          timeline={successSnapshot.noteTimeline}
          failMessage={examMistakeFailed ? `${CLICK_EXAM_MISTAKE_LIMIT} wrong clicks — exam failed.` : undefined}
          onFinish={async () => {
            metronome.stopMetronome(); await saveCurrentScores();
            autoSubmitReport(exerciseRecordsRef.current,
              hasTrackedPerformance && !isEarTrainingRiddle ? { score: examMistakeFailed ? 0 : successSnapshot.score, accuracy: examMistakeFailed ? 0 : successSnapshot.accuracy } : null,
              isEarTrainingRiddle ? { score: earTrainingScore } : null);
            if (isExamMode) onExamComplete?.(examMistakeFailed ? 0 : successSnapshot.accuracy);
          }}
          onRestart={examMistakeFailed ? undefined : () => {
            examAutoFinishedRef.current = false;
            const usesMetronome = !!currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat";
            resetSuccessView(); resetTimer(); metronome.restartMetronome();
            // Hold the timer for the count-in — it must not eat practice time.
            startTimer(usesMetronome ? getCountInDurationMs(metronome.accentPattern?.length ?? 4, effectiveBpm) : 0);
            if (usesMetronome) metronome.startMetronome();
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
              hasTrackedPerformance && !isEarTrainingRiddle && snap ? { score: snap.score, accuracy: snap.accuracy } : null,
              isEarTrainingRiddle ? { score: earTrainingScore } : null);
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
          riddleProgress={riddleProgress} onPlayRiddle={handlePlayRiddle}
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
        selectedGpTrackIdx={selectedGpTrackIdx} setSelectedGpTrackIdx={setSelectedGpTrackIdx}
        handleToggleAlphaTabScore={toggleAlphaTabScore}
        effectiveRawGpFile={effectiveRawGpFile} activeTablature={activeTablature}
        isAudioPlaying={isAudioPlaying} metronomeStartTime={metronome.startTime}
        effectiveBpm={effectiveBpm} isAudioMuted={isAudioMuted}
        backingTrackSlot={backingTrack.enabled ? (
          <BackingTrackBar
            controller={backingTrack}
            sessionBpm={metronome.bpm}
            isPlaying={metronome.isPlaying}
            onTogglePlay={toggleWithoutCountIn}
            onSeekToBeat={handleAlignSeek}
            onAligningChange={setIsAligningBacking}
            onSessionBpmChange={isExamMode ? undefined : metronome.setBpm}
            beatsPerBar={barBeatsOf(activeTablature, metronome.accentPattern?.length ?? 4)}
            measures={activeTablature}
            mixerTracks={audioTracks}
            onMixerChange={handleMixerChange}
          />
        ) : undefined}
        backingCinema={backingTrack.isCinema}
        backingAligning={isAligningBacking}
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
        riddleProgress={riddleProgress} onPlayRiddle={handlePlayRiddle}
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
        onDevPassExam={process.env.NODE_ENV !== "production" && isExamMode && currentExercise.customGoal ? handleDevCompleteExam : undefined}
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
        isNative={isNative} onSelectDevice={selectDevice} onSelectChannel={selectChannel}
        exerciseId={activeExercise.id} isMounted={isMounted}
        hasReportResult={!!reportResult} showSuccessView={showSuccessView}
        isLastExercise={isLastExercise}
      />

      {/* Dev-only shortcut for exams with no hunt panel to host the button —
          scale-tree exams and record runs, where the only way to finish is to
          play the thing out. Passes at 100% and at whatever tempo the run is
          locked to, so record runs save a record from here too. */}
      {process.env.NODE_ENV !== "production" && isExamMode && !currentExercise.customGoal && isMounted && createPortal(
        <button
          type="button"
          onClick={handleDevCompleteExam}
          title="Dev-only: ends the exam right now and runs the normal finish flow"
          className="fixed bottom-4 left-4 z-[999999999] inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 backdrop-blur-md transition-colors hover:bg-emerald-500/20">
          🏁 Pass exam{lockedExamBpm ? ` @ ${lockedExamBpm} BPM` : ""} (dev)
        </button>,
        document.body,
      )}

      <TuningSettingsModal />
    </>
    </SessionUIProvider>
    </BpmProgressProvider>
    </TimerProvider>
    </NoteMatchingProvider>
    </GuitarTuningProvider>
  );
};

