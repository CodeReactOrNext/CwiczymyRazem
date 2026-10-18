// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { RoadmapBuildPreview } from "feature/supporterPanel/components/RoadmapBuildPreview";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("RoadmapBuildPreview", () => {
  it("names the three acts it plays", () => {
    render(<RoadmapBuildPreview />);

    expect(screen.getByText("Your goal")).toBeDefined();
    expect(screen.getByText("Phases")).toBeDefined();
    expect(screen.getByText("Exercises, songs and lessons")).toBeDefined();
  });

  it("types an example goal, then moves on to the next one", () => {
    render(<RoadmapBuildPreview />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("Blues like Stevie Ray Vaughan")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(6400);
    });
    expect(screen.getByText("Back after a break")).toBeDefined();
  });
});
