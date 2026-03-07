import "react-circular-progressbar/dist/styles.css";
import posthog from "posthog-js";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import { Timer } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaInfoCircle, FaLightbulb } from "react-icons/fa";

import { useBpmProgress } from "../../hooks/useBpmProgress";
import { updateMicHighScore, updateEarTrainingHighScore, saveLeaderboardEntry } from "../../services/bpmProgressService";
import { playCompletionSound } from "utils/audioUtils";
import type { ExercisePlan } from "../../types/exercise.types";

import { ExerciseProgress } from "./components/ExerciseProgress";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { ExerciseContentArea } from "./components/ExerciseContentArea";
import { MainTimerSection } from "./components/MainTimerSection";
import { MicHud } from "./components/MicHud";
import { ScaleSelectionDialog } from "./components/ScaleSelectionDialog";
import { ChordSelectionDialog } from "./components/ChordSelectionDialog";
import { SessionBottomBar } from "./components/SessionBottomBar";
import { SessionDialogs } from "./components/SessionDialogs";
import { SessionSidebar } from "./components/SessionSidebar";

import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import { useNoteMatching } from "./hooks/useNoteMatching";
import { useEarTraining } from "./hooks/useEarTraining";
import { useGeneratedExercise } from "./hooks/useGeneratedExercise";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";

import { selectUserAuth, selectUserName, selectUserAvatar } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import { AlphaTabScoreViewer } from "./components/AlphaTabScoreViewer";
import { useTablatureAudio, AudioTrackConfig } from "../../hooks/useTablatureAudio";
import { useAlphaTabPlayer } from "../../hooks/useAlphaTabPlayer";
import { useAudioAnalyzer } from "hooks/useAudioAnalyzer";
import { getNoteFromFrequency } from "utils/audio/noteUtils";
import { useCalibration } from "./hooks/useCalibration";

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
  onClose?: () => void;
  isFinishing?: boolean;
  autoReport?: boolean;
  forceFullDuration?: boolean;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
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
  skillRewardSkillId,
  skillRewardAmount,
}: PracticeSessionProps) => {
  const { t } = useTranslation(["exercises", "common"]);
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
  } = usePracticeSessionState({ plan, onFinish, autoReport, forceFullDuration, skillRewardSkillId, skillRewardAmount });

  const userAuth   = useAppSelector(selectUserAuth);
  const userName   = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  const { bpmStages, completedBpms, isLoading: isBpmLoading, handleToggleBpm } = useBpmProgress(currentExercise);

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

  const metronome = useDeviceMetronome({
    initialBpm:     activeExercise.metronomeSpeed?.recommended || 60,
    minBpm:         activeExercise.metronomeSpeed?.min,
    maxBpm:         activeExercise.metronomeSpeed?.max,
    recommendedBpm: activeExercise.metronomeSpeed?.recommended,
    isMuted:        isMetronomeMuted,
    speedMultiplier: isHalfSpeed ? 0.5 : 1,
  });

  const effectiveBpm = isHalfSpeed ? metronome.bpm / 2 : metronome.bpm;

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
    isMetronomeRunning: metronome.isPlaying,
    stopMetronome:  metronome.stopMetronome,
    startMetronome: metronome.startMetronome,
    currentBpm:     metronome.bpm,
    setBpm:         metronome.setBpm,
  });

  // Reset per-exercise UI flags alongside ear training
  useEffect(() => {
    const pref = loadGuitarPlaybackPreference();
    if (pref !== null) {
      setIsAudioMuted(!pref);
    } else {
      setIsAudioMuted(
        !(currentExercise.riddleConfig?.mode === "sequenceRepeat" ||
          (currentExercise.tablature && currentExercise.tablature.length > 0))
      );
    }
    setIsMetronomeMuted(false);
    setIsHalfSpeed(false);
  }, [currentExercise.id]);

  const activeTablature = riddleMeasures || activeExercise.tablature;

  // ── Audio playback ────────────────────────────────────────────────────────

  const [trackConfigs, setTrackConfigs] = useState<Record<string, { volume: number; isMuted: boolean }>>({});

  useEffect(() => {
    const configs: Record<string, { volume: number; isMuted: boolean }> = {
      main: { volume: 1.0, isMuted: isAudioMuted },
    };
    if (activeExercise.backingTracks) {
      activeExercise.backingTracks.forEach(track => {
        configs[track.id] = { volume: 0.8, isMuted: false };
      });
    }
    setTrackConfigs(configs);
  }, [activeExercise.id, activeExercise.backingTracks]);

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
    if (activeExercise.backingTracks) {
      activeExercise.backingTracks.forEach(track => {
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
  }, [activeTablature, activeExercise.backingTracks, trackConfigs, isAudioMuted]);

  const isAudioPlaying = metronome.isPlaying && metronome.countInRemaining === 0 && !!metronome.startTime;

  const alphaTabTrackConfigs = useMemo(() =>
    Object.fromEntries(Object.entries(trackConfigs).map(([k, v]) => [k, { isMuted: v.isMuted, volume: v.volume }])),
  [trackConfigs]);

  const alphaTabBackingTrackIds = useMemo(() =>
    (activeExercise.backingTracks ?? []).map(t => t.id),
  [activeExercise.backingTracks]);

  // AlphaTab synthesizer (GP files) — disabled while notation view is active
  useAlphaTabPlayer({
    rawGpFile:      rawGpFile ?? null,
    bpm:            effectiveBpm,
    isPlaying:      !!rawGpFile && isAudioPlaying && !showAlphaTabScore,
    startTime:      metronome.startTime,
    onLoopComplete: () => setHasPlayedRiddleOnce(true),
    trackConfigs:   alphaTabTrackConfigs,
    backingTrackIds: alphaTabBackingTrackIds,
  });

  // Custom synthesis fallback — used when no GP file is present
  const { soundfontsReady } = useTablatureAudio({
    tracks:         audioTracks,
    bpm:            effectiveBpm,
    isPlaying:      !rawGpFile && isAudioPlaying,
    startTime:      metronome.startTime,
    onLoopComplete: () => setHasPlayedRiddleOnce(true),
    audioContext:   metronome.audioContext,
    audioStartTime: metronome.audioStartTime,
    disabled:       !!rawGpFile,
  });

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
        metronome.stopMetronome();
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
    setTimeout(() => {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
        metronome.startMetronome();
      }
    }, 100);
  };

  // ── Score saving ──────────────────────────────────────────────────────────

  const exerciseRecordsRef = useRef<{
    micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
    earTrainingHighScore?: { exerciseTitle: string; score: number };
  }>({});

  const saveCurrentScores = async () => {
    const exId       = activeExercise.id;
    const exTitle    = activeExercise.title;
    const exCategory = activeExercise.category;
    if (userAuth && isMicEnabled && gameState.score > 0) {
      const result = await updateMicHighScore(userAuth, exId, gameState.score, sessionAccuracy, exTitle, exCategory);
      saveLeaderboardEntry(userAuth, exId, gameState.score, userName || "Anonymous", userAvatar || "");
      if (result.isNewRecord) {
        exerciseRecordsRef.current = {
          ...exerciseRecordsRef.current,
          micHighScore: { exerciseTitle: exTitle, score: gameState.score, accuracy: sessionAccuracy },
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
    metronome.stopMetronome();
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
    isMicEnabled,
    handleEnableMic, handleSkipMic,
    handleReuseCalibration, handleRecalibrate,
    handleCalibrationComplete, handleCalibrationCancel,
    getAdjustedTargetFreq,
    existingCalibrationTimestamp,
    setIsMicEnabled: updateMicPersistence,
    setSessionPhase,
  } = useCalibration(planHasTablature);

  // Auto-init audio when mic enabled
  useEffect(() => {
    if (isMicEnabled && !isListening) initAudio();
  }, [isMicEnabled]);

  const detectedNoteData = useMemo(() => {
    if (!frequency || frequency < 50) return null;
    return getNoteFromFrequency(frequency);
  }, [frequency]);

  // ── Note matching (RAF game loop) ─────────────────────────────────────────

  const { hitNotes, sessionAccuracy, gameState, maxPossibleScore, currentBeatsElapsed } = useNoteMatching({
    isPlaying,
    startTime:          metronome.startTime,
    effectiveBpm,
    rawBpm:             metronome.bpm,
    activeTablature,
    isMicEnabled,
    currentExerciseIndex,
    isHalfSpeed,
    getLatencyMs,
    audioRefs,
    getAdjustedTargetFreq,
    onReset: () => setEarTrainingScore(0),
  });

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

  // ── Derived ───────────────────────────────────────────────────────────────

  const category = currentExercise.category || "mixed";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
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
          />
        </div>
      )}

      {/* Success view */}
      {showSuccessView && !reportResult && (
        <ExerciseSuccessView
          planTitle={planTitleString}
          onFinish={async () => {
            await saveCurrentScores();
            autoSubmitReport(
              exerciseRecordsRef.current,
              isMicEnabled ? { score: gameState.score, accuracy: sessionAccuracy } : null,
              currentExercise.riddleConfig?.mode === "sequenceRepeat" ? { score: earTrainingScore } : null
            );
          }}
          onRestart={() => { resetSuccessView(); resetTimer(); startTimer(); }}
          isLoading={isFinishing || isSubmittingReport}
        />
      )}

      {/* Mobile modals */}
      {isMobileView && (
        <>
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageSrc={currentExercise.imageUrl || currentExercise.image || ""}
            imageAlt={currentExercise.title}
          />
          <SessionModal
            isOpen={isFullSessionModalOpen && !showCompleteDialog && !reportResult}
            onClose={onClose || (() => router.push("/report"))}
            onFinish={isLastExercise ? async () => {
              await saveCurrentScores();
              autoSubmitReport(
                exerciseRecordsRef.current,
                isMicEnabled ? { score: gameState.score, accuracy: sessionAccuracy } : null,
                currentExercise.riddleConfig?.mode === "sequenceRepeat" ? { score: earTrainingScore } : null
              );
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
            handleBackExercise={() => jumpToExercise(currentExerciseIndex - 1)}
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
            toggleMic={async () => { if (isListening) closeAudio(); else await initAudio(); }}
            gameState={gameState}
            maxPossibleScore={maxPossibleScore}
            sessionAccuracy={sessionAccuracy}
            detectedNoteData={detectedNoteData}
            isListening={isListening}
            hitNotes={hitNotes}
            currentBeatsElapsed={currentBeatsElapsed}
            isAudioMuted={isAudioMuted}
            setIsAudioMuted={setIsAudioMuted}
            isMetronomeMuted={isMetronomeMuted}
            setIsMetronomeMuted={setIsMetronomeMuted}
            isHalfSpeed={isHalfSpeed}
            onHalfSpeedToggle={setIsHalfSpeed}
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
        </>
      )}

      {/* ── Desktop view ──────────────────────────────────────────────────── */}
      <div className={cn("font-openSans min-h-screen bg-zinc-950 relative overflow-hidden", isMobileView && "hidden")}>

        {/* Background ambiance glows */}
        {!reportResult && (
          <>
            <div className={cn(
              "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
              category === "technique"  && "bg-blue-500",
              category === "theory"     && "bg-emerald-500",
              category === "creativity" && "bg-purple-500",
              category === "hearing"    && "bg-orange-500",
              category === "mixed"      && "bg-cyan-500",
              currentExercise.isPlayalong && "bg-red-600 opacity-30 blur-[150px]"
            )} />
            <div className={cn(
              "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 transition-all duration-1000",
              category === "technique"  && "bg-indigo-500",
              category === "theory"     && "bg-green-500",
              category === "creativity" && "bg-pink-500",
              category === "hearing"    && "bg-amber-500",
              category === "mixed"      && "bg-blue-500"
            )} />
          </>
        )}

        <TooltipProvider>
          <ExerciseLayout
            title={reportResult ? "Practice Summary" : plan.title}
            showBreadcrumbs={false}
            className="border-b border-white/5 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50"
          >
            <div className={cn(
              "mx-auto max-w-8xl px-6 pb-64 pt-4 relative z-10",
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
                  />
                </div>
              ) : (
                <>
                  {/* 1. Progress bar */}
                  <div className="mb-8">
                    <ExerciseProgress
                      plan={plan}
                      currentExerciseIndex={currentExerciseIndex}
                      onExerciseSelect={(idx) => {
                        if (metronome.isPlaying) metronome.toggleMetronome();
                        jumpToExercise(idx);
                      }}
                    />
                  </div>

                  {/* 2. Hero section */}
                  <div className={cn(
                    "flex flex-col items-center justify-center text-center",
                    currentExercise.isPlayalong ? "mb-6 mt-0" : "mb-12 mt-8"
                  )}>
                    <h2 className={cn(
                      "font-bold text-white tracking-tight flex flex-wrap items-center justify-center gap-3 mb-8",
                      currentExercise.isPlayalong ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
                    )}>
                      {currentExercise.isPlayalong && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 backdrop-blur-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-bold tracking-wide text-red-400">Playalong</span>
                        </div>
                      )}
                      {activeExercise.title}
                    </h2>

                    {activeExercise.customGoal && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentExercise.customGoal}
                        className="mb-12 flex flex-col items-center gap-4"
                      >
                        <div className="relative group">
                          <div className="absolute -inset-8 bg-cyan-500/20 blur-[40px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
                          <div className="relative w-32 h-32 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                            <span className="text-6xl font-extrabold text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                              {currentExercise.customGoal}
                            </span>
                          </div>
                        </div>
                        {currentExercise.customGoalDescription && (
                          <p className="text-xs text-zinc-500 font-semibold tracking-wide mt-2">
                            {currentExercise.customGoalDescription}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {!!(plan as any).streakDays && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 w-full max-w-2xl px-6 py-4 rounded-xl bg-main/10 border border-main/20 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-main text-white"><Timer size={20} /></div>
                          <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">
                              Challenge: {(plan as any).title}
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">{(plan as any).description}</p>
                            <p className="text-xs text-main font-semibold tracking-wide">
                              Reward: {(plan as any).rewardDescription}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {Array.from({ length: (plan as any).streakDays }).map((_, i) => (
                            <div key={i} className="h-1.5 w-6 rounded-full bg-main/20 border border-main/10" />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Mic game HUD */}
                    {isMicEnabled && (
                      <MicHud
                        gameState={gameState}
                        maxPossibleScore={maxPossibleScore}
                        sessionAccuracy={sessionAccuracy}
                      />
                    )}

                    {/* 3. Content area (tab / notation / video / image) */}
                    <ExerciseContentArea
                      activeTablature={activeTablature}
                      currentExercise={currentExercise}
                      activeExercise={activeExercise}
                      rawGpFile={rawGpFile}
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
                      hitNotes={hitNotes}
                      currentBeatsElapsed={currentBeatsElapsed}
                      audioContext={metronome.audioContext}
                      audioStartTime={metronome.audioStartTime}
                      tabResetKey={tabResetKey}
                      isRiddleRevealed={isRiddleRevealed}
                      isRiddleGuessed={isRiddleGuessed}
                      hasPlayedRiddleOnce={hasPlayedRiddleOnce}
                      earTrainingScore={earTrainingScore}
                      earTrainingHighScore={earTrainingHighScore}
                      onPlayRiddle={handleToggleTimer}
                      onRevealRiddle={handleRevealRiddle}
                      onNextRiddle={handleNextRiddle}
                      onEarTrainingGuessed={() => {
                        setEarTrainingScore(s => s + 1);
                        setIsRiddleGuessed(true);
                        handleRevealRiddle();
                      }}
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
                    />
                  </div>

                  {/* 4. Instructions / Tips + Sidebar */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                    <div className="lg:col-span-8 space-y-8">
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue={
                          activeExercise.instructions?.length > 0 ? "instructions"
                          : activeExercise.tips?.length > 0 ? "tips"
                          : undefined
                        }
                        className="w-full space-y-4"
                      >
                        {activeExercise.instructions && activeExercise.instructions.length > 0 && (
                          <AccordionItem value="instructions" className="border-none radius-premium overflow-hidden bg-zinc-900/40 border border-white/5">
                            <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                  <FaInfoCircle />
                                </div>
                                <span className="font-bold tracking-wide">{t("exercises:instructions")}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-2">
                              <div className={cn(
                                "prose prose-invert max-w-none",
                                currentExercise.isPlayalong && "text-sm leading-relaxed opacity-70"
                              )}>
                                {activeExercise.instructions.map((instruction, idx) => (
                                  <p key={idx} className="mb-4 last:mb-0">{instruction}</p>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {activeExercise.tips && activeExercise.tips.length > 0 && (
                          <AccordionItem value="tips" className="border-none radius-premium overflow-hidden bg-zinc-900/40 border border-white/5">
                            <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                  <FaLightbulb />
                                </div>
                                <span className="font-bold tracking-wide">{t("exercises:hints")}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-2">
                              <ul className={cn(
                                "list-inside list-disc",
                                currentExercise.isPlayalong ? "space-y-1 text-sm" : "space-y-2"
                              )}>
                                {activeExercise.tips.map((tip, idx) => (
                                  <li key={idx} className="marker:text-amber-500/50">{tip}</li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>

                    <SessionSidebar
                      currentExercise={currentExercise}
                      activeExercise={activeExercise}
                      metronome={metronome}
                      effectiveBpm={effectiveBpm}
                      isMetronomeMuted={isMetronomeMuted}
                      setIsMetronomeMuted={setIsMetronomeMuted}
                      isHalfSpeed={isHalfSpeed}
                      setIsHalfSpeed={setIsHalfSpeed}
                      isAudioMuted={isAudioMuted}
                      setIsAudioMuted={setIsAudioMuted}
                      saveGuitarPlaybackPreference={saveGuitarPlaybackPreference}
                      soundfontsReady={soundfontsReady}
                      isMicEnabled={isMicEnabled}
                      updateMicPersistence={updateMicPersistence}
                      isListening={isListening}
                      volume={volume}
                      sessionAccuracy={sessionAccuracy}
                      detectedNoteData={detectedNoteData}
                      setSessionPhase={setSessionPhase}
                      audioTracks={audioTracks}
                      trackConfigs={trackConfigs}
                      setTrackConfigs={setTrackConfigs}
                      bpmStages={bpmStages}
                      completedBpms={completedBpms}
                      isBpmLoading={isBpmLoading}
                      onBpmToggle={handleToggleBpm}
                    />
                  </div>

                  {/* 5. Bottom bar */}
                  {!reportResult && (
                    <SessionBottomBar
                      onClose={onClose}
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
                      timeLeft={timeLeft}
                      currentExerciseIndex={currentExerciseIndex}
                      onGoToPreviousExercise={() => {
                        if (metronome.isPlaying) metronome.toggleMetronome();
                        jumpToExercise(currentExerciseIndex - 1);
                      }}
                      isFinishing={isFinishing}
                      isSubmittingReport={isSubmittingReport}
                      onFinishSession={async () => {
                        await saveCurrentScores();
                        autoSubmitReport(exerciseRecordsRef.current);
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </ExerciseLayout>
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
  );
};
