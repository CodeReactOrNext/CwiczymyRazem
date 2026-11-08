import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useRef, useState } from "react";
import { correctOctaveForLowStrings, getCentsDistance } from "utils/audio/noteUtils";
import { findNearestTuningString } from "utils/audio/tunings";

import type { GuitarString } from "../calibration.constants";
import { advanceTuneHold, HOLD_MS, initialTuneHold, isTuned } from "../tuneHold";

/** Further than this from the target, the player is probably on another string. */
const WRONG_STRING_CENTS = 150;
/** How close a reading must be to another string to name it. */
const NAME_OTHER_STRING_CENTS = 60;
/** Pause on a tuned string before moving to the next, so the tick is seen. */
const ADVANCE_DELAY_MS = 700;
const UI_INTERVAL_MS = 50;

export interface TuningReading {
  /** Distance from the target string in cents; null = nothing heard. */
  cents: number | null;
  /** Index of the string the player seems to be playing instead, if any. */
  otherStringIndex: number | null;
  /** 0–1 of the in-tune hold. */
  progress: number;
}

const SILENT: TuningReading = { cents: null, otherStringIndex: null, progress: 0 };

/**
 * Walks the open strings low to high like a tuner: each one is ticked off once
 * it has rung in tune for a moment (see tuneHold.ts), then the next comes up.
 */
export function useTuningWalk({
  audioRefs, strings, isListening, onFinish,
}: {
  audioRefs: AudioRefs;
  strings: GuitarString[];
  isListening: boolean;
  /** Called once the last string is tuned or skipped, with how many were tuned. */
  onFinish: (tunedCount: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [tuned, setTuned] = useState<Record<number, true>>({});
  const [reading, setReading] = useState<TuningReading>(SILENT);
  const tunedRef = useRef(tuned);
  useEffect(() => { tunedRef.current = tuned; }, [tuned]);
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  const current = strings[index];
  const currentDone = !!tuned[current.id];

  const advance = useCallback(() => {
    if (index < strings.length - 1) {
      setIndex(index + 1);
      setReading(SILENT);
    } else {
      onFinishRef.current(Object.keys(tunedRef.current).length);
    }
  }, [index, strings.length]);

  const goTo = useCallback((i: number) => {
    setIndex(i);
    setReading(SILENT);
  }, []);

  // Listen to the current string until it's tuned.
  useEffect(() => {
    if (!isListening || currentDone) return undefined;
    const target = current.hz;
    let hold = initialTuneHold();
    let last = performance.now();
    let lastUi = 0;
    let raf = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const freq = audioRefs.frequencyRef.current;
      const heard = freq > 40 && audioRefs.volumeRef.current > 0.005;
      const cents = heard ? getCentsDistance(correctOctaveForLowStrings(freq, target), target) : null;
      hold = advanceTuneHold(hold, cents, dt);

      if (isTuned(hold)) {
        setReading({ cents, otherStringIndex: null, progress: 1 });
        setTuned((prev) => ({ ...prev, [current.id]: true }));
        return;
      }

      if (now - lastUi >= UI_INTERVAL_MS) {
        lastUi = now;
        let otherStringIndex: number | null = null;
        if (cents !== null && Math.abs(cents) > WRONG_STRING_CENTS) {
          const nearest = findNearestTuningString(freq, strings.map((s) => ({ string: s.id, name: s.name, hz: s.hz })));
          if (nearest.index !== index && Math.abs(nearest.cents) <= NAME_OTHER_STRING_CENTS) otherStringIndex = nearest.index;
        }
        setReading({ cents, otherStringIndex, progress: hold.heldMs / HOLD_MS });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isListening, currentDone, current, index, strings, audioRefs]);

  // A freshly tuned string moves on by itself.
  useEffect(() => {
    if (!currentDone) return undefined;
    const timer = setTimeout(advance, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [currentDone, advance]);

  return { index, current, tuned, currentDone, reading, advance, goTo };
}
