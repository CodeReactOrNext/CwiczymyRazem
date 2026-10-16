import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdaptiveVolumeGate } from "utils/audio/noteUtils";

import type { LearnStep } from "../utils/learnSteps";
import { learnHitNotes, resolveLearnTargets } from "../utils/learnSteps";
import type { LearnFrame } from "./learnJudge";
import { createLearnJudge } from "./learnJudge";

/** Used until the first confirmed-silent window has measured the room. */
const VOLUME_GATE = 0.005;

/** Where a learn-mode pass stands. */
export interface LearnProgress {
  /** 0-based position of the beat being waited on. */
  stepIndex: number;
  totalSteps: number;
  /** Times the whole exercise has been played through. */
  passes: number;
  /** The beats already played, in the shape the tab paints hits from. */
  hitNotes: Record<string, number>;
  /** Where the tab's cursor rests: the start of the beat being waited on. */
  cursorBeat: number;
  /** Move on without playing it — for a note the mic won't pick up. */
  skip: () => void;
  /** Back to the first beat. */
  restart: () => void;
}

/** What the session shares about learn mode (the progress plus its switch). */
export interface LearnModeState extends LearnProgress {
  /** The exercise can be learned note by note: it has a tab and this is the desktop session. */
  available: boolean;
  /** Learn mode listens, so it needs the mic. */
  micReady: boolean;
  /** Learn mode is on and running: the clock is off and the tab waits for the player. */
  enabled: boolean;
  setEnabled: (next: boolean) => void;
}

interface UseLearnModeMatcherOptions {
  steps: readonly LearnStep[];
  /** Listening: learn mode on, the mic open and the session playing. */
  active: boolean;
  audioRefs: AudioRefs;
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number;
  tuningOffsets?: readonly number[];
  /** A new value starts the exercise over (a restart, a new tab). */
  resetKey: number;
}

interface Position {
  index: number;
  passes: number;
}

const START: Position = { index: 0, passes: 0 };

/**
 * Tempo-free matcher for learn mode: stays on a beat until the mic has heard it,
 * then moves to the next, looping back to the start after the last one.
 *
 * Must be mounted exactly once (PracticeSession): the desktop view and the mobile
 * modal render at the same time, so a view-local copy would listen twice.
 */
export function useLearnModeMatcher({
  steps, active, audioRefs, getAdjustedTargetFreq, tuningOffsets, resetKey,
}: UseLearnModeMatcherOptions): LearnProgress {
  const [position, setPosition] = useState<Position>(START);
  // A new tab or restart starts over. Adjusted while rendering — the documented
  // way to reset state on a prop change — so no frame shows the old position.
  const [seen, setSeen] = useState({ steps, resetKey });
  if (seen.steps !== steps || seen.resetKey !== resetKey) {
    setSeen({ steps, resetKey });
    setPosition(START);
  }

  // The frame loop reads these from refs: a hit moves the position before React
  // renders, and an input that changes identity must not restart the loop —
  // a restart re-arms the judge, which throws away an attack already heard.
  const positionRef = useRef(position);
  const stepsRef = useRef(steps);
  const inputsRef = useRef({ audioRefs, getAdjustedTargetFreq, tuningOffsets });
  useEffect(() => {
    positionRef.current = position;
    stepsRef.current = steps;
    inputsRef.current = { audioRefs, getAdjustedTargetFreq, tuningOffsets };
  }, [position, steps, audioRefs, getAdjustedTargetFreq, tuningOffsets]);

  /** Bumped whenever the beat being waited on changes, so the loop re-arms the judge. */
  const armTokenRef = useRef(0);
  const [judge] = useState(createLearnJudge);

  const moveTo = useCallback((next: Position) => {
    positionRef.current = next;
    armTokenRef.current++;
    setPosition(next);
  }, []);

  const skip = useCallback(() => {
    const { index, passes } = positionRef.current;
    const isLast = index + 1 >= stepsRef.current.length;
    moveTo(isLast ? { index: 0, passes: passes + 1 } : { index: index + 1, passes });
  }, [moveTo]);

  const restart = useCallback(() => moveTo(START), [moveTo]);

  useEffect(() => {
    if (!active || steps.length === 0) return () => { /* nothing to clean up */ };

    // Starting (or resuming) always re-arms: whatever rang while paused is not the answer.
    let armedToken = -1;
    let raf = 0;

    const tick = () => {
      const step = steps[positionRef.current.index];
      if (step) {
        const { audioRefs: refs, getAdjustedTargetFreq: adjust, tuningOffsets: offsets } = inputsRef.current;
        const noiseFloor = refs.noiseFloorRef.current;
        const frame: LearnFrame = {
          now: Date.now(),
          freq: refs.frequencyRef.current,
          volume: refs.rawVolumeRef.current,
          volumeGateBase: noiseFloor > 0 ? getAdaptiveVolumeGate(noiseFloor) : VOLUME_GATE,
          confidence: refs.confidenceRef.current,
          lastOnsetMs: refs.lastOnsetTimeRef.current,
          lastTickMs: refs.lastTickTimeRef.current,
          readSpectrum: refs.readSpectrum,
        };
        if (armedToken !== armTokenRef.current) {
          judge.arm(frame);
          armedToken = armTokenRef.current;
        } else if (judge.judge(resolveLearnTargets(step, offsets, adjust), frame)) {
          skip();
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // resetKey restarts the loop too, so a restart re-arms the judge.
  }, [active, steps, resetKey, judge, skip]);

  const { index, passes } = position;
  const hitNotes = useMemo(() => learnHitNotes(steps, index), [steps, index]);
  const cursorBeat = steps[index]?.beatStart ?? 0;

  return useMemo(
    () => ({ stepIndex: index, totalSteps: steps.length, passes, hitNotes, cursorBeat, skip, restart }),
    [index, steps.length, passes, hitNotes, cursorBeat, skip, restart],
  );
}
