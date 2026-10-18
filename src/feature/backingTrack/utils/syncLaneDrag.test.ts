import { describe, expect, it } from "vitest";

import { barLineNear, dragLimits, MIN_SPAN_SEC, placeDraggedLine } from "./syncLaneDrag";
import { createRecordingTempoMap } from "./tempoMap";

/** 120 BPM, 4/4: a bar every 2 s, bar 1 at 1 s into the recording. */
const evenMap = createRecordingTempoMap({ anchors: [], offsetMs: 1000, sourceBpm: 120 });
/** The same, with bar 3 (beat 8) pinned a little late. */
const pinnedMap = createRecordingTempoMap({
  anchors: [{ beat: 8, sec: 5.2 }],
  offsetMs: 1000,
  sourceBpm: 120,
});

/** 10 ms a pixel. */
const SPP = 0.01;

describe("barLineNear", () => {
  it("takes hold of a bar line a few pixels either side of it", () => {
    expect(barLineNear({ sec: 3.05, secondsPerPixel: SPP, tempoMap: evenMap, beatsPerBar: 4 })).toBe(4);
    expect(barLineNear({ sec: 0.96, secondsPerPixel: SPP, tempoMap: evenMap, beatsPerBar: 4 })).toBe(0);
  });

  it("leaves the space between bars to the view", () => {
    expect(barLineNear({ sec: 4, secondsPerPixel: SPP, tempoMap: evenMap, beatsPerBar: 4 })).toBeNull();
  });

  it("has nothing to grab before bar 1", () => {
    expect(barLineNear({ sec: -1, secondsPerPixel: SPP, tempoMap: evenMap, beatsPerBar: 4 })).toBeNull();
  });
});

describe("dragLimits", () => {
  it("lets bar 1 go anywhere — it moves the whole tab", () => {
    const limits = dragLimits(evenMap, 0);
    expect(limits.minSec).toBe(Number.NEGATIVE_INFINITY);
    expect(limits.maxSec).toBe(Number.POSITIVE_INFINITY);
  });

  it("keeps a bar between its pinned neighbours", () => {
    const limits = dragLimits(pinnedMap, 4);
    expect(limits.minSec).toBeCloseTo(1 + MIN_SPAN_SEC);
    expect(limits.maxSec).toBeCloseTo(5.2 - MIN_SPAN_SEC);
    expect(limits).toMatchObject({ prevBeat: 0, prevSec: 1 });
  });

  it("measures a bar past the last pin from that pin", () => {
    const limits = dragLimits(pinnedMap, 16);
    expect(limits).toMatchObject({ prevBeat: 8, prevSec: 5.2 });
    expect(limits.maxSec).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("placeDraggedLine", () => {
  const free = dragLimits(evenMap, 4);

  it("follows the hand exactly when there is nothing to snap to", () => {
    const placed = placeDraggedLine({
      originSec: 3,
      dragPx: 25,
      secondsPerPixel: SPP,
      limits: free,
      peaks: null,
      peaksPerSecond: 100,
    });
    expect(placed.sec).toBeCloseTo(3.25);
    expect(placed.snapped).toBe(false);
  });

  it("pulls the line onto an attack near the drop", () => {
    // Silence, then a hit at 3.30 s.
    const peaks = new Float32Array(500);
    peaks.fill(0.9, 330);

    const placed = placeDraggedLine({
      originSec: 3,
      dragPx: 25,
      secondsPerPixel: SPP,
      limits: free,
      peaks,
      peaksPerSecond: 100,
    });
    expect(placed.sec).toBeCloseTo(3.3);
    expect(placed.snapped).toBe(true);
  });

  it("prefers the analysed attacks once there are some", () => {
    // The outline says 3.30 s; the attack curve knows the hit is at 3.28 s.
    const peaks = new Float32Array(500);
    peaks.fill(0.9, 330);
    const onset = new Float32Array(500);
    onset[328] = 1;

    const placed = placeDraggedLine({
      originSec: 3,
      dragPx: 25,
      secondsPerPixel: SPP,
      limits: free,
      peaks,
      peaksPerSecond: 100,
      onset,
      onsetFps: 100,
    });
    expect(placed.sec).toBeCloseTo(3.28);
    expect(placed.snapped).toBe(true);
  });

  it("drops exactly where it is let go when asked to", () => {
    const peaks = new Float32Array(500);
    peaks.fill(0.9, 330);

    const placed = placeDraggedLine({
      originSec: 3,
      dragPx: 25,
      secondsPerPixel: SPP,
      limits: free,
      peaks,
      peaksPerSecond: 100,
      exact: true,
    });
    expect(placed.sec).toBeCloseTo(3.25);
  });

  it("stops short of a pinned neighbour instead of crossing it", () => {
    const placed = placeDraggedLine({
      originSec: 3,
      dragPx: 500,
      secondsPerPixel: SPP,
      limits: dragLimits(pinnedMap, 4),
      peaks: null,
      peaksPerSecond: 100,
    });
    expect(placed.sec).toBeCloseTo(5.2 - MIN_SPAN_SEC);
  });
});
