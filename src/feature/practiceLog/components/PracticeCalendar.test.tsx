// @vitest-environment jsdom

import { fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { DayGroup } from "../types/practiceLog.types";
import { PracticeCalendar } from "./PracticeCalendar";

const MINUTE = 60 * 1000;

const dayGroup = (dateKey: string, minutes: number): DayGroup => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return {
    dateKey,
    date: new Date(year, month - 1, day, 12),
    totalTimeMs: minutes * MINUTE,
    totalPoints: 10,
    sessions: [],
  };
};

const days = [
  dayGroup("2026-08-04", 10),
  dayGroup("2026-08-05", 30),
  dayGroup("2026-08-11", 120),
];

/** Mirrors the view: the picked range lives in the parent, not the calendar. */
const Harness = ({ onChange }: { onChange?: (range: string) => void }) => {
  const [range, setRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  return (
    <PracticeCalendar
      days={days}
      from={range[0]}
      to={range[1]}
      onSelect={(from, to) => {
        setRange([from, to]);
        onChange?.(`${from}..${to}`);
      }}
    />
  );
};

const cell = (container: HTMLElement, dateKey: string) =>
  container.querySelector<HTMLElement>(`[data-day="${dateKey}"]`);

const dayButton = (container: HTMLElement, dateKey: string) =>
  container.querySelector<HTMLButtonElement>(`[data-day="${dateKey}"] button`)!;

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 16, 12));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("PracticeCalendar", () => {
  it("paints practice days with their heatmap intensity", () => {
    const { container } = render(<Harness />);

    expect(cell(container, "2026-08-04")?.className).toContain(
      "bg-cyan-500/15",
    );
    expect(cell(container, "2026-08-05")?.className).toContain(
      "bg-cyan-500/25",
    );
    expect(cell(container, "2026-08-11")?.className).toContain(
      "bg-cyan-500/60",
    );
    expect(cell(container, "2026-08-06")?.className).not.toContain("bg-cyan");
  });

  it("leaves the day number colour to the heatmap alone", () => {
    // Regression guard: a resting `text-*` on the cell would be emitted after
    // the heatmap colours in Tailwind's output and grey out every number.
    const { container } = render(<Harness />);

    expect(cell(container, "2026-08-04")?.className).toContain("text-cyan-100");
    expect(cell(container, "2026-08-11")?.className).toContain("text-white");
    expect(cell(container, "2026-08-06")?.className).not.toMatch(/\btext-\w/);
    // The muted resting colour is inherited, so it can never win over one
    // declared on the cell itself.
    expect(container.querySelector(".rdp-root")?.className).toContain(
      "text-zinc-600",
    );
  });

  it("selects a single day on the first click", () => {
    const onChange = vi.fn();
    const { container } = render(<Harness onChange={onChange} />);

    fireEvent.click(dayButton(container, "2026-08-05"));

    expect(onChange).toHaveBeenCalledWith("2026-08-05..2026-08-05");
  });

  it("extends the selection into a range on the second click", () => {
    const onChange = vi.fn();
    const { container } = render(<Harness onChange={onChange} />);

    fireEvent.click(dayButton(container, "2026-08-05"));
    fireEvent.click(dayButton(container, "2026-08-11"));

    expect(onChange).toHaveBeenLastCalledWith("2026-08-05..2026-08-11");
    // Endpoints ring solid, the days between keep their heatmap background.
    expect(cell(container, "2026-08-05")?.className).toContain("ring-cyan-300");
    expect(cell(container, "2026-08-08")?.className).toContain(
      "ring-cyan-300/40",
    );
  });

  it("keeps the heatmap visible under a selected range", () => {
    const { container } = render(<Harness />);

    fireEvent.click(dayButton(container, "2026-08-04"));
    fireEvent.click(dayButton(container, "2026-08-11"));

    expect(cell(container, "2026-08-05")?.className).toContain(
      "bg-cyan-500/25",
    );
  });

  it("does not let future days be picked", () => {
    const { container } = render(<Harness />);

    expect(dayButton(container, "2026-08-20").disabled).toBe(true);
    expect(dayButton(container, "2026-08-14").disabled).toBe(false);
  });
});
