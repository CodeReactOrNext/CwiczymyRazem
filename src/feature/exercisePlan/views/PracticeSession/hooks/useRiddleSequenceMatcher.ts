import { useEffect, useMemo, useRef, useState } from "react";
import { getFrequencyFromTab, getNoteFromFrequency } from "utils/audio/noteUtils";

import type { TablatureMeasure } from "../../../types/exercise.types";

export interface RiddleProgress {
  /** How many notes of the answer have been matched so far, in order. */
  matched: number;
  total: number;
  /** Pitch currently sounding on the mic (e.g. "G#4"), or null in silence. */
  heardNote: string | null;
  /** Increments on every correct hit — drives the dot animations. */
  hitId: number;
  /** True while the mic is armed and judging the player's answer. */
  listening: boolean;
}

type FreqRef = React.RefObject<number> | React.MutableRefObject<number> | undefined;

interface UseRiddleSequenceMatcherOptions {
  measures: TablatureMeasure[] | null;
  /** Arm the matcher: mic on, riddle heard once, answer hidden, playback stopped. */
  active: boolean;
  frequencyRef: FreqRef;
  volumeRef: FreqRef;
  /** Fired once per riddle when the full sequence has been played correctly. */
  onComplete: () => void;
}

const SAMPLE_MS = 50;            // ~20 Hz, same cadence as the tuner + note hunt
const CONFIRM_SAMPLES = 2;       // ~100ms of stable pitch before judging an attack
const VOLUME_THRESHOLD = 0.01;

/** Expected pitch keys ("E4", "G#3", …) for the riddle, in playing order. */
function expectedPitches(measures: TablatureMeasure[] | null): string[] {
  if (!measures) return [];
  const keys: string[] = [];
  for (const measure of measures) {
    for (const beat of measure.beats) {
      const note = beat.notes[0];
      if (!note) continue; // rest beat
      const data = getNoteFromFrequency(getFrequencyFromTab(note.string, note.fret));
      if (data) keys.push(`${data.note}${data.octave}`);
    }
  }
  return keys;
}

interface ProgressSnap {
  /** The riddle this snapshot belongs to — a stale tag reads as zero progress. */
  tag: string[];
  matched: number;
  heardNote: string | null;
  hitId: number;
}

/**
 * Tempo-free sequence matcher for ear-training riddles: listens to the live mic
 * pitch and advances one step whenever the player attacks the next expected
 * note. Wrong notes are ignored — play-and-adjust is part of the training — and
 * a held note is judged once, so repeated notes need a fresh attack.
 *
 * Must be mounted exactly once (PracticeSession): the desktop view and the
 * mobile modals render simultaneously, so view-local instances would
 * double-listen and double-score.
 */
export function useRiddleSequenceMatcher({
  measures,
  active,
  frequencyRef,
  volumeRef,
  onComplete,
}: UseRiddleSequenceMatcherOptions): RiddleProgress {
  const expected = useMemo(() => expectedPitches(measures), [measures]);

  const [snap, setSnap] = useState<ProgressSnap>({ tag: expected, matched: 0, heardNote: null, hitId: 0 });

  const tagRef       = useRef(expected);
  const matchedRef   = useRef(0);
  const hitIdRef     = useRef(0);
  const completedRef = useRef(false);
  // One stable entry = one attack: the same pitch confirmed over consecutive
  // samples, judged once (consumed) so a held note can't march through steps.
  const stableRef = useRef<{ key: string; count: number; consumed: boolean } | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    // New riddle → start the judging refs over. The rendered snapshot resets
    // itself via the tag check below, no state write needed here.
    if (tagRef.current !== expected) {
      tagRef.current       = expected;
      matchedRef.current   = 0;
      hitIdRef.current     = 0;
      completedRef.current = false;
      stableRef.current    = null;
    }
    if (!active || expected.length === 0) return () => { /* nothing to clean up */ };

    let raf = 0;
    let lastSample = 0;

    const tick = () => {
      const now = Date.now();
      if (now - lastSample >= SAMPLE_MS) {
        lastSample = now;

        const freq = frequencyRef?.current ?? 0;
        const vol  = volumeRef?.current ?? 0;

        let heard: string | null = null;
        if (freq > 40 && vol > VOLUME_THRESHOLD) {
          const data = getNoteFromFrequency(freq);
          if (data) {
            heard = `${data.note}${data.octave}`;
            const prev = stableRef.current;
            if (prev && prev.key === heard) prev.count++;
            else stableRef.current = { key: heard, count: 1, consumed: false };

            const entry = stableRef.current!;
            if (entry.count >= CONFIRM_SAMPLES && !entry.consumed) {
              entry.consumed = true;
              if (!completedRef.current && heard === expected[matchedRef.current]) {
                matchedRef.current++;
                hitIdRef.current++;
                if (matchedRef.current >= expected.length) {
                  completedRef.current = true;
                  onCompleteRef.current();
                }
              }
            }
          }
        } else {
          stableRef.current = null; // silence breaks the attack
        }

        const matched = matchedRef.current;
        const hitId   = hitIdRef.current;
        setSnap(prev =>
          prev.tag === expected && prev.matched === matched && prev.heardNote === heard && prev.hitId === hitId
            ? prev
            : { tag: expected, matched, heardNote: heard, hitId },
        );
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, expected, frequencyRef, volumeRef]);

  const isCurrent = snap.tag === expected;
  const matched   = isCurrent ? snap.matched : 0;
  const hitId     = isCurrent ? snap.hitId : 0;
  const heardNote = active && isCurrent ? snap.heardNote : null;
  const total     = expected.length;

  // Stable identity while values are unchanged — the views are memoized.
  return useMemo<RiddleProgress>(
    () => ({ matched, total, heardNote, hitId, listening: active }),
    [matched, total, heardNote, hitId, active],
  );
}
