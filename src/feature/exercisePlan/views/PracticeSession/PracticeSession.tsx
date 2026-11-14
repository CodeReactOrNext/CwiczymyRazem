import "react-circular-progressbar/dist/styles.css";

import type { BossScore } from "feature/autoBacking/bossBacking";
import { useAutoBacking } from "feature/autoBacking/hooks/useAutoBacking";
import { useAutoBackingStore } from "feature/autoBacking/store/autoBackingStore";
import { BackingTrackBar } from "feature/backingTrack/components/BackingTrackBar";
import { useBackingTrackSession } from "feature/backingTrack/hooks/useBackingTrackSession";
import { barBeatsOf } from "feature/backingTrack/utils/alignment";
import { getBackingTrackStatus } from "feature/backingTrack/utils/backingTrackStatus";
import { useLocalizedPlan } from "feature/exercisePlan/hooks/useLocalizedExercises";
import { saveLastSession } from "feature/practice/utils/lastSession";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { useInstrumentPreferenceStore } from "feature/tuner/store/instrumentPreferenceStore";
import { useSessionTunerStore } from "feature/tuner/store/sessionTunerStore";
import { selectUserAuth,selectUserInfo} from "feature/user/store/userSlice";
import { useGuitarAudioInput } from "hooks/useGuitarAudioInput";
import { useMediaQuery } from "hooks/useMediaQuery";
import { useTranslation } from "hooks/useTranslation";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import { useSuppressUiSounds } from "lib/uiSounds/uiSounds";
import Head from "next/head";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { Instrument } from "utils/audio/tunings";

import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import { DEFAULT_ACCENT_PATTERN, stepsPerBeat } from "../../components/Metronome/utils/accentPattern";
import { getCountInDurationMs } from "../../components/Metronome/utils/countInDuration";
import { deriveMetronomeGrid } from "../../components/Metronome/utils/meterGrid";
import type { ExercisePlan } from "../../types/exercise.types";
import { hasLeaderboard } from "../../utils/hasLeaderboard";
import { isClickAnsweredMode } from "../../utils/huntModes";
import { SONG_TAB_METRONOME_SPEED } from "../../utils/songToExercise";
import { DesktopSessionView } from "./components/DesktopSessionView";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { GeneratedExerciseDialogs } from "./components/GeneratedExerciseDialogs";
import { GpLoadingOverlay } from "./components/GpLoadingOverlay";
import { OutputStalledNotice } from "./components/OutputStalledNotice";
import { PracticeLoadingScreen } from "./components/PracticeLoadingScreen";
import { SessionDialogs } from "./components/SessionDialogs";
import { gpLoadingSteps, isStillLoading } from "./components/SessionLoadingSteps";
import { SongSectionMapPanel } from "./components/SongSectionMapPanel";
import { useTablatureSettings } from "./components/tablatureSettings";
import { TimingCalibrationDialog } from "./components/TimingCalibrationDialog";
import { TuningSettingsModal } from "./components/TuningSettingsModal";
import { TurnedScreen } from "./components/TurnedScreen";
import { BossFightControlsProvider } from "./contexts/BossFightControlsContext";
import { BpmProgressProvider } from "./contexts/BpmProgressContext";
import { GuitarTuningProvider } from "./contexts/GuitarTuningContext";
import type { NoteMatchingHandle, NoteMatchingSnapshot } from "./contexts/NoteMatchingContext";
import { CLICK_EXAM_MISTAKE_LIMIT, NoteMatchingProvider } from "./contexts/NoteMatchingContext";
import { SessionUIProvider } from "./contexts/SessionUIContext";
import { TabOverlayProvider } from "./contexts/TabOverlayContext";
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
import { strumSynthVolume } from "./helpers/strumSynthVolume";
import { useTabPlayUntilStore } from "./hooks/tabPlayUntilStore";
import type { TempoRuler } from "./hooks/tempoBeatClock";
import { createTempoRulerFromMeasures } from "./hooks/tempoBeatClock";
import { useBossFightSession } from "./hooks/useBossFightSession";
import { useCalibration } from "./hooks/useCalibration";
import { useDesktopSessionIntegration } from "./hooks/useDesktopSessionIntegration";
import { useEarTraining } from "./hooks/useEarTraining";
import { useGeneratedExercise, willHaveTablature } from "./hooks/useGeneratedExercise";
import { useGoalRunVerdict } from "./hooks/useGoalRunVerdict";
import { useGpFileLoader } from "./hooks/useGpFileLoader";
import { useGuitarTuning } from "./hooks/useGuitarTuning";
import type { LearnModeState } from "./hooks/useLearnModeMatcher";
import { useLearnModeMatcher } from "./hooks/useLearnModeMatcher";
import { useNoteHuntRotation } from "./hooks/useNoteHuntRotation";
import type { NoteJudgement } from "./hooks/useNoteMatching";
import { usePlaybackLeakGuard } from "./hooks/usePlaybackLeakGuard";
import { usePlaybackReducer } from "./hooks/usePlaybackReducer";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import { useRiddleSequenceMatcher } from "./hooks/useRiddleSequenceMatcher";
import { useScoreSaving } from "./hooks/useScoreSaving";
import { useSessionAudio } from "./hooks/useSessionAudio";
import { useSessionControls } from "./hooks/useSessionControls";
import { useSongExerciseGpFile } from "./hooks/useSongExerciseGpFile";
import { timingInputPath, useTimingCalibration } from "./hooks/useTimingCalibration";
import { useUpdateRequiredGate } from "./hooks/useUpdateRequiredGate";
import SessionModal from "./modals/SessionModal";
import type { FreePlayFrame } from "./utils/freePlay";
import { buildLearnSteps } from "./utils/learnSteps";
import { shiftTabPitch } from "./utils/shiftTabPitch";
import { tabPlayUntil } from "./utils/tabPlayUntil";
import type { TimingPrecision } from "./utils/timingPrecision";

/** How long a solved ear-training riddle stays on screen before the next one is dealt. */
const RIDDLE_AUTO_ADVANCE_MS = 1500;
/** Kill switch for usePlaybackLeakGuard: off, no probe chirp, no pilot tone,
 *  no toast, and no run is kept off the boards for playback leaking into the mic. */
const PLAYBACK_LEAK_GUARD_ENABLED = false;

// ── Props ─────────────────────────────────────────────────────────────────────

/** What a goal-mode run hands back once it has been played to the end. */
export interface GoalRunResult {
  /** The slowest tempo a note was scored at — the tempo the run earned. Null
   *  when nothing was scored (mic off, or not a note landed). */
  bpm: number | null;
  accuracy: number;
  /** How tightly the run sat on the beat; null when too few notes were timed. */
  timing: TimingPrecision | null;
}

/**
 * Goal mode: a single exercise, every run played to the end judged against a
 * goal the player set. The tempo is not locked — the metronome only starts at
 * the goal's — because a run counts at whatever tempo it was really played.
 */
export interface GoalRunConfig {
  /** The tempo of the milestone being played for. When it changes (a milestone
   *  was cleared) the metronome moves to it for the next run. */
  targetBpm: number;
  /** Called once per run played to the end; resolves to what the run summary
   *  shows about the goal. */
  onRunComplete: (run: GoalRunResult) => Promise<ReactNode>;
  /** Shown in the summary while onRunComplete is still saving. */
  pendingContent?: ReactNode;
  /** Names the run above the summary's title, in place of "Congratulations!". */
  summaryEyebrow?: string;
}

/** The session's audio clock, for a game mode's own sounds to land on its beats. */
export interface SessionAudioClock {
  /** The context the metronome and the backing play on. */
  context: AudioContext;
  /** Audio time of the run's first beat; null while the run isn't playing. */
  startTime: number | null;
  bpm: number;
  /** The session's master volume, 0–1. */
  volume: number;
}

/**
 * Boss mode: the exercise is one level of a boss fight. The tempo is locked as
 * in an exam, the clock runs untimed, and the fight — fed every judged note —
 * decides when the run is over.
 */
export interface BossFightConfig {
  /** The tempo of the phase being fought. */
  bpm: number;
  /** The phase being fought, from 1 — the backing's score follows it. */
  phase: number;
  /** The score the backing plays: the battle's, or a band to solo over. */
  score: BossScore;
  /** The boss is enraged (low on its phase's HP): the backing plays harder. */
  enraged: boolean;
  /** Above the tab, in place of the exercise's goals. Display only: the
   *  desktop and phone views both mount it. */
  arena: ReactNode;
  /** The same for the phone's smaller layout. */
  compactArena?: ReactNode;
  onNoteJudged: (judgement: NoteJudgement) => void;
  /** The run's clock and every attack — a fight judged without a tab to match. */
  onFreePlay?: (frame: FreePlayFrame) => void;
  /** The session's audio clock for the fight's sounds, whenever it changes; null once it goes. */
  onAudioClock?: (clock: SessionAudioClock | null) => void;
  /** Deals a fresh fight — BossFightSessionControls.restart calls it before it
   *  restarts the run. A plain restart (R) keeps the fight going. */
  onNewRun: () => void;
  /** The fight is decided: the clock stops and the overlay takes over. */
  isOver: boolean;
  /** The fight holds the run — the boss changing phase. It resumes through
   *  BossFightSessionControls.resume. */
  isHolding: boolean;
  /** Rendered once over the session; reads the session's controls through
   *  useBossFightControls. */
  overlay: ReactNode;
  /** Laid over the tab itself (desktop and phone) — display only. */
  tabOverlay?: ReactNode;
}

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
  /** `onTimePct`: share of the run's timed notes that were on time, null where
   *  timing isn't judged — see accuracyToStars. */
  onExamComplete?:     (accuracy: number, onTimePct?: number | null) => void;
  skipExitDialog?:     boolean;
  goalRun?:            GoalRunConfig;
  bossFight?:          BossFightConfig;
  /**
   * The mic question was answered before the session: "setup" opens on the
   * setup wizard (always, also with the mic set up before), "off" starts
   * without the mic. Either way the "use the mic?"
   * prompt is skipped.
   */
  micStart?:           "setup" | "off";
}

const SessionPageHead = ({ exerciseTitle }: { exerciseTitle: string }) => {
  const { formattedTimeLeft } = useTimerContext();
  return <Head><title>{formattedTimeLeft} | {exerciseTitle}</title></Head>;
};

// ── Component ─────────────────────────────────────────────────────────────────

const PracticeSessionInner = ({
  plan, rawGpFile, onFinish, onClose, isFinishing, autoReport,
  forceFullDuration, freeMode: freeModeProp, skillRewardSkillId, skillRewardAmount,
  examMode: examModeProp, examBpm, onExamComplete, skipExitDialog = false, goalRun, bossFight,
  micStart,
}: PracticeSessionProps) => {
  const { t } = useTranslation("session");
  // A boss level runs as an exam at the level's tempo (locked tempo, mic on,
  // no learn mode), untimed — the fight, not the clock, ends it.
  const examMode = examModeProp ?? (bossFight ? { requiredBpm: bossFight.bpm } : undefined);
  const freeMode = freeModeProp || !!bossFight;
  const router = useRouter();

  const {
    currentExerciseIndex, exerciseKey, showCompleteDialog, isMobileView,
    isFullSessionModalOpen, isMounted, currentExercise: planExercise,
    isLastExercise, setShowCompleteDialog, handleNextExercise,
    startTimer, stopTimer, resetTimer, showSuccessView, resetSuccessView,
    videoDuration, setVideoDuration, setTabDuration, setTimerTime, autoSubmitReport,
    isSubmittingReport, reportResult, currentUserStats, previousUserStats,
    planTitleString,  timer, activityDataToUse,
    jumpToExercise,  canFinishSession, hasLoggedPractice,
    completedExercises, restartFullSession,
  } = usePracticeSessionState({ plan, onFinish, autoReport, forceFullDuration, freeMode, skillRewardSkillId, skillRewardAmount });
  // The upright phone, where PhoneSessionModal lays the practice screen on its
  // side: the run summary and the session summary that follow it lie the same way.
  const isUprightScreen = useMediaQuery("(orientation: portrait)");
  const isUprightPhone = isMobileView && isUprightScreen;
  // UI chimes stay silent for as long as the session can be listening to the
  // guitar; the summary (reportResult) is the first moment they may play.
  useSuppressUiSounds(!reportResult);

  const isPlaying = timer.timerEnabled;
  const isExamMode = typeof examMode === 'boolean' ? examMode : !!examMode;
  const isGoalMode = !!goalRun;
  // A take of the guild's recording session, as opposed to a rehearsal of it.
  const isRecordingTake = !!plan.recording && !plan.recording.rehearsal;
  const examModeObject = typeof examMode === 'object' ? examMode : undefined;
  // In exam mode the metronome tempo is fixed: lock min === max === bpm so it
  // can't be changed (slider/±/edit all clamp to this single value).
  const lockedExamBpm = examModeObject ? examModeObject.requiredBpm : (isExamMode ? examBpm : undefined);
  // Scale (theory) exams keep the metronome and backing-track controls visible —
  // unlike regular exercise exams, the metronome is the audible guide here.
  const isScaleExam = isExamMode && planExercise.category === "theory";

  const userInfo   = useAppSelector(selectUserInfo);
  const userId     = useAppSelector(selectUserAuth);
  const isPremium  = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const planHasGpFile = !!rawGpFile || plan.exercises.some(ex => !!ex.gpFileUrl);

  // Desktop-only: a downloaded update sat unapplied too long (see
  // useUpdateRequiredGate). Checked once at session start, never mid-session.
  const updateRequired = useUpdateRequiredGate();
  // Read up here, above the early returns; picked per input path once it is known.
  const timingByPath = useTimingCalibration((s) => s.byPath);

  if (updateRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-lg animate-in fade-in zoom-in duration-slow space-y-6 text-center">
          <h1 className="text-xl font-semibold text-zinc-100">{t("update.title")}</h1>
          <p className="text-sm text-zinc-400">
            {t("update.body")}
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => window.electronApp?.installUpdate()}
              className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-cyan-400">
              {t("update.restart")}
            </button>
            <button onClick={onClose} className="mt-2 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors w-full font-bold capitalize tracking-widest text-[10px]">
              ← {t("update.return")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (planHasGpFile && !isPremium) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-lg animate-in fade-in zoom-in duration-slow">
          <PremiumGate feature="gp-practice" children={<div />} />
          <button onClick={() => router.back()} className="mt-8 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors w-full font-bold capitalize tracking-widest text-[10px]">
            ← {t("update.return")}
          </button>
        </div>
      </div>
    );
  }

  // ── GP file loading ───────────────────────────────────────────────────────

  // A song placed in the routine is practised either over the Guitar Pro file
  // the player attached to it — the same tab its own practice page would open,
  // backing track included — or over its section map (video + sections), which
  // wants neither the tab nor the backing recording behind it.
  const songItem = planExercise.songData;
  const songItemOverSections = songItem?.mode === "sections";
  const songItemTabId = songItem && !songItemOverSections ? songItem.songId : undefined;
  const songGpFile = useSongExerciseGpFile(songItemTabId, userId ?? null);
  const gpFileUrl = planExercise.gpFileUrl ?? songGpFile.gpFileUrl;

  const { effectiveRawGpFile, isFetchingGpFile, isParsingGpFile, parsedGpTracks, gpTempo } = useGpFileLoader({
    rawGpFile, gpFileUrl, exerciseTitle: planExercise.title,
  });

  // A song item carries no tempo of its own (see songToExercise), and Play only
  // runs the transport for exercises that have one — so with a tab attached the
  // clock ran while the tab stood still. The tab brings the tempo range the
  // song's own practice page gives it. Held from the lookup on, so the tempo
  // saved for the song is not reset when the file arrives.
  const songItemHasTab = !!songItemTabId && (songGpFile.isResolving || !!songGpFile.gpFileUrl);
  const currentExercise = useMemo(
    () => (songItemHasTab && !planExercise.metronomeSpeed
      ? { ...planExercise, metronomeSpeed: SONG_TAB_METRONOME_SPEED }
      : planExercise),
    [planExercise, songItemHasTab],
  );

  useEffect(() => {
    posthog.capture("practice_session_started", { plan_title: plan.title, exercise_count: plan.exercises.length });
    // Feed the "Last Session" shortcuts (dashboard + practice hub). Exams and
    // goal runs are deliberately excluded — re-entering either is not
    // "practicing again", and a reached goal's link would lead nowhere. So is
    // the onboarding's first riff: its way out leads back into the onboarding.
    if (!isExamMode && !isGoalMode && !router.pathname.startsWith("/onboarding")) {
      saveLastSession({ title: planTitleString, href: router.asPath });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Playback settings (Reducer) ──────────────────────────────────────────

  const {
    isAudioMuted, isMetronomeMuted, speedMultiplier, showAlphaTabScore, selectedGpTrackIdx,
    setIsAudioMuted, setIsMetronomeMuted, setSpeedMultiplier, setSelectedGpTrackIdx,
    setShowAlphaTabScore, toggleAlphaTabScore, resetForExercise
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

  // A goal may sit outside the exercise's own range, so goal mode widens the
  // range to reach it instead of clamping the starting tempo back inside.
  const goalBpm = goalRun?.targetBpm;
  const exerciseMinBpm = activeExercise.metronomeSpeed?.min;
  const exerciseMaxBpm = activeExercise.metronomeSpeed?.max;
  const metronome = useDeviceMetronome({
    initialBpm:     lockedExamBpm ?? goalBpm ?? (activeExercise.metronomeSpeed?.recommended || 60),
    minBpm:         lockedExamBpm ?? (goalBpm && exerciseMinBpm !== undefined ? Math.min(exerciseMinBpm, goalBpm) : exerciseMinBpm),
    maxBpm:         lockedExamBpm ?? (goalBpm && exerciseMaxBpm !== undefined ? Math.max(exerciseMaxBpm, goalBpm) : exerciseMaxBpm),
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
  // would play the same recording twice. Idle unless the plan is a song — or
  // the current item of the routine is one (the recording follows the item).
  const backingTrack = useBackingTrackSession({
    songId:       songItemTabId ?? plan.song?.id ?? null,
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
  });

  // A string, so the tab section's memo only re-renders when it actually moves.
  const backingTrackStatus = getBackingTrackStatus({
    stemCount: backingTrack.stems.length,
    alignment: backingTrack.alignment,
  });
  const openBackingTrack = useCallback(() => setIsAligningBacking(true), []);

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

    // A strumming exercise's guitar is the pattern synth, not the sampler — it has no
    // tablature to play, so it counts as its own playback when picking the default.
    const hasStrumSynth = !!currentExercise.strummingPatterns?.length;

    let nextAudioMuted = true;
    if (isExamMode) {
      nextAudioMuted = true;
    } else if (currentExercise.riddleConfig?.mode === "sequenceRepeat") {
      nextAudioMuted = false;
    } else {
      const pref = loadGuitarPlaybackPreference();
      nextAudioMuted = pref !== null
        ? !pref
        : !(hasStrumSynth || willHaveTablature(currentExercise));
    }

    // In exam mode with a backing track, the backing guides the tempo, so the
    // metronome click is redundant — mute it (it still runs to keep timing/sync).
    let nextMetronomeMuted = isExamMode && !!currentExercise.examBacking;
    let nextSpeedMultiplier = 1;

    // Exam mode has its own fixed rules above (and a locked BPM), so per-exercise
    // persisted settings only apply to regular practice.
    if (!isExamMode) {
      const persisted = loadPracticeSessionSettings(currentExercise.id);
      // Strumming exercises skip the persisted flag on purpose: until the synth
      // started answering to it, every stored value was the meaningless `true` this
      // screen wrote by default, and honouring it now would mute the pattern for
      // everyone. The global guitar-playback preference (same toggle) still applies.
      if (persisted?.isAudioMuted !== undefined && !hasStrumSynth) nextAudioMuted = persisted.isAudioMuted;
      if (persisted?.isMetronomeMuted !== undefined) nextMetronomeMuted = persisted.isMetronomeMuted;
      // Goal mode starts on the goal's tempo at full speed — a slower tempo left
      // over from regular practice would quietly fail every run.
      if (!isGoalMode) {
        if (persisted?.speedMultiplier !== undefined) nextSpeedMultiplier = persisted.speedMultiplier;
        if (persisted?.metronomeBpm !== undefined) metronome.setBpm(persisted.metronomeBpm);
      }
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

  // ── Instrument + tuning (pitch detection + background guitar match the player's own) ──
  // Until the player picks a Guitar Pro track, a bass player — or the song's
  // Bass arrangement — gets the file's bass track.
  const preferredInstrument = useInstrumentPreferenceStore((s) => s.instrument);
  const wantsBassTrack = preferredInstrument === "bass" || plan.song?.arrangement === "bass";
  const autoGpTrackIdx = useMemo(
    () => Math.max(0, wantsBassTrack ? (parsedGpTracks?.findIndex((track) => track.trackType === "bass") ?? -1) : 0),
    [parsedGpTracks, wantsBassTrack],
  );
  const gpTrackIdx = selectedGpTrackIdx ?? autoGpTrackIdx;
  const gpTrack = parsedGpTracks?.[gpTrackIdx];
  const gpTrackType = gpTrack?.trackType;
  // What the notes are written for: a Guitar Pro track says so itself, a tab
  // exercise carries it (guitar unless marked bass). Anything else — a timer, a
  // hunt — follows the player's own pick.
  const contentInstrument: Instrument | undefined = parsedGpTracks
    ? gpTrackType === "bass" ? "bass" : gpTrackType === "guitar" ? "guitar" : undefined
    : riddleMeasures || activeExercise.tablature?.length
      ? activeExercise.instrument ?? "guitar"
      : undefined;
  // Locked to Standard for Guitar Pro imports (the file already encodes its own tuning)
  // and during exams (prepared only for standard tuning).
  const isGpFile = !!effectiveRawGpFile || !!gpFileUrl;
  const guitarTuning = useGuitarTuning({
    isGpFile, isExamMode, contentInstrument, contentStringCount: gpTrack?.stringCount,
    fileOpenStringMidi: gpTrack?.openStringMidi, fileTuningKey: currentExercise.id,
  });
  const isBass = guitarTuning.instrument === "bass";

  // A player tuned a half step under the file plays the file's frets and sounds
  // a half step under its notes — so that is what the matcher is given to hear.
  const gpTrackMeasures = gpTrack?.measures;
  const gpPitchShift = guitarTuning.pitchShift;
  const playedGpMeasures = useMemo(
    () => shiftTabPitch(gpTrackMeasures, gpPitchShift),
    [gpTrackMeasures, gpPitchShift],
  );

  const rawTablature = riddleMeasures
    || (parsedGpTracks ? playedGpMeasures : undefined)
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

  // A song item's slot stretches to one pass of its tab at the speed it is
  // played — a rotation song gets 10 minutes, and a 12-minute song stopped at 10
  // never gets played through.
  const songTabSeconds = songItemTabId && parsedGpTracks && effectiveBpm > 0
    ? (sessionTempoRuler.totalWarped * 60) / effectiveBpm
    : null;
  useEffect(() => {
    setTabDuration(currentExercise.id, songTabSeconds);
  }, [currentExercise.id, songTabSeconds, setTabDuration]);
  const exerciseDurationSeconds = videoDuration
    ?? Math.max((activeExercise.timeInMinutes || 0) * 60, Math.ceil(songTabSeconds ?? 0));

  // A generated band for tab exercises that bring no accompaniment of their own.
  const autoBacking = useAutoBacking({
    exercise: activeExercise,
    measures: activeTablature,
    tuningOffsets: guitarTuning.tuning.offsets,
    repeatCount: tabRepeatCount,
    blocked: !!effectiveRawGpFile || !!parsedGpTracks || !!riddleMeasures || (isExamMode && !!activeExercise.examBacking),
    boss: bossFight ? { phase: bossFight.phase, score: bossFight.score } : undefined,
  });

  const dynamicBackingTracks = useMemo(() => {
    if (parsedGpTracks && parsedGpTracks.length > 1) return parsedGpTracks.filter((_, idx) => idx !== gpTrackIdx);
    if (activeExercise.backingTracks?.length) return activeExercise.backingTracks;
    return autoBacking.tracks;
  }, [parsedGpTracks, gpTrackIdx, activeExercise.backingTracks, autoBacking.tracks]);

  // ── The tab's guitar starts off over a backing ────────────────────────────
  // With a band (generated, the exercise's own, a GP file's other tracks or the
  // song's recording) the player is the guitar — the tab's own copy on top only
  // doubles them. The backing can arrive after the exercise opens (a GP file
  // parses, a recording loads) or be switched off mid-way, so this follows it
  // rather than deciding once in the reset above. The toggle under a backing is
  // its own remembered choice; the per-exercise saved flag is left out on purpose
  // — it is written on every BPM or mic change, so it mostly holds the old default.
  const hasBacking = !isExamMode && !isEarTrainingRiddle
    && (!!dynamicBackingTracks?.length || backingTrack.stems.length > 0);
  const backingDefaultRef = useRef<{ exerciseId: string; hasBacking: boolean } | null>(null);
  useEffect(() => {
    const prev = backingDefaultRef.current;
    backingDefaultRef.current = { exerciseId: currentExercise.id, hasBacking };
    if (hasBacking) {
      setIsAudioMuted(!(loadGuitarPlaybackPreference(true) ?? false));
    } else if (prev?.exerciseId === currentExercise.id && prev.hasBacking) {
      // The backing went away mid-exercise: the guitar goes back to its usual default.
      setIsAudioMuted(!(loadGuitarPlaybackPreference() ?? true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise.id, hasBacking]);

  const planHasTablature = useMemo(() => plan.exercises.some(ex => willHaveTablature(ex) || ex.riddleConfig?.mode === "sequenceRepeat"), [plan.exercises]);
  const planHasStrumming = useMemo(() => plan.exercises.some(ex => ex.strummingPatterns && ex.strummingPatterns.length > 0), [plan.exercises]);

  // ── Audio subsystem ───────────────────────────────────────────────────────

  const [tabRestartKey, setTabRestartKey] = useState(0);
  const noteMatchingHandle = useRef<NoteMatchingHandle | null>(null);

  const { audioTracks, trackConfigs, setTrackConfigs, backingTrackIds, gpAudioActive, gpAudioReady, effectiveAudioStartTime, tabSchedulerTickRef } = useSessionAudio({
    activeTablature, dynamicBackingTracks, effectiveRawGpFile,
    isAudioMuted, isAudioPlaying, effectiveBpm, masterVolume,
    currentExerciseId: currentExercise.id, selectedGpTrackIdx: gpTrackIdx, tabRepeatCount, loopsCompletedRef,
    autoStopAfterFirstLoop: isEarTrainingRiddle,
    isMetronomeMuted, metronomeVolume: metronome.volume, showAlphaTabScore, examMode: isExamMode,
    examBacking: activeExercise.examBacking,
    metronomeAudioContext: metronome.audioContext,
    metronomeStartTime: metronome.startTime,
    metronomeAudioStartTime: metronome.audioStartTime,
    stopMetronome: metronome.stopMetronome, stopTimer, setTimerTime, setHasPlayedRiddleOnce,
    onAlphaTabAudioContextReady: useCallback((ctx: AudioContext) => setAudioSystem(prev => ({ ...prev, context: ctx })), []),
    onAlphaTabLoopRestart: () => noteMatchingHandle.current?.markAlphaTabPassStart?.(),
    tabRestartKey,
    pendingSeekBeatRef: metronome.pendingSeekBeatRef,
    tuningOffsets: guitarTuning.tuning.offsets,
    gpTransposeSemitones: gpPitchShift,
    isBass,
    bandRage: !!bossFight?.enraged,
  });

  // ── The tab ends with the time ────────────────────────────────────────────
  // A looping tab used to run straight into the time-up, so the last bars on
  // the board were ones nobody could finish. Each time playback starts, the
  // remaining time is laid over the tab: the last bar that ends a second before
  // the timer does is where the board stops drawing, the synth and the band
  // stop playing, and the matcher stops expecting notes. A slow bar would leave
  // a long silence there, so the stop moves inside the next bar to keep it to
  // three seconds at most (tabPlayUntil.ts). Left out where the
  // tab is not ours to cut — AlphaTab plays a GP file itself, an exam runs on
  // its backing, a riddle plays once.
  const setTabPlayUntil = useTabPlayUntilStore(s => s.setUntil);
  const cutsTabAtTimeUp = !freeMode && exerciseDurationSeconds > 0 && !isExamMode
    && !isEarTrainingRiddle && !effectiveRawGpFile && !showAlphaTabScore;
  useEffect(() => {
    const ctx = metronome.audioContext;
    if (!cutsTabAtTimeUp || !isAudioPlaying || !ctx || effectiveAudioStartTime == null) {
      setTabPlayUntil(null);
      return;
    }
    // Both clocks are read at the same moment, so the answer is right whenever
    // this runs — at the first beat, after a resume, after a re-anchor.
    const remainingSec = exerciseDurationSeconds - timer.getTime() / 1000;
    const endSec = ctx.currentTime - effectiveAudioStartTime + remainingSec;
    setTabPlayUntil(tabPlayUntil(activeTablature, sessionTempoRuler, effectiveBpm, endSec));
  }, [
    cutsTabAtTimeUp, isAudioPlaying, metronome.audioContext, effectiveAudioStartTime,
    exerciseDurationSeconds, timer, activeTablature, sessionTempoRuler, effectiveBpm, setTabPlayUntil,
  ]);
  useEffect(() => () => setTabPlayUntil(null), [setTabPlayUntil]);

  // What a Guitar Pro exercise still has to load before it can be played: the
  // file, its tracks, the player's sounds and song. The loading screen keeps
  // its doors shut — and the overlay covers the session — until it has.
  const gpSteps = gpLoadingSteps(
    { fetching: isFetchingGpFile || songGpFile.isResolving, hasFile: !!effectiveRawGpFile, parsing: isParsingGpFile, audioReady: gpAudioReady },
    { file: t("loading_steps.file"), parse: t("loading_steps.parse"), sound: t("loading_steps.sound") },
  );
  const gpLoading = isStillLoading(gpSteps);

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

  const { isListening, init: initAudio, close: closeAudio, audioRefs, getLatencyMs, getAttackLatencyMs, inputGain, setInputGain, isNative, selectDevice, selectChannel, webInput } = useGuitarAudioInput({ bass: isBass, strum: !!currentExercise.strummingPatterns?.length });
  // The player's measured latency for the input path in use — the browser and the
  // desktop app keep separate measurements (different capture chains).
  const calibratedLatencyMs = timingByPath[timingInputPath(isNative)].latencyMs;

  const {
    sessionPhase, isMicEnabled: _isMicEnabled, handleEnableMic, handleSkipMic,
    handleReuseCalibration, handleRecalibrate, handleCalibrationComplete, handleCalibrationCancel,
    getAdjustedTargetFreq, existingCalibrationTimestamp, setIsMicEnabled: updateMicPersistence, setSessionPhase,
  } = useCalibration(planHasTablature, (isExamMode || isGoalMode || !!plan.duel || isRecordingTake) && !currentExercise.disableMic, micStart);
  // The wizard opens the input itself and enables the mic only when it
  // finishes — closing it early has to close that stream too, or the tuner keeps
  // reading the guitar and the mic looks on while nothing is being scored.
  const handleCalibrationCancelAndClose = useCallback(() => {
    if (!_isMicEnabled) closeAudio();
    handleCalibrationCancel();
  }, [_isMicEnabled, closeAudio, handleCalibrationCancel]);
  // The timing measurement (the dialog, or the setup wizard's step) plays its
  // own clicks — the session's timer and metronome must not run under them.
  const stopSessionPlayback = () => { stopTimer(); metronome.stopMetronome(); };

  // disableMic marks exercises with nothing to detect (click drills, improv
  // prompts, backing-track jams). It has to gate the mic HERE, not just the mic
  // controls in SessionModal/DesktopSessionView — the mic preference is global
  // (mic_tracking_enabled in localStorage), so once enabled anywhere it would
  // otherwise open a real getUserMedia stream in every exercise, guitar or not.
  const isMicEnabled = _isMicEnabled && !currentExercise.isPlayalong && !currentExercise.disableMic;

  // ── Learn mode ────────────────────────────────────────────────────────────
  // The tab waits on each note until the player has played it, instead of
  // following the metronome. It has no clock to score against, so it reports
  // nothing but practice time. Desktop only for now: the phone's tab panel
  // doesn't park its cursor on a note.
  const [learnWanted, setLearnWanted] = useState(false);
  const learnSteps = useMemo(
    () => buildLearnSteps(isEarTrainingRiddle ? undefined : activeTablature),
    [isEarTrainingRiddle, activeTablature],
  );
  const learnAvailable = learnSteps.length > 0 && !isMobileView && !isExamMode && !isGoalMode
    && !plan.duel && !isRecordingTake && !currentExercise.isPlayalong && !currentExercise.disableMic;
  const learnEnabled = learnWanted && learnAvailable && isMicEnabled;
  const learnModeRef = useRef(false);
  useEffect(() => { learnModeRef.current = learnEnabled; }, [learnEnabled]);

  // Learn mode needs no Play: it listens as soon as it is on, and a note heard
  // while the clock is stopped starts it — unless the exercise's time is up.
  const handleLearnNotePlayed = useCallback(() => {
    const durationMs = exerciseDurationSeconds * 1000;
    if (!freeMode && durationMs > 0 && timer.getTime() >= durationMs) return;
    startTimer();
  }, [exerciseDurationSeconds, freeMode, timer, startTimer]);

  const learnProgress = useLearnModeMatcher({
    steps: learnSteps,
    active: learnEnabled && isListening && sessionPhase === "ready"
      && !showSuccessView && !reportResult && !isAligningBacking,
    audioRefs, getAdjustedTargetFreq, tuningOffsets: guitarTuning.tuning.offsets,
    resetKey: tabResetKey + tabRestartKey,
    onNotePlayed: handleLearnNotePlayed,
  });

  // Learn mode and the metronome are two ways of keeping the exercise moving, so
  // switching between them stops everything: learn mode restarts the clock on
  // the first note heard, the metronome waits for Play.
  const handleSetLearnEnabled = useCallback((next: boolean) => {
    stopTimer();
    metronome.stopMetronome();
    setLearnWanted(next);
    // The notation view is driven by AlphaTab's own clock — it can't wait for a note.
    if (next) setShowAlphaTabScore(false);
  }, [stopTimer, metronome, setShowAlphaTabScore]);

  const handleToggleAlphaTabScore = useCallback(() => {
    if (learnWanted) setLearnWanted(false);
    toggleAlphaTabScore();
    // The view menu is the player's choice, so the next session opens on it
    // too — otherwise a "Default view: Notation" picked
    // once to try it keeps flipping every session back to sheet music.
    useTablatureSettings
      .getState()
      .set("defaultViewMode", showAlphaTabScore ? "tab" : "notation");
  }, [learnWanted, toggleAlphaTabScore, showAlphaTabScore]);

  const learn = useMemo<LearnModeState | null>(
    () => (learnAvailable
      ? { ...learnProgress, available: true, micReady: isMicEnabled, enabled: learnEnabled, setEnabled: handleSetLearnEnabled }
      : null),
    [learnAvailable, learnProgress, isMicEnabled, learnEnabled, handleSetLearnEnabled],
  );

  // Click-answered hunts are scored from mouse clicks, so their snapshot is a
  // real performance worth reporting even though the mic never opens
  // (useScoreSaving persists them on its own click branch). Everything else only
  // has a snapshot worth submitting when the mic was actually listening — and a
  // lesson is not a run: learn mode has no score, so there is nothing to report.
  const hasTrackedPerformance = (isMicEnabled && !learnEnabled) || isClickAnsweredMode(currentExercise.noteHuntConfig?.mode);
  // Exams, goals, duels and recording takes only count mic-scored runs, so they open on the mic prompt.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if ((isExamMode || isGoalMode || !!plan.duel || isRecordingTake) && !_isMicEnabled && !currentExercise.disableMic) setSessionPhase("mic_prompt"); }, []);
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
  //
  // The cleanup is only registered by the *enabled* run. The calibration wizard
  // opens the stream itself while isMicEnabled is still false and flips it to
  // true on completion — a cleanup left behind by the disabled run would fire
  // right then and close the wizard's stream, while the guard above (isListening
  // still true in this render) skips reopening it: mic "on", nothing detected
  // until the player left the exercise and came back. Unmount is covered by the
  // analyzer hooks' own cleanup.
  useEffect(() => {
    if (!isMicEnabled) return undefined;
    // A mic that was set up earlier can still fail to open today (access taken
    // back, the interface unplugged or held by a DAW). The button lights up
    // from the preference, so without a word it looked on and scored nothing.
    // The desktop path reports its own failures (see useNativeAudioAnalyzer).
    if (!isListening) void Promise.resolve(initAudio()).then((result) => {
      if (!result || result.ok) return;
      toast.error(t("mic_open_failed.title", "The microphone didn't turn on"), {
        description: t(`mic_open_failed.${result.reason}`, "Open Input setup to fix it."),
        action: { label: t("mic_open_failed.action", "Input setup"), onClick: handleRecalibrate },
      });
    });
    return () => { closeAudio(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMicEnabled]);

  // Lend the open input to the desktop title bar's tuner (see sessionTunerStore).
  // No cleanup on change: a null in between would close a tuner that is reading
  // it, so the source only clears when the input closes or the session unmounts.
  const setTunerSource = useSessionTunerStore((s) => s.setSource);
  const isInputOpen = isMicEnabled || isListening;
  useEffect(() => {
    setTunerSource(isInputOpen ? {
      frequencyRef: audioRefs.frequencyRef,
      volumeRef: audioRefs.volumeRef,
      isListening,
      tuning: guitarTuning.tuning,
      isTuningLocked: guitarTuning.isLocked,
    } : null);
  }, [isInputOpen, isListening, audioRefs.frequencyRef, audioRefs.volumeRef, guitarTuning.tuning, guitarTuning.isLocked, setTunerSource]);
  useEffect(() => () => setTunerSource(null), [setTunerSource]);

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

  /**
   * The click grid this exercise plays in.
   *
   * The meter comes from the tab about to be played: a 4/4 exercise clicks four
   * quarters with the accent on one, a 6/8 one clicks six eighths the same way,
   * and a tab that *changes* meter gets a pattern spanning its whole repeating
   * cycle, so the click changes with it instead of holding one bar's shape over
   * all of them. Exercise.metronomeGrid overrides that, for a drill whose click
   * cannot be read off a time signature; nothing needs it today.
   *
   * Locked whenever the pattern covers more than a single bar: the +/- control
   * means "beats in the bar", which a two-bar cycle has no answer for, and adding
   * a beat to it only breaks the alternation. A plain one-bar grid is just a
   * starting point and stays the player's to edit.
   *
   * Read from rawTablature rather than the exercise, so a GP file's own time
   * signatures count too — and so switching GP track re-derives it.
   */
  const exerciseMetronomeGrid = currentExercise.metronomeGrid ?? deriveMetronomeGrid(rawTablature);
  const metronomeGridLocked = (exerciseMetronomeGrid?.barLengths.length ?? 1) > 1;
  // Identity of the grid rather than the object, so a re-derivation that lands on
  // the same meter doesn't wipe accents the player set by hand mid-exercise. The
  // exercise id is part of it because moving to the next exercise *should* reset
  // to that exercise's meter, even when the two happen to share one.
  const metronomeGridKey = exerciseMetronomeGrid
    ? `${currentExercise.id}|${metronomeGridLocked ? "L" : "u"}${exerciseMetronomeGrid.unit}:${exerciseMetronomeGrid.pattern.join("")}`
    : null;
  // An exercise with no tab at all (ear training, improv prompts) asks for no
  // grid — but a two-bar eighth grid must not follow the player out of the drill
  // that set it, hence the reset. The ref keeps that reset from firing on a
  // session that never applied a grid in the first place, where it would wipe a
  // grid the player built by hand.
  const appliedMetronomeGridRef = useRef<string | null>(null);
  useEffect(() => {
    if (exerciseMetronomeGrid) {
      metronome.setAccentGrid(exerciseMetronomeGrid, metronomeGridLocked);
      appliedMetronomeGridRef.current = metronomeGridKey;
    } else if (appliedMetronomeGridRef.current !== null) {
      metronome.setAccentGrid({
        unit: 4,
        pattern: DEFAULT_ACCENT_PATTERN,
        barLengths: [DEFAULT_ACCENT_PATTERN.length],
      });
      appliedMetronomeGridRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metronomeGridKey]);

  // Persist Practice Session settings per exercise, so reopening the same
  // exercise restores its own metronome/playback/mic preferences.
  useEffect(() => {
    // Goal mode's tempo is the goal's, not a preference worth carrying back
    // into regular practice of the same exercise.
    if (isExamMode || isGoalMode) return;
    if (skipNextSettingsSaveRef.current) { skipNextSettingsSaveRef.current = false; return; }
    savePracticeSessionSettings(currentExercise.id, {
      isAudioMuted, isMetronomeMuted, speedMultiplier,
      metronomeBpm: metronome.bpm,
      isMicEnabled: _isMicEnabled,
    });
  }, [currentExercise.id, isExamMode, isGoalMode, isAudioMuted, isMetronomeMuted, speedMultiplier, metronome.bpm, _isMicEnabled]);

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
  // Bar clock for hunts that change on the bar line instead of on a stopwatch.
  // Read off the click itself — the same anchor and the same effective tempo it
  // schedules from — so the changes and the clicks can't drift apart. `startTime`
  // is null until the count-in ends, which is exactly when the drill should start
  // counting bars.
  //
  // Built fresh each render rather than memoized: the rotation hook reads it down
  // to primitives before using it, so a new object identity costs nothing.
  const huntBarSteps = metronome.gridBarLengths?.[0] ?? metronome.accentPattern?.length ?? DEFAULT_ACCENT_PATTERN.length;
  const huntBarClock = {
    startTime: metronome.startTime,
    msPerBar: (60000 / effectiveBpm) * (huntBarSteps / stepsPerBeat(metronome.gridUnit)),
  };
  const { target: huntTarget, secondsLeft: noteHuntSecondsLeft, advance: advanceHunt } = useNoteHuntRotation(currentExercise, isPlaying, huntSolvedRef, isExamMode, huntBarClock);
  const [successSnapshot, setSuccessSnapshot] = useState<NoteMatchingSnapshot | null>(null);
  useEffect(() => { if (showSuccessView) setSuccessSnapshot(noteMatchingHandle.current?.snapshot() ?? null); }, [showSuccessView]);
  // Set by the click-hunt mistake-limit fail path below — shows the same
  // success/fail modal as a normal exam finish, forced into its failed state,
  // instead of redirecting away before the player sees why they failed.
  const [examMistakeFailed, setExamMistakeFailed] = useState(false);

  // ── Score saving ──────────────────────────────────────────────────────────

  // `micStandingRef`/`earTrainingStandingRef` carry the tempo and leaderboard
  // place of the run that was just saved — every finish path below awaits
  // saveCurrentScores() first, so they are filled by the time the report goes out.
  const { saveCurrentScores, exerciseRecordsRef, scoredRuns, micStandingRef, earTrainingStandingRef } = useScoreSaving({
    activeExercise, currentExercise, isMicEnabled, earTrainingScore, noteMatchingHandle,
    sessionBpm: effectiveBpm,
    recordGoalChartRuns: !isGoalMode,
    // A song played through its whole tab is a whole run, however long the song.
    videoDurationSeconds: videoDuration ?? songTabSeconds,
    duelId: plan.duel?.id ?? null,
    recording: plan.recording ?? null,
    learnModeRef,
  });

  // ── Playback leak guard ───────────────────────────────────────────────────

  // The tab's own guitar out of speakers would score as if the player had
  // played it. While it sounds on a run that could land on a board or in a duel,
  // the guard listens for it in the mic, and a run it hears is kept off them.
  // Riddles are left out: their phrase has to be heard, and the mic only judges
  // the answer once the phrase has finished.
  const tabSoundLevel = strumSynthVolume(isAudioMuted, trackConfigs.main) * masterVolume;
  const hasTabSound = !!activeTablature?.length || !!effectiveRawGpFile || !!currentExercise.strummingPatterns?.length;
  // The generated band plays the key's notes and a beat the mic would also
  // take for the player's, so it needs guarding just like the tab's guitar.
  const autoBackingLevel = autoBacking.tracks
    ? Math.max(0, ...audioTracks.filter(track => track.generated && !track.isMuted).map(track => track.volume)) * masterVolume
    : 0;
  const setAutoBackingEnabled = useAutoBackingStore(state => state.setEnabled);
  const handlePlaybackLeak = useCallback(() => {
    noteMatchingHandle.current?.markPlaybackLeak?.();
    toast.warning(t("playback_leak.title", "Your mic can hear the guitar playback"), {
      id: "playback-leak",
      description: t(
        "playback_leak.body",
        "This run won't go on the leaderboards. Put on headphones or turn the guitar sound off, then start the run over.",
      ),
      duration: 12000,
      action: {
        label: t("playback_leak.mute", "Turn guitar off"),
        onClick: () => { setIsAudioMuted(true); setAutoBackingEnabled(false); },
      },
    });
  }, [t, setIsAudioMuted, setAutoBackingEnabled]);
  const playbackLeakingRef = usePlaybackLeakGuard({
    enabled:
      PLAYBACK_LEAK_GUARD_ENABLED &&
      isMicEnabled && isListening && !isEarTrainingRiddle && (hasLeaderboard(activeExercise) || !!plan.duel),
    isTabAudible: isAudioPlaying && ((hasTabSound && tabSoundLevel > 0) || autoBackingLevel > 0),
    tabLevel: Math.max(tabSoundLevel, autoBackingLevel),
    audioContext: metronome.audioContext,
    inputTapRef: audioRefs.inputTapRef,
    onLeak: handlePlaybackLeak,
  });

  const { verdict: goalVerdict, rearm: rearmGoalVerdict } = useGoalRunVerdict({
    goalRun, showSuccessView, isMicEnabled, noteMatchingHandle,
  });

  /**
   * Finish from the session chrome — the desktop bottom bar and the mobile
   * transport, both of which route a below-the-bar finish through
   * FinishSessionDialog first.
   *
   * `earlyFinish` means the session is ending before it was played out. Nothing
   * from the run is banked — no high score, no leaderboard entry, no completion
   * stamp in the skill tree and no skill points on the report. The practice time
   * is the only thing an early finish keeps. Records banked by earlier exercises
   * of the plan (saved on their way out through Next) still ride along.
   * Exams never take this path; they have no early finish.
   */
  const handleFinishSessionClick = async (options?: { earlyFinish?: boolean }) => {
    const earlyFinish = !!options?.earlyFinish;
    metronome.stopMetronome();
    if (!earlyFinish) await saveCurrentScores();
    autoSubmitReport(exerciseRecordsRef.current, undefined, undefined, { skipSkillPoints: earlyFinish });
  };

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
        hasTrackedPerformance && snap ? { score: snap.score, accuracy: snap.accuracy, ...micStandingRef.current } : null,
        null,
      );
      onExamComplete?.(snap?.accuracy ?? 0, snap?.onTimePct ?? null);
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
      hasTrackedPerformance && snap ? { score: snap.maxPossibleScore, accuracy: 100, ...micStandingRef.current } : null,
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
    // The mic prompt and setup wizard sit over the session too: Space on one of
    // their buttons would otherwise start the run (and an exam's clock) behind them.
    shortcutsDisabled: isAligningBacking || !!bossFight?.isOver || !!bossFight?.isHolding || sessionPhase !== "ready",
    isPlaying, stopTimer, startTimer, resetTimer, metronome,
    currentExercise, currentExerciseIndex, isLastExercise, jumpToExercise,
    handleNextExercise, restartFullSession,
    isMicEnabled, closeAudio, updateMicPersistence,
    isAudioMuted, setIsAudioMuted, hasBacking, speedMultiplier, setSpeedMultiplier,
    setEarTrainingScore, setIsRiddleGuessed, handleRevealRiddle,
    saveCurrentScores, noteMatchingHandle, loopsCompletedRef,
    tabRestartKey, setTabRestartKey,
    learnMode: learnEnabled,
  });

  // ── Boss fight ────────────────────────────────────────────────────────────

  const { controls: bossControls, tabOverlay: tabOverlayValue } = useBossFightSession({
    isActive: !!bossFight,
    tabOverlay: bossFight?.tabOverlay,
    isOver: !!bossFight?.isOver,
    isHolding: !!bossFight?.isHolding,
    onNewRun: bossFight?.onNewRun,
    stopTimer, stopMetronome: metronome.stopMetronome, handleRestart,
    hasLoggedPractice,
    // Practice time is all a fight reports — the score belongs to the fight.
    reportPracticeTime: () => autoSubmitReport(exerciseRecordsRef.current, null, null),
    onClose,
    isFinishing: !!isFinishing || isSubmittingReport,
  });

  // The fight's sounds play on the metronome's clock, so a countdown ticks on its beats.
  const onBossAudioClock = bossFight?.onAudioClock;
  useEffect(() => {
    if (!onBossAudioClock) return;
    const context = metronome.audioContext;
    onBossAudioClock(
      context
        ? {
            context,
            startTime: metronome.isPlaying ? (metronome.audioStartTime ?? null) : null,
            bpm: effectiveBpm,
            volume: masterVolume,
          }
        : null,
    );
  }, [onBossAudioClock, metronome.audioContext, metronome.audioStartTime, metronome.isPlaying, effectiveBpm, masterVolume]);
  useEffect(() => () => onBossAudioClock?.(null), [onBossAudioClock]);

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
  // Stop silences the phrase only — the session clock keeps counting while the
  // player works the answer out (the session's own pause still stops it).
  const handlePlayRiddle = useCallback(() => {
    cancelRiddleAutoAdvance();
    if (metronome.isPlaying) { metronome.stopMetronome(); return; }
    if (!isPlaying) startTimer();
    handleReplayRiddle();
  }, [cancelRiddleAutoAdvance, isPlaying, metronome, startTimer, handleReplayRiddle]);

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

  // Armed only while the phrase is silent — otherwise the mic would hear the
  // riddle itself coming from the speakers and solve it on its own. The session
  // clock may keep running meanwhile: answering is practice time too.
  const riddleProgress = useRiddleSequenceMatcher({
    measures: riddleMeasures,
    active: isMicEnabled && isListening && hasPlayedRiddleOnce && !isRiddleRevealed && !metronome.isPlaying,
    frequencyRef: audioRefs.frequencyRef,
    volumeRef: audioRefs.volumeRef,
    tuningOffsets: guitarTuning.tuning.offsets,
    onComplete: handleRiddleMatched,
  });

  // ── Misc effects ──────────────────────────────────────────────────────────

  // Electron shell: keep the display awake + taskbar progress (web: no-op).
  useDesktopSessionIntegration({
    timer,
    durationInSeconds: exerciseDurationSeconds,
    freeMode,
  });

  useEffect(() => {
    const duration = exerciseDurationSeconds;
    if (freeMode || duration === 0) return;

    return timer.subscribe((time) => {
      const remaining = Math.max(0, Math.floor((duration * 1000 - time) / 1000));
      if (remaining > 0) return;
      if (isPlaying) stopTimer();
      if (metronome.isPlaying) metronome.toggleMetronome();
    });
  }, [timer, isPlaying, metronome, stopTimer, freeMode, exerciseDurationSeconds]);

  useEffect(() => {
    const header = document.querySelector("header.sticky") as HTMLElement | null;
    if (header) header.style.display = "none";
    return () => { if (header) header.style.display = ""; };
  }, []);

  // ── Song item over its section map ────────────────────────────────────────
  // Built once and handed to whichever view is on screen: the desktop view and
  // the mobile modal are both mounted at the same time (see DesktopSessionView),
  // and a section map mounted twice would be two YouTube players, two saves
  // and two hands on every keyboard shortcut.
  const songSectionMapSlot = songItemOverSections && songItem && userId ? (
    <SongSectionMapPanel
      song={songItem}
      userId={userId}
      onVideoPlay={startTimer}
      compact={isMobileView}
    />
  ) : undefined;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <GuitarTuningProvider value={guitarTuning}>
    {/* The session pages (/practice/exercise, boss, duel, goal…) render outside
        the app shell, and the light palette only switches on while a
        [data-app-shell] is on the page — this keeps the player's theme. */}
    <span data-app-shell hidden />
    <NoteMatchingProvider
      handleRef={noteMatchingHandle} isPlaying={isPlaying} startTime={metronome.startTime}
      audioContext={metronome.audioContext} audioStartTime={metronome.audioStartTime}
      alphaTabSource={showAlphaTabScore ? "notation" : effectiveRawGpFile ? "player" : null}
      effectiveBpm={effectiveBpm} rawBpm={metronome.bpm}
      activeTablature={isEarTrainingRiddle ? undefined : activeTablature}
      isMicEnabled={isMicEnabled} currentExerciseIndex={currentExerciseIndex}
      speedMultiplier={speedMultiplier} getLatencyMs={getLatencyMs} getAttackLatencyMs={getAttackLatencyMs} calibratedLatencyMs={calibratedLatencyMs} audioRefs={audioRefs}
      scoringFocus={currentExercise.scoringFocus}
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
      canAdvanceHunt={huntTarget !== null}
      onEnableMic={handleMicToggle}
      onReset={handleNoteMatchingReset}
      getSessionTimeMs={timer.getTime}
      isExamMode={isExamMode}
      onExamFail={handleExamMistakeFail}
      playbackLeakingRef={playbackLeakingRef}
      learn={learn}
      onNoteJudged={bossFight?.onNoteJudged}
      onFreePlay={bossFight?.onFreePlay}
    >
    <TimerProvider timer={timer} durationInSeconds={exerciseDurationSeconds} freeMode={freeMode}>
    <BpmProgressProvider exercise={currentExercise}>
    <SessionUIProvider onOpenMicSetup={handleRecalibrate}>
    <TabOverlayProvider value={tabOverlayValue}>
    <>
      {/* Intro splash that always plays on session mount, then parts open
          (door-reveal) to show the session beneath. */}
      <PracticeLoadingScreen isReady={!gpLoading} steps={gpSteps} />

      <SessionPageHead exerciseTitle={activeExercise.title} />

      <GeneratedExerciseDialogs
        showScaleDialog={showScaleDialog} setShowScaleDialog={setShowScaleDialog}
        showChordDialog={showChordDialog} setShowChordDialog={setShowChordDialog}
        onExerciseGenerated={handleGenerated}
      />

      {isMobileView && reportResult && currentUserStats && previousUserStats && (
        <TurnedScreen turned={isUprightPhone} className="z-[999999999] bg-zinc-950">
          <RatingPopUp ratingData={reportResult} currentUserStats={currentUserStats} previousUserStats={previousUserStats}
            onClick={onClose} activityData={activityDataToUse} onRestart={handleRestartFullSession}
            scoredRuns={scoredRuns}
          />
        </TurnedScreen>
      )}

      {gpLoading && <GpLoadingOverlay steps={gpSteps} />}

      {(showSuccessView || examMistakeFailed) && !reportResult && successSnapshot && (
        <ExerciseSuccessView
          planTitle={planTitleString} examMode={isExamMode}
          score={examMistakeFailed ? 0 : successSnapshot.score} maxScore={successSnapshot.maxPossibleScore}
          examAccuracy={examMistakeFailed ? 0 : successSnapshot.accuracy}
          examOnTimePct={examMistakeFailed ? null : successSnapshot.onTimePct ?? null}
          stats={
            hasTrackedPerformance && !isEarTrainingRiddle
              ? { accuracy: examMistakeFailed ? 0 : successSnapshot.accuracy, maxStreak: successSnapshot.maxCombo }
              : undefined
          }
          timeline={successSnapshot.noteTimeline}
          timing={hasTrackedPerformance && !isEarTrainingRiddle && !examMistakeFailed ? successSnapshot.timing : null}
          timingPrecision={hasTrackedPerformance && !isEarTrainingRiddle && !examMistakeFailed ? successSnapshot.timingPrecision : null}
          intonation={hasTrackedPerformance && !isEarTrainingRiddle && !examMistakeFailed ? successSnapshot.intonation : null}
          intonationBiasCents={successSnapshot.intonationBiasCents ?? null}
          noteLog={hasTrackedPerformance && !isEarTrainingRiddle && !examMistakeFailed ? successSnapshot.noteLog : null}
          failMessage={examMistakeFailed ? `${CLICK_EXAM_MISTAKE_LIMIT} wrong clicks — exam failed.` : undefined}
          eyebrow={goalRun?.summaryEyebrow}
          extraContent={goalVerdict}
          offerRestart={isGoalMode}
          turned={isUprightPhone}
          onFinish={async () => {
            metronome.stopMetronome(); await saveCurrentScores();
            autoSubmitReport(exerciseRecordsRef.current,
              !hasTrackedPerformance || isEarTrainingRiddle
                ? null
                : examMistakeFailed
                  ? { score: 0, accuracy: 0 }
                  : { score: successSnapshot.score, accuracy: successSnapshot.accuracy, ...micStandingRef.current },
              isEarTrainingRiddle ? { score: earTrainingScore, ...earTrainingStandingRef.current } : null);
            if (isExamMode) onExamComplete?.(examMistakeFailed ? 0 : successSnapshot.accuracy, successSnapshot.onTimePct ?? null);
          }}
          onRestart={examMistakeFailed ? undefined : () => {
            examAutoFinishedRef.current = false;
            rearmGoalVerdict();
            const usesMetronome = !!currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat";
            resetSuccessView(); resetTimer(); metronome.restartMetronome();
            noteMatchingHandle.current?.resetGame(); setEarTrainingScore(0);
            // Hold the timer for the count-in — it must not eat practice time.
            startTimer(usesMetronome ? getCountInDurationMs(effectiveBpm) : 0);
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
          canFinishSession={canFinishSession} hasLoggedPractice={hasLoggedPractice}
          onFinish={isLastExercise ? async (options?: { earlyFinish?: boolean }) => {
            const earlyFinish = !!options?.earlyFinish;
            // An early finish banks nothing from the run, so there is no
            // snapshot to score it by and no performance to report either.
            const snap = earlyFinish ? null : noteMatchingHandle.current?.snapshot();
            metronome.stopMetronome();
            if (!earlyFinish) await saveCurrentScores();
            autoSubmitReport(exerciseRecordsRef.current,
              hasTrackedPerformance && !isEarTrainingRiddle && snap ? { score: snap.score, accuracy: snap.accuracy, ...micStandingRef.current } : null,
              !earlyFinish && isEarTrainingRiddle ? { score: earTrainingScore, ...earTrainingStandingRef.current } : null,
              { skipSkillPoints: earlyFinish });
            if (isExamMode && snap) onExamComplete?.(snap.accuracy, snap.onTimePct ?? null);
          } : onFinish}
          isMounted={isMounted} currentExercise={currentExercise}
          currentExerciseIndex={currentExerciseIndex} totalExercises={plan.exercises.length}
          isLastExercise={isLastExercise} isPlaying={isPlaying}
          handleNextExercise={handleNextExerciseClick}
          handleBackExercise={() => { stopTimer(); metronome.restartMetronome(); jumpToExercise(currentExerciseIndex - 1); }}
          setVideoDuration={setVideoDuration} setTimerTime={setTimerTime}
          startTimer={startTimer} stopTimer={stopTimer}
          resetScore={() => { noteMatchingHandle.current?.resetGame(); setEarTrainingScore(0); }}
          isFinishing={isFinishing} isSubmittingReport={isSubmittingReport}
          metronome={metronome} effectiveBpm={effectiveBpm}
          audioStartTime={effectiveAudioStartTime}
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
          songSectionMapSlot={isMobileView ? songSectionMapSlot : undefined}
          heroSlot={bossFight ? (bossFight.compactArena ?? bossFight.arena) : undefined}
        />,
        document.body,
      )}

      <DesktopSessionView
        reportResult={reportResult} scoredRuns={scoredRuns}
        currentUserStats={currentUserStats} previousUserStats={previousUserStats}
        activityDataToUse={activityDataToUse} router={router}
        handleRestartFullSession={handleRestartFullSession}
        plan={plan} currentExercise={currentExercise} activeExercise={activeExercise}
        category={currentExercise.category || "mixed"}
        currentExerciseIndex={currentExerciseIndex} completedExercises={completedExercises}
        handleExerciseSelect={handleExerciseSelect} isMicEnabled={isMicEnabled}
        allGpTracks={parsedGpTracks} showAlphaTabScore={showAlphaTabScore}
        selectedGpTrackIdx={gpTrackIdx} setSelectedGpTrackIdx={setSelectedGpTrackIdx}
        handleToggleAlphaTabScore={handleToggleAlphaTabScore}
        effectiveRawGpFile={effectiveRawGpFile} activeTablature={activeTablature}
        isAudioPlaying={isAudioPlaying} metronomeStartTime={metronome.startTime}
        effectiveBpm={effectiveBpm} isAudioMuted={isAudioMuted}
        backingTrackSlot={backingTrack.enabled ? (
          <BackingTrackBar
            controller={backingTrack}
            isPlaying={metronome.isPlaying}
            onTogglePlay={toggleWithoutCountIn}
            onSeekToBeat={handleAlignSeek}
            isAligning={isAligningBacking}
            onAligningChange={setIsAligningBacking}
            onSessionBpmChange={isExamMode ? undefined : metronome.setBpm}
            sessionBpm={metronome.bpm}
            beatsPerBar={barBeatsOf(activeTablature, metronome.accentPattern?.length ?? 4)}
            measures={activeTablature}
            syncTracks={parsedGpTracks ?? undefined}
            mixerTracks={audioTracks}
            onMixerChange={handleMixerChange}
          />
        ) : undefined}
        backingTrackStatus={backingTrack.enabled ? backingTrackStatus : undefined}
        onOpenBackingTrack={openBackingTrack}
        backingCinema={backingTrack.isCinema}
        songSectionMapSlot={isMobileView ? undefined : songSectionMapSlot}
        heroSlot={bossFight?.arena}
        backingAligning={isAligningBacking}
        setupOpen={sessionPhase === "calibrating"}
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
        canFinishSession={canFinishSession} hasLoggedPractice={hasLoggedPractice}
        jumpToExercise={jumpToExercise} isFinishing={isFinishing}
        isSubmittingReport={isSubmittingReport}
        onFinishSession={handleFinishSessionClick}
        onClose={onClose} skipExitDialog={skipExitDialog}
        planHasTablature={planHasTablature} planHasGpFile={planHasGpFile} planHasStrumming={planHasStrumming}
        skillRewardSkillId={skillRewardSkillId} skillRewardAmount={skillRewardAmount}
      />

      <SessionDialogs
        showCompleteDialog={showCompleteDialog} setShowCompleteDialog={setShowCompleteDialog}
        exerciseTitle={currentExercise.title} exerciseDuration={currentExercise.timeInMinutes}
        onFinish={onFinish} handleRestart={handleRestart}
        sessionPhase={sessionPhase} examMode={isExamMode} turned={isUprightPhone}
        handleEnableMic={handleEnableMic} handleSkipMic={handleSkipMic} onLeave={onClose}
        existingCalibrationTimestamp={existingCalibrationTimestamp}
        handleReuseCalibration={handleReuseCalibration} handleRecalibrate={handleRecalibrate}
        handleCalibrationCancel={handleCalibrationCancelAndClose} handleCalibrationComplete={handleCalibrationComplete}
        audioInit={initAudio} audioRefs={audioRefs}
        isListening={isListening} inputGain={inputGain} setInputGain={setInputGain}
        isNative={isNative} onSelectDevice={selectDevice} onSelectChannel={selectChannel} webInput={webInput}
        timingAudioContext={metronome.audioContext} estimateLatencyMs={getLatencyMs}
        onBeforeTimingRun={stopSessionPlayback}
        exerciseId={activeExercise.id} isMounted={isMounted}
        hasReportResult={!!reportResult} showSuccessView={showSuccessView}
        isLastExercise={isLastExercise}
      />

      <TimingCalibrationDialog
        audioRefs={audioRefs} audioContext={metronome.audioContext}
        isListening={isListening} isNative={isNative} estimateLatencyMs={getLatencyMs}
        onEnableMic={() => { if (isMicEnabled) void initAudio(); else updateMicPersistence(true); }}
        onBeforeStart={stopSessionPlayback}
      />

      {/* Dev-only shortcut for exams with no hunt panel to host the button —
          scale-tree exams and record runs, where the only way to finish is to
          play the thing out. Passes at 100% and at whatever tempo the run is
          locked to, so record runs save a record from here too. */}
      {process.env.NODE_ENV !== "production" && isExamMode && !bossFight && !currentExercise.customGoal && isMounted && createPortal(
        <button
          type="button"
          onClick={handleDevCompleteExam}
          title="Dev-only: ends the exam right now and runs the normal finish flow"
          className="fixed bottom-4 left-4 z-[999999999] inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 backdrop-blur-md transition-colors hover:bg-emerald-500/20">
          🏁 Pass exam{lockedExamBpm ? ` @ ${lockedExamBpm} BPM` : ""} (dev)
        </button>,
        document.body,
      )}

      {bossFight && !reportResult && (
        <BossFightControlsProvider value={bossControls}>{bossFight.overlay}</BossFightControlsProvider>
      )}

      <TuningSettingsModal />
      <OutputStalledNotice />
    </>
    </TabOverlayProvider>
    </SessionUIProvider>
    </BpmProgressProvider>
    </TimerProvider>
    </NoteMatchingProvider>
    </GuitarTuningProvider>
  );
};

/**
 * The session reads its plan once, so the words are swapped in front of it: a
 * localized copy of the plan goes in, and everything below — the header, the
 * instructions, the tips — shows the player's language without knowing it.
 */
export const PracticeSession = (props: PracticeSessionProps) => {
  const plan = useLocalizedPlan(props.plan);
  return <PracticeSessionInner {...props} plan={plan} />;
};