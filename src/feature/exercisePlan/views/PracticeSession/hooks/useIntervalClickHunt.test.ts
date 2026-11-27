// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeClickTargets } from "../helpers/clickTargets";
import { useIntervalClickHunt } from "./useIntervalClickHunt";

// A → Perfect 5th ↑ → E, on the A and low E strings, frets 0–12:
// A sits at 6-5, 5-0 and 5-12; E at 6-0, 6-12 and 5-7.
const setup = (root = "A", target = "E", startFret = 0, endFret = 12, strings: number[] | undefined = [5, 6]) =>
  renderHook(({ r, t }) => useIntervalClickHunt(r, t, startFret, endFret, strings), {
    initialProps: { r: root, t: target },
  });

describe("useIntervalClickHunt", () => {
  it("starts on the root step with every root position open as a choice", () => {
    const { result } = setup();
    expect(result.current.state.phase).toBe("root");
    expect(result.current.state.rootPositions).toHaveLength(3);
    expect(result.current.state.rootPositions).toContainEqual({ string: 6, fret: 5 });
    expect(result.current.state.rootPositions).toContainEqual({ string: 5, fret: 0 });
    expect(result.current.state.rootPositions).toContainEqual({ string: 5, fret: 12 });
    // Nothing to answer in step 2 yet — the interval is measured from a root the
    // player hasn't picked.
    expect(result.current.state.intervalPositions).toEqual([]);
    expect(result.current.state.anchor).toBeNull();
    expect(result.current.state.complete).toBe(false);
  });

  it("opens the interval step on a single root click, and measures it from there", () => {
    const { result } = setup();

    // The answer note is a wrong click while the root step is still open.
    act(() => result.current.registerClick(5, 7));
    expect(result.current.state.phase).toBe("root");
    expect(result.current.state.lastClick?.correct).toBe(false);
    expect(result.current.state.mistakeCount).toBe(1);

    act(() => result.current.registerClick(6, 5));
    expect(result.current.state.phase).toBe("interval");
    expect(result.current.state.anchor).toEqual({ string: 6, fret: 5 });
    expect(result.current.state.foundRootKeys).toEqual(["6-5"]);
    // Only the E within a hand's reach of THAT A counts — the ones at 6-0 and
    // 6-12 are the right note in the wrong place.
    expect(result.current.state.intervalPositions).toEqual([{ string: 5, fret: 7 }]);
    expect(result.current.state.complete).toBe(false);
  });

  it("counts the answer note out of reach of the placed root as a mistake", () => {
    const { result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(6, 12)); // an E, seven frets away
    expect(result.current.state.mistakeCount).toBe(1);
    expect(result.current.state.complete).toBe(false);
  });

  it("completes the round on the second click", () => {
    const { result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    expect(result.current.state.complete).toBe(true);
    expect(result.current.state.correctClicks).toBe(2);
    expect(result.current.state.accuracy).toBe(100);
    expect(result.current.state.gameState.score).toBe(result.current.state.maxPossibleScore);
  });

  it("stops grading clicks once the round is solved", () => {
    const { result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    act(() => result.current.registerClick(5, 3));
    expect(result.current.state.mistakeCount).toBe(0);
    expect(result.current.state.correctClicks).toBe(2);
  });

  it("does not punish re-tapping the placed root during the interval step", () => {
    const { result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(6, 5));
    expect(result.current.state.mistakeCount).toBe(0);
    expect(result.current.state.phase).toBe("interval");
  });

  it("accepts any position of the answer when none is within reach", () => {
    // One string only: A at fret 5, E at frets 0 and 12 — both further than a
    // hand's stretch, so the round would be unanswerable if reach were enforced.
    const { result } = setup("A", "E", 0, 12, [6]);

    act(() => result.current.registerClick(6, 5));
    expect(result.current.state.intervalPositions).toEqual([
      { string: 6, fret: 0 },
      { string: 6, fret: 12 },
    ]);
  });

  it("keeps counting mistakes across prompts", () => {
    const { rerender, result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 3)); // C, neither root nor answer
    expect(result.current.state.mistakeCount).toBe(1);

    // A fresh prompt resets progress but never forgives earlier mistakes — the
    // exam's 3-strike limit has to see the whole session.
    rerender({ r: "C", t: "G" });
    expect(result.current.state.mistakeCount).toBe(1);
    expect(result.current.state.phase).toBe("root");
    expect(result.current.state.anchor).toBeNull();
    expect(result.current.state.foundRootKeys).toEqual([]);
    expect(result.current.state.rootPositions).toHaveLength(2);
    expect(result.current.state.rootPositions).toContainEqual({ string: 5, fret: 3 });
  });

  it("carries score across prompts and grades on every round presented", () => {
    const { rerender, result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    const bankedScore = result.current.state.gameState.score;
    expect(bankedScore).toBeGreaterThan(0);

    rerender({ r: "C", t: "G" });
    expect(result.current.state.gameState.score).toBe(bankedScore);
    // The fresh prompt hasn't asked anything of the player yet: if the clock
    // ran out right now, the run was spotless.
    expect(result.current.state.accuracy).toBe(100);

    act(() => result.current.registerClick(5, 3)); // C on the A string
    expect(result.current.state.gameState.score).toBeGreaterThan(bankedScore);
    expect(result.current.state.accuracy).toBe(100);
  });

  it("counts a round that ran out unanswered as missed clicks", () => {
    const { rerender, result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    rerender({ r: "C", t: "G" });
    act(() => result.current.registerClick(5, 3)); // root placed, interval never found
    rerender({ r: "A", t: "E" });
    // 3 landed of the 4 the two finished rounds asked for.
    expect(result.current.state.accuracy).toBe(75);
  });

  it("counts solved rounds across prompts and starts them over on a new run", () => {
    let runKey = 0;
    const { rerender, result } = renderHook(({ r, t }) => useIntervalClickHunt(r, t, 0, 12, [5, 6], runKey), {
      initialProps: { r: "A", t: "E" },
    });

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    expect(result.current.state.solvedRounds).toBe(1);

    rerender({ r: "C", t: "G" });
    act(() => result.current.registerClick(5, 3));
    expect(result.current.state.solvedRounds).toBe(1);
    act(() => result.current.registerClick(6, 3));
    expect(result.current.state.solvedRounds).toBe(2);

    runKey = 1;
    rerender({ r: "C", t: "G" });
    expect(result.current.state.solvedRounds).toBe(0);
  });

  it("builds one multiplier across rounds instead of restarting it every prompt", () => {
    const { rerender, result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    expect(result.current.state.gameState.multiplier).toBe(1);

    // C at 5-3 with G at 5-10, 6-3 — 6-3 is the one in reach.
    rerender({ r: "C", t: "G" });
    act(() => result.current.registerClick(5, 3));
    act(() => result.current.registerClick(6, 3));

    rerender({ r: "A", t: "E" });
    act(() => result.current.registerClick(6, 5));
    expect(result.current.state.correctClicks).toBe(5);
    expect(result.current.state.gameState.multiplier).toBe(2);
  });

  it("ignores an unknown note name instead of demanding impossible cells", () => {
    const { result } = setup("H", "E");
    expect(result.current.state.rootPositions).toEqual([]);
    // No root to place → the interval step is open immediately, on every position.
    expect(result.current.state.phase).toBe("interval");
    expect(result.current.state.intervalPositions).toEqual(computeClickTargets("E", 0, 12, [5, 6]));
  });
});
