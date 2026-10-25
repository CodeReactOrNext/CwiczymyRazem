// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DROPPABLE_GUITARS } from "../../data/guitarDefinitions";
import type { ScrapResult } from "../../types/arsenal.types";
import type { ActiveScene } from "./sceneStore";
import { subjectOfDef } from "./sceneSubject";
import { TeardownScene } from "./TeardownScene";

vi.mock("framer-motion", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("framer-motion")),
  useReducedMotion: () => false,
}));

const guitar = DROPPABLE_GUITARS.find((g) => g.rarity === "Epic")!;
const subject = subjectOfDef("guitar", guitar);

const scene = (
  result?: ScrapResult,
): Extract<ActiveScene, { type: "teardown" }> => ({
  id: 1,
  type: "teardown",
  subjects: [subject],
  count: 1,
  result,
});

const result: ScrapResult = {
  parts: [
    { partId: "screws", tier: "Standard", qty: 3 },
    { partId: "pot", tier: "Epic", qty: 1 },
  ],
  newParts: [],
  salvaged: null,
};

/**
 * Time in small steps: each beat is scheduled by an effect after the previous
 * one re-renders, and one long jump inside a single act() never lets it.
 */
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

describe("TeardownScene", () => {
  it("winds up while the request is out, with nothing to continue to", () => {
    render(<TeardownScene scene={scene()} onClose={vi.fn()} />);

    expect(screen.getByText(`Taking the ${guitar.name} apart`)).toBeTruthy();
    expect(continueButton().disabled).toBe(true);

    // However long the server takes, it does not pretend to have finished.
    advance(10_000);
    expect(continueButton().disabled).toBe(true);
  });

  it("pays off once the answer is in, and says what came out", () => {
    const { rerender } = render(
      <TeardownScene scene={scene()} onClose={vi.fn()} />,
    );
    rerender(<TeardownScene scene={scene(result)} onClose={vi.fn()} />);

    advance(4_000);

    expect(continueButton().disabled).toBe(false);
    expect(screen.getByRole("status").textContent).toContain(
      "Scrapped for 4 parts!",
    );
  });

  it("names a mod that came out whole", () => {
    render(
      <TeardownScene
        scene={scene({
          ...result,
          salvaged: {
            id: "m1",
            featureId: "hand-wound",
            kind: "guitar",
            points: 4,
            sourceName: guitar.name,
            salvagedAt: 0,
          },
        })}
        onClose={vi.fn()}
      />,
    );

    advance(1_000);

    expect(screen.getByText(/\+4 pulled out and stashed/)).toBeTruthy();
  });

  it("closes itself once it has played out", () => {
    const onClose = vi.fn();
    render(<TeardownScene scene={scene(result)} onClose={onClose} />);

    advance(3_000);
    expect(onClose).not.toHaveBeenCalled();

    advance(4_000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
