import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoGain(
  audioRefs: AudioRefs,
  inputGain: number,
  onInputGainChange: (v: number) => void,
) {
  const [autoState, setAutoState] = useState<"idle" | "measuring" | "done">("idle");
  const [countdown, setCountdown] = useState(2);
  const autoRAFRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const startRef   = useRef(0);

  useEffect(() => () => cancelAnimationFrame(autoRAFRef.current), []);

  const startAutoGain = useCallback(() => {
    const DURATION = 2000;
    setAutoState("measuring");
    setCountdown(2);
    samplesRef.current = [];
    startRef.current   = Date.now();

    const measure = () => {
      const vol     = audioRefs.volumeRef.current;
      if (vol > 0.01) samplesRef.current.push(vol);
      const elapsed = Date.now() - startRef.current;
      setCountdown(Math.max(0, Math.ceil((DURATION - elapsed) / 1000)));
      if (elapsed < DURATION) { autoRAFRef.current = requestAnimationFrame(measure); return; }
      const s = samplesRef.current;
      if (s.length > 3) {
        const sorted = [...s].sort((a, b) => a - b);
        const p85    = sorted[Math.floor(sorted.length * 0.85)];
        onInputGainChange(Math.round(Math.max(0.5, Math.min(10, inputGain * (0.40 / p85))) * 10) / 10);
      }
      setAutoState("done");
      setTimeout(() => setAutoState("idle"), 2000);
    };
    autoRAFRef.current = requestAnimationFrame(measure);
  }, [audioRefs, inputGain, onInputGainChange]);

  return { autoState, countdown, startAutoGain };
}
