import { describe, expect, it } from "vitest";

import { cycleGridFor, deriveMetronomeGrid, gridForTimeSignature } from "./meterGrid";

const bars = (...meters: [number, number][]) => meters.map((timeSignature) => ({ timeSignature }));

describe("gridForTimeSignature", () => {
  it("clicks x/4 in quarter notes, accenting beat one", () => {
    expect(gridForTimeSignature([4, 4])).toEqual({
      unit: 4,
      pattern: [2, 1, 1, 1],
      barLengths: [4],
      label: "4/4",
    });
    expect(gridForTimeSignature([3, 4])?.pattern).toEqual([2, 1, 1]);
    expect(gridForTimeSignature([2, 4])?.pattern).toEqual([2, 1]);
    expect(gridForTimeSignature([5, 4])?.pattern).toEqual([2, 1, 1, 1, 1]);
    // A long bar is still one bar: nothing but its own downbeat is accented.
    expect(gridForTimeSignature([8, 4])?.pattern).toEqual([2, 1, 1, 1, 1, 1, 1, 1]);
  });

  it("clicks x/8 in eighth notes, accenting beat one", () => {
    expect(gridForTimeSignature([6, 8])).toEqual({
      unit: 8,
      pattern: [2, 1, 1, 1, 1, 1],
      barLengths: [6],
      label: "6/8",
    });
    expect(gridForTimeSignature([7, 8])?.pattern).toEqual([2, 1, 1, 1, 1, 1, 1]);
    expect(gridForTimeSignature([12, 8])?.pattern).toEqual([
      2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ]);
  });

  it("clicks x/2 in half notes, resting the quarters in between", () => {
    // Cut time is two beats over four quarters, so the grid is four entries long
    // and only every other one sounds.
    expect(gridForTimeSignature([2, 2])?.pattern).toEqual([2, 0, 1, 0]);
  });

  it("declines meters the grid cannot state", () => {
    // Two and a half eighths: no entry of either grid lands on the bar line.
    expect(gridForTimeSignature([5, 16])).toBeNull();
    expect(gridForTimeSignature([4, 3])).toBeNull();
    expect(gridForTimeSignature(undefined)).toBeNull();
  });
});

describe("cycleGridFor", () => {
  it("keeps each bar in its own note value across a meter change", () => {
    // Four quarters, then six eighths. The 4/4 bar sits on the shared eighth grid
    // but its off-eighths are silent, so it still sounds in quarters.
    expect(cycleGridFor([[4, 4], [6, 8]])).toEqual({
      unit: 8,
      pattern: [2, 0, 1, 0, 1, 0, 1, 0, 2, 1, 1, 1, 1, 1],
      barLengths: [8, 6],
      label: "4/4 ↔ 6/8",
    });
  });

  it("accents only the first beat of each bar", () => {
    const grid = cycleGridFor([[3, 4], [5, 8]]);

    expect(grid?.pattern).toEqual([2, 0, 1, 0, 1, 0, 2, 1, 1, 1, 1]);
    expect(grid?.pattern.filter((level) => level === 2)).toHaveLength(2);
  });

  it("stays on quarters when no bar of the cycle is written in eighths", () => {
    expect(cycleGridFor([[5, 4], [7, 4]])).toEqual({
      unit: 4,
      pattern: [2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
      barLengths: [5, 7],
      label: "5/4 ↔ 7/4",
    });
  });

  it("holds a pair too long for the hand-built grid's own limit", () => {
    // Twenty entries — past MAX_BEATS_PER_BAR, which caps only the +/- control.
    const grid = cycleGridFor([[12, 8], [4, 4]]);

    expect(grid?.pattern).toHaveLength(20);
    expect(grid?.barLengths).toEqual([12, 8]);
  });

  it("declines a run it cannot place or hold", () => {
    expect(cycleGridFor([[3, 4], [5, 16]])).toBeNull();
    expect(cycleGridFor(Array.from({ length: 9 }, () => [4, 4] as [number, number]))).toBeNull();
    expect(cycleGridFor([])).toBeNull();
  });
});

describe("deriveMetronomeGrid", () => {
  it("takes the meter the tab is actually in", () => {
    expect(deriveMetronomeGrid(bars([3, 4], [3, 4], [3, 4]))).toEqual({
      unit: 4,
      pattern: [2, 1, 1],
      barLengths: [3],
      label: "3/4",
    });
  });

  it("follows a tab that alternates two meters through both of them", () => {
    const grid = deriveMetronomeGrid(bars([4, 4], [6, 8], [4, 4], [6, 8]));

    expect(grid?.label).toBe("4/4 ↔ 6/8");
    expect(grid?.barLengths).toEqual([8, 6]);
    expect(grid?.pattern).toEqual([2, 0, 1, 0, 1, 0, 1, 0, 2, 1, 1, 1, 1, 1]);
  });

  it("covers a short tab whose meter changes without repeating", () => {
    // Nothing shorter than the whole tab repeats, so the whole tab becomes the
    // pattern — which is the one length that can never fall out of phase.
    const grid = deriveMetronomeGrid(bars([4, 4], [4, 4], [4, 4], [2, 4]));

    expect(grid?.label).toBe("4/4 ↔ 2/4");
    expect(grid?.barLengths).toEqual([4, 4, 4, 2]);
  });

  it("falls back to the most common meter when the cycle is too long to hold", () => {
    const long = bars(...Array.from({ length: 9 }, () => [4, 4] as [number, number]), [2, 4]);
    const grid = deriveMetronomeGrid(long);

    expect(grid?.label).toBe("4/4");
    expect(grid?.barLengths).toEqual([4]);
  });

  it("falls back rather than trusting a sequence with a bar that declares no meter", () => {
    // A gap makes the run unreadable — bar 3 might repeat bar 1 or might not.
    expect(deriveMetronomeGrid([...bars([3, 4]), {}, ...bars([3, 4])])?.label).toBe("3/4");
  });

  it("asks for no grid when there is no tab to read one from", () => {
    expect(deriveMetronomeGrid(undefined)).toBeNull();
    expect(deriveMetronomeGrid([])).toBeNull();
    expect(deriveMetronomeGrid([{}])).toBeNull();
  });
});
