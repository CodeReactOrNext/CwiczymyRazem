// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useClickHunt } from "./useClickHunt";
import { useIntervalClickHunt } from "./useIntervalClickHunt";

// E on the low E string, frets 0–12: 6-0 and 6-12. G at 6-3.
describe("useClickHunt run reset", () => {
  it("banks the score across rotated notes within one run", () => {
    const { result, rerender } = renderHook(
      ({ note, run }) => useClickHunt(note, 0, 12, [6], run),
      { initialProps: { note: "E", run: 0 } },
    );
    act(() => result.current.registerClick(6, 0));
    const afterFirst = result.current.state.gameState.score;
    expect(afterFirst).toBeGreaterThan(0);

    rerender({ note: "G", run: 0 });
    expect(result.current.state.gameState.score).toBe(afterFirst);
  });

  it("starts the score, accuracy and mistakes over on a new run (Repeat session)", () => {
    const { result, rerender } = renderHook(
      ({ note, run }) => useClickHunt(note, 0, 12, [6], run),
      { initialProps: { note: "E", run: 0 } },
    );
    act(() => result.current.registerClick(6, 0));
    act(() => result.current.registerClick(6, 12));
    act(() => result.current.registerClick(6, 5)); // wrong
    rerender({ note: "G", run: 0 });
    expect(result.current.state.gameState.score).toBeGreaterThan(0);

    // Same note can come back on the restart — the run key alone must reset it.
    rerender({ note: "G", run: 1 });
    expect(result.current.state.gameState.score).toBe(0);
    expect(result.current.state.mistakeCount).toBe(0);
    expect(result.current.state.foundKeys).toEqual([]);

    act(() => result.current.registerClick(6, 3));
    expect(result.current.state.accuracy).toBe(100);
  });
});

describe("useIntervalClickHunt run reset", () => {
  it("starts the score over on a new run", () => {
    const { result, rerender } = renderHook(
      ({ run }) => useIntervalClickHunt("A", "E", 0, 12, [5, 6], run),
      { initialProps: { run: 0 } },
    );
    act(() => result.current.registerClick(6, 5));
    act(() => result.current.registerClick(5, 7));
    act(() => result.current.registerClick(6, 1)); // ignored: round solved
    expect(result.current.state.correctClicks).toBe(2);
    expect(result.current.state.gameState.score).toBeGreaterThan(0);

    rerender({ run: 1 });
    expect(result.current.state.correctClicks).toBe(0);
    expect(result.current.state.mistakeCount).toBe(0);
    expect(result.current.state.gameState.score).toBe(0);
    expect(result.current.state.phase).toBe("root");
  });
});
