import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useState } from "react";
import {
  correctOctaveForLowStrings,
  getAdaptiveVolumeGate,
  getBaseToleranceCents,
  getCentsDistance,
  getDetectionGates,
  getSustainVolumeGate,
} from "utils/audio/noteUtils";

import { advanceSustain, initialSustain, type SustainState } from "../sustainCheck";

/** The tab's fixed gate before the room's noise floor has been measured (useNoteMatching VOLUME_GATE). */
const FALLBACK_GATE = 0.005;
const UI_INTERVAL_MS = 50;
/** A failed check starts over by itself after this long — not everyone finds the button. */
export const AUTO_RETRY_MS = 5000;

/**
 * Runs the sustain test on the live input with the tab's own gates and
 * tolerance, so what passes here is what a tab note would hold.
 *
 * A failed run re-arms itself after AUTO_RETRY_MS; its result stays on show
 * (`lastFail`) until the next note starts, so the hint isn't lost. A pass is
 * remembered (`passedOnce`) through any later runs.
 */
export function useSustainCheck({
  audioRefs, targetHz, active,
}: {
  audioRefs: AudioRefs;
  targetHz: number;
  active: boolean;
}) {
  const [state, setState] = useState<SustainState>(initialSustain);
  const [run, setRun] = useState(0);
  const [passedOnce, setPassedOnce] = useState(false);
  const [lastFail, setLastFail] = useState<SustainState | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    let s = initialSustain();
    let last = performance.now();
    let lastUi = 0;
    let raf = 0;
    let started = false;
    const toleranceCents = getBaseToleranceCents(targetHz);

    const tick = (now: number) => {
      const dtMs = now - last;
      last = now;
      const freq = audioRefs.frequencyRef.current;
      const noise = audioRefs.noiseFloorRef.current;
      s = advanceSustain(s, {
        cents: freq > 40 ? getCentsDistance(correctOctaveForLowStrings(freq, targetHz), targetHz) : null,
        rawVolume: audioRefs.rawVolumeRef.current,
        gainedVolume: audioRefs.volumeRef.current,
        rawPeak: audioRefs.inputPeakRef?.current ?? 0,
        attackGate: getDetectionGates(targetHz, noise > 0 ? getAdaptiveVolumeGate(noise) : FALLBACK_GATE).volumeGate,
        sustainGate: getDetectionGates(targetHz, getSustainVolumeGate(noise, FALLBACK_GATE)).volumeGate,
        toleranceCents,
        dtMs,
      });
      // A new note is under way — the previous run's hint has done its job.
      if (!started && s.phase !== "waiting") {
        started = true;
        setLastFail(null);
      }
      if (s.phase === "done" || now - lastUi >= UI_INTERVAL_MS) {
        lastUi = now;
        setState(s);
        if (s.outcome === "pass") setPassedOnce(true);
      }
      if (s.phase !== "done") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, targetHz, audioRefs, run]);

  const failed = state.phase === "done" && state.outcome !== "pass";

  // Re-arm a failed run by itself, keeping its result up meanwhile.
  useEffect(() => {
    if (!failed) return undefined;
    const failedState = state;
    const timer = setTimeout(() => {
      setLastFail(failedState);
      setRun((r) => r + 1);
    }, AUTO_RETRY_MS);
    return () => clearTimeout(timer);
  }, [failed, state]);

  const retry = useCallback(() => {
    setLastFail(null);
    setRun((r) => r + 1);
  }, []);

  return { state, retry, passedOnce, lastFail };
}
