// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "assets/components/ui/tooltip";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionTransport } from "./SessionTransport";

const timer = { time: 0, formattedTimeLeft: "7:00", isFinished: false };
vi.mock("../contexts/TimerContext", () => ({ useTimerContext: () => timer }));

afterEach(() => {
  cleanup();
  Object.assign(timer, { time: 0, formattedTimeLeft: "7:00", isFinished: false });
});

const renderTransport = (props: Partial<ComponentProps<typeof SessionTransport>> = {}) => {
  const handlers = { onToggle: vi.fn(), onRestart: vi.fn() };
  render(
    <TooltipProvider>
      <SessionTransport isPlaying={false} {...handlers} {...props} />
    </TooltipProvider>,
  );
  return handlers;
};

describe("SessionTransport", () => {
  it("carries the exercise's clock on Start", () => {
    const { onToggle } = renderTransport();
    const start = screen.getByRole("button", { name: "Start" });
    expect(start.textContent).toContain("7:00");
    fireEvent.click(start);
    expect(onToggle).toHaveBeenCalledTimes(1);
    // Nothing to restart yet.
    expect(screen.queryByRole("button", { name: "Restart Exercise" })).toBeNull();
  });

  it("reads Pause while it runs and Resume once stopped midway", () => {
    Object.assign(timer, { time: 5000 });
    renderTransport({ isPlaying: true });
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    cleanup();
    renderTransport();
    expect(screen.getByRole("button", { name: "Resume" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restart Exercise" })).toBeTruthy();
  });

  it("steps aside for Again when the clock is down", () => {
    Object.assign(timer, { time: 420_000, formattedTimeLeft: "0:00", isFinished: true });
    const { onRestart } = renderTransport();
    expect(screen.queryByRole("button", { name: /start|pause|resume/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Again" }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("leaves only the clock while the gate offers Start", () => {
    renderTransport({ clockOnly: true });
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("7:00")).toBeTruthy();
  });
});
