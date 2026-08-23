// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileToolsIsland } from "./MobileToolsIsland";

// Radix' slider (inside the tempo panel) measures itself on mount.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const exercise = {
  id: "ex-1",
  title: "Spider walk",
  metronomeSpeed: 90,
  instructions: ["Keep every finger down"],
  tips: ["Start slower than feels useful"],
} as unknown as Exercise;

const metronome = {
  bpm: 90,
  setBpm: vi.fn(),
  minBpm: 40,
  maxBpm: 240,
  subdivision: 1,
  accentPattern: [2, 1, 1, 1],
};

const renderIsland = (
  props: Partial<Parameters<typeof MobileToolsIsland>[0]> = {},
) =>
  render(
    <MobileToolsIsland
      exercise={exercise}
      metronome={metronome}
      hasMetronome
      hasAudioTrack={false}
      hasMicControls
      isRiddleMode={false}
      speedMultiplier={1}
      onSpeedMultiplierChange={vi.fn()}
      isAudioMuted={false}
      onAudioToggle={vi.fn()}
      isMicEnabled={false}
      onMicToggle={vi.fn()}
      onRecalibrate={vi.fn()}
      {...props}
    />,
  );

// No global setup file in this project, so cleanup is explicit.
afterEach(cleanup);

describe("MobileToolsIsland", () => {
  it("keeps the tools collapsed until asked for", () => {
    renderIsland();

    // The BPM sits on the island button, but the tempo panel behind it stays shut.
    expect(screen.getByTitle("Tempo")).toBeDefined();
    expect(screen.queryByRole("tab", { name: "Tempo" })).toBeNull();
    expect(screen.queryByTitle("Slower")).toBeNull();
  });

  it("opens the tempo panel with the other tool groups next to it", () => {
    renderIsland();
    fireEvent.click(screen.getByTitle("Tempo"));

    expect(screen.getByRole("tab", { name: "Tempo" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Sound" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Guide" })).toBeDefined();
    expect(screen.getByTitle("Slower")).toBeDefined();
  });

  it("toggles pitch detect straight from the island", () => {
    const onMicToggle = vi.fn();
    renderIsland({ onMicToggle });

    fireEvent.click(screen.getByTitle("Pitch Detect off"));
    expect(onMicToggle).toHaveBeenCalledOnce();
  });

  it("hides tempo and backing track in exam mode", () => {
    renderIsland({ examMode: true, hasAudioTrack: true });

    expect(screen.queryByTitle("Tempo")).toBeNull();
    expect(screen.queryByTitle("Backing track on")).toBeNull();
    expect(screen.getByTitle("Sound & input")).toBeDefined();
  });
});
