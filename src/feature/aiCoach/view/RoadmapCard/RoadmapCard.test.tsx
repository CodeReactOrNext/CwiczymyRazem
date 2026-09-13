// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import { afterEach, describe, expect, it, vi } from "vitest";

import RoadmapCard from "./RoadmapCard";

vi.mock("next/image", () => ({ default: () => null }));

afterEach(cleanup);

const makeRoadmap = (sessions: number[]): Roadmap => ({
  id: "roadmap",
  userId: "user",
  title: "I want to play in the style of Marty Friedman",
  goal: "I want to play in the style of Marty Friedman",
  level: "Advanced",
  createdAt: "2026-09-13",
  updatedAt: "2026-09-13",
  phases: [
    {
      id: "phase",
      title: "Expression",
      order: 0,
      steps: sessions.map((sessionsCompleted, index) => ({
        id: `step-${index}`,
        title: `Lesson ${index + 1}`,
        order: index,
        description: "Practice",
        successCriteria: "Play cleanly",
        sessionsRequired: 8,
        sessionsCompleted,
      })),
    },
  ],
});

describe("RoadmapCard", () => {
  it("offers a focusable start action and a short artist heading", () => {
    const onOpen = vi.fn();
    render(<RoadmapCard roadmap={makeRoadmap([0, 0])} onOpen={onOpen} />);
    expect(
      screen.getByRole("heading", { name: "Marty Friedman" }),
    ).toBeTruthy();
    const button = screen.getByRole("button", {
      name: "Start learning: Marty Friedman",
    });
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("continues a partially practised step even before any step is complete", () => {
    render(<RoadmapCard roadmap={makeRoadmap([0, 3])} onOpen={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Continue: Marty Friedman" }),
    ).toBeTruthy();
    expect(screen.getByText("Lesson 2")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "0",
    );
  });

  it("offers review instead of continuing after all steps are complete", () => {
    render(<RoadmapCard roadmap={makeRoadmap([8, 8])} onOpen={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Review roadmap: Marty Friedman" }),
    ).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "100",
    );
    expect(screen.queryByText("Up next")).toBeNull();
  });
});
