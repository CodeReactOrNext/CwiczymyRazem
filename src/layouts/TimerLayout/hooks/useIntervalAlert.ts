import { useEffect, useRef, useState } from "react";

interface UseIntervalAlertOptions {
  enabled: boolean;
  elapsedMs: number;
  isRunning: boolean;
  intervalMs: number;
  onAlert: () => void;
}

// Fires `onAlert` every `intervalMs` of active practice time (i.e. only while
// `isRunning`), counted from the moment the alert gets enabled — not from
// absolute wall-clock multiples — so switching skills mid-interval doesn't
// shift the schedule.
export const useIntervalAlert = ({
  enabled,
  elapsedMs,
  isRunning,
  intervalMs,
  onAlert,
}: UseIntervalAlertOptions) => {
  const baselineRef = useRef<number | null>(null);
  const elapsedIntervalsRef = useRef(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;
  const elapsedMsRef = useRef(elapsedMs);
  elapsedMsRef.current = elapsedMs;

  useEffect(() => {
    if (!enabled) {
      baselineRef.current = null;
      elapsedIntervalsRef.current = 0;
      setRemainingMs(null);
      return;
    }

    baselineRef.current = elapsedMsRef.current;
    elapsedIntervalsRef.current = 0;
    setRemainingMs(intervalMs);
  }, [enabled, intervalMs]);

  useEffect(() => {
    if (!enabled || !isRunning || baselineRef.current === null) return;

    const passedIntervals = Math.floor((elapsedMs - baselineRef.current) / intervalMs);
    if (passedIntervals > elapsedIntervalsRef.current) {
      elapsedIntervalsRef.current = passedIntervals;
      onAlertRef.current();
    }

    const nextThreshold =
      baselineRef.current + (elapsedIntervalsRef.current + 1) * intervalMs;
    setRemainingMs(Math.max(0, nextThreshold - elapsedMs));
  }, [enabled, isRunning, elapsedMs, intervalMs]);

  return { remainingMs };
};
