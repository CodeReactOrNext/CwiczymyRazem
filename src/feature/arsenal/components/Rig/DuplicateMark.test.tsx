// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { BoardCopy } from "../../data/boardDuplicates";
import { duplicateGlow,DuplicateMark } from "./DuplicateMark";

/**
 * What the mark has to get right is which pedal it accuses. A lone pedal wears
 * nothing, the best of several wears the count, and only the copies that
 * actually lose levels wear a share — so the board reads as "keep this one,
 * swap those" without a legend.
 */
const copyOf = (partial: Partial<BoardCopy> = {}): BoardCopy => ({
  itemId: "a",
  model: 14,
  total: 3,
  name: "Astral Reverberator",
  level: 40,
  index: 0,
  share: 1,
  counted: 40,
  ...partial,
});

afterEach(cleanup);

describe("DuplicateMark", () => {
  it("says nothing at all about a pedal that stands alone", () => {
    const { container } = render(
      <DuplicateMark copy={copyOf({ total: 1 })} name='Astral Reverberator' />,
    );

    expect(container.textContent).toBe("");
  });

  it("wears the group's count on the copy that keeps its levels", () => {
    const { container } = render(
      <DuplicateMark copy={copyOf()} name='Astral Reverberator' />,
    );

    expect(container.textContent).toContain("×3");
    // …and says so in words, rather than leaving the count to be guessed at.
    const label = container.querySelector("span")?.getAttribute("aria-label");
    expect(label).toContain("3 copies of Astral Reverberator");
    expect(label).toContain("counts in full");
  });

  it("wears what it is counted at on every copy after the first", () => {
    const second = render(
      <DuplicateMark
        copy={copyOf({ itemId: "b", index: 1, share: 0.5, counted: 20 })}
        name='Astral Reverberator'
      />,
    );
    expect(second.container.textContent).toContain("½");
    cleanup();

    const third = render(
      <DuplicateMark
        copy={copyOf({ itemId: "c", index: 2, share: 0, counted: 0 })}
        name='Astral Reverberator'
      />,
    );
    expect(third.container.textContent).toContain("0");
  });
});

describe("duplicateGlow", () => {
  it("lights the copies that are losing levels, and leaves the keeper dark", () => {
    expect(duplicateGlow(copyOf({ index: 1, share: 0.5 }), false)).toContain(
      "drop-shadow",
    );
    expect(duplicateGlow(copyOf(), false)).toBeNull();
  });

  it("lights the whole set once the pointer is on any copy of it", () => {
    expect(duplicateGlow(copyOf(), true)).toContain("drop-shadow");
  });

  it("never lights a pedal that has no twin, or none at all", () => {
    expect(duplicateGlow(copyOf({ total: 1 }), true)).toBeNull();
    expect(duplicateGlow(undefined, true)).toBeNull();
  });
});
