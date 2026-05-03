import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { useCallback, useEffect, useRef } from "react";

import type { SlotResult } from "../../../hooks/useStrummingMatcher";
import { playStrumSound } from "../strumming.audio";
import { barPixelWidth } from "../strumming.canvas";
import { PAD, SLOT_W } from "../strumming.constants";
import { drawFrame } from "../strumming.frame";

interface UseStrummingAnimationOptions {
  pattern:               StrumPattern | undefined;
  bpm:                   number;
  isPlaying:             boolean;
  startTime:             number | null;
  countInRemaining:      number;
  slotFeedback:          Map<number, SlotResult> | undefined;
  isMicEnabled:          boolean | undefined;
  maxReps:               number;
  canvasH:               number;
  externalAudioContext:  AudioContext | null | undefined;
}

export function useStrummingAnimation({
  pattern, bpm, isPlaying, startTime, countInRemaining,
  slotFeedback, isMicEnabled, maxReps, canvasH, externalAudioContext,
}: UseStrummingAnimationOptions) {
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const containerRef       = useRef<HTMLDivElement>(null);
  const rafRef             = useRef<number | null>(null);
  const sizeRef            = useRef({ w: 0, h: 0 });
  const audioCtxRef        = useRef<AudioContext | null>(null);
  const lastSlotRef        = useRef<number>(-1);
  const lastStartTimeRef   = useRef<number | null>(null);
  const prevFeedbackRef    = useRef<Map<number, SlotResult>>(new Map());
  const transitionStartRef = useRef<number | null>(null);
  const viewerLoopCountRef = useRef<number>(0);

  // Keep a ref to externalAudioContext so the RAF tick always reads the latest value
  const externalAudioContextRef = useRef(externalAudioContext);
  externalAudioContextRef.current = externalAudioContext;

  useEffect(() => {
    if (!isPlaying) {
      lastSlotRef.current        = -1;
      viewerLoopCountRef.current = 0;
      prevFeedbackRef.current    = new Map();
      transitionStartRef.current = null;
    }
  }, [isPlaying]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      sizeRef.current = { w, h: canvasH };
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr     = window.devicePixelRatio || 1;
      canvas.width  = w * dpr;
      canvas.height = canvasH * dpr;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasH]);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx)   { rafRef.current = requestAnimationFrame(tick); return; }

    const { w } = sizeRef.current;
    if (!pattern || w === 0) { rafRef.current = requestAnimationFrame(tick); return; }

    const dpr        = window.devicePixelRatio || 1;
    const totalSlots = pattern.timeSignature[0] * pattern.subdivisions;
    const bpw        = barPixelWidth(pattern);
    const drawSlotW  = Math.max(28, (w - 2 * PAD) / totalSlots);
    const drawBpw    = totalSlots * drawSlotW;

    let cursorScreenX = -1;
    let totalPixels   = 0;
    let chordIdx      = 0;
    let currentRep    = 0;

    const active = isPlaying && startTime !== null && countInRemaining === 0;

    if (active) {
      if (startTime !== lastStartTimeRef.current) {
        lastStartTimeRef.current   = startTime;
        lastSlotRef.current        = -1;
        viewerLoopCountRef.current = 0;
        prevFeedbackRef.current    = new Map();
        transitionStartRef.current = null;
      }

      const elapsedMs  = Date.now() - startTime;
      const elapsedSec = Math.max(0, elapsedMs / 1000);
      const bps        = bpm / 60;
      const barDurSec  = pattern.timeSignature[0] / bps;
      totalPixels = (elapsedSec / barDurSec) * bpw;

      const barsDone  = Math.floor(totalPixels / bpw);
      const chordList = pattern.chords && pattern.chords.length > 0 ? pattern.chords : null;
      chordIdx        = chordList ? barsDone % chordList.length : 0;
      currentRep      = barsDone % maxReps;
      const currentChord = chordList ? chordList[chordIdx] : pattern.chord;

      if (barsDone > viewerLoopCountRef.current) {
        viewerLoopCountRef.current = barsDone;
        prevFeedbackRef.current    = new Map(slotFeedback ?? new Map());
        transitionStartRef.current = performance.now();
      }

      const repProgress = (totalPixels % bpw) / bpw;
      cursorScreenX = PAD + repProgress * drawBpw;

      const totalSlotsElapsed = Math.floor(totalPixels / SLOT_W);
      if (totalSlotsElapsed !== lastSlotRef.current) {
        lastSlotRef.current = totalSlotsElapsed;
        const slotInBar = totalSlotsElapsed % totalSlots;
        const beat      = pattern.strums[slotInBar];
        if (beat && beat.direction !== "miss") {
          function getAudioCtx() {
            const ext = externalAudioContextRef.current;
            if (ext) { if (ext.state === "suspended") ext.resume(); return ext; }
            if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
            if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
            return audioCtxRef.current;
          }
          try { playStrumSound(getAudioCtx(), beat.direction, !!beat.muted, !!beat.accented, currentChord); }
          catch (_) { /* ignore AudioContext errors */ }
        }
      }
    }

    const transitionAlpha = transitionStartRef.current !== null
      ? Math.max(0, 1 - (performance.now() - transitionStartRef.current) / 400)
      : 0;

    const idleCursor = !active && countInRemaining === 0;
    if (idleCursor) cursorScreenX = PAD;

    drawFrame(
      ctx, dpr, canvas.width, canvas.height, pattern,
      cursorScreenX, chordIdx,
      slotFeedback ?? new Map(),
      prevFeedbackRef.current,
      transitionAlpha,
      !!(isMicEnabled && active),
      idleCursor,
      currentRep, maxReps, drawSlotW,
    );
    rafRef.current = requestAnimationFrame(tick);
  }, [pattern, bpm, isPlaying, startTime, countInRemaining, slotFeedback, isMicEnabled, maxReps]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [tick]);

  useEffect(() => () => { audioCtxRef.current?.close(); }, []);

  return { canvasRef, containerRef };
}
