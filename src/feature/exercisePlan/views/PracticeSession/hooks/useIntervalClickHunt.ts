import { useCallback, useEffect, useRef, useState } from "react";

import type { ClickTarget } from "../helpers/clickTargets";
import {
  clickTargetKey,
  computeClickTargets,
  multiplierForFoundCount,
  scoreForFoundCount,
  targetsWithinReach,
} from "../helpers/clickTargets";
import type { GameState } from "./noteMatchingFeedback";

/** Which half of the round the player is on: place the root, then the interval. */
export type IntervalClickPhase = "root" | "interval";

export interface IntervalClickState {
  phase: IntervalClickPhase;
  /** Every position of the ROOT inside the window — step 1 takes any ONE of them. */
  rootPositions: ClickTarget[];
  /** Cells that count as the interval from the placed root — empty until it is placed. */
  intervalPositions: ClickTarget[];
  /** The root position the player picked; the interval is measured from here. */
  anchor: ClickTarget | null;
  /** The placed root, as a one-element list — the board marks cells by key. */
  foundRootKeys: string[];
  foundIntervalKeys: string[];
  /** Most recent click outcome, for transient flash feedback — `id` increments on
   *  every scored click so the same cell can flash twice. `elapsedSeconds` is set
   *  only on a correct click, counted from when the step started. */
  lastClick: { string: number; fret: number; correct: boolean; id: number; elapsedSeconds?: number } | null;
  gameState: GameState;
  accuracy: number;
  maxPossibleScore: number;
  maxCombo: number;
  /** Wrong clicks across the whole exercise (every rotation), never reset. */
  mistakeCount: number;
  /** Correct clicks across the whole exercise — two per solved round. */
  correctClicks: number;
  /** Both clicks of the current prompt landed. */
  complete: boolean;
}

const keyOf = clickTargetKey;

interface BuildArgs {
  rootPositions: ClickTarget[];
  intervalPositions: ClickTarget[];
  anchor: ClickTarget | null;
  foundIntervalKey: string | null;
  lastClick: IntervalClickState["lastClick"];
  correctClicks: number;
  bankedTotal: number;
  mistakeCount: number;
}

function buildState({
  rootPositions,
  intervalPositions,
  anchor,
  foundIntervalKey,
  lastClick,
  correctClicks,
  bankedTotal,
  mistakeCount,
}: BuildArgs): IntervalClickState {
  // A window with no root at all (unknown note name) has nothing to place, so
  // the round opens on step 2 rather than deadlocking on step 1.
  const hasRoots = rootPositions.length > 0;
  const rootDone = !hasRoots || anchor !== null;
  const roundTotal = (hasRoots ? 1 : 0) + 1;
  const roundFound = (anchor ? 1 : 0) + (foundIntervalKey ? 1 : 0);

  // Graded across every prompt rotated through this session, not just the current
  // one: correct clicks over the clicks the session asked for (two per prompt
  // presented) plus every wrong click. Both halves matter — skipping rounds
  // leaves asked-for clicks unanswered, and brute-forcing the board inflates the
  // denominator, so neither route reaches a good grade.
  const cumulativeTotal = bankedTotal + roundTotal + mistakeCount;

  return {
    phase: rootDone ? "interval" : "root",
    rootPositions,
    intervalPositions,
    anchor,
    foundRootKeys: anchor ? [keyOf(anchor)] : [],
    foundIntervalKeys: foundIntervalKey ? [foundIntervalKey] : [],
    lastClick,
    gameState: {
      // The streak runs across rounds, not inside one: at two clicks a round the
      // multiplier would never leave 1× if it reset on every prompt.
      score: scoreForFoundCount(correctClicks),
      combo: correctClicks,
      multiplier: multiplierForFoundCount(correctClicks),
    },
    accuracy: cumulativeTotal > 0 ? Math.round((correctClicks / cumulativeTotal) * 100) : 0,
    maxPossibleScore: scoreForFoundCount(correctClicks + (roundTotal - roundFound)),
    maxCombo: correctClicks,
    mistakeCount,
    correctClicks,
    complete: rootDone && foundIntervalKey !== null,
  };
}

export interface IntervalClickControls {
  state: IntervalClickState;
  /** Register a click on a fretboard cell — scored against whichever step is active. */
  registerClick: (string: number, fret: number) => void;
}

/**
 * The interval drill's answer tracking: two clicks per round. Step 1 asks for the
 * ROOT — any one of its positions in the window, the player's pick — and step 2,
 * which opens on that click, asks for the note the prompted interval lands on,
 * within a hand's reach of the root just placed. The answer's name is never shown;
 * working it out IS the exercise.
 *
 * Placing the root instead of mapping all of them is what makes step 2 a real
 * interval: the shape is measured from one spot on the neck, the way it is when
 * playing, rather than from a note name spread over six strings.
 */
export function useIntervalClickHunt(
  rootNote: string,
  intervalNote: string,
  startFret: number,
  endFret: number,
  strings: number[] | undefined,
): IntervalClickControls {
  const stringsKey = strings ? strings.join(",") : "all";
  const promptKey = `${rootNote}>${intervalNote}|${startFret}-${endFret}|${stringsKey}`;

  const initialRoots = computeClickTargets(rootNote, startFret, endFret, strings);
  const initialTargets = computeClickTargets(intervalNote, startFret, endFret, strings);
  // Step 2 has no answers until a root is placed — unless there is no root to
  // place at all, in which case the round opens on every position of the answer.
  const initialAccepted = initialRoots.length > 0 ? [] : initialTargets;

  const rootsRef = useRef<ClickTarget[]>(initialRoots);
  /** Every position of the answer note in the window — narrowed to the ones in
   *  reach as soon as the root is placed. */
  const allTargetsRef = useRef<ClickTarget[]>(initialTargets);
  const anchorRef = useRef<ClickTarget | null>(null);
  const acceptedRef = useRef<ClickTarget[]>(initialAccepted);
  const foundIntervalRef = useRef<string | null>(null);
  const hitIdRef = useRef(0);
  const correctClicksRef = useRef(0);
  const firstPromptRef = useRef(true);
  const bankedTotalRef = useRef(0);
  // Never cleared on rotation — an exam's mistake limit has to see every wrong
  // click since the exam started, not just the current prompt's.
  const mistakeCountRef = useRef(0);
  // When the current STEP started, so each correct click can report how long it
  // took. Set for real by the retarget effect below (which also runs on mount) —
  // 0 here is just a placeholder so nothing calls Date.now() during render.
  const stepStartRef = useRef(0);

  const [state, setState] = useState<IntervalClickState>(() =>
    buildState({
      rootPositions: initialRoots,
      intervalPositions: initialAccepted,
      anchor: null,
      foundIntervalKey: null,
      lastClick: null,
      correctClicks: 0,
      bankedTotal: 0,
      mistakeCount: 0,
    }),
  );

  // Fresh prompt: bank the finishing round's asked-for clicks first (skipping the
  // initial mount), then start over on the new root/interval pair.
  useEffect(() => {
    if (!firstPromptRef.current) {
      bankedTotalRef.current += (rootsRef.current.length > 0 ? 1 : 0) + 1;
    }
    firstPromptRef.current = false;
    rootsRef.current = computeClickTargets(rootNote, startFret, endFret, strings);
    allTargetsRef.current = computeClickTargets(intervalNote, startFret, endFret, strings);
    anchorRef.current = null;
    acceptedRef.current = rootsRef.current.length > 0 ? [] : allTargetsRef.current;
    foundIntervalRef.current = null;
    hitIdRef.current = 0;
    stepStartRef.current = Date.now();
    setState(
      buildState({
        rootPositions: rootsRef.current,
        intervalPositions: acceptedRef.current,
        anchor: null,
        foundIntervalKey: null,
        lastClick: null,
        correctClicks: correctClicksRef.current,
        bankedTotal: bankedTotalRef.current,
        mistakeCount: mistakeCountRef.current,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptKey]);

  const registerClick = useCallback((string: number, fret: number) => {
    // Round already solved — the panel is on its way to the next prompt, and
    // stray taps in the meantime must not be graded either way.
    if (foundIntervalRef.current !== null) return;

    const anchor = anchorRef.current;
    const rootDone = anchor !== null || rootsRef.current.length === 0;
    const key = `${string}-${fret}`;

    // Tapping the placed root again during step 2 is obviously not an attempt at
    // the interval — it stays marked on the board — so it costs nothing.
    if (anchor && key === keyOf(anchor)) return;

    hitIdRef.current++;
    let elapsedSeconds: number | undefined;
    let correct = false;

    if (!rootDone) {
      const placed = rootsRef.current.find((p) => p.string === string && p.fret === fret);
      if (placed) {
        correct = true;
        elapsedSeconds = (Date.now() - stepStartRef.current) / 1000;
        anchorRef.current = placed;
        // The interval is measured from the spot just picked, so step 2's answers
        // only exist once there is a root to measure from.
        acceptedRef.current = targetsWithinReach(allTargetsRef.current, placed);
        // Step 2 opens here — restart the clock so its find time is measured from
        // when it actually became answerable.
        stepStartRef.current = Date.now();
      }
    } else if (acceptedRef.current.some((p) => p.string === string && p.fret === fret)) {
      correct = true;
      elapsedSeconds = (Date.now() - stepStartRef.current) / 1000;
      foundIntervalRef.current = key;
    }

    if (correct) correctClicksRef.current += 1;
    else mistakeCountRef.current += 1;

    setState(
      buildState({
        rootPositions: rootsRef.current,
        intervalPositions: acceptedRef.current,
        anchor: anchorRef.current,
        foundIntervalKey: foundIntervalRef.current,
        lastClick: { string, fret, correct, id: hitIdRef.current, elapsedSeconds },
        correctClicks: correctClicksRef.current,
        bankedTotal: bankedTotalRef.current,
        mistakeCount: mistakeCountRef.current,
      }),
    );
  }, []);

  return { state, registerClick };
}
