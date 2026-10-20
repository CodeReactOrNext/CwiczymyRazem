import { describe, expect, it } from "vitest";

import { noteFit } from "./fit";
import { harmonize, parseChordSymbol, unitLengths } from "./harmonize";
import { detectKey } from "./keyDetection";
import { extractTabContent } from "./noteEvents";
import {
  A_MINOR_PENTATONIC_BOX,
  bar,
  chordBar,
  sixteenths,
} from "./testing/tabBuilders";
import { chordSymbol } from "./theory";

function plan(...measures: Parameters<typeof extractTabContent>[0]) {
  const content = extractTabContent(measures);
  const analysis = detectKey(content);
  return harmonize({
    content,
    analysis,
    barMap: content.bars.map((b) => b.index),
  });
}

const symbols = (result: ReturnType<typeof harmonize>) =>
  result.spans.map((span) => chordSymbol(span.chord));

describe("noteFit", () => {
  const cMajorKey = new Set([0, 2, 4, 5, 7, 9, 11]);
  it("hears chord tones as home", () => {
    expect(noteFit(4, { root: 0, quality: "maj" }, cMajorKey, "ionian")).toBe(
      1,
    );
  });
  it("hears a semitone above a chord tone as a clash", () => {
    // C over G major rubs against its B.
    expect(
      noteFit(0, { root: 7, quality: "maj" }, cMajorKey, "ionian"),
    ).toBeLessThan(0);
  });
  it("lets the blue note pass over a dominant chord in the blues", () => {
    expect(
      noteFit(
        3,
        { root: 0, quality: "7" },
        new Set([0, 3, 5, 6, 7, 10]),
        "blues",
      ),
    ).toBeGreaterThan(0);
  });
});

describe("harmonize", () => {
  it("follows chords the notes spell out", () => {
    // Am | F | C | G, each struck as a chord shape.
    const result = plan(
      chordBar([
        [5, 0],
        [4, 2],
        [3, 2],
        [2, 1],
      ]),
      chordBar([
        [4, 3],
        [3, 2],
        [2, 1],
        [1, 1],
      ]),
      chordBar([
        [5, 3],
        [4, 2],
        [3, 0],
        [2, 1],
      ]),
      chordBar([
        [6, 3],
        [5, 2],
        [4, 0],
        [3, 0],
      ]),
    );
    expect(result.source).toBe("melody");
    expect(symbols(result)).toEqual(["Am", "F", "C", "G"]);
  });

  it("takes chord names written in the tab as given", () => {
    const result = plan(
      chordBar(
        [
          [3, 2],
          [2, 2],
          [1, 0],
        ],
        4,
        "A/C#",
      ),
      chordBar(
        [
          [3, 2],
          [2, 3],
          [1, 2],
        ],
        4,
        "D",
      ),
    );
    expect(result.source).toBe("tab");
    expect(symbols(result)).toEqual(["A", "D"]);
  });

  it("starts a scale run's backing on the tonic and never puts an avoid note under it", () => {
    const run = bar(sixteenths(A_MINOR_PENTATONIC_BOX));
    const result = plan(run, run, run, run);
    expect(result.kind).toBe("tonal");
    expect(symbols(result)[0]).toBe("Am");
    // bVII (G) would put the run's many Cs a semitone above its B.
    expect(symbols(result)).not.toContain("G");
  });

  it("plays nothing harmonic under a chromatic drill", () => {
    const result = plan(
      bar(
        sixteenths([
          [6, 1],
          [6, 2],
          [6, 3],
          [6, 4],
          [5, 1],
          [5, 2],
          [5, 3],
          [5, 4],
          [4, 1],
          [4, 2],
          [4, 3],
          [4, 4],
          [3, 1],
          [3, 2],
          [3, 3],
          [3, 4],
        ]),
      ),
    );
    expect(result.kind).toBe("rhythm");
    expect(result.spans).toEqual([]);
  });
});

describe("parseChordSymbol", () => {
  it.each([
    ["A/C#", { root: 9, quality: "maj" }],
    ["Gm", { root: 7, quality: "min" }],
    ["E5", { root: 4, quality: "5" }],
    ["Cmaj7", { root: 0, quality: "maj7" }],
    ["Bbm7", { root: 10, quality: "min7" }],
    ["F#dim", { root: 6, quality: "dim" }],
  ] as const)("%s", (symbol, chord) => {
    expect(parseChordSymbol(symbol)).toEqual(chord);
  });
});

describe("unitLengths", () => {
  const at = (timeSignature: [number, number], length: number) =>
    unitLengths({ index: 0, start: 0, length, timeSignature, accents: [] });
  it("splits 4/4 in halves and leaves odd meters whole", () => {
    expect(at([4, 4], 4)).toEqual([2, 2]);
    expect(at([7, 8], 3.5)).toEqual([3.5]);
    expect(at([12, 8], 6)).toEqual([3, 3]);
    expect(at([8, 4], 8)).toEqual([2, 2, 2, 2]);
  });
});
