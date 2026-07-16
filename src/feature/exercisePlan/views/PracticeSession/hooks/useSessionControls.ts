import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Exercise } from "../../../types/exercise.types";
import type { NoteMatchingHandle } from "../contexts/NoteMatchingContext";
import { saveGuitarPlaybackPreference } from "../helpers/guitarPlaybackPreference";

interface Metronome {
  isPlaying:              boolean;
  startMetronome:         () => void;
  stopMetronome:          () => void;
  restartMetronome:       () => void;
  bpm:                    number;
  setBpm:                 (bpm: number) => void;
  minBpm:                 number;
  maxBpm:                 number;
  handleSetRecommendedBpm: () => void;
}

interface UseSessionControlsOptions {
  isPlaying:              boolean;
  stopTimer:              () => void;
  startTimer:             () => void;
  resetTimer:             () => void;
  metronome:              Metronome;
  currentExercise:        Exercise;
  currentExerciseIndex:   number;
  isLastExercise:         boolean;
  jumpToExercise:         (idx: number) => void;
  handleNextExercise:     (resetTimer: () => void) => void;
  restartFullSession:     () => void;
  isMicEnabled:           boolean;
  closeAudio:             () => void;
  updateMicPersistence:   (enabled: boolean) => void;
  isAudioMuted:           boolean;
  setIsAudioMuted:        Dispatch<SetStateAction<boolean>>;
  speedMultiplier:        number;
  setSpeedMultiplier:     (payload: number | ((prev: number) => number)) => void;
  setEarTrainingScore:    Dispatch<SetStateAction<number>>;
  setIsRiddleGuessed:     (v: boolean) => void;
  handleRevealRiddle:     () => void;
  saveCurrentScores:      () => Promise<void>;
  noteMatchingHandle:     RefObject<NoteMatchingHandle | null>;
  loopsCompletedRef:      { current: number };
  tabRestartKey:          number;
  setTabRestartKey:       Dispatch<SetStateAction<number>>;
}

export function useSessionControls({
  isPlaying, stopTimer, startTimer, resetTimer, metronome,
  currentExercise, currentExerciseIndex, isLastExercise, jumpToExercise,
  handleNextExercise, restartFullSession,
  isMicEnabled, closeAudio, updateMicPersistence,
  isAudioMuted, setIsAudioMuted, speedMultiplier, setSpeedMultiplier,
  setEarTrainingScore, setIsRiddleGuessed, handleRevealRiddle,
  saveCurrentScores, noteMatchingHandle, loopsCompletedRef,
  tabRestartKey, setTabRestartKey,
}: UseSessionControlsOptions) {
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleTimer = useCallback(() => {
    if (isPlaying) {
      stopTimer(); metronome.stopMetronome();
    } else {
      startTimer();
      if (currentExercise.metronomeSpeed || currentExercise.riddleConfig?.mode === "sequenceRepeat") {
        metronome.startMetronome();
      }
    }
  }, [isPlaying, stopTimer, metronome, startTimer, currentExercise]);

  const handleRestart = useCallback(() => {
    stopTimer(); metronome.restartMetronome(); resetTimer();
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
  }, [stopTimer, metronome, resetTimer, startTimer, currentExercise, setEarTrainingScore, noteMatchingHandle]);

  const handleRestartFullSession = useCallback(() => {
    restartFullSession(); setTabRestartKey(prev => prev + 1);
  }, [restartFullSession]);

  const handleSpeedMultiplierChange = useCallback((value: number) => {
    setSpeedMultiplier((prev: number) => {
      if (value !== prev) {
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
      return value;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metronome, currentExercise]);

  const handleNextExerciseClick = useCallback(async () => {
    stopTimer(); metronome.restartMetronome();
    await saveCurrentScores();
    handleNextExercise(resetTimer);
  }, [stopTimer, metronome, saveCurrentScores, handleNextExercise, resetTimer]);

  const handleMicToggle = useCallback(async () => {
    if (isMicEnabled) { closeAudio(); updateMicPersistence(false); }
    else              { updateMicPersistence(true); }
  }, [isMicEnabled, closeAudio, updateMicPersistence]);

  const handleAudioToggle = useCallback(() => {
    const newMuted = !isAudioMuted;
    setIsAudioMuted(newMuted);
    saveGuitarPlaybackPreference(!newMuted);
  }, [isAudioMuted, setIsAudioMuted]);

  const handleExerciseSelect = useCallback((idx: number) => {
    stopTimer(); metronome.restartMetronome(); jumpToExercise(idx);
  }, [stopTimer, metronome, jumpToExercise]);

  const handleEarTrainingGuessed = useCallback(() => {
    setEarTrainingScore(s => s + 1); setIsRiddleGuessed(true); handleRevealRiddle();
  }, [setEarTrainingScore, setIsRiddleGuessed, handleRevealRiddle]);

  const handleRepeatCountChange = useCallback(() => { loopsCompletedRef.current = 0; }, []);
  const handleNoteMatchingReset = useCallback(() => setEarTrainingScore(0), [setEarTrainingScore]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  // ↑ ↓ (and Shift+↑ Shift+↓) are reserved for tempo, with Enter resetting to
  // the exercise's recommended (baseline) tempo. Exercise navigation lives on
  // J/K (vim-style) instead, so the two groups never share a key. See
  // ShortcutsLegend for the full, user-facing list.

  const hasTempoControl = !!currentExercise.metronomeSpeed;

  const handleTempoStep = useCallback((delta: number) => {
    metronome.setBpm(Math.min(metronome.maxBpm, Math.max(metronome.minBpm, metronome.bpm + delta)));
  }, [metronome]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault(); handleToggleTimer(); return;
      }
      if (e.key === "j" && !isLastExercise) handleNextExerciseClick();
      if (e.key === "k" && currentExerciseIndex > 0) {
        stopTimer(); metronome.restartMetronome(); jumpToExercise(currentExerciseIndex - 1);
      }
      if (!hasTempoControl) return;
      if (e.key === "ArrowUp") { e.preventDefault(); handleTempoStep(e.shiftKey ? 5 : 1); }
      if (e.key === "ArrowDown") { e.preventDefault(); handleTempoStep(e.shiftKey ? -5 : -1); }
      if (e.key === "Enter") { e.preventDefault(); metronome.handleSetRecommendedBpm(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLastExercise, currentExerciseIndex, handleToggleTimer, handleNextExerciseClick, stopTimer, metronome, jumpToExercise, hasTempoControl, handleTempoStep]);

  return useMemo(() => ({
    tabRestartKey, isPlayingRef,
    handleToggleTimer, handleRestart, handleRestartFullSession, handleSpeedMultiplierChange,
    handleNextExerciseClick, handleMicToggle, handleAudioToggle,
    handleExerciseSelect, handleEarTrainingGuessed, handleRepeatCountChange, handleNoteMatchingReset,
  }), [
    tabRestartKey, isPlayingRef,
    handleToggleTimer, handleRestart, handleRestartFullSession, handleSpeedMultiplierChange,
    handleNextExerciseClick, handleMicToggle, handleAudioToggle,
    handleExerciseSelect, handleEarTrainingGuessed, handleRepeatCountChange, handleNoteMatchingReset,
  ]);
}
