import { useCallback, useEffect, useRef, useState } from "react";

import type { ClickTarget } from "../helpers/clickTargets";
import { clickTargetKey, computeClickTargets, multiplierForFoundCount, scoreForFoundCount } from "../helpers/clickTargets";
import type { GameState } from "./noteMatchingFeedback";

/** Which half of the round the player is on: locate the root, then the interval. */
export type IntervalClickPhase = "root" | "interval";

export interface IntervalClickState {
  phase: IntervalClickPhase;
  /** Every position of the ROOT note inside the window — step 1's answers. */
  rootPositions: ClickTarget[];
  /** Every position of the INTERVAL note (root + interval) — step 2's answers. */
  intervalPositions: ClickTarget[];
  foundRootKeys: string[];
  foundIntervalKeys: string[];
  /** Most recent click outcome, for transient flash feedback — `id` increments on
   *  every scored click so the same cell can flash twice. `elapsedSeconds` is set
   *  only the first time a position is found, counted from when the step started. */
  lastClick: { string: number; fret: number; correct: boolean; id: number; elapsedSeconds?: number } | null;
  gameState: GameState;
  accuracy: number;
  maxPossibleScore: number;
  maxCombo: number;
  /** Wrong clicks across the whole exercise (every rotation), never reset. */
  mistakeCount: number;
  /** Both steps solved for the current prompt. */
  complete: boolean;
}

const keyOf = clickTargetKey;

interface BuildArgs {
  rootPositions: ClickTarget[];
  intervalPositions: ClickTarget[];
  foundRoot: Set<string>;
  foundInterval: Set<string>;
  lastClick: IntervalClickState["lastClick"];
  scoreOffset: number;
  bankedFound: number;
  bankedTotal: number;
  mistakeCount: number;
}

function buildState({
  rootPositions,
  intervalPositions,
  foundRoot,
  foundInterval,
  lastClick,
  scoreOffset,
  bankedFound,
  bankedTotal,
  mistakeCount,
}: BuildArgs): IntervalClickState {
  const rootFound = rootPositions.filter((p) => foundRoot.has(keyOf(p))).length;
  const intervalFound = intervalPositions.filter((p) => foundInterval.has(keyOf(p))).length;
  const foundCount = rootFound + intervalFound;
  const total = rootPositions.length + intervalPositions.length;
  const rootDone = rootFound >= rootPositions.length;

  // Cumulative across every prompt rotated through this session, not just the
  // current one — an exercise that ends mid-round would otherwise grade on the
  // fraction of the CURRENT prompt that happens to be found, ignoring every
  // round already solved in full. Same banking as useClickHunt.
  const cumulativeFound = bankedFound + foundCount;
  const cumulativeTotal = bankedTotal + total;

  return {
    phase: rootDone ? "interval" : "root",
    rootPositions,
    intervalPositions,
    foundRootKeys: Array.from(foundRoot),
    foundIntervalKeys: Array.from(foundInterval),
    lastClick,
    gameState: {
      score: scoreOffset + scoreForFoundCount(foundCount),
      combo: foundCount,
      multiplier: multiplierForFoundCount(foundCount),
    },
    accuracy: cumulativeTotal > 0 ? Math.round((cumulativeFound / cumulativeTotal) * 100) : 0,
    maxPossibleScore: scoreForFoundCount(total),
    maxCombo: foundCount,
    mistakeCount,
    complete: total > 0 && rootDone && intervalFound >= intervalPositions.length,
  };
}

export interface IntervalClickControls {
  state: IntervalClickState;
  /** Register a click on a fretboard cell — scored against whichever step is active. */
  registerClick: (string: number, fret: number) => void;
}

/**
 * The interval drill's answer tracking: a two-step click round. Step 1 asks for
 * every position of the ROOT note inside the window; step 2 — which opens by
 * itself once the root is fully mapped — asks for every position of the note the
 * prompted interval lands on, whose name is never shown (working it out IS the
 * exercise).
 *
 * Scoring, accuracy banking and the mistake counter mirror useClickHunt, so an
 * interval round grades on the same scale as a plain click drill; the two steps
 * share one running multiplier, so a full round is worth more than two halves.
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

  const rootsRef = useRef<ClickTarget[]>(computeClickTargets(rootNote, startFret, endFret, strings));
  const intervalsRef = useRef<ClickTarget[]>(computeClickTargets(intervalNote, startFret, endFret, strings));
  const foundRootRef = useRef<Set<string>>(new Set());
  const foundIntervalRef = useRef<Set<string>>(new Set());
  const hitIdRef = useRef(0);
  const sessionScoreRef = useRef(0);
  const prevFoundCountRef = useRef(0);
  const firstPromptRef = useRef(true);
  const bankedFoundRef = useRef(0);
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
      rootPositions: computeClickTargets(rootNote, startFret, endFret, strings),
      intervalPositions: computeClickTargets(intervalNote, startFret, endFret, strings),
      foundRoot: new Set(),
      foundInterval: new Set(),
      lastClick: null,
      scoreOffset: 0,
      bankedFound: 0,
      bankedTotal: 0,
      mistakeCount: 0,
    }),
  );

  // Fresh prompt: bank the finishing round's score and progress first (skipping
  // the initial mount), then start over on the new root/interval pair.
  useEffect(() => {
    if (!firstPromptRef.current) {
      sessionScoreRef.current += scoreForFoundCount(prevFoundCountRef.current);
      bankedFoundRef.current += prevFoundCountRef.current;
      bankedTotalRef.current += rootsRef.current.length + intervalsRef.current.length;
    }
    firstPromptRef.current = false;
    rootsRef.current = computeClickTargets(rootNote, startFret, endFret, strings);
    intervalsRef.current = computeClickTargets(intervalNote, startFret, endFret, strings);
    foundRootRef.current = new Set();
    foundIntervalRef.current = new Set();
    hitIdRef.current = 0;
    prevFoundCountRef.current = 0;
    stepStartRef.current = Date.now();
    setState(
      buildState({
        rootPositions: rootsRef.current,
        intervalPositions: intervalsRef.current,
        foundRoot: foundRootRef.current,
        foundInterval: foundIntervalRef.current,
        lastClick: null,
        scoreOffset: sessionScoreRef.current,
        bankedFound: bankedFoundRef.current,
        bankedTotal: bankedTotalRef.current,
        mistakeCount: mistakeCountRef.current,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptKey]);

  const registerClick = useCallback((string: number, fret: number) => {
    const roots = rootsRef.current;
    const intervals = intervalsRef.current;
    const key = `${string}-${fret}`;
    const rootDone = roots.every((p) => foundRootRef.current.has(keyOf(p)));

    // Tapping a root cell again after the root step is over is obviously not an
    // attempt at the interval — those cells stay marked on the board — so it
    // costs nothing rather than burning a strike.
    if (rootDone && foundRootRef.current.has(key)) return;

    const active = rootDone ? intervals : roots;
    const found = rootDone ? foundIntervalRef.current : foundRootRef.current;
    const isTarget = active.some((p) => p.string === string && p.fret === fret);
    const alreadyFound = found.has(key);
    hitIdRef.current++;

    let elapsedSeconds: number | undefined;
    if (isTarget && !alreadyFound) {
      found.add(key);
      elapsedSeconds = (Date.now() - stepStartRef.current) / 1000;
      // Finishing the root step opens the interval step — restart the clock so
      // its own find times are measured from when it actually became answerable.
      if (!rootDone && roots.every((p) => foundRootRef.current.has(keyOf(p)))) {
        stepStartRef.current = Date.now();
      }
    } else if (!isTarget) {
      mistakeCountRef.current += 1;
    }

    const next = buildState({
      rootPositions: roots,
      intervalPositions: intervals,
      foundRoot: foundRootRef.current,
      foundInterval: foundIntervalRef.current,
      lastClick: { string, fret, correct: isTarget, id: hitIdRef.current, elapsedSeconds },
      scoreOffset: sessionScoreRef.current,
      bankedFound: bankedFoundRef.current,
      bankedTotal: bankedTotalRef.current,
      mistakeCount: mistakeCountRef.current,
    });
    prevFoundCountRef.current = next.gameState.combo;
    setState(next);
  }, []);

  return { state, registerClick };
}
