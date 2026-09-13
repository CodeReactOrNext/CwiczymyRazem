// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { effectiveBpmLabel, SpeedDropdown } from "./SpeedDropdown";

// Radix' popper measures the trigger on open.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(cleanup);

const renderSpeed = (
  props: Partial<Parameters<typeof SpeedDropdown>[0]> = {},
) =>
  render(
    <SpeedDropdown
      speedMultiplier={1}
      onSpeedMultiplierChange={vi.fn()}
      baseBpm={61}
      h='h-8'
      {...props}
    />,
  );

describe("effectiveBpmLabel", () => {
  it("rounds the scaled tempo for display", () => {
    expect(effectiveBpmLabel(61, 0.75)).toBe(46);
    expect(effectiveBpmLabel(61, 0.5)).toBe(31);
    expect(effectiveBpmLabel(61, 1)).toBe(61);
  });
});

describe("SpeedDropdown", () => {
  it("says what it is — a bare percentage read as an unrelated setting", () => {
    renderSpeed();

    expect(screen.getByText("Speed")).toBeDefined();
    expect(screen.getByText("100%")).toBeDefined();
    // At full speed the BPM is already on the metronome; don't repeat it.
    expect(screen.queryByText("BPM")).toBeNull();
  });

  it("spells out the tempo the percentage works out to once slowed", () => {
    renderSpeed({ speedMultiplier: 0.75 });

    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("46")).toBeDefined();
    expect(screen.getByText("BPM")).toBeDefined();
    expect(screen.getByTitle(/run at 46 BPM instead of 61/)).toBeDefined();
  });

  it("lists every speed next to the BPM it becomes", () => {
    const onSpeedMultiplierChange = vi.fn();
    renderSpeed({ onSpeedMultiplierChange });

    fireEvent.keyDown(screen.getByTitle(/Playback speed/), { key: "Enter" });

    expect(screen.getByText("Playback speed")).toBeDefined();
    expect(screen.getByText("46 BPM")).toBeDefined();
    expect(screen.getByText("31 BPM")).toBeDefined();
    expect(screen.getByText("15 BPM")).toBeDefined();

    fireEvent.click(screen.getByText("50%"));
    expect(onSpeedMultiplierChange).toHaveBeenCalledWith(0.5);
  });

  it("drops the label but keeps the readout in the compact strip", () => {
    renderSpeed({ compact: true, speedMultiplier: 0.5 });

    expect(screen.queryByText("Speed")).toBeNull();
    expect(screen.getByText("50%")).toBeDefined();
    expect(screen.getByText("31")).toBeDefined();
  });
});
