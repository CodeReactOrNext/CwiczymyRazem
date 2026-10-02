// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TimingBreakdown } from "./TimingBreakdown";

afterEach(cleanup);

describe("TimingBreakdown", () => {
  it("shows how the hits split across the grades", () => {
    render(<TimingBreakdown timing={{ 3: 45, 2: 10, 1: 5 }} />);

    expect(screen.getByText("75% on time")).toBeTruthy();
    expect(screen.getByText("45")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("explains the lower score only when something was off the beat", () => {
    const { rerender } = render(<TimingBreakdown timing={{ 3: 12, 2: 0, 1: 0 }} />);
    expect(screen.queryByText(/still counts, but for less/)).toBeNull();

    rerender(<TimingBreakdown timing={{ 3: 12, 2: 1, 1: 0 }} />);
    expect(screen.getByText(/still counts, but for less/)).toBeTruthy();
  });

  it("renders nothing for a run without a single hit", () => {
    const { container } = render(<TimingBreakdown timing={{ 3: 0, 2: 0, 1: 0 }} />);
    expect(container.innerHTML).toBe("");
  });
});
