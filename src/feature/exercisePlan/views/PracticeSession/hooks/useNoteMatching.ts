import { useEffect, useRef, useState, useMemo, startTransition } from "react";
import { getFrequencyFromTab, getCentsDistance, freqToPitchClass, computeChromagram } from "utils/audio/noteUtils";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import type { TablatureMeasure } from "../../../types/exercise.types";

// ── Constants shared with MicHud ─────────────────────────────────────────────
 
export const CENTS_TOLERANCE = 60;
export const CHORD_CHROMA_THRESHOLD = 0.75;

export const feedbackStyles: Record<string, { color: string; dropShadow: string; scale: number }> = {
  "NICE!":          { color: "text-emerald-400", dropShadow: "drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]",  scale: 1.35 },
  "GREAT!":         { color: "text-cyan-400",    dropShadow: "drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]",  scale: 1.45 },
  "AMAZING!":       { color: "text-purple-400",  dropShadow: "drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]", scale: 1.5  },
  "ON FIRE!":       { color: "text-orange-400",  dropShadow: "drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]",  scale: 1.55 },
  "UNSTOPPABLE!":   { color: "text-amber-400",   dropShadow: "drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]",  scale: 1.6  },
  "MULTIPLIER UP!": { color: "text-main",        dropShadow: "drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]",   scale: 1.5  },
};

export function getPerformanceGrade(accuracy: number) {
  if (accuracy >= 95) return { letter: "S", color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   glow: "shadow-[0_0_12px_rgba(251,191,36,0.4)]" };
  if (accuracy >= 85) return { letter: "A", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "" };
  if (accuracy >= 70) return { letter: "B", color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    glow: "" };
  if (accuracy >= 50) return { letter: "C", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  glow: "" };
  return                      { letter: "D", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     glow: "" };
}

export function getFeedbackForCombo(combo: number): { text: string } | null {
  if (combo >= 25 && combo % 5 === 0) return { text: "UNSTOPPABLE!" };
  if (combo === 20) return { text: "ON FIRE!" };
  if (combo === 15) return { text: "AMAZING!" };
  if (combo === 10) return { text: "GREAT!" };
  if (combo === 5)  return { text: "NICE!" };
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GameState {
  score: number;
  combo: number;
  multiplier: number;
  lastFeedback: string;
  feedbackId: number;
}

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
  /** called after per-exercise reset (e.g. to clear earTrainingScore) */
  onReset?: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNoteMatching({
  isPlaying,
  startTime,
  effectiveBpm,
  rawBpm,
  activeTablature,
  isMicEnabled,
  currentExerciseIndex,
  isHalfSpeed,
  getLatencyMs,
  audioRefs,
  getAdjustedTargetFreq,
  onReset,
}: UseNoteMatchingOptions) {
  const [hitNotes,       setHitNotes]       = useState<Record<string, boolean>>({});
  const [missedNotes,    setMissedNotes]    = useState<Record<string, boolean>>({});
  const [sessionAccuracy,setSessionAccuracy] = useState(100);
  const [sessionStats,   setSessionStats]   = useState({ hits: 0, misses: 0 });
  const [gameState,      setGameState]      = useState<GameState>({
    score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0,
  });

  const lastLoopedBeatsRef  = useRef(0);
  const processedNotesRef   = useRef<Set<string>>(new Set());
  const hitNotesRef         = useRef<Record<string, boolean>>({});
  const missedNotesRef      = useRef<Record<string, boolean>>({});
  const rafIdRef            = useRef<number>(0);
  const gameStateRef        = useRef<GameState>({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
  const statsRef            = useRef({ hits: 0, misses: 0 });
  const lastFlushRef        = useRef(0);
  const needsFlushRef       = useRef(false);
  const consecutiveMissesRef = useRef(0);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const totalNotes = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) =>
      acc + m.beats.reduce((acc2, b) => acc2 + b.notes.length, 0), 0
    );
  }, [activeTablature]);

  const maxPossibleScore = useMemo(() => {
    if (totalNotes === 0) return 0;
    const halfPenalty = isHalfSpeed ? 0.5 : 1;
    const bpmB = 1 + (rawBpm - 100) * 0.001;
    let total = 0;
    for (let i = 0; i < totalNotes; i++) {
      const mult = Math.min(8, Math.floor(i / 5) + 1);
      total += Math.round(100 * mult * halfPenalty * bpmB);
    }
    return total;
  }, [totalNotes, isHalfSpeed, rawBpm]);

  const totalExerciseBeats = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) =>
      acc + m.beats.reduce((acc2, b) => acc2 + b.duration, 0), 0
    );
  }, [activeTablature]);

  const beatsPerSecond = effectiveBpm / 60;
  const elapsedSeconds = (isPlaying && startTime) ? (Date.now() - startTime) / 1000 : 0;
  const currentBeatsElapsed = totalExerciseBeats > 0
    ? (elapsedSeconds * beatsPerSecond) % totalExerciseBeats
    : 0;

  // ── Reset on exercise change ─────────────────────────────────────────────────

  const resetGame = () => {
    setHitNotes({});
    hitNotesRef.current = {};
    setMissedNotes({});
    missedNotesRef.current = {};
    setSessionAccuracy(100);
    setSessionStats({ hits: 0, misses: 0 });
    setGameState({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
    gameStateRef.current = { score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 };
    statsRef.current = { hits: 0, misses: 0 };
    needsFlushRef.current = false;
    lastLoopedBeatsRef.current = 0;
    consecutiveMissesRef.current = 0;
    processedNotesRef.current.clear();
  };

  useEffect(() => {
    resetGame();
    onReset?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex]);

  // ── Clear feedback after delay ───────────────────────────────────────────────

  useEffect(() => {
    if (gameState.lastFeedback) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, lastFeedback: "" }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.feedbackId]);

  // ── RAF note-matching loop ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying || !startTime || !activeTablature || !isMicEnabled) return;

    const tablature = activeTablature;
    const totalExBeats = tablature.reduce((acc, m) =>
      acc + m.beats.reduce((acc2, b) => acc2 + b.duration, 0), 0
    );
    if (totalExBeats === 0) return;

    const bpm             = effectiveBpm;
    const halfSpeedPenalty = isHalfSpeed ? 0.5 : 1;
    const bpmBonus         = 1 + (rawBpm - 100) * 0.001;

    const tick = () => {
      const now            = Date.now();
      const latencyMs      = getLatencyMs();
      const compensatedNow = now - latencyMs;

      const currentFreq     = audioRefs.frequencyRef.current;
      const currentVolume   = audioRefs.volumeRef.current;
      const lastOnsetTime   = audioRefs.lastOnsetTimeRef.current;

      // Lazy chromagram — computed at most once per tick, only for chord beats
      let chromagram: Float32Array | null | undefined = undefined;
      const getChromagram = (): Float32Array | null => {
        if (chromagram === undefined) {
          const analyser = audioRefs.analyserRef.current;
          chromagram = analyser ? computeChromagram(analyser) : null;
        }
        return chromagram;
      };

      const beatsPerSec    = bpm / 60;
      const beatDurationMs = 60000 / bpm;
      const onsetRecencyMs = Math.min(800, Math.max(200, beatDurationMs * 0.8));
      const windowMs         = Math.min(500, Math.max(150, beatDurationMs * 0.35));
      const windowBeats      = (windowMs / 1000) * beatsPerSec;
      const earlyWindowMs    = Math.max(16, Math.min(50, beatDurationMs * 0.05));
      const earlyWindowBeats = (earlyWindowMs / 1000) * beatsPerSec;

      const elapsedSec       = (compensatedNow - startTime) / 1000;
      const totalBeatsElapsed = elapsedSec * beatsPerSec;
      const loopedBeatsElapsed = totalBeatsElapsed % totalExBeats;

      // Detect loop restart
      const hasLooped = loopedBeatsElapsed < lastLoopedBeatsRef.current - 0.1;
      if (hasLooped) {
        hitNotesRef.current = {};
        missedNotesRef.current = {};
        processedNotesRef.current.clear();
        needsFlushRef.current = true;
      }
      lastLoopedBeatsRef.current = loopedBeatsElapsed;

      const timeSinceOnset = now - lastOnsetTime;
      const hasRecentOnset = timeSinceOnset < onsetRecencyMs;

      let currentBeatTotal = 0;
      const gs = gameStateRef.current;
      const s  = statsRef.current;

      for (let mIdx = 0; mIdx < tablature.length; mIdx++) {
        const measure = tablature[mIdx];
        for (let bIdx = 0; bIdx < measure.beats.length; bIdx++) {
          const beat      = measure.beats[bIdx];
          const beatStart = currentBeatTotal;
          const beatEnd   = currentBeatTotal + beat.duration;

          const isWithinWindow =
            (loopedBeatsElapsed >= beatStart - earlyWindowBeats && loopedBeatsElapsed <= beatEnd + windowBeats) ||
            (loopedBeatsElapsed < earlyWindowBeats && beatEnd + windowBeats >= totalExBeats);
          const isPassed = loopedBeatsElapsed > beatEnd + windowBeats;

          beat.notes.forEach((note, nIdx) => {
            const noteKey = `${mIdx}-${bIdx}-${nIdx}`;
            if (processedNotesRef.current.has(noteKey)) return;

            const requiresOnset = !note.isHammerOn && !note.isPullOff;

            if (isWithinWindow && currentVolume > 0.02 && (hasRecentOnset || !requiresOnset)) {
              const baseTargetFreq = getFrequencyFromTab(note.string, note.fret);
              const targetFreq     = getAdjustedTargetFreq(note.string, baseTargetFreq);

              let isHit = false;
              if (beat.notes.length > 1) {
                // Chord / dyad / interval — prefer the onset snapshot (cleaner signal).
                // For legato notes (no onset required) fall back to the live chromagram.
                const chroma = requiresOnset
                  ? audioRefs.onsetChromaRef.current
                  : getChromagram();
                if (chroma) {
                  isHit = chroma[freqToPitchClass(targetFreq)] >= CHORD_CHROMA_THRESHOLD;
                }
              } else {
                // Single note — use existing monophonic YIN path
                isHit = currentFreq > 50 && Math.abs(getCentsDistance(currentFreq, targetFreq)) <= CENTS_TOLERANCE;
              }

              if (isHit) {
                processedNotesRef.current.add(noteKey);
                hitNotesRef.current[noteKey] = true;
                needsFlushRef.current = true;
                s.hits++;
                consecutiveMissesRef.current = 0;

                const newCombo      = gs.combo + 1;
                const newMultiplier = Math.min(8, Math.floor(newCombo / 5) + 1);
                if (newMultiplier > gs.multiplier) {
                  gs.lastFeedback = "MULTIPLIER UP!"; gs.feedbackId++;
                } else {
                  const tier = getFeedbackForCombo(newCombo);
                  if (tier) { gs.lastFeedback = tier.text; gs.feedbackId++; }
                }
                gs.score      += Math.round(100 * newMultiplier * halfSpeedPenalty * bpmBonus);
                gs.combo       = newCombo;
                gs.multiplier  = newMultiplier;
              }
            } else if (isPassed && !hitNotesRef.current[noteKey]) {
              processedNotesRef.current.add(noteKey);
              missedNotesRef.current[noteKey] = true;
              needsFlushRef.current = true;
              s.misses++;
              consecutiveMissesRef.current++;
              gs.combo = 0;
              // Reset multiplier only after 3 consecutive misses
              if (consecutiveMissesRef.current >= 3) {
                gs.multiplier = 1;
              }
            }
          });

          currentBeatTotal += beat.duration;
        }
      }

      // Throttled flush to React: immediate after long pause (first note of phrase), 50ms throttle during active play
      const timeSinceFlush = now - lastFlushRef.current;
      const flushThreshold = timeSinceFlush > 200 ? 0 : 50;
      if (needsFlushRef.current && timeSinceFlush >= flushThreshold) {
        lastFlushRef.current  = now;
        needsFlushRef.current = false;
        const hitNotesCopy    = { ...hitNotesRef.current };
        const missedNotesCopy = { ...missedNotesRef.current };
        const statsCopy       = { hits: s.hits, misses: s.misses };
        const total           = s.hits + s.misses;
        const accuracy        = total > 0 ? Math.round((s.hits / total) * 100) : 100;
        const gsCopy          = { ...gs };
        startTransition(() => {
          setHitNotes(hitNotesCopy);
          setMissedNotes(missedNotesCopy);
          setSessionStats(statsCopy);
          setSessionAccuracy(accuracy);
          setGameState(gsCopy);
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafIdRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, effectiveBpm, activeTablature, isMicEnabled, currentExerciseIndex, getLatencyMs, audioRefs, getAdjustedTargetFreq, isHalfSpeed, rawBpm]);

  return {
    hitNotes,
    missedNotes,
    sessionAccuracy,
    sessionStats,
    gameState,
    maxPossibleScore,
    currentBeatsElapsed,
    resetGame,
  };
}
