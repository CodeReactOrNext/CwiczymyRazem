import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCentsDistance } from "utils/audio/noteUtils";

import type { CalibrationOffsets } from "../../../hooks/useCalibration";
import { ACCEPT_CENTS, MIN_SAMPLES, STALE_MS, STRINGS, median } from "../calibration.constants";

interface UseCaptureOptions {
  step:        "source" | "setup" | "tuning" | "summary";
  isOpen:      boolean;
  isListening: boolean;
  audioRefs:   AudioRefs;
  onAllStringsDone: () => void;
}

export function useCalibrationCapture({ step, isOpen, isListening, audioRefs, onAllStringsDone }: UseCaptureOptions) {
  const [currentStringIndex, setCurrentStringIndex] = useState(0);
  const [stringState,        setStringState]        = useState<"listening" | "done">("listening");
  const [offsets,            setOffsets]            = useState<CalibrationOffsets>({});
  const [currentOffset,      setCurrentOffset]      = useState<number | null>(null);
  const [sampleCount,        setSampleCount]        = useState(0);

  const samplesRef   = useRef<number[]>([]);
  const lastMatchRef = useRef(0);
  const rafRef       = useRef(0);
  const lastUIRef    = useRef(0);

  // Reset capture state whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCurrentStringIndex(0);
    setStringState("listening");
    setOffsets({});
    setCurrentOffset(null);
    setSampleCount(0);
    samplesRef.current = [];
  }, [isOpen]);

  const currentStr = STRINGS[currentStringIndex];

  // Sample collection RAF — runs only during the tuning step in listening state
  useEffect(() => {
    if (step !== "tuning" || stringState !== "listening" || !isOpen || !isListening) return;
    samplesRef.current   = [];
    lastMatchRef.current = 0;
    setSampleCount(0);
    const targetHz = currentStr.hz;

    const tick = () => {
      const now  = Date.now();
      const freq = audioRefs.frequencyRef.current;
      const vol  = audioRefs.volumeRef.current;

      if (freq > 40 && vol > 0.005) {
        const corrected = targetHz < 165 &&
          Math.abs(getCentsDistance(freq / 2, targetHz)) < Math.abs(getCentsDistance(freq, targetHz))
          ? freq / 2 : freq;
        if (Math.abs(getCentsDistance(corrected, targetHz)) <= ACCEPT_CENTS) {
          samplesRef.current.push(corrected);
          lastMatchRef.current = now;
        }
      }

      // Discard stale samples if note goes silent
      if (samplesRef.current.length > 0 && lastMatchRef.current > 0 && now - lastMatchRef.current > STALE_MS) {
        samplesRef.current = [];
      }

      if (samplesRef.current.length >= MIN_SAMPLES) {
        const offset = getCentsDistance(median(samplesRef.current), targetHz);
        setCurrentOffset(offset);
        setOffsets(prev => ({ ...prev, [currentStr.id]: offset }));
        setStringState("done");
        return;
      }

      if (now - lastUIRef.current >= 100) { lastUIRef.current = now; setSampleCount(samplesRef.current.length); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step, stringState, isOpen, isListening, audioRefs, currentStr]);

  const advanceString = useCallback(() => {
    if (currentStringIndex < STRINGS.length - 1) {
      setCurrentStringIndex(i => i + 1);
      setCurrentOffset(null);
      setSampleCount(0);
      samplesRef.current = [];
      setStringState("listening");
    } else {
      onAllStringsDone();
    }
  }, [currentStringIndex, onAllStringsDone]);



  const handleRetry = useCallback(() => {
    samplesRef.current = [];
    setCurrentOffset(null);
    setSampleCount(0);
    setStringState("listening");
  }, []);

  return { currentStringIndex, currentStr, stringState, offsets, currentOffset, sampleCount, handleRetry, advanceString };
}
