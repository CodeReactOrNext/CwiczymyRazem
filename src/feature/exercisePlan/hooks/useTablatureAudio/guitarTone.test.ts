import { describe, expect, it } from "vitest";

import { ampCurveValue, articulationFor, brightnessCutoffHz, strumDelays, voiceVariation } from "./guitarTone";

const chord = (...strings: number[]) => strings.map((string) => ({ string, fret: 0 }));

describe("strumDelays", () => {
  it("leaves a single note on the beat", () => {
    expect(strumDelays(chord(3))).toEqual([0]);
    expect(strumDelays([])).toEqual([]);
  });

  it("crosses a chord from the low string up on a downstroke", () => {
    const delays = strumDelays(chord(1, 2, 3, 4, 5, 6));
    expect(delays[5]).toBe(0);
    for (let i = 0; i < 5; i++) expect(delays[i]).toBeGreaterThan(delays[i + 1]);
  });

  it("crosses it from the high string down on an upstroke", () => {
    const delays = strumDelays(chord(6, 3, 1), "up");
    expect(delays[2]).toBe(0);
    expect(delays[0]).toBeGreaterThan(delays[1]);
  });

  it("keeps the whole strum within a few milliseconds of the beat", () => {
    for (const strings of [[1, 2], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6, 7]]) {
      expect(Math.max(...strumDelays(chord(...strings)))).toBeLessThanOrEqual(0.024 + 1e-9);
    }
  });
});

describe("brightnessCutoffHz", () => {
  it("leaves a normal or accented note as sampled", () => {
    expect(brightnessCutoffHz(1)).toBeNull();
    expect(brightnessCutoffHz(1.25)).toBeNull();
  });

  it("darkens a note more the softer it is", () => {
    const soft = brightnessCutoffHz(0.6)!;
    const ghost = brightnessCutoffHz(0.28)!;
    expect(ghost).toBeLessThan(soft);
    expect(ghost).toBeGreaterThan(1400);
    expect(soft).toBeLessThan(8000);
  });
});

describe("voiceVariation", () => {
  it("stays within a few percent of level and a few cents of pitch", () => {
    for (const r of [0, 0.5, 1]) {
      const v = voiceVariation(() => r);
      expect(Math.abs(v.gain - 1)).toBeLessThanOrEqual(0.07 + 1e-9);
      expect(Math.abs(v.detuneCents)).toBeLessThanOrEqual(3);
    }
    expect(voiceVariation(() => 0.5)).toEqual({ gain: 1, detuneCents: 0 });
  });
});

describe("articulationFor", () => {
  it("leaves a picked note alone", () => {
    expect(articulationFor({}, 60, 1)).toBeNull();
    expect(articulationFor({}, 60, 1, { midi: 57, time: 0.5 })).toBeNull();
  });

  it("takes the pick out of a hammer-on, pull-off or tap", () => {
    for (const note of [{ isHammerOn: true }, { isPullOff: true }, { isTap: true }]) {
      const a = articulationFor(note, 60, 1)!;
      expect(a.attackSec).toBeGreaterThan(0.01);
      expect(a.gain).toBeLessThan(1);
      expect(a.glideFromCents).toBe(0);
    }
  });

  it("slides up from the note before it on the string", () => {
    const shift = articulationFor({}, 62, 1, { midi: 60, time: 0.5, slideOut: 1 })!;
    expect(shift.glideFromCents).toBe(-200);
    expect(shift.attackSec).toBeUndefined();
    const legato = articulationFor({}, 57, 1, { midi: 60, time: 0.5, slideOut: 2 })!;
    expect(legato.glideFromCents).toBe(300);
    expect(legato.attackSec).toBeGreaterThan(0.01);
  });

  it("ignores a slide whose starting note is long gone or the same pitch", () => {
    expect(articulationFor({}, 62, 9, { midi: 60, time: 0.5, slideOut: 1 })).toBeNull();
    expect(articulationFor({}, 60, 1, { midi: 60, time: 0.5, slideOut: 1 })).toBeNull();
  });

  it("slides into a note marked so, from below or above", () => {
    expect(articulationFor({ slideIn: 1 }, 60, 1)!.glideFromCents).toBeLessThan(0);
    expect(articulationFor({ slideIn: 2 }, 60, 1)!.glideFromCents).toBeGreaterThan(0);
  });
});

describe("ampCurveValue", () => {
  it("leaves a single note's level almost alone", () => {
    // One sampled note reaches the stage at about 0.17.
    expect(ampCurveValue(0.17) / 0.17).toBeGreaterThan(0.93);
    expect(ampCurveValue(-0.17)).toBeCloseTo(-ampCurveValue(0.17), 10);
  });

  it("rounds a chord off under a ceiling instead of clipping it", () => {
    expect(ampCurveValue(1)).toBeLessThan(0.4);
    expect(ampCurveValue(1)).toBeGreaterThan(ampCurveValue(0.6));
  });
});
