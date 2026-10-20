import { describe, expect, it } from "vitest";

import { detectKey, keyFromText } from "./keyDetection";
import { extractTabContent } from "./noteEvents";
import {
  A_MINOR_PENTATONIC_BOX,
  bar,
  eighths,
  sixteenths,
  SPIDER,
} from "./testing/tabBuilders";

const analyse = (...measures: Parameters<typeof extractTabContent>[0]) =>
  detectKey(extractTabContent(measures));

describe("detectKey", () => {
  it("reads a pentatonic box as its minor key, not the relative major", () => {
    const analysis = analyse(bar(sixteenths(A_MINOR_PENTATONIC_BOX)));
    expect(analysis.kind).toBe("tonal");
    expect(analysis.key?.tonic).toBe(9);
    expect(analysis.key?.scale.id).toBe("minorPentatonic");
  });

  it("gives a chromatic spider drill no key at all — drums only", () => {
    const analysis = analyse(
      bar(sixteenths(SPIDER.slice(0, 16))),
      bar(sixteenths(SPIDER.slice(8, 24))),
    );
    expect(analysis.kind).toBe("rhythm");
    expect(analysis.key).toBeNull();
  });

  it("treats one repeated note as a drone on it", () => {
    const analysis = analyse(bar(eighths([[6, 0]])));
    expect(analysis.kind).toBe("drone");
    expect(analysis.key?.tonic).toBe(4);
  });

  it("knows the third is missing when the notes never play one", () => {
    // E, A, B, D: E minor-ish, but no G or G#.
    const analysis = analyse(
      bar(
        eighths([
          [6, 0],
          [5, 0],
          [5, 2],
          [4, 0],
        ]),
      ),
    );
    expect(analysis.key?.thirdKnown).toBe(false);
  });

  it("does not call a key modal on a stray colour note", () => {
    // A natural minor run with one quick F# (the dorian sixth) in two bars.
    const run: [number, number][] = [
      [5, 0],
      [5, 2],
      [5, 3],
      [4, 0],
      [4, 2],
      [4, 3],
      [3, 0],
      [3, 2],
    ];
    const stray = bar([...eighths(run).slice(0, 7), [4, 4, 0.5]]);
    const analysis = analyse(bar(eighths(run)), bar(eighths(run)), stray);
    expect(analysis.key?.scale.id).not.toBe("dorian");
  });

  it("believes a key the exercise names when the notes agree", () => {
    // C D E G A — A minor pentatonic or C major pentatonic, the text decides.
    const content = extractTabContent([
      bar(
        eighths([
          [3, 5],
          [3, 7],
          [2, 5],
          [2, 8],
          [1, 5],
        ]),
      ),
    ]);
    const named = detectKey(
      content,
      undefined,
      keyFromText("Pull-offs in C major pentatonic"),
    );
    expect(named.key?.tonic).toBe(0);
    expect(named.key?.scale.id).toBe("majorPentatonic");
  });

  it("ignores a named key the notes contradict", () => {
    const content = extractTabContent([
      bar(sixteenths(A_MINOR_PENTATONIC_BOX)),
    ]);
    const named = detectKey(
      content,
      undefined,
      keyFromText("Play it in F# major"),
    );
    expect(named.key?.tonic).toBe(9);
  });
});

describe("keyFromText", () => {
  it("finds a key named in a description", () => {
    const key = keyFromText(
      "Develop legato using A minor pentatonic pull-offs across the middle strings.",
    );
    expect(key?.tonic).toBe(9);
    expect(key?.scale.id).toBe("minorPentatonic");
  });

  it("reads flats and modes", () => {
    expect(keyFromText("A riff in Bb mixolydian")).toMatchObject({
      tonic: 10,
      scale: { id: "mixolydian" },
    });
  });

  it("does not mistake English for a key", () => {
    expect(
      keyFromText("This is a major step forward for your picking."),
    ).toBeNull();
  });
});
