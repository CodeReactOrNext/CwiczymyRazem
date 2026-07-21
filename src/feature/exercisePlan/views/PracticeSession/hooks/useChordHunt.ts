import { useCallback, useEffect, useRef, useState } from "react";
import { getNoteFromFrequency, NOTES } from "utils/audio/noteUtils";

import type { GameState } from "./noteMatchingFeedback";

export interface ChordHuntState {
  /** Live detected note name (e.g. "C#"), or null when silent. */
  detectedNote: string | null;
  /** Live detected pitch class (0–11), or null when silent. */
  detectedPitchClass: number | null;
  /** Tuning offset of the detected note in cents. */
  cents: number;
  /** True while the detected note is one of the chord tones and is stable. */
  isMatch: boolean;
  /** Chord-tone pitch classes the player has confirmed at least once. */
  foundTones: number[];
  /** All target chord-tone pitch classes (root first). */
  tones: number[];
  /** Degree labels aligned with `tones` (e.g. ["R","3","5"]). */
  labels: string[];
  /** Increments on every fresh tone attack — use it to trigger hit animations. */
  hitId: number;
  // ── Scoring (mirrors note hunt / note matching so the success screen is consistent) ──
  gameState: GameState;
  accuracy: number;
  maxPossibleScore: number;
  maxCombo: number;
}

const SAMPLE_MS = 50;
const CONFIRM_SAMPLES = 2;
const VOLUME_THRESHOLD = 0.01;

type FreqRef = React.RefObject<number> | React.MutableRefObject<number> | undefined;

/** Escalating score for collecting `n` tones — same curve as note hunt. */
function scoreForCount(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += 100 * Math.min(8, Math.floor(i / 5) + 1);
  return total;
}

function sameState(a: ChordHuntState, b: ChordHuntState): boolean {
  return (
    a.detectedNote === b.detectedNote &&
    a.isMatch === b.isMatch &&
    a.hitId === b.hitId &&
    a.gameState.score === b.gameState.score &&
    a.foundTones.length === b.foundTones.length &&
    a.tones.length === b.tones.length &&
    Math.abs(a.cents - b.cents) < 3
  );
}

function buildState(
  tones: number[],
  labels: string[],
  found: Set<number>,
  detectedNote: string | null,
  detectedPitchClass: number | null,
  cents: number,
  isMatch: boolean,
  hitId: number,
  scoreOffset = 0,
): ChordHuntState {
  const foundCount = tones.filter(t => found.has(t)).length;
  const multiplier = Math.min(8, Math.floor(foundCount / 5) + 1);
  return {
    detectedNote, detectedPitchClass, cents, isMatch, hitId, tones, labels,
    // Keep found tones in chord-tone order (root → 3rd → 5th …).
    foundTones: tones.filter(t => found.has(t)),
    gameState: {
      // Cumulative across the session: banked total + the current chord's score.
      score: scoreOffset + scoreForCount(foundCount),
      combo: foundCount,
      multiplier,
    },
    accuracy: tones.length > 0 ? Math.round((foundCount / tones.length) * 100) : 0,
    maxPossibleScore: scoreForCount(tones.length),
    maxCombo: foundCount,
  };
}

/**
 * Listens to the live mic pitch and tracks which chord tones the player has hit,
 * one note at a time (monophonic — works on web + native). Mirrors useNoteHunt's
 * RAF/stability/scoring so the success screen stays consistent, but the unit of
 * progress is a chord-tone pitch class instead of an octave.
 *
 * Retargets in place when the chord (`tones`) changes — no remount needed.
 */
export interface ChordHuntControls {
  state: ChordHuntState;
  /** Manually toggle a chord tone as found — used in no-mic (self-check) practice. */
  markTone: (pitchClass: number) => void;
}

export function useChordHunt(
  tones: number[],
  labels: string[],
  frequencyRef: FreqRef,
  volumeRef: FreqRef,
  active: boolean,
): ChordHuntControls {
  const [state, setState] = useState<ChordHuntState>(() =>
    buildState(tones, labels, new Set(), null, null, 0, false, 0),
  );

  // Primitive key so a fresh tones array each render doesn't reset progress.
  const targetKey = tones.join(",");

  const rafRef         = useRef(0);
  const lastSampleRef  = useRef(0);
  const stableRef      = useRef<{ note: string; octave: number; count: number } | null>(null);
  const wasMatchingRef = useRef(false);
  const foundRef       = useRef<Set<number>>(new Set());
  const prevFoundRef   = useRef(0);
  const hitIdRef       = useRef(0);
  const tonesRef       = useRef<number[]>(tones);
  const labelsRef      = useRef<string[]>(labels);
  // Score banked from previous chords — keeps the total accumulating across rotations.
  const sessionScoreRef = useRef(0);
  const firstTargetRef  = useRef(true);

  useEffect(() => {
    if (!firstTargetRef.current) sessionScoreRef.current += scoreForCount(prevFoundRef.current);
    firstTargetRef.current = false;
    tonesRef.current      = tones;
    labelsRef.current     = labels;
    foundRef.current      = new Set();
    stableRef.current     = null;
    wasMatchingRef.current = false;
    prevFoundRef.current  = 0;
    hitIdRef.current      = 0;
    // Push the cleared state now — the RAF loop is idle when the mic is off, so
    // without this the previous chord's found tones would linger after a rotate.
    setState(buildState(tonesRef.current, labelsRef.current, foundRef.current, null, null, 0, false, 0, sessionScoreRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  useEffect(() => {
    if (!active) return () => { /* nothing to clean up */ };

    const tick = () => {
      const now = Date.now();
      if (now - lastSampleRef.current >= SAMPLE_MS) {
        lastSampleRef.current = now;

        const freq = frequencyRef?.current ?? 0;
        const vol  = volumeRef?.current ?? 0;
        const tonesNow = tonesRef.current;

        if (freq > 40 && vol > VOLUME_THRESHOLD) {
          const data = getNoteFromFrequency(freq);
          if (data) {
            const pc = NOTES.indexOf(data.note);
            const matchesTone = pc >= 0 && tonesNow.includes(pc);

            const prevStable = stableRef.current;
            let entry: { note: string; octave: number; count: number };
            if (prevStable && prevStable.note === data.note && prevStable.octave === data.octave) {
              prevStable.count++;
              entry = prevStable;
            } else {
              entry = { note: data.note, octave: data.octave, count: 1 };
              stableRef.current = entry;
            }
            const confirmed = entry.count >= CONFIRM_SAMPLES;
            const isMatch = matchesTone && confirmed;

            if (isMatch) {
              if (!wasMatchingRef.current) hitIdRef.current++;
              wasMatchingRef.current = true;
              foundRef.current.add(pc);
            } else if (!matchesTone) {
              wasMatchingRef.current = false;
            }

            const foundCount = tonesNow.filter(t => foundRef.current.has(t)).length;
            if (foundCount > prevFoundRef.current) prevFoundRef.current = foundCount;

            const next = buildState(
              tonesNow, labelsRef.current, foundRef.current, data.note, pc, data.cents,
              isMatch, hitIdRef.current, sessionScoreRef.current,
            );
            setState(prev => sameState(prev, next) ? prev : next);
          }
        } else {
          stableRef.current = null;
          wasMatchingRef.current = false;
          setState(prev =>
            prev.detectedNote === null && !prev.isMatch
              ? prev
              : { ...prev, detectedNote: null, detectedPitchClass: null, isMatch: false },
          );
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, frequencyRef, volumeRef]);

  // Self-check for players without a mic: tap to toggle a chord tone as found.
  const markTone = useCallback((pitchClass: number) => {
    const found = foundRef.current;
    if (found.has(pitchClass)) {
      found.delete(pitchClass);
    } else {
      found.add(pitchClass);
      hitIdRef.current++;
    }
    const foundCount = tonesRef.current.filter(t => found.has(t)).length;
    prevFoundRef.current = foundCount;
    setState(prev => buildState(
      tonesRef.current, labelsRef.current, found, prev.detectedNote, prev.detectedPitchClass, prev.cents,
      prev.isMatch, hitIdRef.current, sessionScoreRef.current,
    ));
  }, []);

  return { state, markTone };
}
