// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EFFECT_DEFINITIONS } from "../../data/effectDefinitions";
import { DROPPABLE_GUITARS } from "../../data/guitarDefinitions";
import type { MergeOffer } from "../../types/arsenal.types";
import { MergeAnimation } from "./MergeAnimation";

let reduceMotion = false;

vi.mock("framer-motion", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("framer-motion")),
  useReducedMotion: () => reduceMotion,
}));

const guitar = DROPPABLE_GUITARS.find((g) => g.rarity === "Epic")!;
const effect = EFFECT_DEFINITIONS[0];
const offer: MergeOffer = {
  targetId: "keep",
  gain: 2,
  levelBefore: 20,
  levelAfter: 22,
};

beforeEach(() => {
  reduceMotion = false;
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MergeAnimation", () => {
  it("says what happened for anyone not watching the scene", () => {
    render(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      `${guitar.name} merged. Item Level 20 to 22.`,
    );
  });

  it("shows the gain the server granted", () => {
    render(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("works for a pedal as well as a guitar", () => {
    render(
      <MergeAnimation
        kind='effect'
        def={effect}
        offer={offer}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByText("+2")).toBeTruthy();
    expect(document.querySelector("img")?.getAttribute("src")).toContain(
      `/effects/${effect.imageId}`,
    );
  });

  it("finishes by itself once the scene has played out", () => {
    const onDone = vi.fn();
    render(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={onDone}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("finishes when the player continues, and only once", () => {
    const onDone = vi.fn();
    render(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={onDone}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onDone).toHaveBeenCalledTimes(1);

    // The timer running out afterwards must not call it a second time.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("is not restarted by a parent that re-renders with a new callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={first}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    rerender(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={second}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Timer kept its place, and the newest callback is the one that ran.
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("skips the movement for a player who asked for less of it", () => {
    reduceMotion = true;
    const onDone = vi.fn();
    render(
      <MergeAnimation
        kind='guitar'
        def={guitar}
        offer={offer}
        onDone={onDone}
      />,
    );

    // The final level is simply there, and the scene is over sooner.
    expect(screen.getByText("22")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
