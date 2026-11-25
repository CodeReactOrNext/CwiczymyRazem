// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  setBeatsPerBar: vi.fn(),
  cycleBeatAccent: vi.fn(),
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
    expect(screen.getByText("Slow down").closest("div")).toBe(bar);
    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("46")).toBeDefined();
  });

  it("leaves the picker out when the layout places it elsewhere", () => {
    render(<ExerciseQuickActionsBar exercise={exercise} metronome={metronome} />);

    expect(screen.getByText("61")).toBeDefined();
    expect(screen.queryByText("Slow down")).toBeNull();
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

    expect(screen.queryByText("Slow down")).toBeNull();
    expect(screen.queryByText("50%")).toBeNull();
  });

  it("reads the beat count as a meter", () => {
    render(<ExerciseQuickActionsBar exercise={exercise} metronome={metronome} />);
    expect(screen.getByText("4/4")).toBeDefined();
  });

  it("offers the way back to the exercise's tempo only once it has moved off it", () => {
    const handleSetRecommendedBpm = vi.fn();
    const { rerender } = render(
      <ExerciseQuickActionsBar
        exercise={exercise}
        metronome={{ ...metronome, recommendedBpm: 61, handleSetRecommendedBpm }}
      />,
    );
    expect(screen.queryByRole("button", { name: /reset to recommended/i })).toBeNull();

    rerender(
      <ExerciseQuickActionsBar
        exercise={exercise}
        metronome={{ ...metronome, bpm: 70, recommendedBpm: 61, handleSetRecommendedBpm }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reset to recommended/i }));
    expect(handleSetRecommendedBpm).toHaveBeenCalledTimes(1);
  });
});
