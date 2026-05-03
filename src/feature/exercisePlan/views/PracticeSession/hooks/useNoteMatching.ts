import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useEffect, useMemo, useRef } from "react";
import { computeChromagram, freqToPitchClass, getCentsDistance, getFrequencyFromTab } from "utils/audio/noteUtils";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { getFeedbackForCombo } from "./noteMatchingFeedback";
import { useGameState } from "./useGameState";

const CENTS_TOLERANCE      = 45;
const CHORD_CHROMA_THRESHOLD = 0.55;

interface UseNoteMatchingOptions {
  isPlaying: boolean;
  startTime: number | null;
  effectiveBpm: number;
  /** raw metronome BPM — used for score bonus calculation */
  rawBpm: number;
  activeTablature: TablatureMeasure[] | null | undefined;
  isMicEnabled: boolean;
  currentExerciseIndex: number;
  isHalfSpeed: boolean;
  getLatencyMs: () => number;
  audioRefs: AudioRefs;
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number;
  onReset?: () => void;
}

export function useNoteMatching({
  isPlaying, startTime, effectiveBpm, rawBpm,
  activeTablature, isMicEnabled, currentExerciseIndex,
  isHalfSpeed, getLatencyMs, audioRefs, getAdjustedTargetFreq, onReset,
}: UseNoteMatchingOptions) {
  const {
    hitNotes, missedNotes, sessionAccuracy, sessionStats, maxCombo, gameState,
    hitNotesRef, missedNotesRef, gameStateRef, statsRef,
    maxComboRef, consecutiveMissesRef, needsFlushRef,
    flushToReact, reset: resetGame,
  } = useGameState(currentExerciseIndex, onReset);

  const lastLoopedBeatsRef = useRef(0);
  const processedNotesRef  = useRef<Set<string>>(new Set());
  const rafIdRef           = useRef<number>(0);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalNotes = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) => acc + m.beats.reduce((a, b) => a + b.notes.length, 0), 0);
  }, [activeTablature]);

  const maxPossibleScore = useMemo(() => {
    if (totalNotes === 0) return 0;
    const halfPenalty = isHalfSpeed ? 0.5 : 1;
    const bpmB        = 1 + (rawBpm - 100) * 0.001;
    let total = 0;
    for (let i = 0; i < totalNotes; i++) {
      total += Math.round(100 * Math.min(8, Math.floor(i / 5) + 1) * halfPenalty * bpmB);
    }
    return total;
  }, [totalNotes, isHalfSpeed, rawBpm]);

  const totalExerciseBeats = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) => acc + m.beats.reduce((a, b) => a + b.duration, 0), 0);
  }, [activeTablature]);

  const beatsPerSecond = effectiveBpm / 60;
  const currentBeatsElapsedRef = useRef(0);

  useEffect(() => {
    if (!isPlaying || !startTime || !totalExerciseBeats) { currentBeatsElapsedRef.current = 0; return; }
    let rafId: number;
    const tick = () => {
      const elapsed = ((Date.now() - startTime) / 1000) * beatsPerSecond;
      currentBeatsElapsedRef.current = elapsed % totalExerciseBeats;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, startTime, beatsPerSecond, totalExerciseBeats]);

  // ── RAF note-matching loop ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying || !startTime || !activeTablature || !isMicEnabled) return;

    // Pre-flatten beats once per effect mount for O(log n) window search
    const flatBeats: {
      beat: any; beatStart: number; beatEnd: number;
      notes: { note: any; noteKey: string }[];
    }[] = [];
    let pos = 0;
    for (let mIdx = 0; mIdx < activeTablature.length; mIdx++) {
      for (let bIdx = 0; bIdx < activeTablature[mIdx].beats.length; bIdx++) {
        const beat = activeTablature[mIdx].beats[bIdx];
        flatBeats.push({
          beat, beatStart: pos, beatEnd: pos + beat.duration,
          notes: beat.notes.map((note: any, nIdx: number) => ({
            note, noteKey: `${mIdx}-${bIdx}-${nIdx}`,
          })),
        });
        pos += beat.duration;
      }
    }
    const totalExBeats = pos;
    if (totalExBeats === 0) return;

    const halfSpeedPenalty = isHalfSpeed ? 0.5 : 1;
    const bpmBonus         = 1 + (rawBpm - 100) * 0.001;

    const tick = () => {
      const now            = Date.now();
      const compensatedNow = now - getLatencyMs();

      const currentFreq   = audioRefs.frequencyRef.current;
      const currentVolume = audioRefs.rawVolumeRef.current;
      const lastOnsetTime = audioRefs.lastOnsetTimeRef.current;
      const lastTickTime  = audioRefs.lastTickTimeRef.current;

      // Lazy chromagram — computed at most once per tick, only for chord beats
      let chromagram: Float32Array | null | undefined = undefined;
      const getChromagram = (): Float32Array | null => {
        if (chromagram === undefined) chromagram = audioRefs.analyserRef.current ? computeChromagram(audioRefs.analyserRef.current) : null;
        return chromagram;
      };

      const beatsPerSec      = effectiveBpm / 60;
      const beatDurationMs   = 60000 / effectiveBpm;
      const onsetRecencyMs   = Math.min(800, Math.max(200, beatDurationMs * 0.8));
      const windowMs         = Math.min(500, Math.max(150, beatDurationMs * 0.35));
      const windowBeats      = (windowMs / 1000) * beatsPerSec;
      const earlyWindowBeats = (Math.max(16, Math.min(50, beatDurationMs * 0.05)) / 1000) * beatsPerSec;

      const loopedBeatsElapsed = ((compensatedNow - startTime) / 1000 * beatsPerSec) % totalExBeats;
      const hasRecentOnset     = (now - lastOnsetTime) < onsetRecencyMs;
      const hasRecentTick      = (now - lastTickTime)  < onsetRecencyMs;

      // Detect loop restart — reset note tracking
      if (loopedBeatsElapsed < lastLoopedBeatsRef.current - 0.1) {
        hitNotesRef.current   = {};
        missedNotesRef.current = {};
        processedNotesRef.current.clear();
        needsFlushRef.current = true;
      }
      lastLoopedBeatsRef.current = loopedBeatsElapsed;

      const gs = gameStateRef.current;
      const s  = statsRef.current;

      // We must search slightly further back than windowBeats so we can evaluate `isPassed` and mark misses
      let low = 0, high = flatBeats.length - 1, startIdx = 0;
      const searchTarget = Math.max(0, loopedBeatsElapsed - windowBeats - (beatsPerSec * 1.5)); // Look 1.5s into the past
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (flatBeats[mid].beatEnd < searchTarget) { startIdx = mid + 1; low = mid + 1; }
        else high = mid - 1;
      }

      for (let i = startIdx; i < flatBeats.length; i++) {
        const { beat, beatStart, beatEnd, notes } = flatBeats[i];
        if (beatStart > loopedBeatsElapsed + earlyWindowBeats + 1) break;

        const isWithinWindow =
          (loopedBeatsElapsed >= beatStart - earlyWindowBeats && loopedBeatsElapsed <= beatEnd + windowBeats) ||
          (loopedBeatsElapsed < earlyWindowBeats && beatEnd + windowBeats >= totalExBeats);
        const isPassed = loopedBeatsElapsed > beatEnd + windowBeats;

        notes.forEach(({ note, noteKey }) => {
          if (processedNotesRef.current.has(noteKey) && !hitNotesRef.current[noteKey]) return;

          const requiresOnset = !note.isHammerOn && !note.isPullOff;
          const alreadyHit    = !!hitNotesRef.current[noteKey];

          if (isWithinWindow) {
            if (currentVolume > 0.005 && (hasRecentOnset || hasRecentTick || !requiresOnset || alreadyHit)) {
              let isHit = false;
              let targetFreqToLog = 0;
              if (note.isDead) {
                isHit = hasRecentTick || hasRecentOnset;
              } else {
                const targetFret     = (note.isBend || note.isPreBend) && note.bendSemitones ? note.fret + note.bendSemitones : note.fret;
                const baseTargetFreq = getFrequencyFromTab(note.string, targetFret);
                const targetFreq     = getAdjustedTargetFreq(note.string, baseTargetFreq);
                targetFreqToLog = targetFreq;
                if (beat.notes.length > 1) {
                  const chroma = (requiresOnset && !alreadyHit) ? audioRefs.onsetChromaRef.current : getChromagram();
                  if (chroma) isHit = chroma[freqToPitchClass(targetFreq)] >= CHORD_CHROMA_THRESHOLD;
                } else {
                  // Thicker strings (like E6) often drift sharp on attack and are harder to tune perfectly.
                  const tolerance = targetFreq < 100 ? CENTS_TOLERANCE + 25 : (targetFreq < 165 ? CENTS_TOLERANCE + 15 : CENTS_TOLERANCE);
                  
                  const direct = currentFreq > 20 && Math.abs(getCentsDistance(currentFreq, targetFreq)) <= tolerance;
                  const octave = targetFreq < 165 && (currentFreq / 2) > 20 && Math.abs(getCentsDistance(currentFreq / 2, targetFreq)) <= tolerance;
                  const thirdHarmonic = targetFreq < 130 && (currentFreq / 3) > 20 && Math.abs(getCentsDistance(currentFreq / 3, targetFreq)) <= tolerance;
                  const fourthHarmonic = targetFreq < 100 && (currentFreq / 4) > 20 && Math.abs(getCentsDistance(currentFreq / 4, targetFreq)) <= tolerance;
                  const subOctave = targetFreq > 70 && (currentFreq * 2) > 20 && Math.abs(getCentsDistance(currentFreq * 2, targetFreq)) <= tolerance;
                  
                  isHit = direct || octave || thirdHarmonic || fourthHarmonic || subOctave;
                }
              }

              if (isHit) {
                if (!processedNotesRef.current.has(noteKey)) {
                  processedNotesRef.current.add(noteKey);

                  s.hits++;
                  consecutiveMissesRef.current = 0;
                  const newCombo      = gs.combo + 1;
                  if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
                  const newMultiplier = Math.min(8, Math.floor(newCombo / 5) + 1);
                  if (newMultiplier > gs.multiplier) { gs.lastFeedback = "MULTIPLIER UP!"; gs.feedbackId++; }
                  else { const tier = getFeedbackForCombo(newCombo); if (tier) { gs.lastFeedback = tier.text; gs.feedbackId++; } }
                  gs.score += Math.round(100 * newMultiplier * halfSpeedPenalty * bpmBonus);
                  gs.combo  = newCombo;
                  gs.multiplier = newMultiplier;
                }
                hitNotesRef.current[noteKey] = loopedBeatsElapsed;
                needsFlushRef.current = true;
              }
            }
          } else if (isPassed && !hitNotesRef.current[noteKey]) {

            processedNotesRef.current.add(noteKey);
            missedNotesRef.current[noteKey] = true;
            needsFlushRef.current = true;
            s.misses++;
            consecutiveMissesRef.current++;
            gs.combo = 0;
            if (consecutiveMissesRef.current >= 3) gs.multiplier = 1;
          }
        });
      }

      flushToReact();
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, effectiveBpm, activeTablature, isMicEnabled, currentExerciseIndex, getLatencyMs, audioRefs, getAdjustedTargetFreq, isHalfSpeed, rawBpm]);

  return { hitNotes, missedNotes, sessionAccuracy, sessionStats, gameState, maxCombo, maxPossibleScore, currentBeatsElapsedRef, resetGame };
}
