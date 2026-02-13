import "react-circular-progressbar/dist/styles.css";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import { Timer } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FaCheck, FaExternalLinkAlt, FaFacebook, FaHeart, FaInfoCircle, FaInstagram, FaLightbulb, FaStepBackward, FaStepForward, FaTwitter, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { Metronome } from "../../components/Metronome/Metronome";
import { YouTubePlayalong } from "../../components/YouTubePlayalong";
import type {
  ExercisePlan,
} from "../../types/exercise.types";
import { ExerciseImage } from "./components/ExerciseImage";
import { ExerciseProgress } from "./components/ExerciseProgress";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { MainTimerSection } from "./components/MainTimerSection";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";

import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import { TablatureViewer } from "./components/TablatureViewer";
import { useTablatureAudio } from "../../hooks/useTablatureAudio";
import { useAudioAnalyzer } from "hooks/useAudioAnalyzer";
import { useMemo } from "react";
import confetti from "canvas-confetti";
import { getNoteFromFrequency, getFrequencyFromTab, getCentsDistance } from "utils/audio/noteUtils";
import { useCalibration } from "./hooks/useCalibration";
import { MicModeDialog } from "./components/MicModeDialog";
import { CalibrationChoiceDialog } from "./components/CalibrationChoiceDialog";
import { CalibrationWizard } from "./components/CalibrationWizard";
import { generateRiddle } from "feature/exercisePlan/logic/riddleGenerator";
import { EarTrainingView } from "./components/EarTrainingView";
import { ImprovPromptView } from "./components/ImprovPromptView";
import type { TablatureMeasure } from "../../types/exercise.types";
import { playCompletionSound } from "utils/audioUtils";
import { ScaleSelectionDialog } from "./components/ScaleSelectionDialog";
import { ChordSelectionDialog } from "./components/ChordSelectionDialog";
import type { Exercise } from "../../types/exercise.types";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish: () => void;
  onClose?: () => void;
  isFinishing?: boolean;
  autoReport?: boolean;
  forceFullDuration?: boolean;
  skillRewardSkillId?: string;
  skillRewardAmount?: number;
}

export const PracticeSession = ({ plan, onFinish, onClose, isFinishing, autoReport, forceFullDuration, skillRewardSkillId, skillRewardAmount }: PracticeSessionProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    toggleTimer,
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
    canSkipExercise
  } = usePracticeSessionState({ plan, onFinish, autoReport, forceFullDuration, skillRewardSkillId, skillRewardAmount });

  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isMetronomeMuted, setIsMetronomeMuted] = useState(false);

  // --- Scale Selection State ---
  const [showScaleDialog, setShowScaleDialog] = useState(false);
  const [showChordDialog, setShowChordDialog] = useState(false);
  const [generatedExercise, setGeneratedExercise] = useState<Exercise | null>(null);

  // --- Ear Training / Riddle State ---
  const [riddleMeasures, setRiddleMeasures] = useState<TablatureMeasure[] | null>(null);
  const [isRiddleRevealed, setIsRiddleRevealed] = useState(false);
  const [earTrainingScore, setEarTrainingScore] = useState(0);
  const [hasPlayedRiddleOnce, setHasPlayedRiddleOnce] = useState(false);

  // Detect configurable scale exercise - removed auto-popup as requested by user
  /*
  useEffect(() => {
    if (currentExercise.id === 'scale_practice_configurable') {
      setShowScaleDialog(true);
      setShowChordDialog(false);
      setGeneratedExercise(null);
    } else if (currentExercise.id === 'chord_practice_configurable') {
      setShowChordDialog(true);
      setShowScaleDialog(false);
      setGeneratedExercise(null);
    } else {
      setShowScaleDialog(false);
      setShowChordDialog(false);
    }
  }, [currentExercise.id]);
  */

  const handleGenerated = (genExercise: Exercise) => {
    setGeneratedExercise(genExercise);
    setShowScaleDialog(false);
    setShowChordDialog(false);
  };

  // Use generated exercise if available, otherwise use current exercise
  const activeExercise = generatedExercise || currentExercise;

  useEffect(() => {
    // Reset flags and UI state on ANY exercise change
    // For Ear Training (riddleConfig), enable playback by default, otherwise disable
    setIsAudioMuted(!(currentExercise.riddleConfig?.mode === 'sequenceRepeat' || (currentExercise.tablature && currentExercise.tablature.length > 0)));
    setIsMetronomeMuted(false);
    setHasPlayedRiddleOnce(false);
    setIsRiddleRevealed(false);

    if (currentExercise.riddleConfig?.mode === 'sequenceRepeat') {
       // Generate new riddle when exercise changes
       setRiddleMeasures(generateRiddle(currentExercise.riddleConfig));
       if (metronome.bpm !== 108) metronome.setBpm(108);
    } else {
       setRiddleMeasures(null);
    }
  }, [currentExercise.id]); // Use ID to trigger on exercise change

  const activeTablature = riddleMeasures || activeExercise.tablature;

  const handleNextRiddle = () => {
    if (currentExercise.riddleConfig?.mode === 'sequenceRepeat') {
      setRiddleMeasures(generateRiddle(currentExercise.riddleConfig));
      setIsRiddleRevealed(false);
      setHasPlayedRiddleOnce(false); // Reset on next riddle

      // Restart audio securely
      if (metronome.isPlaying) {
         metronome.stopMetronome();
      }
      setTimeout(() => {
          metronome.startMetronome();
      }, 100);
    }
  };

  const handleRevealRiddle = () => setIsRiddleRevealed(true);
  // -----------------------------------

  // --- Completion Notification ---
  const [showCompletionNotification, setShowCompletionNotification] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 && isMounted && !showCompleteDialog && !reportResult && !showSuccessView && !isLastExercise) {
      playCompletionSound();
      setShowCompletionNotification(true);
      const timer = setTimeout(() => setShowCompletionNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isMounted, showCompleteDialog, reportResult, showSuccessView, isLastExercise]);
  // -----------------------------------

  // Metronome State
  const metronome = useDeviceMetronome({
    initialBpm: activeExercise.metronomeSpeed?.recommended || 60,
    minBpm: activeExercise.metronomeSpeed?.min,
    maxBpm: activeExercise.metronomeSpeed?.max,
    recommendedBpm: activeExercise.metronomeSpeed?.recommended,
    isMuted: isMetronomeMuted 
  });

  // Audio Playback
  useTablatureAudio({
    measures: activeTablature,
    bpm: metronome.bpm,
    isPlaying: metronome.isPlaying && metronome.countInRemaining === 0 && !!metronome.startTime, // Only play when count-in finished
    startTime: metronome.startTime,
    isMuted: isAudioMuted,
    onLoopComplete: () => setHasPlayedRiddleOnce(true),
    audioContext: metronome.audioContext,
    audioStartTime: metronome.audioStartTime,
  });

  const {
    imageScale,
    setImageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
  } = useImageHandling();

  const planHasTablature = useMemo(
    () => plan.exercises.some(ex => (ex.tablature && ex.tablature.length > 0) || ex.riddleConfig?.mode === 'sequenceRepeat'),
    [plan.exercises]
  );

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if focus is in an input or similar (though not many here)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.code === "Space") {
            e.preventDefault();
            if (isPlaying) {
              stopTimer();
              metronome.stopMetronome();
            } else {
              startTimer();
              if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === 'sequenceRepeat') {
                metronome.startMetronome();
              }
            }
            return;
        }

        if (e.key === "ArrowRight") {
            if (!isLastExercise) {
                handleNextExerciseClick();
            } else {
                // optional: finish session
            }
        } 
        if (e.key === "ArrowLeft") {
            if (currentExerciseIndex > 0) {
                stopTimer();
                metronome.stopMetronome();
                jumpToExercise(currentExerciseIndex - 1);
            }
        }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLastExercise, currentExerciseIndex, handleNextExercise, jumpToExercise, resetTimer, metronome, isPlaying, startTimer, stopTimer, currentExercise]);

  const category = currentExercise.category || "mixed";

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
    handleNextExercise(resetTimer);
  };

  const {
    frequency,
    volume,
    isOnset,
    confidence, // eslint-disable-line @typescript-eslint/no-unused-vars
    isListening,
    error: audioError, // eslint-disable-line @typescript-eslint/no-unused-vars
    init: initAudio,
    close: closeAudio,
    audioRefs,
    getLatencyMs,
    inputGain,
    setInputGain,
  } = useAudioAnalyzer();

  const {
    sessionPhase,
    isMicEnabled,
    calibrationData,
    handleEnableMic,
    handleSkipMic,
    handleReuseCalibration,
    handleRecalibrate,
    handleCalibrationComplete,
    handleCalibrationCancel,
    getAdjustedTargetFreq,
    existingCalibrationTimestamp,
  } = useCalibration(planHasTablature);

  const CENTS_TOLERANCE = 60; // Tolerance in cents (~over half a semitone)

  const toggleMic = async () => {
    if (isListening) {
      closeAudio();
    } else {
      await initAudio();
    }
  };

  // Auto-init audio when mic enabled via calibration flow
  useEffect(() => {
    if (isMicEnabled && !isListening) {
      initAudio();
    }
  }, [isMicEnabled]);

  // detectedNoteData derived from throttled state — used only for UI display
  const detectedNoteData = useMemo(() => {
     if (!frequency || frequency < 50) return null;
     return getNoteFromFrequency(frequency);
  }, [frequency]);

  const getFeedbackForCombo = (combo: number): { text: string } | null => {
    if (combo >= 25 && combo % 5 === 0) return { text: "UNSTOPPABLE!" };
    if (combo === 20) return { text: "ON FIRE!" };
    if (combo === 15) return { text: "AMAZING!" };
    if (combo === 10) return { text: "GREAT!" };
    if (combo === 5) return { text: "NICE!" };
    return null;
  };

  const feedbackStyles: Record<string, { color: string; dropShadow: string; scale: number }> = {
    "NICE!":          { color: "text-emerald-400", dropShadow: "drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]", scale: 1.35 },
    "GREAT!":         { color: "text-cyan-400",    dropShadow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]", scale: 1.45 },
    "AMAZING!":       { color: "text-purple-400",  dropShadow: "drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]", scale: 1.5 },
    "ON FIRE!":       { color: "text-orange-400",  dropShadow: "drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]", scale: 1.55 },
    "UNSTOPPABLE!":   { color: "text-amber-400",   dropShadow: "drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]", scale: 1.6 },
    "MULTIPLIER UP!": { color: "text-main",        dropShadow: "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]", scale: 1.5 },
  };

  const getPerformanceGrade = (accuracy: number) => {
    if (accuracy >= 95) return { letter: 'S', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]' };
    if (accuracy >= 85) return { letter: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: '' };
    if (accuracy >= 70) return { letter: 'B', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: '' };
    if (accuracy >= 50) return { letter: 'C', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: '' };
    return { letter: 'D', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: '' };
  };

  const [hitNotes, setHitNotes] = useState<Record<string, boolean>>({});
  const [sessionAccuracy, setSessionAccuracy] = useState(100);
  const [sessionStats, setSessionStats] = useState({ hits: 0, misses: 0 });
  const [gameState, setGameState] = useState({
    score: 0,
    combo: 0,
    multiplier: 1,
    lastFeedback: "",
    feedbackId: 0
  });
  const lastLoopedBeatsRef = useRef(0);
  const processedNotesRef = useRef<Set<string>>(new Set());
  const hitNotesRef = useRef<Record<string, boolean>>({});
  const rafIdRef = useRef<number>(0);

  // Refs for throttled UI updates — detection at 60fps, React flushes at ~10fps
  const gameStateRef = useRef({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
  const statsRef = useRef({ hits: 0, misses: 0 });
  const lastFlushRef = useRef(0);
  const needsFlushRef = useRef(false);

  const totalNotes = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) =>
      acc + m.beats.reduce((acc2, b) => acc2 + b.notes.length, 0), 0
    );
  }, [activeTablature]);

  useEffect(() => {
    setHitNotes({});
    hitNotesRef.current = {};
    setSessionAccuracy(100);
    setSessionStats({ hits: 0, misses: 0 });
    setGameState({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
    gameStateRef.current = { score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 };
    statsRef.current = { hits: 0, misses: 0 };
    needsFlushRef.current = false;
    lastLoopedBeatsRef.current = 0;
    processedNotesRef.current.clear();
  }, [currentExerciseIndex]);

  // Clear feedback after a delay
  useEffect(() => {
      if (gameState.lastFeedback) {
          const timer = setTimeout(() => {
              setGameState(prev => ({ ...prev, lastFeedback: "" }));
          }, 1500);
          return () => clearTimeout(timer);
      }
  }, [gameState.feedbackId]);

  // Combo milestone confetti
  useEffect(() => {
    if (gameState.combo === 25 || gameState.combo === 50) {
      confetti({
        particleCount: gameState.combo === 50 ? 50 : 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399'],
        zIndex: 99999999,
      });
    }
  }, [gameState.combo]);

  // Note matching via requestAnimationFrame — reads real-time values from refs
  useEffect(() => {
    if (!isPlaying || !metronome.startTime || !activeTablature || !isMicEnabled) return;

    const tablature = activeTablature;
    const totalExBeats = tablature.reduce((acc, m) =>
      acc + m.beats.reduce((acc2, b) => acc2 + b.duration, 0), 0
    );
    if (totalExBeats === 0) return;

    const bpm = metronome.bpm;
    const startTime = metronome.startTime;

    const tick = () => {
      const now = Date.now();
      const latencyMs = getLatencyMs();
      const compensatedNow = now - latencyMs;

      // Read real-time audio data from refs (no React re-render needed)
      const currentFreq = audioRefs.frequencyRef.current;
      const currentVolume = audioRefs.volumeRef.current;
      const lastOnsetTime = audioRefs.lastOnsetTimeRef.current;

      const beatsPerSecond = bpm / 60;

      // BPM-adaptive timing windows
      const beatDurationMs = 60000 / bpm;
      const onsetRecencyMs = Math.min(800, Math.max(200, beatDurationMs * 0.8));
      const windowMs = Math.min(500, Math.max(150, beatDurationMs * 0.35));
      const windowBeats = (windowMs / 1000) * beatsPerSecond;

      const elapsedSeconds = (compensatedNow - startTime) / 1000;
      const totalBeatsElapsed = elapsedSeconds * beatsPerSecond;
      const loopedBeatsElapsed = totalBeatsElapsed % totalExBeats;

      // Detect loop restart
      const hasLooped = loopedBeatsElapsed < lastLoopedBeatsRef.current - 0.1;
      if (hasLooped) {
        hitNotesRef.current = {};
        processedNotesRef.current.clear();
        needsFlushRef.current = true;
      }
      lastLoopedBeatsRef.current = loopedBeatsElapsed;

      // Onset gating: only allow hits if a string attack was detected recently
      const timeSinceOnset = now - lastOnsetTime;
      const hasRecentOnset = timeSinceOnset < onsetRecencyMs;

      let currentBeatTotal = 0;
      const gs = gameStateRef.current;
      const s = statsRef.current;

      for (let mIdx = 0; mIdx < tablature.length; mIdx++) {
        const measure = tablature[mIdx];
        for (let bIdx = 0; bIdx < measure.beats.length; bIdx++) {
          const beat = measure.beats[bIdx];
          const beatStart = currentBeatTotal;
          const beatEnd = currentBeatTotal + beat.duration;

          // Fix wraparound: second condition only applies at the loop boundary
          const isWithinWindow =
            (loopedBeatsElapsed >= beatStart - windowBeats && loopedBeatsElapsed <= beatEnd + windowBeats) ||
            (loopedBeatsElapsed < windowBeats && beatEnd + windowBeats >= totalExBeats);

          const isPassed = loopedBeatsElapsed > beatEnd + windowBeats;

          beat.notes.forEach((note, nIdx) => {
            const noteKey = `${mIdx}-${bIdx}-${nIdx}`;

            if (processedNotesRef.current.has(noteKey)) return;

            // Hammer-ons and pull-offs don't produce pick attacks
            const requiresOnset = !note.isHammerOn && !note.isPullOff;

            // 1. Check for Hit
            if (isWithinWindow && currentFreq > 50 && (hasRecentOnset || !requiresOnset)) {
              const baseTargetFreq = getFrequencyFromTab(note.string, note.fret);
              const targetFreq = getAdjustedTargetFreq(note.string, baseTargetFreq);

              // Direct semitone-distance comparison (octave-aware)
              const centsOff = Math.abs(getCentsDistance(currentFreq, targetFreq));

              if (centsOff <= CENTS_TOLERANCE &&
                  currentVolume > 0.02) {

                processedNotesRef.current.add(noteKey);
                hitNotesRef.current[noteKey] = true;
                needsFlushRef.current = true;

                s.hits++;

                const newCombo = gs.combo + 1;
                const newMultiplier = Math.min(8, Math.floor(newCombo / 5) + 1);

                if (newMultiplier > gs.multiplier) {
                  gs.lastFeedback = "MULTIPLIER UP!";
                  gs.feedbackId++;
                } else {
                  const tier = getFeedbackForCombo(newCombo);
                  if (tier) { gs.lastFeedback = tier.text; gs.feedbackId++; }
                }

                gs.score += 100 * newMultiplier;
                gs.combo = newCombo;
                gs.multiplier = newMultiplier;
              }
            }

            // 2. Check for Miss (window passed without hit)
            else if (isPassed && !hitNotesRef.current[noteKey]) {
              processedNotesRef.current.add(noteKey);
              needsFlushRef.current = true;
              s.misses++;
              gs.combo = 0;
              gs.multiplier = 1;
            }
          });

          currentBeatTotal += beat.duration;
        }
      }

      // Throttled flush to React state (~10Hz) — keeps detection at 60fps
      if (needsFlushRef.current && now - lastFlushRef.current >= 100) {
        lastFlushRef.current = now;
        needsFlushRef.current = false;

        setHitNotes({ ...hitNotesRef.current });

        setSessionStats({ hits: s.hits, misses: s.misses });
        const total = s.hits + s.misses;
        setSessionAccuracy(total > 0 ? Math.round((s.hits / total) * 100) : 100);

        setGameState({ ...gs });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying, metronome.startTime, metronome.bpm, activeTablature, isMicEnabled, currentExerciseIndex, getLatencyMs, audioRefs, getAdjustedTargetFreq]);

  // Pass progress for gray-out effect
  const beatsPerSecond = metronome.bpm / 60;
  const elapsedSeconds = (isPlaying && metronome.startTime) ? (Date.now() - metronome.startTime) / 1000 : 0;
  const totalExerciseBeats = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) => 
      acc + m.beats.reduce((acc2, b) => acc2 + b.duration, 0), 0
    );
  }, [activeTablature]);
  
  const currentBeatsElapsed = totalExerciseBeats > 0 ? (elapsedSeconds * beatsPerSecond) % totalExerciseBeats : 0;

  // Auto-stop everything when time runs out
  useEffect(() => {
    if (timeLeft > 0) return;
    if (isPlaying) stopTimer();
    if (metronome.isPlaying) metronome.toggleMetronome();
  }, [timeLeft, isPlaying, metronome.isPlaying, stopTimer]);


  return (
    <>
      <Head>
        <title>{formattedTimeLeft} | {activeExercise.title}</title>
      </Head>

      {/* Scale Selection Dialog */}
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



      {showSuccessView && !reportResult && (
        <ExerciseSuccessView
          planTitle={planTitleString}
          onFinish={autoSubmitReport}
          onRestart={() => {
            resetSuccessView();
            resetTimer();
            startTimer();
          }}
          isLoading={isFinishing || isSubmittingReport}
        />
      )}

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
            onFinish={isLastExercise ? autoSubmitReport : onFinish}
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
            isMicEnabled={isMicEnabled}
            toggleMic={toggleMic}
            gameState={gameState}
            sessionAccuracy={sessionAccuracy}
            detectedNoteData={detectedNoteData}
            isListening={isListening}
            hitNotes={hitNotes}
            currentBeatsElapsed={currentBeatsElapsed}
            isAudioMuted={isAudioMuted}
            setIsAudioMuted={setIsAudioMuted}
            isMetronomeMuted={isMetronomeMuted}
            setIsMetronomeMuted={setIsMetronomeMuted}
            activeTablature={activeTablature}
            isRiddleRevealed={isRiddleRevealed}
            hasPlayedRiddleOnce={hasPlayedRiddleOnce}
            handleNextRiddle={handleNextRiddle}
            handleRevealRiddle={handleRevealRiddle}
            earTrainingScore={earTrainingScore}
          />
        </>
      )}

      <div
        className={cn("font-openSans min-h-screen bg-zinc-950 relative overflow-hidden", isMobileView && "hidden")}>
        
        {/* Background Ambiance Glows */}
        {!reportResult && (
          <>
            <div className={cn(
              "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
              category === "technique" && "bg-blue-500",
              category === "theory" && "bg-emerald-500",
              category === "creativity" && "bg-purple-500",
              category === "hearing" && "bg-orange-500",
              category === "mixed" && "bg-cyan-500",
              currentExercise.isPlayalong && "bg-red-600 opacity-30 blur-[150px]"
            )} />
            <div className={cn(
              "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 transition-all duration-1000",
              category === "technique" && "bg-indigo-500",
              category === "theory" && "bg-green-500",
              category === "creativity" && "bg-pink-500",
              category === "hearing" && "bg-amber-500",
              category === "mixed" && "bg-blue-500"
            )} />
          </>
        )}

        <TooltipProvider>
          <ExerciseLayout
            title={reportResult ? "Practice Summary" : plan.title}
            showBreadcrumbs={false}
            className="border-b border-white/5 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50">
            
            <div className={cn(
              'mx-auto max-w-6xl px-6 pb-64 pt-4 relative z-10',
              reportResult && "max-w-7xl px-4 pt-8"
            )}>
              
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
               {/* 1. Progress Bar (Top) */}
               <div className="mb-8">
                   <ExerciseProgress
                        plan={plan}
                        currentExerciseIndex={currentExerciseIndex}
                        onExerciseSelect={(idx) => {
                            if (metronome.isPlaying) {
                              metronome.toggleMetronome();
                            }
                            jumpToExercise(idx);
                         }}
                   />
               </div>

               {/* 2. Hero Section (Image & Title) - "Zen Focus" */}
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
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                                  Playalong
                              </span>
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
                           <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">
                              {currentExercise.customGoalDescription}
                           </p>
                         )}
                      </motion.div>
                    )}

                    {/* Simple Challenge Banner */}
                    {(plan as any).streakDays && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 w-full max-w-2xl px-6 py-4 rounded-xl bg-main/10 border border-main/20 flex items-center justify-between"
                      >
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-main text-white">
                               <Timer size={20} />
                            </div>
                            <div>
                               <h3 className="text-lg font-bold text-white tracking-tight">
                                 Challenge: {typeof (plan as any).title === 'string' ? (plan as any).title : (plan as any).title}
                               </h3>
                               <p className="text-sm text-zinc-400 leading-relaxed">
                                 {typeof (plan as any).description === 'string' ? (plan as any).description : (plan as any).description}
                               </p>
                               <p className="text-xs text-main font-bold uppercase tracking-widest">
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
                    
                     {isMicEnabled && (
                        <div className="w-full max-w-5xl mb-6 animate-in fade-in slide-in-from-top-6 duration-700">
                            <div className="flex items-end justify-between gap-8">
                                {/* Left: Score & Accuracy */}
                                <div className="flex-1 flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Total Score</span>
                                        <motion.span
                                            key={gameState.score}
                                            initial={{ scale: 1.15, filter: "brightness(1.5)" }}
                                            animate={{ scale: 1, filter: "brightness(1)" }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] inline-block"
                                        >
                                            {gameState.score.toLocaleString()}
                                        </motion.span>
                                    </div>
                                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                                    <div>
                                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Accuracy</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-emerald-400 tabular-nums">{sessionAccuracy}%</span>
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
                                                                "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-black",
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
                                </div>

                                {/* Center: Dynamic Feedback */}
                                <div className="flex-[0.5] flex flex-col items-center justify-center -mb-2 relative">
                                    <div className="absolute top-[-50px] whitespace-nowrap">
                                        <AnimatePresence mode="wait">
                                            {gameState.lastFeedback && (() => {
                                                const style = feedbackStyles[gameState.lastFeedback] || { color: "text-cyan-400", dropShadow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]", scale: 1.4 };
                                                return (
                                                    <motion.div
                                                        key={gameState.feedbackId}
                                                        initial={{
                                                            y: 40,
                                                            opacity: 0,
                                                            scale: 0.3,
                                                            filter: "blur(10px)"
                                                        }}
                                                        animate={{
                                                            y: 0,
                                                            opacity: 1,
                                                            scale: style.scale,
                                                            filter: "blur(0px)",
                                                            transition: {
                                                                type: "spring",
                                                                stiffness: 300,
                                                                damping: 15
                                                            }
                                                        }}
                                                        exit={{
                                                            y: -40,
                                                            opacity: 0,
                                                            scale: style.scale + 0.6,
                                                            filter: "blur(5px)",
                                                            transition: { duration: 0.4 }
                                                        }}
                                                        className={cn(
                                                            "text-4xl font-black uppercase italic tracking-tighter",
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
                                    <div className="mt-8 h-1 w-32 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                            className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
                                            animate={{ width: `${(gameState.combo % 5) * 20 || (gameState.combo > 0 ? 100 : 0)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Right: Streak & Multiplier */}
                                <div className="flex-1 flex items-center justify-end gap-6">
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Note Streak</span>
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-3xl font-black text-cyan-400 tabular-nums">{gameState.combo}</span>
                                            <div className="flex flex-col gap-0.5">
                                                {[...Array(3)].map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={cn(
                                                            "w-1 h-3 rounded-full transition-all duration-300",
                                                            gameState.combo > i ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-zinc-800"
                                                        )} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className={cn(
                                            "absolute -inset-4 rounded-2xl blur-2xl transition-all duration-500",
                                            gameState.multiplier >= 4 ? "bg-main/30 opacity-100" : "bg-cyan-500/20 opacity-0"
                                        )} />
                                        <div className={cn(
                                            "relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all duration-500 overflow-hidden",
                                            gameState.multiplier >= 4 
                                                ? "bg-main border-white/40 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110" 
                                                : "bg-zinc-950 border-white/10"
                                        )}>
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-white/50 -mb-1">Multiplier</span>
                                            <span className="text-4xl font-black text-white italic tracking-tighter">x{gameState.multiplier}</span>
                                            {gameState.multiplier >= 8 && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}

                    <div className={cn(
                      "relative w-full overflow-hidden radius-premium bg-zinc-900 shadow-2xl",
                      currentExercise.isPlayalong ? "" : "border border-white/10 glass-card"
                    )}>
                        {/* Ear Training View */}
                        {/* Ear Training View */}
                        {currentExercise.riddleConfig?.mode === 'sequenceRepeat' && (
                            <div className="p-4 border-b border-white/5">
                                <EarTrainingView
                                    difficulty={currentExercise.riddleConfig.difficulty}
                                    isRevealed={isRiddleRevealed}
                                    isPlaying={isPlaying}
                                    onPlayRiddle={handleToggleTimer}
                                    onReveal={handleRevealRiddle}
                                    onNextRiddle={handleNextRiddle}
                                    onGuessed={() => {
                                      setEarTrainingScore(s => s + 1);
                                      handleNextRiddle();
                                    }}
                                    score={earTrainingScore}
                                    canGuess={hasPlayedRiddleOnce}
                                />
                            </div>
                        )}

                        {/* Improv Prompt View */}
                        {currentExercise.riddleConfig?.mode === 'improvPrompt' && (
                            <div className="p-4">
                                <ImprovPromptView config={currentExercise.riddleConfig} isRunning={isPlaying} />
                            </div>
                        )}

                         {(activeTablature && activeTablature.length > 0 && (currentExercise.riddleConfig?.mode !== 'sequenceRepeat' || isRiddleRevealed)) ? (
                           <TablatureViewer
                              measures={activeTablature}
                              bpm={metronome.bpm}
                              isPlaying={metronome.isPlaying}
                              startTime={metronome.startTime || null}
                              countInRemaining={(metronome as any).countInRemaining}
                              className="w-full"
                              detectedNote={detectedNoteData}
                              isListening={isListening}
                              hitNotes={hitNotes}
                              currentBeatsElapsed={currentBeatsElapsed}
                              hideNotes={activeExercise.hideTablatureNotes}
                              audioContext={metronome.audioContext}
                              audioStartTime={metronome.audioStartTime}
                           />
                         ) : currentExercise.isPlayalong && currentExercise.youtubeVideoId ? (
                             !isMobileView && (
                                <YouTubePlayalong
                                    videoId={currentExercise.youtubeVideoId}
                                    isPlaying={isPlaying}
                                    onEnd={handleNextExerciseClick}
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
                                    const match = currentExercise.videoUrl?.match(regExp);
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
                                            ></iframe>
                                        );
                                    }
                                    return <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">Video not available</div>;
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
               </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                     <div className="lg:col-span-8 space-y-8">
                         <Accordion type="single" collapsible defaultValue={activeExercise.instructions?.length > 0 ? "instructions" : (activeExercise.tips?.length > 0 ? "tips" : undefined)} className="w-full space-y-4">
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
                                           currentExercise.isPlayalong ? "text-sm leading-relaxed opacity-70" : ""
                                         )}>
                                            {activeExercise.instructions.map((instruction, idx) => (
                                                <p key={idx} className="mb-4 last:mb-0">
                                                    {instruction}
                                                </p>
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
                                                <li key={idx} className="marker:text-amber-500/50">
                                                    {tip}
                                                </li>
                                            ))}
                                         </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                         </Accordion>
                     </div>

                      <div className="lg:col-span-4 space-y-6">
                        {currentExercise.metronomeSpeed && (
                             <div className="radius-premium bg-zinc-900/40 border border-white/5 p-6 backdrop-blur-sm">
                                 <Metronome
                                     metronome={metronome}
                                     showStartStop={!currentExercise.tablature || currentExercise.tablature.length === 0}
                                     isMuted={isMetronomeMuted}
                                     onMuteToggle={setIsMetronomeMuted}
                                     recommendedBpm={currentExercise.metronomeSpeed.recommended}
                                 />
                                  {currentExercise.tablature && currentExercise.tablature.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                              "w-full gap-2 text-xs font-bold uppercase tracking-widest transition-all",
                                              isAudioMuted ? "text-zinc-500 hover:text-zinc-400" : "text-cyan-400 hover:text-cyan-300 bg-cyan-500/10",
                                              currentExercise.riddleConfig?.mode === 'sequenceRepeat' && "opacity-50 cursor-not-allowed" // Disable button if forced on
                                            )}
                                            disabled={currentExercise.riddleConfig?.mode === 'sequenceRepeat'} // Disable if Ear Training
                                            onClick={() => {
                                              const newMuted = !isAudioMuted;
                                              setIsAudioMuted(newMuted);
                                            }}
                                          >
                                            <GiGuitar className="text-base" />
                                            {isAudioMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                            {isAudioMuted ? "Guitar Playback Off" : "Guitar Playback On"}
                                          </Button>
                                    </div>
                                  )}

                                  {isMicEnabled && isListening && (
                                    <div className="mt-4 flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                                                <motion.div 
                                                    className={cn(
                                                        "h-full transition-all duration-150",
                                                        volume > 0.1 ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-zinc-600"
                                                    )}
                                                    animate={{ width: `${Math.min(100, volume * 300)}%` }} // Boost for visibility
                                                />
                                            </div>
                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Level</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-400 leading-none">
                                            {sessionAccuracy}% Accuracy
                                        </span>
                                        {detectedNoteData && volume > 0.05 && (
                                            <span className={cn(
                                                "text-[8px] font-mono px-1 py-0 mt-1 rounded border",
                                                Math.abs(detectedNoteData.cents) <= CENTS_TOLERANCE 
                                                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                                    : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                                            )}>
                                                {detectedNoteData.note}{detectedNoteData.octave} 
                                                {detectedNoteData.cents > 0 ? '+' : ''}{detectedNoteData.cents}c
                                            </span>
                                        )}
                                    </div>
                                  )}
                             </div>
                        )}
                        
                        {currentExercise.links && currentExercise.links.length > 0 && (
                            <div className="radius-premium bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-6 backdrop-blur-sm space-y-4">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                                    <FaHeart className="animate-pulse" />
                                    <span>Support Author</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {currentExercise.links.map((link, idx) => {
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

                {!reportResult && (
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 border-t border-white/5 bg-zinc-950/60 backdrop-blur-3xl">
                     <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">
                          <div className="flex-1 hidden xl:flex items-center justify-start gap-4">
                             <Button
                                 size="sm"
                                 variant="ghost"
                                 className="radius-premium font-bold text-[10px] tracking-[0.2em] transition-all click-behavior uppercase text-zinc-500 hover:text-white"
                                 onClick={onClose}
                             >
                                 {t("common:practice.exit")}
                             </Button>
                          </div>

                          <div className="flex-none flex justify-center">
                             <MainTimerSection
                                 exerciseKey={exerciseKey}
                                 currentExercise={currentExercise}
                                 isLastExercise={isLastExercise}
                                 isPlaying={isPlaying}
                                 timerProgressValue={timerProgressValue}
                                 formattedTimeLeft={formattedTimeLeft}
                                 toggleTimer={handleToggleTimer}
                                 handleNextExercise={handleNextExerciseClick}
                                 showExerciseInfo={false}
                                 variant="compact"
                                 sessionTimerData={sessionTimerData}
                                 exerciseTimeSpent={exerciseTimeSpent}
                                 canSkipExercise={canSkipExercise}
                                 isFinished={timeLeft === 0}
                             />
                          </div>

                          <div className="flex-1 flex justify-end items-center gap-3">
                             {currentExerciseIndex > 0 && (
                               <Button
                                   size="sm"
                                   variant="ghost"
                                   className="radius-premium font-black text-[11px] tracking-[0.1em] transition-all click-behavior uppercase text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 flex items-center gap-2"
                                   onClick={() => {
                                      if (metronome.isPlaying) {
                                        metronome.toggleMetronome();
                                      }
                                      jumpToExercise(currentExerciseIndex - 1);
                                   }}
                               >
                                   <FaStepBackward /> {t("common:back") || "Back"}
                               </Button>
                             )}

                             <Button
                                 size="sm"
                                 variant="ghost"
                                 loading={isFinishing || isSubmittingReport}
                                 className={cn(
                                 "radius-premium font-black text-[11px] tracking-[0.1em] transition-all click-behavior uppercase",
                                 isLastExercise ? "h-12 px-6 bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 hover:text-black" : "text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2",
                                 !canSkipExercise && "opacity-50 cursor-not-allowed"
                                 )}
                                 onClick={() => {
                                  if (isLastExercise) {
                                    autoSubmitReport();
                                  } else {
                                    handleNextExerciseClick();
                                  }
                                }}
                                disabled={!canSkipExercise}
                             >
                                 {(isFinishing || isSubmittingReport) ? (
                                     <span>Saving...</span>
                                 ) : isLastExercise ? (
                                     <span className="flex items-center gap-2">{t("common:finish_session")} <FaCheck /></span>
                                 ) : (
                                     <span className="flex items-center gap-2">{t("common:skip")} <FaStepForward /></span>
                                 )}
                             </Button>
                          </div>
                     </div>
                </div>
                )}
                </>
                )}
            </div>
          </ExerciseLayout>
        </TooltipProvider>
      </div>

      <ExerciseCompleteDialog
        isOpen={showCompleteDialog}
        onClose={() => {
            setShowCompleteDialog(false);
            onFinish?.();
        }}
        onRestart={() => {
            setShowCompleteDialog(false);
            resetTimer();
            startTimer();
        }}
        exerciseTitle={currentExercise.title}
        duration={currentExercise.timeInMinutes}
      />

      <MicModeDialog
        isOpen={sessionPhase === 'mic_prompt'}
        onEnableMic={handleEnableMic}
        onSkipMic={handleSkipMic}
      />
      <CalibrationChoiceDialog
        isOpen={sessionPhase === 'calibration_choice'}
        calibrationTimestamp={existingCalibrationTimestamp}
        onReuse={handleReuseCalibration}
        onRecalibrate={handleRecalibrate}
        onCancel={handleCalibrationCancel}
      />
      <CalibrationWizard
        isOpen={sessionPhase === 'calibrating'}
        onComplete={handleCalibrationComplete}
        onCancel={handleCalibrationCancel}
        audioInit={initAudio}
        audioClose={closeAudio}
        audioRefs={audioRefs}
        isListening={isListening}
        inputGain={inputGain}
        onInputGainChange={setInputGain}
      />

      {/* Completion Notification */}
      <AnimatePresence>
        {showCompletionNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 50, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[99999] px-8 py-4 bg-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.5)] border border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <FaCheck className="text-black h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xl font-black text-black uppercase tracking-tighter leading-none">
                  Exercise Finished!
                </h4>
                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">
                  Great job on this one!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
