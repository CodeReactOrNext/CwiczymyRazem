import { useEffect, useRef, useState, startTransition } from "react";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import type { GameState } from "./useNoteMatching";
import { getFeedbackForCombo } from "./useNoteMatching";

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_W = 64; // must match StrummingPatternViewer

function barPixelWidth(p: StrumPattern) {
  return p.timeSignature[0] * p.subdivisions * SLOT_W;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SlotResult = "hit" | "miss" | "wrong";

interface UseStrummingMatcherOptions {
  isPlaying: boolean;
  startTime: number | null;
  bpm: number;
  pattern: StrumPattern | undefined;
  isMicEnabled: boolean;
  audioRefs: AudioRefs;
  getLatencyMs: () => number;
  currentExerciseIndex: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStrummingMatcher({
  isPlaying,
  startTime,
  bpm,
  pattern,
  isMicEnabled,
  audioRefs,
  getLatencyMs,
  currentExerciseIndex,
}: UseStrummingMatcherOptions) {
  // ── Refs (all mutation happens here, never triggers re-render) ──────────────
  const slotFeedbackRefInternal = useRef<Map<number, SlotResult>>(new Map());
  const processedSlotsRef       = useRef<Set<number>>(new Set());
  const lastProcessedOnsetRef   = useRef<number>(0);
  const rhythmStatsRef          = useRef({ hits: 0, misses: 0, wrongHits: 0 });
  const gameStateRef            = useRef<GameState>({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
  const lastHudFlushRef         = useRef<number>(0);
  const needsFlushRef           = useRef<boolean>(false);
  const prevLoopIdxRef          = useRef<number>(0);
  const rafIdRef                = useRef<number>(0);

  // ── React state (flushed ~10Hz) ─────────────────────────────────────────────
  const [slotFeedback, setSlotFeedback] = useState<Map<number, SlotResult>>(new Map());
  const [gameState,    setGameState]    = useState<GameState>({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
  const [sessionAccuracy, setSessionAccuracy] = useState(100);
  const [sessionStats,    setSessionStats]    = useState({ hits: 0, misses: 0 });

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = () => {
    slotFeedbackRefInternal.current.clear();
    processedSlotsRef.current.clear();
    lastProcessedOnsetRef.current = 0;
    rhythmStatsRef.current  = { hits: 0, misses: 0, wrongHits: 0 };
    gameStateRef.current    = { score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 };
    prevLoopIdxRef.current  = 0;
    needsFlushRef.current   = true;
    startTransition(() => {
      setSlotFeedback(new Map());
      setGameState({ score: 0, combo: 0, multiplier: 1, lastFeedback: "", feedbackId: 0 });
      setSessionAccuracy(100);
      setSessionStats({ hits: 0, misses: 0 });
    });
  };

  useEffect(() => { resetGame(); }, [currentExerciseIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear feedback message after it shows
  useEffect(() => {
    if (gameState.lastFeedback) {
      const t = setTimeout(() => setGameState(prev => ({ ...prev, lastFeedback: "" })), 1500);
      return () => clearTimeout(t);
    }
  }, [gameState.feedbackId]);

  // ── Detection RAF loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !startTime || !pattern || !isMicEnabled) return;

    const totalSlots = pattern.timeSignature[0] * pattern.subdivisions;
    const bpw        = barPixelWidth(pattern);

    const tick = () => {
      const now        = Date.now();
      const elapsedMs  = now - startTime;
      if (elapsedMs < 0) { rafIdRef.current = requestAnimationFrame(tick); return; }

      const latency         = getLatencyMs();
      const slotDurationMs  = (60000 / bpm) / pattern.subdivisions;
      const toleranceMs     = slotDurationMs * 0.37;
      const totalSlotsNow   = Math.floor(elapsedMs / slotDurationMs);

      // ── Loop restart detection ──────────────────────────────────────────
      const totalPixels    = (elapsedMs / 1000) * (bpm / 60) * pattern.subdivisions * SLOT_W;
      const currentLoopIdx = Math.floor(totalPixels / bpw);
      if (currentLoopIdx > prevLoopIdxRef.current) {
        prevLoopIdxRef.current = currentLoopIdx;
        // Keep slotFeedbackRefInternal so the viewer can show a fade-out of the
        // previous rep's results — it will be overwritten slot-by-slot as the
        // new rep progresses. Only clear the processed-slots guard so each slot
        // gets re-evaluated in the new rep.
        processedSlotsRef.current.clear();
      }

      // ── Miss detection: mark slot when cursor passes it ────────────────
      const prevAbsSlot = totalSlotsNow - 1;
      if (prevAbsSlot >= 0 && !processedSlotsRef.current.has(prevAbsSlot)) {
        processedSlotsRef.current.add(prevAbsSlot);
        const prevSlotInBar = ((prevAbsSlot % totalSlots) + totalSlots) % totalSlots;
        const prevBeat = pattern.strums[prevSlotInBar];
        if (prevBeat && prevBeat.direction !== "miss") {
          slotFeedbackRefInternal.current.set(prevSlotInBar, "miss");
          rhythmStatsRef.current.misses++;
          gameStateRef.current.combo      = 0;
          gameStateRef.current.multiplier = 1;
          needsFlushRef.current = true;
        }
      }

      // ── Onset detection ────────────────────────────────────────────────
      const lastOnset = audioRefs.lastOnsetTimeRef.current;
      if (lastOnset > 0 && lastOnset !== lastProcessedOnsetRef.current) {
        const compensated = lastOnset - latency;
        const onsetElapsed = compensated - startTime;
        if (onsetElapsed > 0) {
          const rawSlot   = Math.round(onsetElapsed / slotDurationMs);
          const slotInBar = ((rawSlot % totalSlots) + totalSlots) % totalSlots;
          const offsetMs  = onsetElapsed - rawSlot * slotDurationMs;

          if (Math.abs(offsetMs) <= toleranceMs) {
            const beat = pattern.strums[slotInBar];
            lastProcessedOnsetRef.current = lastOnset;
            processedSlotsRef.current.add(rawSlot);

            const gs = gameStateRef.current;

            if (beat && beat.direction !== "miss") {
              // HIT
              slotFeedbackRefInternal.current.set(slotInBar, "hit");
              rhythmStatsRef.current.hits++;
              const newCombo = gs.combo + 1;
              const newMult  = Math.min(8, Math.floor(newCombo / 5) + 1);
              if (newMult > gs.multiplier) {
                gs.lastFeedback = "MULTIPLIER UP!"; gs.feedbackId++;
              } else {
                const tier = getFeedbackForCombo(newCombo);
                if (tier) { gs.lastFeedback = tier.text; gs.feedbackId++; }
              }
              gs.score     += Math.round(100 * newMult);
              gs.combo      = newCombo;
              gs.multiplier = newMult;
            } else {
              // WRONG — strummed on a rest
              slotFeedbackRefInternal.current.set(slotInBar, "wrong");
              rhythmStatsRef.current.wrongHits++;
              gs.combo      = 0;
              gs.multiplier = 1;
            }
            needsFlushRef.current = true;
          }
        }
      }

      // ── Throttled flush to React (~10Hz) ───────────────────────────────
      if (needsFlushRef.current && now - lastHudFlushRef.current >= 100) {
        lastHudFlushRef.current = now;
        needsFlushRef.current   = false;
        const s     = rhythmStatsRef.current;
        const total = s.hits + s.misses + s.wrongHits;
        const acc   = total > 0 ? Math.round((s.hits / total) * 100) : 100;
        const gsCopy  = { ...gameStateRef.current };
        const fbCopy  = new Map(slotFeedbackRefInternal.current);
        startTransition(() => {
          setSlotFeedback(fbCopy);
          setGameState(gsCopy);
          setSessionAccuracy(acc);
          setSessionStats({ hits: s.hits, misses: s.misses });
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, bpm, pattern, isMicEnabled, currentExerciseIndex, getLatencyMs, audioRefs]);

  return { slotFeedback, gameState, sessionAccuracy, sessionStats, resetGame };
}
