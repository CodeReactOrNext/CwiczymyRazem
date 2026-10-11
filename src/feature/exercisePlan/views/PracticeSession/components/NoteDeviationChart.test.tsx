// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { RunNote } from "../utils/timingGrade";
import { chartValues, NoteDeviationChart } from "./NoteDeviationChart";

afterEach(cleanup);

const notes: RunNote[] = [
  { hit: true, timingMs: -40, cents: 12 },
  { hit: false, timingMs: null, cents: null },
  { hit: true, timingMs: 130, cents: null },
  { hit: true, timingMs: null, cents: -35 },
];

describe("chartValues", () => {
  it("takes only the notes that were measured on what the chart shows", () => {
    expect(chartValues(notes, "intonation")).toEqual([12, -35]);
    expect(chartValues(notes, "timing")).toEqual([-40, 130]);
  });
});

describe("NoteDeviationChart", () => {
  it("labels an intonation run with its direction and note count", () => {
    render(<NoteDeviationChart variant='intonation' notes={notes} />);
    expect(screen.getByText("Intonation, note by note")).toBeTruthy();
    expect(screen.getByText("2 notes")).toBeTruthy();
    expect(screen.getByText("sharp")).toBeTruthy();
    expect(screen.getByText("flat")).toBeTruthy();
  });

  it("labels a timing run with early and late", () => {
    render(<NoteDeviationChart variant='timing' notes={notes} />);
    expect(screen.getByText("Timing, note by note")).toBeTruthy();
    expect(screen.getByText("late")).toBeTruthy();
    expect(screen.getByText("early")).toBeTruthy();
  });
});
