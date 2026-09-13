// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExerciseQuickActionsBar } from "./ExerciseQuickActionsBar";

// Radix' slider measures itself on mount.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const exercise = {
  id: "ex-1",
  title: "Spider walk",
  metronomeSpeed: 61,
} as unknown as Exercise;

const metronome = {
  bpm: 61,
  setBpm: vi.fn(),
  minBpm: 40,
  maxBpm: 240,
  subdivision: 1,
  accentPattern: [2, 1, 1, 1],
};

afterEach(cleanup);

describe("ExerciseQuickActionsBar", () => {
  it("keeps the speed picker inside the bar, next to the BPM it scales", () => {
    render(
      <ExerciseQuickActionsBar
        exercise={exercise}
        metronome={metronome}
        speedMultiplier={0.75}
        onSpeedMultiplierChange={vi.fn()}
      />,
    );

    const bar = screen.getByText("61").closest("div");
    expect(bar).not.toBeNull();
    // Same container as the BPM readout — not a sibling island.
    expect(screen.getByText("Speed").closest("div")).toBe(bar);
    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("46")).toBeDefined();
  });

  it("leaves the picker out when the layout places it elsewhere", () => {
    render(<ExerciseQuickActionsBar exercise={exercise} metronome={metronome} />);

    expect(screen.getByText("61")).toBeDefined();
    expect(screen.queryByText("Speed")).toBeNull();
  });

  it("never squeezes the picker into the compact strip", () => {
    render(
      <ExerciseQuickActionsBar
        exercise={exercise}
        metronome={metronome}
        speedMultiplier={0.5}
        onSpeedMultiplierChange={vi.fn()}
        compact
      />,
    );

    expect(screen.queryByText("Speed")).toBeNull();
    expect(screen.queryByText("50%")).toBeNull();
  });
});
