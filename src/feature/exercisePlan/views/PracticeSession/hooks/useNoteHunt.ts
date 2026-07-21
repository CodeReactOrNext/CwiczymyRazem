import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNoteFromFrequency, NOTES } from "utils/audio/noteUtils";

import type { GameState } from "./noteMatchingFeedback";

export interface NoteHuntState {
  /** Live detected note name (e.g. "C#"), or null when silent. */
  detectedNote: string | null;
  /** Live detected octave, or null when silent. */
  detectedOctave: number | null;
  /** Tuning offset of the detected note in cents. */
  cents: number;
  /** True while the detected note matches the target (any octave) and is stable. */
  isMatch: boolean;
  /** Octaves of the target note the player has confirmed at least once, sorted. */
  foundOctaves: number[];
  /** Octaves of the target note reachable on a standard-tuned guitar. */
  octaves: number[];
  /** Increments on every fresh match attack — use it to trigger hit animations. */
  hitId: number;
  // ── Scoring (mirrors the tablature game so the success screen is consistent) ──
  gameState: GameState;
  accuracy: number;
  maxPossibleScore: number;
  maxCombo: number;
}

const SAMPLE_MS = 50;            // ~20 Hz, same cadence as the live tuner
const CONFIRM_SAMPLES = 2;       // require ~100ms of a stable pitch before counting it
const VOLUME_THRESHOLD = 0.01;

type FreqRef = React.RefObject<number> | React.MutableRefObject<number> | undefined;

/**
 * Octaves of `note` reachable on a standard-tuned guitar, roughly E2 (MIDI 40)
 * up to E6 (MIDI 88) — open strings through ~24th fret.
 */
export function playableOctaves(note: string): number[] {
  const idx = NOTES.indexOf(note);
  if (idx < 0) return [];
  const octaves: number[] = [];
  for (let o = 1; o <= 7; o++) {
    const midi = (o + 1) * 12 + idx; // C{o} = (o+1)*12
    if (midi >= 40 && midi <= 88) octaves.push(o);
  }
  return octaves;
}

/**
 * Octaves of `note` the player should hunt: the whole neck normally, or — in
 * region mode — only those reachable inside the `[startFret, endFret]` window.
 */
function targetOctaves(note: string, fretRange?: [number, number]): number[] {
  if (!fretRange) return playableOctaves(note);
  const idx = NOTES.indexOf(note);
  if (idx < 0) return [];
  const positions = getNotePositionsInRange(idx, fretRange[0], fretRange[1]);
  return Array.from(new Set(positions.map(p => p.octave))).sort((a, b) => a - b);
}

/** Escalating score for finding `n` octaves — same curve as note-matching. */
function scoreForCount(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += 100 * Math.min(8, Math.floor(i / 5) + 1);
  return total;
}

function sameState(a: NoteHuntState, b: NoteHuntState): boolean {
  return (
    a.detectedNote === b.detectedNote &&
    a.detectedOctave === b.detectedOctave &&
    a.isMatch === b.isMatch &&
    a.hitId === b.hitId &&
    a.gameState.score === b.gameState.score &&
    a.foundOctaves.length === b.foundOctaves.length &&
    a.octaves.length === b.octaves.length &&
    Math.abs(a.cents - b.cents) < 3
  );
}

function buildState(
  octaves: number[],
  found: Set<number>,
  detectedNote: string | null,
  detectedOctave: number | null,
  cents: number,
  isMatch: boolean,
  hitId: number,
  scoreOffset = 0,
): NoteHuntState {
  const foundInRange = octaves.filter(o => found.has(o)).length;
  const multiplier = Math.min(8, Math.floor(foundInRange / 5) + 1);
  return {
    detectedNote, detectedOctave, cents, isMatch, hitId, octaves,
    foundOctaves: Array.from(found).sort((a, b) => a - b),
    gameState: {
      // Cumulative across the session: banked total + the current target's score.
      score: scoreOffset + scoreForCount(foundInRange),
      combo: foundInRange,
      multiplier,
    },
    accuracy: octaves.length > 0 ? Math.round((foundInRange / octaves.length) * 100) : 0,
    maxPossibleScore: scoreForCount(octaves.length),
    maxCombo: foundInRange,
  };
}

/**
 * Listens to the live mic pitch and reports whether the player is hitting the
 * target note (ignoring octave), tracking which octaves they've located and
 * scoring the hunt. Self-contained — no tablature/timing, unlike useNoteMatching.
 *
 * Designed to live in a long-lived owner (NoteMatchingProvider): it retargets
 * and clears progress in place when `targetNote` changes, rather than relying on
 * remounting.
 */
export interface NoteHuntControls {
  state: NoteHuntState;
  /** Manually toggle an octave as found — used in no-mic (self-check) practice. */
  markOctave: (octave: number) => void;
}

export function useNoteHunt(
  targetNote: string,
  frequencyRef: FreqRef,
  volumeRef: FreqRef,
  active: boolean,
  fretRange?: [number, number],
): NoteHuntControls {
  const [state, setState] = useState<NoteHuntState>(() =>
    buildState(targetOctaves(targetNote, fretRange), new Set(), null, null, 0, false, 0),
  );

  // Re-roll progress when EITHER the note or the region window changes. Derived as
  // a primitive key so a fresh fretRange array each render doesn't reset us.
  const targetKey = `${targetNote}|${fretRange ? `${fretRange[0]}-${fretRange[1]}` : ""}`;

  const rafRef         = useRef(0);
  const lastSampleRef  = useRef(0);
  const stableRef      = useRef<{ note: string; octave: number; count: number } | null>(null);
  const wasMatchingRef = useRef(false);
  const foundRef       = useRef<Set<number>>(new Set());
  const prevFoundRef   = useRef(0);
  const hitIdRef       = useRef(0);
  const targetRef      = useRef(targetNote);
  const octavesRef     = useRef<number[]>(targetOctaves(targetNote, fretRange));
  // Score banked from previous targets — keeps the total accumulating across rotations.
  const sessionScoreRef = useRef(0);
  const firstTargetRef  = useRef(true);

  // Retarget in place when the goal note or region changes (no remount). Refs
  // only — the RAF loop pushes the cleared state on its next tick.
  useEffect(() => {
    // Bank the finishing target's score before clearing (skip the initial mount).
    if (!firstTargetRef.current) sessionScoreRef.current += scoreForCount(prevFoundRef.current);
    firstTargetRef.current = false;
    targetRef.current     = targetNote;
    octavesRef.current    = targetOctaves(targetNote, fretRange);
    foundRef.current      = new Set();
    stableRef.current     = null;
    wasMatchingRef.current = false;
    prevFoundRef.current  = 0;
    hitIdRef.current      = 0;
    // Push the cleared state now — the RAF loop is idle when the mic is off, so
    // without this the previous note's found octaves would linger after a rotate.
    setState(buildState(octavesRef.current, foundRef.current, null, null, 0, false, 0, sessionScoreRef.current));
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
        const octaves = octavesRef.current;

        if (freq > 40 && vol > VOLUME_THRESHOLD) {
          const data = getNoteFromFrequency(freq);
          if (data) {
            const matchesTarget = data.note === targetRef.current;

            // Stability: the same note+octave must persist across a few samples
            // before we trust it — guitar attacks momentarily report wrong pitches.
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
            const isMatch = matchesTarget && confirmed;

            if (isMatch) {
              if (!wasMatchingRef.current) hitIdRef.current++; // new attack → flash
              wasMatchingRef.current = true;
              foundRef.current.add(data.octave);
            } else if (!matchesTarget) {
              wasMatchingRef.current = false;
            }

            const foundInRange = octaves.filter(o => foundRef.current.has(o)).length;
            if (foundInRange > prevFoundRef.current) prevFoundRef.current = foundInRange;

            const next = buildState(
              octaves, foundRef.current, data.note, data.octave, data.cents,
              isMatch, hitIdRef.current, sessionScoreRef.current,
            );
            setState(prev => sameState(prev, next) ? prev : next);
          }
        } else {
          // Silence — drop the live readout but keep the found-octaves progress.
          stableRef.current = null;
          wasMatchingRef.current = false;
          setState(prev =>
            prev.detectedNote === null && !prev.isMatch
              ? prev
              : { ...prev, detectedNote: null, detectedOctave: null, isMatch: false },
          );
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, frequencyRef, volumeRef]);

  // Self-check for players without a mic: tap to toggle an octave as found. Feeds
  // the same found-set/scoring path as live detection.
  const markOctave = useCallback((octave: number) => {
    const found = foundRef.current;
    if (found.has(octave)) {
      found.delete(octave);
    } else {
      found.add(octave);
      hitIdRef.current++;
    }
    const foundInRange = octavesRef.current.filter(o => found.has(o)).length;
    prevFoundRef.current = foundInRange;
    setState(prev => buildState(
      octavesRef.current, found, prev.detectedNote, prev.detectedOctave, prev.cents,
      prev.isMatch, hitIdRef.current, sessionScoreRef.current,
    ));
  }, []);

  return { state, markOctave };
}
