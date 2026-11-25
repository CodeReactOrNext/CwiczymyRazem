// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RunVerdict } from "../utils/runVerdict";
import { PlanInterlude } from "./PlanInterlude";
import { BarDrillStrip, RunVerdictStrip } from "./SessionVerdict";

vi.mock("components/Mascot/Kostek", () => ({ Kostek: ({ mood }: { mood: string }) => <i data-testid='kostek'>{mood}</i> }));

afterEach(cleanup);

const renderStrip = (verdict: RunVerdict, onDrill?: (measure: number) => void) => {
  const onAgain = vi.fn();
  const onContinue = vi.fn();
  render(
    <RunVerdictStrip
      verdict={verdict}
      minutes={2}
      nextTitle='Slow Melody'
      onAgain={onAgain}
      onDrill={onDrill}
      onContinue={onContinue}
    />,
  );
  return { onAgain, onContinue };
};

describe("RunVerdictStrip", () => {
  it("confirms the time and names what is next when nothing was judged", () => {
    renderStrip({ kind: "time" });
    expect(screen.getByText("2 min done")).toBeDefined();
    expect(screen.getByText("Next: Slow Melody")).toBeDefined();
  });

  it("answers a clean run with its numbers, focused on Continue", () => {
    const { onContinue } = renderStrip({ kind: "clean", accuracy: 98, streak: 45 });
    expect(screen.getByText("Clean run")).toBeDefined();
    expect(screen.getByText("98% hit, 45 in a row")).toBeDefined();
    const next = screen.getByRole("button", { name: "Continue" });
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("offers the weak bar of a rough run on its own", () => {
    const onDrill = vi.fn();
    renderStrip({ kind: "rough", accuracy: 70, streak: 9, weakMeasure: 2 }, onDrill);
    expect(screen.getByText("Bar 3 slipped")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Bar 3, slower" }));
    expect(onDrill).toHaveBeenCalledWith(2);
  });

  it("keeps the drill to itself where the session cannot run one", () => {
    const { onAgain } = renderStrip({ kind: "rough", accuracy: 70, streak: 9, weakMeasure: 2 });
    expect(screen.queryByRole("button", { name: "Bar 3, slower" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Again" }));
    expect(onAgain).toHaveBeenCalledOnce();
  });
});

describe("BarDrillStrip", () => {
  const strip = (passes: number) => (
    <BarDrillStrip bar={3} bpm={60} passes={passes} isPlaying={false} onToggle={() => {}} onLeave={() => {}} />
  );

  it("shows the clean passes so far", () => {
    render(strip(1));
    expect(screen.getByRole("img", { name: "1 of 3 clean passes" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Skip" })).toBeDefined();
  });

  it("ends on Continue once they are all in", () => {
    render(strip(3));
    expect(screen.getByText("Got it")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
  });
});

describe("PlanInterlude", () => {
  const interlude = (done: number, total: number, streak: number) => (
    <PlanInterlude done={done} total={total} streak={streak} turned={false} onContinue={() => {}} />
  );

  it("says halfway only at an exact half", () => {
    const { unmount } = render(interlude(2, 4, 0));
    expect(screen.getByText("Halfway there.")).toBeDefined();
    unmount();
    render(interlude(3, 5, 0));
    expect(screen.getByText("3 of 5 done.")).toBeDefined();
  });

  it("celebrates a streak to be proud of", () => {
    render(interlude(2, 4, 45));
    expect(screen.getByText("45 in a row.")).toBeDefined();
    expect(screen.getByTestId("kostek").textContent).toBe("celebrate");
  });
});
