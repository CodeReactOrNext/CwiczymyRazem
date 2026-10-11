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

  it("says which way the run leaned, past the detector's own noise", () => {
    const base = { medianOffsetMs: 120, measuredNotes: 20 };
    const { rerender } = render(<TimingBreakdown timing={{ 3: 5, 2: 3, 1: 12 }} precision={{ ...base, biasMs: -118 }} />);
    expect(screen.getByText(/Mostly early — about 118 ms ahead/)).toBeTruthy();

    rerender(<TimingBreakdown timing={{ 3: 5, 2: 3, 1: 12 }} precision={{ ...base, biasMs: 64 }} />);
    expect(screen.getByText(/Mostly late — about 64 ms behind/)).toBeTruthy();

    rerender(<TimingBreakdown timing={{ 3: 5, 2: 3, 1: 12 }} precision={{ ...base, biasMs: 6 }} />);
    expect(screen.queryByText(/Mostly/)).toBeNull();
  });

  it("reads the counts as intonation for pitch-scored runs", () => {
    render(<TimingBreakdown timing={{ 3: 6, 2: 2, 1: 0 }} variant='intonation' />);
    expect(screen.getByText("Intonation")).toBeTruthy();
    expect(screen.getByText("75% in tune")).toBeTruthy();
    expect(screen.getByText("In tune")).toBeTruthy();
    expect(screen.getByText(/within 40 cents/)).toBeTruthy();
  });

  it("says which way the notes tend to miss", () => {
    const { rerender } = render(<TimingBreakdown timing={{ 3: 4, 2: 4, 1: 2 }} variant='intonation' biasCents={-18} />);
    expect(screen.getByText(/Mostly flat — your notes land about 18 cents under/)).toBeTruthy();

    rerender(<TimingBreakdown timing={{ 3: 4, 2: 4, 1: 2 }} variant='intonation' biasCents={12} />);
    expect(screen.getByText(/Mostly sharp — your notes land about 12 cents over/)).toBeTruthy();

    rerender(<TimingBreakdown timing={{ 3: 4, 2: 4, 1: 2 }} variant='intonation' biasCents={3} />);
    expect(screen.queryByText(/Mostly/)).toBeNull();
  });

  it("renders nothing for a run without a single hit", () => {
    const { container } = render(<TimingBreakdown timing={{ 3: 0, 2: 0, 1: 0 }} />);
    expect(container.innerHTML).toBe("");
  });
});
