import "react-circular-progressbar/dist/styles.css";

import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { parseGpFile } from "feature/songs/services/gp5Parser.service";
import { fetchGpFileAsFile } from "feature/songs/services/userGpFiles.service";
import { selectUserAuth, selectUserAvatar, selectUserInfo,selectUserName } from "feature/user/store/userSlice";
import { useAudioAnalyzer } from "hooks/useAudioAnalyzer";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import Head from "next/head";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "store/hooks";
import { getNoteFromFrequency } from "utils/audio/noteUtils";
import { playCompletionSound } from "utils/audioUtils";

import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import { useAlphaTabPlayer } from "../../hooks/useAlphaTabPlayer";
import { useBpmProgress } from "../../hooks/useBpmProgress";
import { useExamBackingAudio } from "../../hooks/useExamBackingAudio";
import type { AudioTrackConfig} from "../../hooks/useTablatureAudio";
import {useTablatureAudio } from "../../hooks/useTablatureAudio";
import { saveLeaderboardEntry,updateEarTrainingHighScore, updateMicHighScore } from "../../services/bpmProgressService";
import type { ExercisePlan } from "../../types/exercise.types";
import type { BackingTrack } from "../../types/exercise.types";
import { BackgroundAmbiance } from "./components/BackgroundAmbiance";
import { ChordSelectionDialog } from "./components/ChordSelectionDialog";
import { ExerciseContentArea } from "./components/ExerciseContentArea";
import { ExerciseHeroHeader } from "./components/ExerciseHeroHeader";
import { ExerciseInfoGrid } from "./components/ExerciseInfoGrid";
import { ExerciseProgress } from "./components/ExerciseProgress";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { GpLoadingOverlay } from "./components/GpLoadingOverlay";
import { GpTrackSelector } from "./components/GpTrackSelector";
import { MediaControlsToolbar } from "./components/MediaControlsToolbar";
import { MicHud } from "./components/MicHud";
import { ScaleSelectionDialog } from "./components/ScaleSelectionDialog";
import { SessionBottomBar } from "./components/SessionBottomBar";
import { SessionDialogs } from "./components/SessionDialogs";
import { SessionSidebar } from "./components/SessionSidebar";
import { useCalibration } from "./hooks/useCalibration";
import { useEarTraining } from "./hooks/useEarTraining";
import { useGeneratedExercise } from "./hooks/useGeneratedExercise";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";
import type { NoteMatchingHandle, NoteMatchingSnapshot } from "./contexts/NoteMatchingContext";
import { NoteMatchingProvider } from "./contexts/NoteMatchingContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GUITAR_PLAYBACK_KEY = "guitar_playback_enabled";

function loadGuitarPlaybackPreference(): boolean | null {
  try {
    const raw = localStorage.getItem(GUITAR_PLAYBACK_KEY);
    if (raw === null) return null;
    return raw === "true";
  } catch { return null; }
}

function saveGuitarPlaybackPreference(enabled: boolean): void {
  try { localStorage.setItem(GUITAR_PLAYBACK_KEY, String(enabled)); } catch {}
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PracticeSessionProps {
  plan: ExercisePlan;
  /** Raw GP file — when present AlphaTab's built-in synthesizer is used for audio */
  rawGpFile?: File;
  onFinish: () => void;
  onClose: () => void;
  isFinishing?: boolean;
  autoReport?: boolean;
  forceFullDuration?: boolean;
  /** Free mode: no countdown, elapsed time shown, session never auto-completes */
  freeMode?: boolean;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
  /** Exam mode — metronome locked at examBpm, score reported on finish */
  examMode?: boolean;
  examBpm?: number;
  onExamComplete?: (accuracy: number) => void;
  /** Skip exit confirmation dialog — use when navigating back to journey */
  skipExitDialog?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PracticeSession = ({
  plan,
  rawGpFile,
  onFinish,
  onClose,
  isFinishing,
  autoReport,
  forceFullDuration,
  freeMode,
  skillRewardSkillId,
  skillRewardAmount,
  examMode = false,
  examBpm,
  onExamComplete,
  skipExitDialog = false,
}: PracticeSessionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Session state (navigation, timer, report) ─────────────────────────────

  const {
    currentExerciseIndex,
    exerciseKey,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isImageModalOpen,
    isMounted,
    currentExercise,
    nextExercise,
    isLastExercise,
    isPlaying,
    formattedTimeLeft,
    timerProgressValue,
    setShowCompleteDialog,
    setIsImageModalOpen,
    handleNextExercise,
    timeLeft,
    startTimer,
    stopTimer,
    resetTimer,
    showSuccessView,
    resetSuccessView,
    setVideoDuration,
    setTimerTime,
    autoSubmitReport,
    isSubmittingReport,
    reportResult,
    currentUserStats,
    previousUserStats,
    planTitleString,
    sessionTimerData,
    exerciseTimeSpent,
    activityDataToUse,
    jumpToExercise,
    canSkipExercise,
    canFinishSession,
    isSkillExercise,
    completedExercises,
    restartFullSession,
  } = usePracticeSessionState({ plan, onFinish, autoReport, forceFullDuration, freeMode, skillRewardSkillId, skillRewardAmount });

  const userAuth   = useAppSelector(selectUserAuth);
  const userName   = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const userInfo   = useAppSelector(selectUserInfo);

  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  const planHasGpFile = !!rawGpFile || plan.exercises.some(ex => !!ex.gpFileUrl);

  if (planHasGpFile && !isPremium) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500">
          <PremiumGate feature="gp-practice" children={<div />} />
          <button 
            onClick={() => router.back()} 
            className="mt-8 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors w-full font-bold uppercase tracking-widest text-[10px]"
          >
            ← Wróć do biblioteki
          </button>
        </div>
      </div>
    );
  }

  const { bpmStages, completedBpms, isLoading: isBpmLoading, handleToggleBpm } = useBpmProgress(currentExercise);

  // ── Fetch GP file for exercises created from GP ────────────────────────────

  const [fetchedGpFile, setFetchedGpFile] = useState<File | null>(null);
  const [isFetchingGpFile, setIsFetchingGpFile] = useState(false);

  useEffect(() => {
    if (!currentExercise.gpFileUrl) {
      setFetchedGpFile(null);
      return;
    }
    const fileName = currentExercise.title.replace(/[^a-zA-Z0-9._-]/g, "_") + ".gp5";
    setIsFetchingGpFile(true);
    fetchGpFileAsFile(currentExercise.gpFileUrl, fileName)
      .then(file => { setFetchedGpFile(file); setIsFetchingGpFile(false); })
      .catch(() => { setFetchedGpFile(null); setIsFetchingGpFile(false); });
  }, [currentExercise.gpFileUrl]);

  const effectiveRawGpFile = rawGpFile ?? fetchedGpFile ?? undefined;

  // ── Parse GP file to get all tracks ───────────────────────────────────────

  const [parsedGpTracks, setParsedGpTracks] = useState<BackingTrack[] | null>(null);

  useEffect(() => {
    if (!effectiveRawGpFile) { setParsedGpTracks(null); return; }
    parseGpFile(effectiveRawGpFile).then(data => {
      setParsedGpTracks(data.tracks.map((t, idx) => ({
        id: `track-${idx}`,
        name: t.name,
        measures: t.measures,
        trackType: t.trackType as BackingTrack["trackType"],
        pan: t.pan,
      })));
    }).catch(() => setParsedGpTracks(null));
  }, [effectiveRawGpFile]);

  // Track session start once
  useEffect(() => {
    posthog.capture("practice_session_started", {
      plan_title: plan.title,
      exercise_count: plan.exercises.length,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── UI state ──────────────────────────────────────────────────────────────

  const [leaderboardOpen,   setLeaderboardOpen]   = useState(false);
  const [isAudioMuted,      setIsAudioMuted]      = useState(true);
  const [isMetronomeMuted,  setIsMetronomeMuted]  = useState(false);
  const [isHalfSpeed,       setIsHalfSpeed]       = useState(false);
  const [showAlphaTabScore, setShowAlphaTabScore] = useState(false);
  const [tabRepeatCount,    setTabRepeatCount]    = useState(0); // 0 = infinite
  const loopsCompletedRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const [tabRestartKey,     setTabRestartKey]     = useState(0);

  const handleToggleAlphaTabScore = () => {
    setShowAlphaTabScore(prev => {
      const next = !prev;
      if (next) setIsAudioMuted(false);
      return next;
    });
  };

  // ── Generated exercise (scale / chord dialogs) ────────────────────────────

  const {
    showScaleDialog, setShowScaleDialog,
    showChordDialog, setShowChordDialog,
    activeExercise,
    handleGenerated,
  } = useGeneratedExercise({ currentExercise });

  // ── Ear training / riddle ─────────────────────────────────────────────────

  // Bridge ref: filled after useAlphaTabPlayer runs, read by metronome's onPlayStart.
  // This avoids a React render cycle between count-in end and AlphaTab start.
  const alphaTabPlayRef = useRef<(() => void) | null>(null);
  // Bridge ref: filled after useTablatureAudio runs, driven by metronome's onTick.
  // Shares the ~25ms AudioWorklet tick so tablature audio stays locked to the metronome clock.
  const tabTickBridgeRef = useRef<(() => void) | null>(null);

  // AlphaTab's internal AudioContext — captured via api.player.output.context after playerReady.
  // Passed to the metronome so metronome clicks and GP audio share the same audio graph and clock.
  // Reset to null when the GP file changes so a new context is captured on the next playerReady.
  const [alphaTabAudioContext, setAlphaTabAudioContext] = useState<AudioContext | null>(null);
  useEffect(() => { setAlphaTabAudioContext(null); }, [effectiveRawGpFile]);

  // Tracks whether GP audio is actively playing (post count-in). Updated one render after
  // isAudioPlaying to break the circular dependency with useDeviceMetronome's isMuted prop.
  // Used to silence our custom metronome clicks once AlphaTab's built-in metronome takes over.
  const [gpAudioActive, setGpAudioActive] = useState(false);

  const metronome = useDeviceMetronome({
    initialBpm:     examMode && examBpm ? examBpm : (activeExercise.metronomeSpeed?.recommended || 60),
    minBpm:         examMode && examBpm ? examBpm : activeExercise.metronomeSpeed?.min,
    maxBpm:         examMode && examBpm ? examBpm : activeExercise.metronomeSpeed?.max,
    recommendedBpm: examMode && examBpm ? examBpm : activeExercise.metronomeSpeed?.recommended,
    // During GP playback AlphaTab's built-in metronome handles clicks — silence ours.
    // During count-in (gpAudioActive=false) our metronome still clicks normally.
    isMuted:        isMetronomeMuted || gpAudioActive,
    speedMultiplier: isHalfSpeed ? 0.5 : 1,
    onPlayStart:    useCallback(() => { alphaTabPlayRef.current?.(); }, []),
    onTick:         useCallback(() => { tabTickBridgeRef.current?.(); }, []),
    // GP file: share AlphaTab's AudioContext so metronome clicks and GP audio are in the same graph.
    // Non-GP: undefined → metronome creates its own context (already shared with useTablatureAudio).
    externalAudioContext: effectiveRawGpFile ? alphaTabAudioContext : undefined,
  });

  const effectiveBpm = isHalfSpeed ? metronome.bpm / 2 : metronome.bpm;

  // Re-anchors the TablatureViewer cursor to the metronome audio clock on every
  // AlphaTab loop restart, preventing cumulative drift between cursor and GP audio.
  const [alphaTabLoopAnchor, setAlphaTabLoopAnchor] = useState<number | null>(null);

  const {
    riddleMeasures,
    isRiddleRevealed, isRiddleGuessed, setIsRiddleGuessed,
    earTrainingScore, setEarTrainingScore,
    earTrainingHighScore,
    hasPlayedRiddleOnce, setHasPlayedRiddleOnce,
    tabResetKey,
    handleNextRiddle, handleRevealRiddle,
  } = useEarTraining({
    currentExercise,
    userAuth,
    restartMetronome: metronome.restartMetronome,
    startMetronome:   metronome.startMetronome,
    currentBpm:     metronome.bpm,
    setBpm:         metronome.setBpm,
  });

  // ── GP track selection (in-session) ───────────────────────────────────────

  const [selectedGpTrackIdx, setSelectedGpTrackIdx] = useState(0);

  // Reset per-exercise UI flags alongside ear training
  useEffect(() => {
    if (examMode) {
      setIsAudioMuted(true);
    } else if (currentExercise.riddleConfig?.mode === "sequenceRepeat") {
      setIsAudioMuted(false);
    } else {
      const pref = loadGuitarPlaybackPreference();
      if (pref !== null) {
        setIsAudioMuted(!pref);
      } else {
        setIsAudioMuted(!(currentExercise.tablature && currentExercise.tablature.length > 0));
      }
    }
    setIsMetronomeMuted(false);
    setIsHalfSpeed(false);
    setSelectedGpTrackIdx(0);
  }, [currentExercise.id]);

  const allGpTracks = parsedGpTracks;

  const activeTablature = riddleMeasures
    || (allGpTracks ? allGpTracks[selectedGpTrackIdx]?.measures : undefined)
    || activeExercise.tablature;

  const dynamicBackingTracks = useMemo(() => {
    if (allGpTracks && allGpTracks.length > 1) {
      return allGpTracks.filter((_, idx) => idx !== selectedGpTrackIdx);
    }
    return activeExercise.backingTracks;
  }, [allGpTracks, selectedGpTrackIdx, activeExercise.backingTracks]);

  // ── Audio playback ────────────────────────────────────────────────────────

  const [trackConfigs, setTrackConfigs] = useState<Record<string, { volume: number; isMuted: boolean }>>({});

  useEffect(() => {
    const configs: Record<string, { volume: number; isMuted: boolean }> = {
      main: { volume: 1.0, isMuted: isAudioMuted },
    };
    if (dynamicBackingTracks) {
      dynamicBackingTracks.forEach(track => {
        configs[track.id] = { volume: 0.8, isMuted: false };
      });
    }
    setTrackConfigs(configs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExercise.id, selectedGpTrackIdx]);

  // Keep main track mute in sync with global toggle
  useEffect(() => {
    setTrackConfigs(prev => ({
      ...prev,
      main: { ...prev.main, isMuted: isAudioMuted },
    }));
  }, [isAudioMuted]);

  const audioTracks = useMemo((): AudioTrackConfig[] => {
    const tracks: AudioTrackConfig[] = [{
      id: "main",
      name: "Główny Instrument",
      measures: activeTablature || [],
      volume:   trackConfigs.main?.volume ?? 1,
      isMuted:  trackConfigs.main?.isMuted ?? isAudioMuted,
      trackType: "guitar",
      pan: 0,
    }];
    if (dynamicBackingTracks) {
      dynamicBackingTracks.forEach(track => {
        tracks.push({
          id:        track.id,
          name:      track.name,
          measures:  track.measures,
          volume:    trackConfigs[track.id]?.volume ?? 0.8,
          isMuted:   trackConfigs[track.id]?.isMuted ?? false,
          trackType: track.trackType,
          pan:       track.pan,
        });
      });
    }
    return tracks;
  }, [activeTablature, dynamicBackingTracks, trackConfigs, isAudioMuted]);

  const isAudioPlaying = metronome.isPlaying && metronome.countInRemaining === 0 && !!metronome.startTime;

  // Keep gpAudioActive in sync. This drives the isMuted prop on useDeviceMetronome above:
  // true  → our click sounds are silenced; AlphaTab's built-in metronome plays instead.
  // false → our metronome plays click sounds (count-in phase or non-GP exercise).
  useEffect(() => {
    setGpAudioActive(!!effectiveRawGpFile && isAudioPlaying);
  }, [effectiveRawGpFile, isAudioPlaying]);

  // Reset loop anchor when playback stops so the next session starts clean.
  useEffect(() => {
    if (!isAudioPlaying) setAlphaTabLoopAnchor(null);
  }, [isAudioPlaying]);

  // Prefer the loop anchor (re-set on each AlphaTab loop restart) over the fixed
  // metronome start time so cursor re-syncs to beat 0 every loop without drift.
  const effectiveAudioStartTime = alphaTabLoopAnchor ?? metronome.audioStartTime;

  const alphaTabTrackConfigs = useMemo(() =>
    Object.fromEntries(Object.entries(trackConfigs).map(([k, v]) => [k, { isMuted: v.isMuted, volume: v.volume }])),
  [trackConfigs]);

  const alphaTabBackingTrackIds = useMemo(() =>
    (dynamicBackingTracks ?? []).map(t => t.id),
  [dynamicBackingTracks]);

  // AlphaTab synthesizer (GP files) — disabled while notation view is active
  const { playRef: atPlayRef } = useAlphaTabPlayer({
    rawGpFile:      effectiveRawGpFile ?? null,
    bpm:            effectiveBpm,
    isPlaying:      !!effectiveRawGpFile && isAudioPlaying && !showAlphaTabScore,
    startTime:      metronome.startTime,
    onLoopComplete: () => {
      setHasPlayedRiddleOnce(true);
    },
    onLoopRestart:  useCallback(() => {
      // Re-anchor cursor to the current metronome audio clock on each AlphaTab loop
      // restart. Without this, the small scheduling delay of each api.stop()/api.play()
      // call accumulates across loops causing visible drift.
      if (metronome.audioContext) setAlphaTabLoopAnchor(metronome.audioContext.currentTime);
    }, [metronome.audioContext]),
    onAudioContextReady: useCallback((ctx: AudioContext) => {
      // Capture AlphaTab's AudioContext so the metronome can be re-initialised on it,
      // placing metronome clicks and GP audio in the same audio graph and clock domain.
      setAlphaTabAudioContext(ctx);
    }, []),
    // Relay user mute preference to AlphaTab's built-in metronome click track.
    metronomeVolume: isMetronomeMuted ? 0 : 1,
    trackConfigs:   alphaTabTrackConfigs,
    backingTrackIds: alphaTabBackingTrackIds,
  });
  // AlphaTab is driven solely by the isPlaying prop / playback control effect.
  // Do NOT wire alphaTabPlayRef → atPlayRef here: onPlayStart fires before the React
  // render cycle, causing api.play() to be called twice (once imperatively, once from
  // the effect) which triggers api.stop() on an unstarted AlphaTab worklet node.
  alphaTabPlayRef.current = null;
  // Exam backing track (MP3, exam mode only)
  useExamBackingAudio({
    url:       activeExercise.examBacking?.url ?? "",
    sourceBpm: activeExercise.examBacking?.sourceBpm ?? 60,
    targetBpm: effectiveBpm,
    isPlaying: isAudioPlaying,
    enabled:   !!(examMode && activeExercise.examBacking),
    onEnded: () => {
      if (examMode) {
        stopTimer();
        // Force timeLeft → 0 to trigger checkForSuccess
        setTimerTime(999_999_999);
      }
    },
  });

  // Reset loop counter when exercise changes
  useEffect(() => { loopsCompletedRef.current = 0; }, [currentExercise.id]);

  // Custom synthesis fallback — used when no GP file is present
  const { soundfontsReady, schedulerTickRef: tabSchedulerTickRef } = useTablatureAudio({
    tracks:         audioTracks,
    bpm:            effectiveBpm,
    isPlaying:      !effectiveRawGpFile && isAudioPlaying,
    startTime:      metronome.startTime,
    onLoopComplete: () => {
      setHasPlayedRiddleOnce(true);
      if (tabRepeatCount > 0) {
        loopsCompletedRef.current += 1;
        if (loopsCompletedRef.current >= tabRepeatCount) {
          loopsCompletedRef.current = 0;
          metronome.stopMetronome();
          stopTimer();
        }
      }
    },
    audioContext:   metronome.audioContext,
    audioStartTime: effectiveAudioStartTime,
    disabled:       !!effectiveRawGpFile,
    repeatCount:    tabRepeatCount,
  });
  // Sync bridge — keeps tabTickBridgeRef pointing at the live tablature scheduler.
  // The metronome's onTick calls tabTickBridgeRef, which calls tabSchedulerTickRef.current,
  // so useTablatureAudio is driven by the AudioWorklet clock instead of window.setTimeout.
  // Always point at the latest tabSchedulerTickRef value (ref is stable; .current is set by effect).
  tabTickBridgeRef.current = () => tabSchedulerTickRef.current?.();

  // ── Image handling ────────────────────────────────────────────────────────

  const {
    imageScale, setImageScale,
    handleZoomIn, handleZoomOut, resetImagePosition,
  } = useImageHandling();

  const planHasTablature = useMemo(
    () => plan.exercises.some(ex =>
      (ex.tablature && ex.tablature.length > 0) || ex.riddleConfig?.mode === "sequenceRepeat"
    ),
    [plan.exercises]
  );

  const planHasStrumming = useMemo(
    () => plan.exercises.some(ex => ex.strummingPatterns && ex.strummingPatterns.length > 0),
    [plan.exercises]
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) {
          stopTimer();
          metronome.stopMetronome();
        } else {
          startTimer();
          if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
            metronome.startMetronome();
          }
        }
        return;
      }
      if (e.key === "ArrowRight" && !isLastExercise) handleNextExerciseClick();
      if (e.key === "ArrowLeft" && currentExerciseIndex > 0) {
        stopTimer();
        metronome.restartMetronome();
        jumpToExercise(currentExerciseIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastExercise, currentExerciseIndex, isPlaying, startTimer, stopTimer, currentExercise, metronome]);

  // ── Timer controls ────────────────────────────────────────────────────────

  const handleToggleTimer = () => {
    if (isPlaying) {
      stopTimer();
      metronome.stopMetronome();
    } else {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
        metronome.startMetronome();
      }
    }
  };

  const handleRestart = () => {
    stopTimer();
    metronome.restartMetronome();
    resetTimer();
    loopsCompletedRef.current = 0;
    setTabRestartKey(prev => prev + 1);
    setEarTrainingScore(0);
    noteMatchingHandle.current?.resetGame();
    setTimeout(() => {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
        metronome.startMetronome();
      }
    }, 100);
  };

  const handleRestartFullSession = useCallback(() => {
    restartFullSession();
    setTabRestartKey(prev => prev + 1);
  }, [restartFullSession]);

  const handleHalfSpeedToggle = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsHalfSpeed(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (next !== prev) {
        // Restart audio and tablature from beginning when toggling speed (timer keeps running)
        const wasMetronomePlaying = metronome.isPlaying;
        metronome.restartMetronome();
        setTabRestartKey(k => k + 1);
        if (wasMetronomePlaying) {
          setTimeout(() => {
            if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
              metronome.startMetronome();
            }
          }, 100);
        }
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer, resetTimer, startTimer, metronome, currentExercise]);

  // ── Score saving ──────────────────────────────────────────────────────────

  const exerciseRecordsRef = useRef<{
    micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
    earTrainingHighScore?: { exerciseTitle: string; score: number };
  }>({});

  const saveCurrentScores = async () => {
    const snap      = noteMatchingHandle.current?.snapshot();
    const exId      = activeExercise.id;
    const exTitle   = activeExercise.title;
    const exCategory = activeExercise.category;
    if (userAuth && isMicEnabled && snap && snap.score > 0) {
      const result = await updateMicHighScore(userAuth, exId, snap.score, snap.accuracy, exTitle, exCategory);
      saveLeaderboardEntry(userAuth, exId, snap.score, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          micHighScore: { exerciseTitle: exTitle, score: snap.score, accuracy: snap.accuracy },
        };
      }
    }
    if (userAuth && currentExercise.riddleConfig?.mode === "sequenceRepeat" && earTrainingScore > 0) {
      const result = await updateEarTrainingHighScore(userAuth, exId, earTrainingScore, exTitle, exCategory);
      saveLeaderboardEntry(userAuth, exId, earTrainingScore, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          earTrainingHighScore: { exerciseTitle: exTitle, score: earTrainingScore },
        };
      }
    }
  };

  const handleNextExerciseClick = async () => {
    await saveCurrentScores();
    stopTimer();
    metronome.restartMetronome();
    handleNextExercise(resetTimer);
  };

  // ── Audio analyzer + calibration ──────────────────────────────────────────

  const {
    frequency, volume, isListening,
    init: initAudio, close: closeAudio,
    audioRefs, getLatencyMs,
    inputGain, setInputGain,
  } = useAudioAnalyzer();

  const {
    sessionPhase,
    isMicEnabled: _isMicEnabled,
    handleEnableMic, handleSkipMic,
    handleReuseCalibration, handleRecalibrate,
    handleCalibrationComplete, handleCalibrationCancel,
    getAdjustedTargetFreq,
    existingCalibrationTimestamp,
    setIsMicEnabled: updateMicPersistence,
    setSessionPhase,
  } = useCalibration(planHasTablature);

  const isMicEnabled = _isMicEnabled && !currentExercise.isPlayalong;

  // In exam mode, force the mic prompt at session start if mic isn't already configured
  useEffect(() => {
    if (examMode && !_isMicEnabled) setSessionPhase("mic_prompt");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-init audio when mic enabled
  useEffect(() => {
    if (isMicEnabled && !isListening) initAudio();
  }, [isMicEnabled]);

  const detectedNoteData = useMemo(() => {
    if (!frequency || frequency < 50) return null;
    return getNoteFromFrequency(frequency);
  }, [frequency]);

  // ── Note matching — moved to NoteMatchingProvider ────────────────────────
  // PracticeSession reads final values only via noteMatchingHandle.snapshot()

  const activeStrumPattern = currentExercise.strummingPatterns?.[0];
  const noteMatchingHandle = useRef<NoteMatchingHandle | null>(null);
  const [successSnapshot, setSuccessSnapshot] = useState<NoteMatchingSnapshot | null>(null);

  // Capture end-of-session snapshot as soon as the success view should appear
  useEffect(() => {
    if (showSuccessView) setSuccessSnapshot(noteMatchingHandle.current?.snapshot() ?? null);
  }, [showSuccessView]);

  // ── Completion notification ───────────────────────────────────────────────

  const [showCompletionNotification, setShowCompletionNotification] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 && isMounted && !showCompleteDialog && !reportResult && !showSuccessView && !isLastExercise) {
      playCompletionSound();
      setShowCompletionNotification(true);
      const timer = setTimeout(() => setShowCompletionNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isMounted, showCompleteDialog, reportResult, showSuccessView, isLastExercise]);

  // Auto-stop timer when time runs out
  useEffect(() => {
    if (timeLeft > 0) return;
    if (isPlaying) stopTimer();
    if (metronome.isPlaying) metronome.toggleMetronome();
  }, [timeLeft, isPlaying, metronome.isPlaying, stopTimer]);

  // ── Hide site header during session ───────────────────────────────────────

  useEffect(() => {
    const header = document.querySelector("header.sticky") as HTMLElement | null;
    if (header) header.style.display = "none";
    return () => {
      if (header) header.style.display = "";
    };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const category = currentExercise.category || "mixed";

  const handleMicToggle = useCallback(async () => {
    if (isMicEnabled) { closeAudio(); updateMicPersistence(false); } else { updateMicPersistence(true); }
  }, [isMicEnabled, closeAudio, updateMicPersistence]);

  const handleAudioToggle = useCallback(() => {
    const newMuted = !isAudioMuted;
    setIsAudioMuted(newMuted);
    saveGuitarPlaybackPreference(!newMuted);
  }, [isAudioMuted]);

  const handleExerciseSelect = useCallback((idx: number) => {
    stopTimer();
    metronome.restartMetronome();
    jumpToExercise(idx);
  }, [stopTimer, metronome.restartMetronome, jumpToExercise]);

  const handleEarTrainingGuessed = useCallback(() => {
    setEarTrainingScore(s => s + 1);
    setIsRiddleGuessed(true);
    handleRevealRiddle();
  }, [handleRevealRiddle]);

  const handleRepeatCountChange = useCallback(() => { loopsCompletedRef.current = 0; }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const handleNoteMatchingReset = useCallback(() => setEarTrainingScore(0), []);

  return (
    <NoteMatchingProvider
      handleRef={noteMatchingHandle}
      isPlaying={isPlaying}
      startTime={metronome.startTime}
      effectiveBpm={effectiveBpm}
      rawBpm={metronome.bpm}
      activeTablature={activeTablature}
      isMicEnabled={isMicEnabled}
      currentExerciseIndex={currentExerciseIndex}
      isHalfSpeed={isHalfSpeed}
      getLatencyMs={getLatencyMs}
      audioRefs={audioRefs}
      getAdjustedTargetFreq={getAdjustedTargetFreq}
      activeStrumPattern={activeStrumPattern}
      onReset={handleNoteMatchingReset}
    >
    <>
      <Head>
        <title>{formattedTimeLeft} | {activeExercise.title}</title>
      </Head>

      {/* Generated Exercise Dialogs */}
      <ScaleSelectionDialog
        isOpen={showScaleDialog}
        onClose={() => setShowScaleDialog(false)}
        onExerciseGenerated={handleGenerated}
      />
      <ChordSelectionDialog
        isOpen={showChordDialog}
        onClose={() => setShowChordDialog(false)}
        onExerciseGenerated={handleGenerated}
      />

      {/* Mobile: report overlay */}
      {isMobileView && reportResult && currentUserStats && previousUserStats && (
        <div className="fixed inset-0 z-[999999999] overflow-y-auto bg-zinc-950">
          <RatingPopUp
            ratingData={reportResult}
            currentUserStats={currentUserStats}
            previousUserStats={previousUserStats}
            onClick={() => router.push("/dashboard")}
            activityData={activityDataToUse}
            onRestart={handleRestartFullSession}
          />
        </div>
      )}

      {/* GP file loading overlay */}
      <GpLoadingOverlay isLoading={isFetchingGpFile} />

      {/* Success view */}
      {showSuccessView && !reportResult && successSnapshot && (
        <ExerciseSuccessView
          planTitle={planTitleString}
          examMode={examMode}
          score={successSnapshot.score}
          maxScore={successSnapshot.maxPossibleScore}
          stats={{ accuracy: successSnapshot.accuracy, maxStreak: successSnapshot.maxCombo }}
          timeline={successSnapshot.noteTimeline}
          onFinish={async () => {
            metronome.stopMetronome();
            await saveCurrentScores();
            autoSubmitReport(
              exerciseRecordsRef.current,
              isMicEnabled ? { score: successSnapshot.score, accuracy: successSnapshot.accuracy } : null,
              currentExercise.riddleConfig?.mode === "sequenceRepeat" ? { score: earTrainingScore } : null
            );
            if (examMode) onExamComplete?.(successSnapshot.accuracy);
          }}
          onRestart={() => {
            resetSuccessView();
            resetTimer();
            metronome.restartMetronome();
            startTimer();
            if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
              metronome.startMetronome();
            }
          }}
          isLoading={isFinishing || isSubmittingReport}
        />
      )}

      {/* Mobile modals — rendered via portal to document.body to escape parent stacking contexts */}
      {isMobileView && createPortal(
        <>
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageSrc={currentExercise.imageUrl || currentExercise.image || ""}
            imageAlt={currentExercise.title}
          />
          <SessionModal
            examMode={examMode}
            isOpen={isFullSessionModalOpen && !showCompleteDialog && !reportResult && !showSuccessView}
            onClose={onClose }
            onFinish={isLastExercise ? async () => {
              const snap = noteMatchingHandle.current?.snapshot();
              metronome.stopMetronome();
              await saveCurrentScores();
              autoSubmitReport(
                exerciseRecordsRef.current,
                isMicEnabled && snap ? { score: snap.score, accuracy: snap.accuracy } : null,
                currentExercise.riddleConfig?.mode === "sequenceRepeat" ? { score: earTrainingScore } : null
              );
              if (examMode && snap) onExamComplete?.(snap.accuracy);
            } : onFinish}
            onImageClick={() => setIsImageModalOpen(true)}
            isMounted={isMounted}
            currentExercise={currentExercise}
            nextExercise={nextExercise}
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={plan.exercises.length}
            isLastExercise={isLastExercise}
            isPlaying={isPlaying}
            formattedTimeLeft={formattedTimeLeft}
            toggleTimer={handleToggleTimer}
            handleNextExercise={handleNextExerciseClick}
            handleBackExercise={() => {
              stopTimer();
              metronome.restartMetronome();
              jumpToExercise(currentExerciseIndex - 1);
            }}
            sessionTimerData={sessionTimerData}
            exerciseTimeSpent={exerciseTimeSpent}
            setVideoDuration={setVideoDuration}
            setTimerTime={setTimerTime}
            startTimer={startTimer}
            stopTimer={stopTimer}
            isFinishing={isFinishing}
            isSubmittingReport={isSubmittingReport}
            canSkipExercise={canSkipExercise}
            metronome={metronome}
            effectiveBpm={effectiveBpm}
            isMicEnabled={isMicEnabled}
            toggleMic={handleMicToggle}
            detectedNoteData={detectedNoteData}
            isListening={isListening}
            isAudioMuted={isAudioMuted}
            setIsAudioMuted={setIsAudioMuted}
            isMetronomeMuted={isMetronomeMuted}
            setIsMetronomeMuted={setIsMetronomeMuted}
            isHalfSpeed={isHalfSpeed}
            onHalfSpeedToggle={handleHalfSpeedToggle}
            activeTablature={activeTablature}
            isRiddleRevealed={isRiddleRevealed}
            isRiddleGuessed={isRiddleGuessed}
            hasPlayedRiddleOnce={hasPlayedRiddleOnce}
            handleNextRiddle={handleNextRiddle}
            handleRevealRiddle={handleRevealRiddle}
            earTrainingScore={earTrainingScore}
            earTrainingHighScore={earTrainingHighScore}
            exerciseUrl={`/exercises/${activeExercise.id.replace(/_/g, "-")}`}
            onEarTrainingGuessed={() => {
              setEarTrainingScore(s => s + 1);
              setIsRiddleGuessed(true);
              handleRevealRiddle();
            }}
            bpmStages={bpmStages}
            completedBpms={completedBpms}
            isBpmLoading={isBpmLoading}
            onBpmToggle={handleToggleBpm}
            onRecordsClick={() => setLeaderboardOpen(true)}
          />
        </>,
        document.body
      )}

      {/* ── Desktop view ──────────────────────────────────────────────────── */}
      <div className={cn("font-openSans fixed inset-0 z-[999999] bg-zinc-950", "overflow-y-auto", isMobileView && "hidden")}>

        {/* Background ambiance glows */}
        <BackgroundAmbiance
          category={category}
          isPlayalong={currentExercise.isPlayalong}
          visible={!reportResult}
        />

        <TooltipProvider>
          <div>
            <div className={cn(
              "mx-auto max-w-[2400px] px-6 pb-64 pt-4 relative z-10",
              reportResult && "max-w-7xl px-4 pt-8"
            )}>

              {/* ── Report result ── */}
              {reportResult && currentUserStats && previousUserStats ? (
                <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                  <RatingPopUp
                    ratingData={reportResult}
                    currentUserStats={currentUserStats}
                    previousUserStats={previousUserStats}
                    onClick={() => router.push("/dashboard")}
                    activityData={activityDataToUse}
                    hideWrapper={true}
                    onRestart={handleRestartFullSession}
                  />
                </div>
              ) : (
                <>
                  {/* 1. Progress bar */}
                  <div className="mb-8">
                    <ExerciseProgress
                      plan={plan}
                      currentExerciseIndex={currentExerciseIndex}
                      completedExercises={completedExercises}
                      onExerciseSelect={handleExerciseSelect}
                    />
                  </div>

                  {/* 2. Hero section */}
                  <div className={cn(
                    "flex flex-col items-center justify-center text-center",
                    currentExercise.isPlayalong ? "mb-6 mt-0" : "mb-12 mt-8"
                  )}>
                    <ExerciseHeroHeader
                      exercise={currentExercise}
                      activeExercise={activeExercise}
                      plan={plan}
                    />

                    {/* Mic game HUD */}
                    {isMicEnabled && <MicHud />}

                    {/* GP track selector */}
                    {allGpTracks && !showAlphaTabScore && (
                      <GpTrackSelector
                        tracks={allGpTracks}
                        selectedIdx={selectedGpTrackIdx}
                        onChange={setSelectedGpTrackIdx}
                      />
                    )}

                    {/* Media controls toolbar */}
                    <MediaControlsToolbar
                      hasMetronome={!!currentExercise.metronomeSpeed}
                      hasAudioTrack={!!((currentExercise.tablature && currentExercise.tablature.length > 0) || planHasTablature || planHasGpFile || planHasStrumming)}
                      hasMicControls={planHasTablature || planHasGpFile || planHasStrumming}
                      isHalfSpeed={isHalfSpeed}
                      onHalfSpeedToggle={handleHalfSpeedToggle}
                      isAudioMuted={isAudioMuted}
                      isRiddleMode={currentExercise.riddleConfig?.mode === "sequenceRepeat"}
                      onAudioToggle={handleAudioToggle}
                      isMicEnabled={isMicEnabled}
                      onMicToggle={handleMicToggle}
                      onRecalibrate={handleRecalibrate}
                    />

                    {/* 3. Content area (tab / notation / video / image) */}
                    <ExerciseContentArea
                      activeTablature={activeTablature}
                      currentExercise={currentExercise}
                      activeExercise={activeExercise}
                      rawGpFile={effectiveRawGpFile}
                      showAlphaTabScore={showAlphaTabScore}
                      onToggleAlphaTabScore={handleToggleAlphaTabScore}
                      isAudioPlaying={isAudioPlaying}
                      startTime={metronome.startTime}
                      effectiveBpm={effectiveBpm}
                      isAudioMuted={isAudioMuted}
                      isMobileView={isMobileView}
                      isMetronomePlaying={metronome.isPlaying}
                      countInRemaining={(metronome as any).countInRemaining ?? 0}
                      detectedNoteData={detectedNoteData}
                      isListening={isListening}
                      audioContext={metronome.audioContext}
                      audioStartTime={effectiveAudioStartTime}
                      tabResetKey={tabResetKey + tabRestartKey}
                      isRiddleRevealed={isRiddleRevealed}
                      isRiddleGuessed={isRiddleGuessed}
                      hasPlayedRiddleOnce={hasPlayedRiddleOnce}
                      earTrainingScore={earTrainingScore}
                      earTrainingHighScore={earTrainingHighScore}
                      onPlayRiddle={handleToggleTimer}
                      onRevealRiddle={handleRevealRiddle}
                      onNextRiddle={handleNextRiddle}
                      onEarTrainingGuessed={handleEarTrainingGuessed}
                      onLeaderboardClick={() => setLeaderboardOpen(true)}
                      imageScale={imageScale}
                      setImageScale={setImageScale}
                      containerRef={containerRef}
                      setIsImageModalOpen={setIsImageModalOpen}
                      handleZoomIn={handleZoomIn}
                      handleZoomOut={handleZoomOut}
                      resetImagePosition={resetImagePosition}
                      startTimer={startTimer}
                      stopTimer={stopTimer}
                      setVideoDuration={setVideoDuration}
                      setTimerTime={setTimerTime}
                      onVideoEnd={handleNextExerciseClick}
                      isPlaying={isPlaying}
                      isMicEnabled={isMicEnabled}
                      volumeRef={audioRefs.volumeRef}
                    />
                  </div>

                  {/* 4. Controls & Instructions */}
                  <ExerciseInfoGrid
                    exercise={activeExercise}
                    isPlayalong={currentExercise.isPlayalong}
                    hasMetronome={!!currentExercise.metronomeSpeed}
                  >
                    <SessionSidebar
                      currentExercise={currentExercise}
                      activeExercise={activeExercise}
                      metronome={metronome}
                      isMetronomeMuted={isMetronomeMuted}
                      setIsMetronomeMuted={setIsMetronomeMuted}
                      audioTracks={audioTracks}
                      trackConfigs={trackConfigs}
                      setTrackConfigs={setTrackConfigs}
                      bpmStages={bpmStages}
                      completedBpms={completedBpms}
                      isBpmLoading={isBpmLoading}
                      onBpmToggle={handleToggleBpm}
                      examMode={examMode}
                    />
                  </ExerciseInfoGrid>

                  {/* 5. Bottom bar */}
                  {!reportResult && (
                    <SessionBottomBar
                      examMode={examMode}
                      onClose={onClose}
                      skipExitDialog={skipExitDialog}
                      exerciseKey={exerciseKey}
                      currentExercise={currentExercise}
                      isLastExercise={isLastExercise}
                      isPlaying={isPlaying}
                      timerProgressValue={timerProgressValue}
                      formattedTimeLeft={formattedTimeLeft}
                      toggleTimer={handleToggleTimer}
                      handleRestart={handleRestart}
                      handleNextExerciseClick={handleNextExerciseClick}
                      sessionTimerData={sessionTimerData}
                      exerciseTimeSpent={exerciseTimeSpent}
                      canSkipExercise={canSkipExercise}
                      canFinishSession={canFinishSession}
                      isSkillExercise={isSkillExercise}
                      timeLeft={timeLeft}
                      currentExerciseIndex={currentExerciseIndex}
                      onGoToPreviousExercise={() => {
                        stopTimer();
                        metronome.restartMetronome();
                        jumpToExercise(currentExerciseIndex - 1);
                      }}
                      isFinishing={isFinishing}
                      isSubmittingReport={isSubmittingReport}
                      onFinishSession={async () => {
                        metronome.stopMetronome();
                        await saveCurrentScores();
                        autoSubmitReport(exerciseRecordsRef.current);
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* ── Session dialogs ─────────────────────────────────────────────── */}
      <SessionDialogs
        showCompleteDialog={showCompleteDialog}
        setShowCompleteDialog={setShowCompleteDialog}
        exerciseTitle={currentExercise.title}
        exerciseDuration={currentExercise.timeInMinutes}
        onFinish={onFinish}
        resetTimer={resetTimer}
        startTimer={startTimer}
        sessionPhase={sessionPhase}
        examMode={examMode}
        handleEnableMic={handleEnableMic}
        handleSkipMic={handleSkipMic}
        existingCalibrationTimestamp={existingCalibrationTimestamp}
        handleReuseCalibration={handleReuseCalibration}
        handleRecalibrate={handleRecalibrate}
        handleCalibrationCancel={handleCalibrationCancel}
        handleCalibrationComplete={handleCalibrationComplete}
        audioInit={initAudio}
        audioClose={closeAudio}
        audioRefs={audioRefs}
        isListening={isListening}
        inputGain={inputGain}
        setInputGain={setInputGain}
        leaderboardOpen={leaderboardOpen}
        setLeaderboardOpen={setLeaderboardOpen}
        exerciseId={activeExercise.id}
        showCompletionNotification={showCompletionNotification}
      />
    </>
    </NoteMatchingProvider>
  );
};
