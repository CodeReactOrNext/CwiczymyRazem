import { useEffect, useRef, useState } from "react";
import { getNoteFromFrequency, NOTES } from "utils/audio/noteUtils";

import { type GameState,getFeedbackForCombo } from "./noteMatchingFeedback";

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
    a.gameState.feedbackId === b.gameState.feedbackId &&
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
  feedback: { text: string; id: number },
): NoteHuntState {
  const foundInRange = octaves.filter(o => found.has(o)).length;
  const multiplier = Math.min(8, Math.floor(foundInRange / 5) + 1);
  return {
    detectedNote, detectedOctave, cents, isMatch, hitId, octaves,
    foundOctaves: Array.from(found).sort((a, b) => a - b),
    gameState: {
      score: scoreForCount(foundInRange),
      combo: foundInRange,
      multiplier,
      lastFeedback: feedback.text,
      feedbackId: feedback.id,
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
export function useNoteHunt(
  targetNote: string,
  frequencyRef: FreqRef,
  volumeRef: FreqRef,
  active: boolean,
): NoteHuntState {
  const [state, setState] = useState<NoteHuntState>(() =>
    buildState(playableOctaves(targetNote), new Set(), null, null, 0, false, 0, { text: "", id: 0 }),
  );

  const rafRef         = useRef(0);
  const lastSampleRef  = useRef(0);
  const stableRef      = useRef<{ note: string; octave: number; count: number } | null>(null);
  const wasMatchingRef = useRef(false);
  const foundRef       = useRef<Set<number>>(new Set());
  const prevFoundRef   = useRef(0);
  const hitIdRef       = useRef(0);
  const feedbackRef    = useRef<{ text: string; id: number }>({ text: "", id: 0 });
  const targetRef      = useRef(targetNote);
  const octavesRef     = useRef<number[]>(playableOctaves(targetNote));

  // Retarget in place when the goal note changes (no remount). Refs only — the
  // RAF loop pushes the cleared state on its next tick.
  useEffect(() => {
    targetRef.current     = targetNote;
    octavesRef.current    = playableOctaves(targetNote);
    foundRef.current      = new Set();
    stableRef.current     = null;
    wasMatchingRef.current = false;
    prevFoundRef.current  = 0;
    hitIdRef.current      = 0;
    feedbackRef.current   = { text: "", id: 0 };
  }, [targetNote]);

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

            // Feedback fires when a new in-range octave is located.
            const foundInRange = octaves.filter(o => foundRef.current.has(o)).length;
            if (foundInRange > prevFoundRef.current) {
              const prevMult = Math.min(8, Math.floor(prevFoundRef.current / 5) + 1);
              const mult     = Math.min(8, Math.floor(foundInRange / 5) + 1);
              if (mult > prevMult) feedbackRef.current = { text: "MULTIPLIER UP!", id: feedbackRef.current.id + 1 };
              else {
                const tier = getFeedbackForCombo(foundInRange);
                if (tier) feedbackRef.current = { text: tier.text, id: feedbackRef.current.id + 1 };
              }
              prevFoundRef.current = foundInRange;
            }

            const next = buildState(
              octaves, foundRef.current, data.note, data.octave, data.cents,
              isMatch, hitIdRef.current, feedbackRef.current,
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

  return state;
}
