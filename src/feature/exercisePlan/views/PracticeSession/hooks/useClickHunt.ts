import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { useCallback, useEffect, useRef, useState } from "react";
import { NOTES } from "utils/audio/noteUtils";

import type { GameState } from "./noteMatchingFeedback";

export interface ClickTarget {
  string: number;
  fret: number;
}

export interface ClickHuntState {
  /** Every valid (string, fret) position for the current target inside the
   *  configured window/strings. */
  targetPositions: ClickTarget[];
  /** Positions the player has already clicked correctly, as "string-fret" keys. */
  foundKeys: string[];
  /** Most recent click outcome, for transient flash feedback. Increments `id` on
   *  every click (even repeats) so the same cell can flash again. `elapsedSeconds`
   *  is only set the first time a position is correctly found — time since the
   *  current target note appeared. */
  lastClick: { string: number; fret: number; correct: boolean; id: number; elapsedSeconds?: number } | null;
  hitId: number;
  gameState: GameState;
  accuracy: number;
  maxPossibleScore: number;
  maxCombo: number;
}

const keyOf = (p: ClickTarget) => `${p.string}-${p.fret}`;

/** Escalating score for finding `n` positions — same curve as the mic-based hunts. */
function scoreForCount(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += 100 * Math.min(8, Math.floor(i / 5) + 1);
  return total;
}

function computeTargets(note: string, startFret: number, endFret: number, strings?: number[]): ClickTarget[] {
  const pitchClass = NOTES.indexOf(note);
  if (pitchClass < 0) return [];
  const positions = getNotePositionsInRange(pitchClass, startFret, endFret);
  const scoped = strings ? positions.filter((p) => strings.includes(p.string)) : positions;
  return scoped.map((p) => ({ string: p.string, fret: p.fret }));
}

function buildState(
  targetPositions: ClickTarget[],
  found: Set<string>,
  lastClick: ClickHuntState["lastClick"],
  hitId: number,
  scoreOffset = 0,
  bankedFound = 0,
  bankedTotal = 0,
): ClickHuntState {
  const foundCount = targetPositions.filter((p) => found.has(keyOf(p))).length;
  const multiplier = Math.min(8, Math.floor(foundCount / 5) + 1);
  // Cumulative across every target rotated through this exam, not just the
  // currently active one — otherwise an exam that ends mid-rotation (the
  // exercise timer, not the per-note countdown) would grade on whatever
  // fraction of the CURRENT note happens to be found, ignoring every note
  // already solved 100% before it. Same fix as the sweep hunt's banked set.
  const cumulativeFound = bankedFound + foundCount;
  const cumulativeTotal = bankedTotal + targetPositions.length;
  return {
    targetPositions,
    foundKeys: Array.from(found),
    lastClick,
    hitId,
    gameState: {
      score: scoreOffset + scoreForCount(foundCount),
      combo: foundCount,
      multiplier,
    },
    accuracy: cumulativeTotal > 0 ? Math.round((cumulativeFound / cumulativeTotal) * 100) : 0,
    maxPossibleScore: scoreForCount(targetPositions.length),
    maxCombo: foundCount,
  };
}

export interface ClickHuntControls {
  state: ClickHuntState;
  /** Register a click on a fretboard cell — scores it if it's a valid, unfound target. */
  registerClick: (string: number, fret: number) => void;
}

/**
 * Click-to-answer counterpart to useNoteHunt: instead of listening to the mic,
 * the player clicks the target note's position(s) directly on a fretboard
 * diagram. No audio, no RAF loop, no play/pause gating — clicks always register,
 * the same way the mic hunts' no-mic tap-to-mark (markOctave) always works
 * regardless of the session timer.
 */
export function useClickHunt(
  note: string,
  startFret: number,
  endFret: number,
  strings: number[] | undefined,
): ClickHuntControls {
  const targetKey = `${note}|${startFret}-${endFret}|${strings ? strings.join(",") : "all"}`;

  const foundRef = useRef<Set<string>>(new Set());
  const hitIdRef = useRef(0);
  const sessionScoreRef = useRef(0);
  const prevFoundCountRef = useRef(0);
  const firstTargetRef = useRef(true);
  const targetsRef = useRef<ClickTarget[]>(computeTargets(note, startFret, endFret, strings));
  // Cumulative found/total across every finished target — banked alongside the
  // score, see buildState's accuracy comment.
  const bankedFoundRef = useRef(0);
  const bankedTotalRef = useRef(0);
  // When the current target note appeared — lets each correct click report how
  // long it took to find, for the "✓ 1.3s" feedback tooltip. Set for real by the
  // retarget effect below (which also runs on mount) — 0 here is just a pure
  // placeholder so the initializer doesn't call Date.now() during render.
  const targetStartRef = useRef(0);

  const [state, setState] = useState<ClickHuntState>(() =>
    buildState(computeTargets(note, startFret, endFret, strings), new Set(), null, 0, 0),
  );

  // Retarget in place when the note/window/strings change — bank the finishing
  // target's score first (skip the initial mount), same pattern as useNoteHunt.
  useEffect(() => {
    if (!firstTargetRef.current) {
      sessionScoreRef.current += scoreForCount(prevFoundCountRef.current);
      bankedFoundRef.current += prevFoundCountRef.current;
      bankedTotalRef.current += targetsRef.current.length;
    }
    firstTargetRef.current = false;
    targetsRef.current = computeTargets(note, startFret, endFret, strings);
    foundRef.current = new Set();
    hitIdRef.current = 0;
    prevFoundCountRef.current = 0;
    targetStartRef.current = Date.now();
    setState(buildState(
      targetsRef.current, foundRef.current, null, 0,
      sessionScoreRef.current, bankedFoundRef.current, bankedTotalRef.current,
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  const registerClick = useCallback(
    (string: number, fret: number) => {
      const targets = targetsRef.current;
      const isTarget = targets.some((p) => p.string === string && p.fret === fret);
      const key = `${string}-${fret}`;
      const alreadyFound = foundRef.current.has(key);
      hitIdRef.current++;

      let elapsedSeconds: number | undefined;
      if (isTarget && !alreadyFound) {
        foundRef.current.add(key);
        const foundCount = targets.filter((p) => foundRef.current.has(keyOf(p))).length;
        prevFoundCountRef.current = foundCount;
        elapsedSeconds = (Date.now() - targetStartRef.current) / 1000;
      }

      setState(
        buildState(
          targets,
          foundRef.current,
          { string, fret, correct: isTarget, id: hitIdRef.current, elapsedSeconds },
          hitIdRef.current,
          sessionScoreRef.current,
          bankedFoundRef.current,
          bankedTotalRef.current,
        ),
      );
    },
    [],
  );

  return { state, registerClick };
}
