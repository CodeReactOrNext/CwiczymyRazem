import { useEffect, useMemo, useRef, useState } from "react";
import type { TuningStringRef } from "utils/audio/tunings";
import { findNearestTuningString } from "utils/audio/tunings";

/** Within this many cents of a string's reference pitch, that string reads as in
 *  tune — same threshold ArcTuner paints green with, so the chip can't disagree
 *  with the needle. */
export const TUNER_IN_TUNE_CENTS = 10;
/** Beyond this, the reading is treated as "not even close" — the hold timer drops. */
const TUNER_CLOSE_CENTS = 25;
/** How long the pitch has to stay in tune before the string is marked done. */
const TUNED_HOLD_MS = 600;

interface StringTunerState {
  cents: number;
  hasNote: boolean;
  /** Index into `strings` of the reference pitch the detected note is closest to. */
  activeIndex: number;
}

export interface StringTunerResult extends StringTunerState {
  /** Per-string flag, parallel to `strings` — true once held in tune long enough. */
  tuned: boolean[];
}

/**
 * Tuning-aware live tuner: instead of naming whatever chromatic note is closest,
 * it snaps the detected pitch to the nearest *open string of the current tuning*
 * and reports the deviation from that string's reference pitch. A Drop D player
 * therefore tunes the 6th string to D2, not "a very flat E2".
 *
 * `tuningKey` identifies the tuning the `strings` came from. Per-string progress
 * is stamped with it, so switching tuning re-targets every string and anything
 * tuned under the old preset stops counting (a stale stamp simply reads as
 * "nothing tuned yet" — no reset pass needed).
 */
export function useStringTuner(
  frequencyRef: React.RefObject<number>,
  volumeRef: React.RefObject<number>,
  strings: readonly TuningStringRef[],
  tuningKey: string,
): StringTunerResult {
  const untuned = useMemo(() => strings.map(() => false), [strings]);
  const [state, setState] = useState<StringTunerState>({
    cents: 0,
    hasNote: false,
    activeIndex: 0,
  });
  const [progress, setProgress] = useState<{ tuningKey: string; tuned: boolean[] }>(
    () => ({ tuningKey, tuned: untuned }),
  );
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  /** Which string has been sitting in tune, and since when. */
  const holdRef = useRef<{ index: number; since: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now - lastRef.current >= 50) {
        lastRef.current = now;
        const freq = frequencyRef.current ?? 0;
        const vol = volumeRef.current ?? 0;
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
                const base = prev.tuningKey === tuningKey ? prev.tuned : untuned;
                if (base[bestIndex]) return prev;
                return {
                  tuningKey,
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
  }, [frequencyRef, volumeRef, strings, tuningKey, untuned]);

  const tuned = progress.tuningKey === tuningKey ? progress.tuned : untuned;

  return { ...state, tuned };
}
