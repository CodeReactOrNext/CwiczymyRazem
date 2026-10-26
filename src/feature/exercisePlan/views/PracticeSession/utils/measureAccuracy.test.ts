import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { accuracyPerMeasure } from "./measureAccuracy";

/** How it used to be worked out: every note of the tab, every time. */
const walkingEveryNote = (measures: TablatureMeasure[], hitNotes: Record<string, unknown>, missedNotes: Record<string, unknown>) =>
  measures.map((measure, mIdx) => {
    let hit = 0;
    let total = 0;
    measure.beats.forEach((beat, bIdx) => beat.notes.forEach((_, nIdx) => {
      const key = `${mIdx}-${bIdx}-${nIdx}`;
      if (hitNotes[key]) { hit++; total++; } else if (missedNotes[key]) total++;
    }));
    return total > 0 ? hit / total : null;
  });

let seed = 3;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };

const tab: TablatureMeasure[] = Array.from({ length: 40 }, () => ({
  timeSignature: [4, 4],
  beats: Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => ({
    duration: 0.5,
    notes: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ string: 1, fret: 0 })),
  })),
})) as TablatureMeasure[];

describe("accuracyPerMeasure", () => {
  it("matches walking every note of the tab", () => {
    for (let run = 0; run < 50; run++) {
      const hitNotes: Record<string, unknown> = {};
      const missedNotes: Record<string, unknown> = {};
      tab.forEach((m, mIdx) => m.beats.forEach((b, bIdx) => b.notes.forEach((_, nIdx) => {
        const key = `${mIdx}-${bIdx}-${nIdx}`;
        const r = rnd();
        // Hit marks are a beat (0 included, which never counted) or true.
        if (r < 0.3) hitNotes[key] = rnd() < 0.1 ? 0 : 1 + rnd() * 100;
        else if (r < 0.5) missedNotes[key] = true;
        else if (r < 0.55) { hitNotes[key] = true; missedNotes[key] = true; }
      })));
      // Marks left over from another tab name no note of this one.
      hitNotes["99-0-0"] = true;
      missedNotes["3-40-0"] = true;
      expect(accuracyPerMeasure(tab, hitNotes, missedNotes)).toEqual(walkingEveryNote(tab, hitNotes, missedNotes));
    }
  });

  it("leaves measures nobody has reached yet unfilled", () => {
    expect(accuracyPerMeasure(tab.slice(0, 3), {}, {})).toEqual([null, null, null]);
  });
});
