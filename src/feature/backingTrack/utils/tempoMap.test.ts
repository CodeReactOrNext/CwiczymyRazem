import { describe, expect, it } from "vitest";

import {
  bpmBetween,
  createRecordingTempoMap,
  MAX_TEMPO_BPM,
  MIN_TEMPO_BPM,
  type TempoAnchor,
  withAnchorAt,
} from "./tempoMap";

/** 120 BPM = 2 beats a second, so a beat is a tidy 0.5s. */
const at120 = { offsetMs: 0, sourceBpm: 120 };

describe("bpmBetween", () => {
  it("reads the tempo two anchors imply", () => {
    expect(bpmBetween({ beat: 0, sec: 0 }, { beat: 4, sec: 2 })).toBeCloseTo(120);
    expect(bpmBetween({ beat: 0, sec: 0 }, { beat: 4, sec: 4 })).toBeCloseTo(60);
  });

  it("refuses a span that goes nowhere or backwards", () => {
    expect(bpmBetween({ beat: 0, sec: 0 }, { beat: 4, sec: 0 })).toBeNaN();
    expect(bpmBetween({ beat: 4, sec: 2 }, { beat: 0, sec: 4 })).toBeNaN();
  });
});

describe("createRecordingTempoMap", () => {
  it("is a straight line when nothing is anchored", () => {
    const map = createRecordingTempoMap({ anchors: [], ...at120 });

    expect(map.isConstant).toBe(true);
    expect(map.secForBeat(4)).toBeCloseTo(2);
    expect(map.beatForSec(2)).toBeCloseTo(4);
    expect(map.bpmAtBeat(99)).toBe(120);
    expect(map.ratioAtBeat(99)).toBe(1);
  });

  it("keeps honouring the offset with no anchors", () => {
    const map = createRecordingTempoMap({ anchors: undefined, offsetMs: 1500, sourceBpm: 120 });

    // The old trackTimeForBeat did exactly this, and must keep doing it.
    expect(map.secForBeat(0)).toBeCloseTo(1.5);
    expect(map.secForBeat(4)).toBeCloseTo(3.5);
  });

  it("bends time between two anchors", () => {
    // Bars 1–3 (8 beats) take 5s rather than 4 — the band was dragging.
    const map = createRecordingTempoMap({ anchors: [{ beat: 8, sec: 5 }], ...at120 });

    expect(map.isConstant).toBe(false);
    expect(map.bpmAtBeat(0)).toBeCloseTo(96); // 8 beats / 5s
    expect(map.secForBeat(4)).toBeCloseTo(2.5); // halfway through the span
    expect(map.secForBeat(8)).toBeCloseTo(5);
  });

  it("lands every anchor exactly on the second it was pinned to", () => {
    const anchors: TempoAnchor[] = [
      { beat: 8, sec: 4.2 },
      { beat: 16, sec: 8.1 },
      { beat: 32, sec: 16.9 },
    ];
    const map = createRecordingTempoMap({ anchors, ...at120 });

    for (const anchor of anchors) {
      expect(map.secForBeat(anchor.beat)).toBeCloseTo(anchor.sec);
    }
  });

  it("round-trips beats and seconds", () => {
    const map = createRecordingTempoMap({
      anchors: [
        { beat: 8, sec: 4.2 },
        { beat: 16, sec: 8.1 },
      ],
      ...at120,
    });

    for (const beat of [0, 3, 8, 12, 16, 40]) {
      expect(map.beatForSec(map.secForBeat(beat))).toBeCloseTo(beat);
    }
  });

  it("carries the last measured tempo past the final anchor", () => {
    // The closing span runs at 60 BPM, so bar after bar keeps costing 1s a beat
    // rather than snapping back to the nominal 120.
    const map = createRecordingTempoMap({
      anchors: [
        { beat: 4, sec: 2 },
        { beat: 8, sec: 6 },
      ],
      ...at120,
    });

    expect(map.bpmAtBeat(20)).toBeCloseTo(60);
    expect(map.secForBeat(12)).toBeCloseTo(10);
  });

  it("reports the ratio the session clock has to bend by", () => {
    const map = createRecordingTempoMap({ anchors: [{ beat: 8, sec: 8 }], ...at120 });

    // 8 beats over 8s is 60 BPM against a nominal 120 — play it half speed.
    expect(map.ratioAtBeat(2)).toBeCloseTo(0.5);
  });

  it("ignores an anchor thrown behind its neighbour", () => {
    const map = createRecordingTempoMap({
      anchors: [
        { beat: 8, sec: 4 },
        { beat: 16, sec: 3 }, // earlier than bar 8 — impossible
      ],
      ...at120,
    });

    expect(map.points).toHaveLength(2); // beat 0 and beat 8 only
    expect(Number.isFinite(map.secForBeat(20))).toBe(true);
  });

  it("ignores an anchor at or before bar 1", () => {
    // Bar 1 is the offset; an anchor there would be two names for one thing.
    const map = createRecordingTempoMap({ anchors: [{ beat: 0, sec: 9 }], ...at120 });

    expect(map.isConstant).toBe(true);
    expect(map.secForBeat(0)).toBeCloseTo(0);
  });

  it("survives anchors handed over out of order", () => {
    const map = createRecordingTempoMap({
      anchors: [
        { beat: 16, sec: 8 },
        { beat: 8, sec: 4 },
      ],
      ...at120,
    });

    expect(map.points.map((p) => p.beat)).toEqual([0, 8, 16]);
  });

  it("clamps a tempo no recording could really have", () => {
    // Two anchors a hair apart would otherwise imply thousands of BPM.
    const map = createRecordingTempoMap({ anchors: [{ beat: 64, sec: 0.001 }], ...at120 });

    expect(map.bpmAtBeat(1)).toBeLessThanOrEqual(MAX_TEMPO_BPM);
    expect(map.bpmAtBeat(1)).toBeGreaterThanOrEqual(MIN_TEMPO_BPM);
  });

  it("falls back to a usable tempo when sourceBpm is nonsense", () => {
    const map = createRecordingTempoMap({ anchors: [], offsetMs: 0, sourceBpm: 0 });

    expect(Number.isFinite(map.secForBeat(4))).toBe(true);
  });
});

describe("withAnchorAt", () => {
  it("adds an anchor in beat order", () => {
    const next = withAnchorAt([{ beat: 16, sec: 8 }], 8, 4);
    expect(next).toEqual([
      { beat: 8, sec: 4 },
      { beat: 16, sec: 8 },
    ]);
  });

  it("moves an anchor already on that beat rather than doubling it", () => {
    const next = withAnchorAt([{ beat: 8, sec: 4 }], 8, 4.5);
    expect(next).toEqual([{ beat: 8, sec: 4.5 }]);
  });

  it("removes an anchor on null", () => {
    const next = withAnchorAt(
      [
        { beat: 8, sec: 4 },
        { beat: 16, sec: 8 },
      ],
      8,
      null,
    );
    expect(next).toEqual([{ beat: 16, sec: 8 }]);
  });

  it("leaves the input alone", () => {
    const anchors = [{ beat: 8, sec: 4 }];
    withAnchorAt(anchors, 8, 99);
    expect(anchors).toEqual([{ beat: 8, sec: 4 }]);
  });
});
