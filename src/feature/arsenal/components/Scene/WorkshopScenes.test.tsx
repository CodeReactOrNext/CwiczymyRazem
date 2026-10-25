// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DROPPABLE_GUITARS } from "../../data/guitarDefinitions";
import type {
  InventoryItem,
  WorkshopBuildResult,
  WorkshopRepairResult,
} from "../../types/arsenal.types";
import { BuildScene } from "./BuildScene";
import { RestoreScene } from "./RestoreScene";
import type { ActiveScene } from "./sceneStore";
import { subjectOfItem } from "./sceneSubject";

vi.mock("framer-motion", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("framer-motion")),
  useReducedMotion: () => false,
}));

const guitar = DROPPABLE_GUITARS.find((g) => g.rarity === "Rare")!;

const copy = (buildLevel: number, condition = 0.5): InventoryItem => ({
  id: "g1",
  guitarId: guitar.id,
  acquiredAt: 0,
  isNew: false,
  year: guitar.yearFrom,
  country: "USA",
  condition,
  buildLevel,
});

/** Each beat is scheduled after the last re-renders — see TeardownScene.test. */
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 100) {
    act(() => {
      vi.advanceTimersByTime(100);
    });
  }
};

const continueButton = () =>
  screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("BuildScene", () => {
  const build = (
    before: InventoryItem,
    result?: WorkshopBuildResult,
  ): Extract<ActiveScene, { type: "build" }> => ({
    id: 1,
    type: "build",
    subject: subjectOfItem("guitar", before)!,
    result,
  });

  const answer = (after: InventoryItem, gain: number): WorkshopBuildResult => ({
    buildLevel: after.buildLevel ?? 0,
    levelGain: gain,
    fameSpent: 0,
    spent: [],
    item: after,
    newParts: [],
    newFame: 0,
    rigLevel: 0,
  });

  it("works on the instrument until the server answers", () => {
    render(<BuildScene scene={build(copy(0))} onClose={vi.fn()} />);

    expect(
      screen.getByText(`The bench is working on your ${guitar.name}`),
    ).toBeTruthy();
    advance(5_000);
    expect(continueButton().disabled).toBe(true);
  });

  it("names the build it landed on", () => {
    render(
      <BuildScene
        scene={build(copy(0), answer(copy(1), 2))}
        onClose={vi.fn()}
      />,
    );
    advance(3_000);

    expect(continueButton().disabled).toBe(false);
    expect(screen.getByText("Build 1")).toBeTruthy();
  });

  it("calls a promotion by the rarity it reached", () => {
    render(
      <BuildScene
        scene={build(copy(2), answer(copy(3), 4))}
        onClose={vi.fn()}
      />,
    );
    advance(3_500);

    expect(screen.getByText("Promoted to Epic")).toBeTruthy();
  });
});

describe("RestoreScene", () => {
  const restore = (
    result?: WorkshopRepairResult,
  ): Extract<ActiveScene, { type: "restore" }> => ({
    id: 2,
    type: "restore",
    subject: subjectOfItem("guitar", copy(0, 0.5))!,
    conditionBefore: 0.5,
    result,
  });

  it("ends on the grade the instrument was restored to", () => {
    render(
      <RestoreScene
        scene={restore({
          grade: "Mint",
          condition: 0.75,
          levelGain: 2,
          spent: [],
          item: copy(0, 0.75),
          newParts: [],
          rigLevel: 0,
        })}
        onClose={vi.fn()}
      />,
    );
    advance(3_500);

    expect(continueButton().disabled).toBe(false);
    expect(screen.getByText("Restored to Mint")).toBeTruthy();
  });
});
