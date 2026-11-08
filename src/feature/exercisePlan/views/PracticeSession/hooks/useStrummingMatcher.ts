import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { startTransition,useEffect, useRef, useState } from "react";

import type { GameState } from "./noteMatchingFeedback";

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_W = 64; // must match StrummingPatternViewer

/** How far off its slot (as a share of the slot) a strum still counts. */
const TOLERANCE_OF_SLOT = 0.37;

/**
 * How long after a strum's own (latency-compensated) time its attack can still
 * be on its way: the detector reports an attack one analysis window after it
 * (the latency estimate's window part), then up to a block later, then the next
 * frame reads it. A slot is only called missed once this has passed too —
 * judged the moment the cursor left it, a strum played on time but reported
 * after that counted as a miss *and* a hit.
 */
const REPORT_MARGIN_MS = 110;

/** Analysis window the attack-time latencies leave out (see getAttackLatencyMs). */
const ATTACK_WINDOW_MS = 50;

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
  /** getLatencyMs() without the analysis window — the lag lastAttackMsRef still carries. */
  getAttackLatencyMs?: () => number;
  /** The player's measured latency (timing calibration), already on attack times. */
  calibratedLatencyMs?: number | null;
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
  getAttackLatencyMs,
  calibratedLatencyMs,
  currentExerciseIndex,
}: UseStrummingMatcherOptions) {
  // ── Refs (all mutation happens here, never triggers re-render) ──────────────
  const slotFeedbackRefInternal = useRef<Map<number, SlotResult>>(new Map());
  /** Absolute slots already given their verdict — each gets exactly one. */
  const judgedSlotsRef          = useRef<Set<number>>(new Set());
  /** The next absolute slot whose deadline for a miss hasn't been checked. */
  const missCursorRef           = useRef<number>(0);
  const lastProcessedOnsetRef   = useRef<number>(0);
  const lastProcessedSoftRef    = useRef<number>(0);
  const rhythmStatsRef          = useRef({ hits: 0, misses: 0, wrongHits: 0 });
  const gameStateRef            = useRef<GameState>({ score: 0, combo: 0, multiplier: 1 });
  const lastHudFlushRef         = useRef<number>(0);
  const needsFlushRef           = useRef<boolean>(false);
  const prevLoopIdxRef          = useRef<number>(0);
  const rafIdRef                = useRef<number>(0);

  // ── React state (flushed ~10Hz) ─────────────────────────────────────────────
  const [slotFeedback, setSlotFeedback] = useState<Map<number, SlotResult>>(new Map());
  const [gameState,    setGameState]    = useState<GameState>({ score: 0, combo: 0, multiplier: 1 });
  const [sessionAccuracy, setSessionAccuracy] = useState(100);
  const [sessionStats,    setSessionStats]    = useState({ hits: 0, misses: 0 });

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = () => {
    slotFeedbackRefInternal.current.clear();
    judgedSlotsRef.current.clear();
    missCursorRef.current = 0;
    lastProcessedOnsetRef.current = 0;
    lastProcessedSoftRef.current = 0;
    rhythmStatsRef.current  = { hits: 0, misses: 0, wrongHits: 0 };
    gameStateRef.current    = { score: 0, combo: 0, multiplier: 1 };
    prevLoopIdxRef.current  = 0;
    needsFlushRef.current   = true;
    startTransition(() => {
      setSlotFeedback(new Map());
      setGameState({ score: 0, combo: 0, multiplier: 1 });
      setSessionAccuracy(100);
      setSessionStats({ hits: 0, misses: 0 });
    });
  };

  useEffect(() => { resetGame(); }, [currentExerciseIndex]);

  // ── Detection RAF loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !startTime || !pattern || !isMicEnabled) return;

    const totalSlots = pattern.timeSignature[0] * pattern.subdivisions;
    const bpw        = barPixelWidth(pattern);

    /**
     * Gives the slot an attack lands on its verdict, if it has none yet. A soft
     * attack (spectral flux — see lastSoftAttackMsRef) may only credit a strum:
     * it also hears palm mutes and chord changes, which must not turn a rest
     * wrong.
     */
    const judgeAttack = (compensatedMs: number, soft: boolean, slotDurationMs: number) => {
      const onsetElapsed = compensatedMs - startTime;
      if (onsetElapsed <= 0) return;
      const rawSlot  = Math.round(onsetElapsed / slotDurationMs);
      const offsetMs = onsetElapsed - rawSlot * slotDurationMs;
      if (Math.abs(offsetMs) > slotDurationMs * TOLERANCE_OF_SLOT) return;
      // One verdict per slot: a strum reported twice (both detectors, or one
      // twice) is still one strum.
      if (judgedSlotsRef.current.has(rawSlot)) return;
      const slotInBar = ((rawSlot % totalSlots) + totalSlots) % totalSlots;
      const beat = pattern.strums[slotInBar];
      const isStrum = !!beat && beat.direction !== "miss";
      if (soft && !isStrum) return;

      judgedSlotsRef.current.add(rawSlot);
      const gs = gameStateRef.current;
      if (isStrum) {
        // HIT
        slotFeedbackRefInternal.current.set(slotInBar, "hit");
        rhythmStatsRef.current.hits++;
        const newCombo = gs.combo + 1;
        const newMult  = Math.min(8, Math.floor(newCombo / 5) + 1);
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
    };

    const tick = () => {
      const now        = Date.now();
      const elapsedMs  = now - startTime;
      if (elapsedMs < 0) { rafIdRef.current = requestAnimationFrame(tick); return; }

      const slotDurationMs  = (60000 / bpm) / pattern.subdivisions;
      const toleranceMs     = slotDurationMs * TOLERANCE_OF_SLOT;

      // ── Loop restart detection ──────────────────────────────────────────
      const totalPixels    = (elapsedMs / 1000) * (bpm / 60) * pattern.subdivisions * SLOT_W;
      const currentLoopIdx = Math.floor(totalPixels / bpw);
      if (currentLoopIdx > prevLoopIdxRef.current) {
        prevLoopIdxRef.current = currentLoopIdx;
        // NOTE: do NOT clear judgedSlotsRef here. Slots are *absolute*
        // (monotonically increasing) indices, so every slot is judged exactly
        // once and the next rep naturally gets fresh indices. Clearing it at the
        // bar boundary used to wipe the just-recorded hit on the rep's last slot.
        // slotFeedbackRefInternal is intentionally kept so the viewer can fade
        // out the previous rep's results; it is overwritten slot-by-slot.
      }

      // ── Onset detection ────────────────────────────────────────────────
      // The attack's own time (dated back to the hop it landed in, less the
      // analysis window), with the latency that time still carries — measured
      // when calibrated. lastOnsetTimeRef only stamps the end of the block, up
      // to a block late, and is the fallback where no attack time exists.
      const attackLatency = calibratedLatencyMs ?? (getAttackLatencyMs ?? getLatencyMs)();
      const attackMs = audioRefs.lastAttackMsRef?.current ?? 0;
      const useAttack = attackMs > 0;
      const lastOnset = useAttack ? attackMs : audioRefs.lastOnsetTimeRef.current;
      if (lastOnset > 0 && lastOnset !== lastProcessedOnsetRef.current) {
        lastProcessedOnsetRef.current = lastOnset;
        judgeAttack(lastOnset - (useAttack ? attackLatency : getLatencyMs()), false, slotDurationMs);
      }
      const softMs = audioRefs.lastSoftAttackMsRef?.current ?? 0;
      if (softMs > 0 && softMs !== lastProcessedSoftRef.current) {
        lastProcessedSoftRef.current = softMs;
        judgeAttack(softMs - attackLatency, true, slotDurationMs);
      }

      // ── Miss detection: once a slot's last chance to be heard has passed ─
      // Its strum may land up to the tolerance late, and is heard a latency
      // (plus the window and a block) after that.
      const reportLagMs = Math.max(getLatencyMs(), attackLatency + ATTACK_WINDOW_MS) + REPORT_MARGIN_MS;
      const settledSlots = Math.floor((elapsedMs - toleranceMs - reportLagMs) / slotDurationMs) + 1;
      while (missCursorRef.current < settledSlots) {
        const absSlot = missCursorRef.current++;
        if (judgedSlotsRef.current.has(absSlot)) continue;
        judgedSlotsRef.current.add(absSlot);
        const slotInBar = ((absSlot % totalSlots) + totalSlots) % totalSlots;
        const beat = pattern.strums[slotInBar];
        if (beat && beat.direction !== "miss") {
          slotFeedbackRefInternal.current.set(slotInBar, "miss");
          rhythmStatsRef.current.misses++;
          gameStateRef.current.combo      = 0;
          gameStateRef.current.multiplier = 1;
          needsFlushRef.current = true;
        } else if (beat && slotFeedbackRefInternal.current.has(slotInBar)) {
          // Rest correctly observed. Clear any stale "wrong" left over from a
          // previous rep so the rest doesn't stay orange forever — the feedback
          // map is keyed by slot-in-bar and shared across reps, and nothing
          // else ever re-evaluates a rest slot.
          slotFeedbackRefInternal.current.delete(slotInBar);
          needsFlushRef.current = true;
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

  }, [isPlaying, startTime, bpm, pattern, isMicEnabled, currentExerciseIndex, getLatencyMs, getAttackLatencyMs, calibratedLatencyMs, audioRefs]);

  return { slotFeedback, gameState, sessionAccuracy, sessionStats, resetGame };
}
