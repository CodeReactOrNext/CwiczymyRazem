// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccentGrid } from "./AccentGrid";

const chips = (container: HTMLElement) => [...container.querySelectorAll("button")];

const columnsOf = (container: HTMLElement) =>
  (container.firstElementChild as HTMLElement).style.gridTemplateColumns;

describe("AccentGrid", () => {
  afterEach(cleanup);

  it("gives a single bar exactly as many columns as it has entries", () => {
    // Four chips across one row, filling the width — the way a plain 4/4 grid has
    // always looked.
    const { container } = render(<AccentGrid pattern={[2, 1, 1, 1]} />);

    expect(columnsOf(container)).toBe("repeat(4, minmax(0, 1fr))");
  });

  it("starts every bar of a meter change on a fresh row", () => {
    // 4/4 clicked in eighths, then 6/8: without this the second bar would begin
    // wherever the first row ran out, and the last entries would stretch to fill.
    const { container } = render(
      <AccentGrid
        pattern={[2, 0, 1, 0, 1, 0, 1, 0, 2, 1, 1, 1, 1, 1]}
        barLengths={[8, 6]}
      />,
    );

    const cells = chips(container);
    expect(columnsOf(container)).toBe("repeat(8, minmax(0, 1fr))");
    expect(cells[0].style.gridColumnStart).toBe("1");
    expect(cells[8].style.gridColumnStart).toBe("1");
    expect(cells[7].style.gridColumnStart).toBe("");
  });

  it("caps the row width so a long bar wraps instead of overflowing", () => {
    const { container } = render(
      <AccentGrid pattern={Array(20).fill(1)} barLengths={[12, 8]} />,
    );

    expect(columnsOf(container)).toBe("repeat(8, minmax(0, 1fr))");
  });

  it("cycles the entry a player clicks, and refuses every click once locked", () => {
    const onCycle = vi.fn();
    const { rerender } = render(<AccentGrid pattern={[2, 1, 1]} onCycle={onCycle} />);

    screen.getAllByRole("button")[1].click();
    expect(onCycle).toHaveBeenCalledWith(1);

    onCycle.mockClear();
    rerender(<AccentGrid pattern={[2, 1, 1]} onCycle={onCycle} locked />);
    screen.getAllByRole("button")[1].click();
    expect(onCycle).not.toHaveBeenCalled();
  });
});
