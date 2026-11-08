import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useRef, useState } from "react";

import { type AutoGainResult, computeAutoGain, signalGate } from "../inputLevel";

const DURATION_MS = 3000;

export type AutoGainPhase = "idle" | "measuring" | "done";

/**
 * Listens to a few seconds of playing and sets the input gain from it.
 * Measures the raw (ungained) level, so moving the slider mid-measurement
 * can't skew it, and reports what it found instead of always "done" — no
 * playing, clipping, too quiet even at full gain, or buried in noise.
 */
export function useAutoGain(
  audioRefs: AudioRefs,
  inputGain: number,
  onInputGainChange: (v: number) => void,
) {
  const [phase, setPhase] = useState<AutoGainPhase>("idle");
  const [countdown, setCountdown] = useState(Math.ceil(DURATION_MS / 1000));
  const [result, setResult] = useState<AutoGainResult | null>(null);
  const rafRef = useRef(0);
  const gainRef = useRef(inputGain);
  useEffect(() => { gainRef.current = inputGain; }, [inputGain]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const startAutoGain = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPhase("measuring");
    setResult(null);
    setCountdown(Math.ceil(DURATION_MS / 1000));
    const rawLevels: number[] = [];
    let rawPeak = 0;
    const start = performance.now();

    const measure = (now: number) => {
      const raw = audioRefs.rawVolumeRef.current;
      if (raw > signalGate(audioRefs.noiseFloorRef.current)) rawLevels.push(raw);
      rawPeak = Math.max(rawPeak, audioRefs.inputPeakRef?.current ?? 0);

      const elapsed = now - start;
      if (elapsed < DURATION_MS) {
        setCountdown(Math.max(1, Math.ceil((DURATION_MS - elapsed) / 1000)));
        rafRef.current = requestAnimationFrame(measure);
        return;
      }
      const outcome = computeAutoGain({
        rawLevels,
        rawPeak,
        noiseFloor: audioRefs.noiseFloorRef.current,
        currentGain: gainRef.current,
      });
      if (outcome.status !== "no_signal") onInputGainChange(outcome.gain);
      setResult(outcome);
      setPhase("done");
    };
    rafRef.current = requestAnimationFrame(measure);
  }, [audioRefs, onInputGainChange]);

  /** Forget the last result — the player moved the slider themselves. */
  const clearResult = useCallback(() => {
    setResult(null);
    setPhase((p) => (p === "measuring" ? p : "idle"));
  }, []);

  return { phase, countdown, result, startAutoGain, clearResult };
}
