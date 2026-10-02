import { scheduleClick } from "feature/exercisePlan/components/Metronome/utils/clickTones";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import { useCallback, useEffect, useRef, useState } from "react";
import { applySinkId } from "utils/applyAudioSinkId";

import { useTablatureSettings } from "../components/tablatureSettings";
import type { CalibrationResult } from "../utils/timingCalibration";
import {
  CALIBRATION_CLICKS,
  CALIBRATION_COUNT_IN,
  CALIBRATION_GAP_MS,
  matchAttacksToClicks,
  measureTimingLatency,
} from "../utils/timingCalibration";

/** How long after a click its answer can still arrive (matches LATE_SHARE). */
const ANSWER_WINDOW_MS = CALIBRATION_GAP_MS * 0.6;
/** Lead time before the first click, so scheduling never lands in the past. */
const START_DELAY_SEC = 0.4;
const CLICK_VOLUME = 0.6;

export type CalibrationRunState =
  | { phase: "idle" }
  | {
      phase: "running";
      /** Count-in clicks still to come before measuring starts (0 once it has). */
      countInLeft: number;
      /** Per measured click: delay heard, null = nothing, undefined = not decided yet. */
      delays: (number | null | undefined)[];
    }
  | { phase: "done"; result: CalibrationResult };

let fallbackContext: AudioContext | null = null;

/** A context of our own for when the session's metronome hasn't made one yet. */
function getFallbackContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (fallbackContext && fallbackContext.state !== "closed") return fallbackContext;
  const Ctor = window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  fallbackContext = new Ctor();
  applySinkId(fallbackContext, readPersistedOutputDeviceId());
  return fallbackContext;
}

/**
 * Plays the calibration click track and collects the attacks the mic hears.
 *
 * Clicks go out on the session metronome's own context when there is one, so
 * the output path measured is the one the session clicks on. Click times are
 * mapped to wall-clock the same way the note matcher maps beats (Date.now()
 * against the context's currentTime), so the latency measured is exactly the
 * offset the matcher needs.
 */
export function useTimingCalibrationRun({
  audioRefs,
  audioContext,
}: {
  audioRefs: AudioRefs;
  audioContext: AudioContext | null;
}) {
  const [state, setState] = useState<CalibrationRunState>({ phase: "idle" });
  const rafRef = useRef<number>(0);
  const outputRef = useRef<GainNode | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    // Clicks already scheduled can't be unscheduled — silence their bus instead.
    if (outputRef.current) {
      outputRef.current.gain.value = 0;
      outputRef.current.disconnect();
      outputRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setState({ phase: "idle" });
  }, [stop]);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    stop();
    const ctx = audioContext ?? getFallbackContext();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();

    const output = ctx.createGain();
    output.connect(ctx.destination);
    outputRef.current = output;

    const gapSec = CALIBRATION_GAP_MS / 1000;
    const firstClickSec = ctx.currentTime + START_DELAY_SEC;
    const total = CALIBRATION_COUNT_IN + CALIBRATION_CLICKS;
    const sound = useTablatureSettings.getState().metronomeSound;
    for (let i = 0; i < total; i++) {
      scheduleClick(ctx, output, firstClickSec + i * gapSec, i % 4 === 0 ? "accent" : "beat", CLICK_VOLUME, sound);
    }

    const wallNow = Date.now();
    const ctxNow = ctx.currentTime;
    const clickWallMs = Array.from({ length: total }, (_, i) =>
      wallNow + (firstClickSec + i * gapSec - ctxNow) * 1000);
    const measuredClicks = clickWallMs.slice(CALIBRATION_COUNT_IN);
    const lastAnswerMs = measuredClicks[measuredClicks.length - 1] + ANSWER_WINDOW_MS;

    // Polled rather than read off noteEventsRef: an event is only committed once
    // its pitch settles, while lastAttackMsRef moves the moment the onset fires —
    // which is what the live dots need. The events still back it up at the end.
    const attacks: number[] = [];
    let lastAttack = audioRefs.lastAttackMsRef?.current ?? 0;
    // Re-render only when a dot or the count-in changes, not on every frame.
    let lastShown = "";

    const collectEventOnsets = () => {
      const from = clickWallMs[0];
      for (const event of audioRefs.noteEventsRef.current) {
        if (event.onsetMs < from || event.onsetMs > lastAnswerMs) continue;
        if (attacks.some((a) => Math.abs(a - event.onsetMs) < 5)) continue;
        attacks.push(event.onsetMs);
      }
    };

    const tick = () => {
      const now = Date.now();
      const attackMs = audioRefs.lastAttackMsRef?.current ?? 0;
      if (attackMs !== lastAttack && attackMs > 0) {
        lastAttack = attackMs;
        attacks.push(attackMs);
      }

      if (now > lastAnswerMs + 150) {
        // A last pending onset is committed by then (EVENT_RESOLVE_TIMEOUT_MS).
        collectEventOnsets();
        stop();
        setState({ phase: "done", result: measureTimingLatency(matchAttacksToClicks(measuredClicks, attacks)) });
        return;
      }

      const countInLeft = clickWallMs.slice(0, CALIBRATION_COUNT_IN).filter((t) => t > now).length;
      // A click is decided once heard, or once its answer window has closed.
      const delays = matchAttacksToClicks(measuredClicks, attacks).map((delay, i) =>
        delay !== null ? delay : now > measuredClicks[i] + ANSWER_WINDOW_MS ? null : undefined);
      const shown = `${countInLeft}|${delays.join(",")}`;
      if (shown !== lastShown) {
        lastShown = shown;
        setState({ phase: "running", countInLeft, delays });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    setState({
      phase: "running",
      countInLeft: CALIBRATION_COUNT_IN,
      delays: measuredClicks.map(() => undefined),
    });
    rafRef.current = requestAnimationFrame(tick);
  }, [audioContext, audioRefs, stop]);

  return { state, start, reset };
}
