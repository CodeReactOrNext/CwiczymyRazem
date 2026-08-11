import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { computeClickTargets } from "../helpers/clickTargets";
import { useIntervalClickHunt } from "./useIntervalClickHunt";

// A → Perfect 5th ↑ → E, on the low E string only (open = E2), frets 0–12:
// A sits at fret 5, E at frets 0 and 12.
const setup = (root = "A", target = "E", startFret = 0, endFret = 12, strings: number[] | undefined = [6]) =>
  renderHook(({ r, t }) => useIntervalClickHunt(r, t, startFret, endFret, strings), {
    initialProps: { r: root, t: target },
  });

describe("useIntervalClickHunt", () => {
  it("starts on the root step with every root position in the window as a target", () => {
    const { result } = setup();
    expect(result.current.state.phase).toBe("root");
    expect(result.current.state.rootPositions).toEqual([{ string: 6, fret: 5 }]);
    expect(result.current.state.intervalPositions).toEqual([
      { string: 6, fret: 0 },
      { string: 6, fret: 12 },
    ]);
    expect(result.current.state.complete).toBe(false);
  });

  it("opens the interval step only once every root position is found", () => {
    const { result } = setup();

    // The interval note is a wrong answer while the root step is still open.
    act(() => result.current.registerClick(6, 0));
    expect(result.current.state.phase).toBe("root");
    expect(result.current.state.lastClick?.correct).toBe(false);
    expect(result.current.state.mistakeCount).toBe(1);
    expect(result.current.state.foundIntervalKeys).toEqual([]);

    act(() => result.current.registerClick(6, 5));
    expect(result.current.state.phase).toBe("interval");
    expect(result.current.state.foundRootKeys).toEqual(["6-5"]);
    expect(result.current.state.complete).toBe(false);
  });

  it("completes the round once both steps are solved", () => {
    const { result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(6, 0));
    expect(result.current.state.complete).toBe(false);

    act(() => result.current.registerClick(6, 12));
    expect(result.current.state.complete).toBe(true);
    expect(result.current.state.accuracy).toBe(100);
    expect(result.current.state.gameState.score).toBe(result.current.state.maxPossibleScore);
  });

  it("does not punish re-tapping a located root during the interval step", () => {
    const { result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(6, 5));
    expect(result.current.state.mistakeCount).toBe(0);
    expect(result.current.state.phase).toBe("interval");
  });

  it("counts a wrong cell in the interval step as a mistake, and keeps counting across prompts", () => {
    const { rerender, result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(6, 3)); // G, neither root nor target
    expect(result.current.state.mistakeCount).toBe(1);

    // A fresh prompt resets progress but never forgives earlier mistakes — the
    // exam's 3-strike limit has to see the whole session.
    rerender({ r: "C", t: "G" });
    expect(result.current.state.mistakeCount).toBe(1);
    expect(result.current.state.phase).toBe("root");
    expect(result.current.state.foundRootKeys).toEqual([]);
    expect(result.current.state.rootPositions).toEqual([{ string: 6, fret: 8 }]);
  });

  it("banks a finished round's score and accuracy into the next prompt", () => {
    const { rerender, result } = setup();

    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(6, 0));
    act(() => result.current.registerClick(6, 12));
    const bankedScore = result.current.state.gameState.score;

    rerender({ r: "C", t: "G" });
    expect(result.current.state.gameState.score).toBe(bankedScore);
    // 3 found out of the 3 already presented + the 2 the new prompt just put on
    // the board — accuracy always counts the round in progress too.
    expect(result.current.state.accuracy).toBe(60);

    act(() => result.current.registerClick(6, 8)); // C on the low E string
    expect(result.current.state.gameState.score).toBeGreaterThan(bankedScore);
  });

  it("shares one running multiplier across both steps of a round", () => {
    // Both strings in play: A at 6-5, 5-0 and 5-12; E at 6-0, 6-12 and 5-7 — six
    // cells across the two steps, so the multiplier only lifts on the interval
    // step, which is the point of sharing one counter between them.
    const { result } = setup("A", "E", 0, 12, [5, 6]);
    const clicks: [number, number][] = [[6, 5], [5, 0], [5, 12], [6, 0], [6, 12], [5, 7]];
    clicks.forEach(([string, fret]) => act(() => result.current.registerClick(string, fret)));

    expect(result.current.state.complete).toBe(true);
    expect(result.current.state.gameState.combo).toBe(6);
    expect(result.current.state.gameState.multiplier).toBe(2);
  });

  it("ignores an unknown note name instead of demanding impossible cells", () => {
    const { result } = setup("H", "E");
    expect(result.current.state.rootPositions).toEqual([]);
    // No roots to find → the interval step is open immediately.
    expect(result.current.state.phase).toBe("interval");
    expect(computeClickTargets("H", 0, 12, [6])).toEqual([]);
  });
});
