import { useEffect, useMemo, useRef, useState } from "react";
import type { GuitarTuningPreset, TuningStringRef } from "utils/audio/tunings";
import { findNearestTuningString, getTuningStrings } from "utils/audio/tunings";

/** Within this many cents of a string's reference pitch, that string reads as in
 *  tune — same threshold ArcTuner paints green with, so the chip can't disagree
 *  with the needle. */
export const TUNER_IN_TUNE_CENTS = 10;
/** Beyond this, the reading is treated as "not even close" — the hold timer drops. */
const TUNER_CLOSE_CENTS = 25;
/** How long the pitch has to stay in tune before the string is marked done. */
const TUNED_HOLD_MS = 600;

interface LiveTunerState {
  cents:       number;
  hasNote:     boolean;
  /** Index into `strings` of the reference pitch the detected note is closest to. */
  activeIndex: number;
}

export interface LiveTunerResult extends LiveTunerState {
  /** Open-string reference pitches for the active tuning, low string (6) first. */
  strings: TuningStringRef[];
  /** Per-string flag, parallel to `strings` — true once held in tune long enough. */
  tuned:   boolean[];
}

/**
 * Tuning-aware live tuner: instead of naming whatever chromatic note is closest,
 * it snaps the detected pitch to the nearest *open string of the current tuning*
 * and reports the deviation from that string's reference pitch. A Drop D player
 * therefore tunes the 6th string to D2, not "a very flat E2".
 */
export function useLiveTuner(
  frequencyRef: React.MutableRefObject<number>,
  volumeRef:    React.MutableRefObject<number>,
  tuning:       GuitarTuningPreset,
): LiveTunerResult {
  const strings = useMemo(() => getTuningStrings(tuning), [tuning]);
  const untuned = useMemo(() => strings.map(() => false), [strings]);
  const [state, setState] = useState<LiveTunerState>({ cents: 0, hasNote: false, activeIndex: 0 });
  // Progress is stamped with the tuning it was earned under: switching tuning
  // re-targets every string, so anything tuned to the old preset stops counting
  // (a stale stamp simply reads as "nothing tuned yet" — no reset pass needed).
  const [progress, setProgress] = useState<{ tuningId: string; tuned: boolean[] }>(
    () => ({ tuningId: tuning.id, tuned: untuned }),
  );
  const rafRef  = useRef(0);
  const lastRef = useRef(0);
  /** Which string has been sitting in tune, and since when. */
  const holdRef = useRef<{ index: number; since: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now - lastRef.current >= 50) {
        lastRef.current = now;
        const freq = frequencyRef.current;
        const vol  = volumeRef.current;
        if (freq > 40 && vol > 0.005) {
          const { index: bestIndex, cents: bestCents } = findNearestTuningString(freq, strings);
          setState({ cents: bestCents, hasNote: true, activeIndex: bestIndex });

          const abs = Math.abs(bestCents);
          if (abs <= TUNER_IN_TUNE_CENTS) {
            const hold = holdRef.current;
            if (!hold || hold.index !== bestIndex) {
              holdRef.current = { index: bestIndex, since: now };
            } else if (now - hold.since >= TUNED_HOLD_MS) {
              setProgress(prev => {
                const base = prev.tuningId === tuning.id ? prev.tuned : untuned;
                if (base[bestIndex]) return prev;
                return {
                  tuningId: tuning.id,
                  tuned: base.map((v, i) => (i === bestIndex ? true : v)),
                };
              });
            }
          } else if (abs > TUNER_CLOSE_CENTS) {
            // Small wobble around the centre keeps the hold alive; a real miss drops it.
            holdRef.current = null;
          }
        } else {
          setState(s => (s.hasNote ? { ...s, hasNote: false } : s));
          holdRef.current = null;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [frequencyRef, volumeRef, strings, tuning.id, untuned]);

  const tuned = progress.tuningId === tuning.id ? progress.tuned : untuned;

  return { ...state, strings, tuned };
}
