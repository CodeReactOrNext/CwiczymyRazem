import { NOTES } from "utils/audio/noteUtils";
import { describe, expect, it } from "vitest";

import { INTERVALS, noteAtInterval } from "./intervalDefinitions";
import { intervalWindows, pickIntervalWindow, WHOLE_NECK_WINDOW, windowFitsInterval } from "./intervalWindows";

describe("interval windows", () => {
  it("finds a narrow window for every root and interval on the full neck", () => {
    for (const root of NOTES) {
      for (const interval of INTERVALS) {
        const target = noteAtInterval(root, interval.semitones);
        expect(intervalWindows(root, target, 4).length, `${root} ${interval.name}`).toBeGreaterThan(1);
      }
    }
  });

  it("only hands out windows that hold both notes within reach of each other", () => {
    for (let i = 0; i < 200; i++) {
      const root = NOTES[i % 12];
      const target = noteAtInterval(root, INTERVALS[i % INTERVALS.length].semitones);
      const window = pickIntervalWindow(root, target, 4, [3, 2]);
      if (window === WHOLE_NECK_WINDOW) continue;
      expect(window.endFret - window.startFret).toBe(3);
      expect(window.endFret).toBeLessThanOrEqual(12);
      expect(windowFitsInterval(window, root, target, [3, 2])).toBe(true);
    }
  });

  it("moves to a different window from one round to the next", () => {
    let previous = pickIntervalWindow("C", "G", 4);
    for (let i = 0; i < 50; i++) {
      const next = pickIntervalWindow("C", "G", 4, undefined, previous);
      expect(next.startFret).not.toBe(previous.startFret);
      previous = next;
    }
  });

  it("falls back to the whole neck when nothing narrow fits", () => {
    expect(pickIntervalWindow("C", "C#", 1, [6])).toEqual(WHOLE_NECK_WINDOW);
  });
});
