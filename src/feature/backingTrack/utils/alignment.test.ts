import { describe, expect, it } from "vitest";

import {
  barBeatsOf,
  beatGridLines,
  firstOnsetIndex,
  isUsableTap,
  medianMs,
  offsetDeltaFromDrag,
  offsetFromTaps,
  secondsPerBeat,
  snapSecToTransient,
  tabNoteEvents,
  tapErrorMs,
} from "./alignment";
import { createRecordingTempoMap } from "./tempoMap";

describe("tapErrorMs", () => {
  const startTime = 100_000;

  it("reports zero when the tap lands exactly on a beat", () => {
    // 120 BPM = 500 ms per beat, so beat 4 is 2000 ms in.
    expect(tapErrorMs(startTime + 2_000, startTime, 120)).toBe(0);
  });

  it("reports a late tap as positive", () => {
    expect(tapErrorMs(startTime + 2_060, startTime, 120)).toBe(60);
  });

  it("reports an early tap as negative", () => {
    expect(tapErrorMs(startTime + 1_940, startTime, 120)).toBe(-60);
  });

  it("measures against the nearest beat, not the first one", () => {
    expect(tapErrorMs(startTime + 10_030, startTime, 120)).toBe(30);
  });

  it("has nothing to measure before the session starts", () => {
    expect(tapErrorMs(startTime, null, 120)).toBeNull();
  });
});

describe("isUsableTap", () => {
  it("accepts a tap that clearly belongs to one beat", () => {
    // 120 BPM = 500 ms per beat, so anything under 200 ms is unambiguous.
    expect(isUsableTap(150, 120)).toBe(true);
  });

  it("rejects one close to the midpoint between two beats", () => {
    expect(isUsableTap(240, 120)).toBe(false);
  });

  it("scales its tolerance with tempo", () => {
    expect(isUsableTap(300, 60)).toBe(true);
    expect(isUsableTap(300, 180)).toBe(false);
  });
});

describe("medianMs", () => {
  it("ignores a single wild tap among good ones", () => {
    expect(medianMs([40, 45, 50, 900])).toBe(47.5);
  });

  it("returns 0 with nothing to average", () => {
    expect(medianMs([])).toBe(0);
  });
});

describe("offsetFromTaps", () => {
  it("pushes the offset forward when the recording's beats arrive late", () => {
    const next = offsetFromTaps({
      errorsMs: [60, 60, 60],
      currentOffsetMs: 0,
      effectiveBpm: 120,
      sourceBpm: 120,
    });
    expect(next).toBe(60);
  });

  it("pulls it back when they arrive early", () => {
    const next = offsetFromTaps({
      errorsMs: [-80],
      currentOffsetMs: 500,
      effectiveBpm: 120,
      sourceBpm: 120,
    });
    expect(next).toBe(420);
  });

  it("converts the wall-clock error into the recording's own timeline", () => {
    // Played at double the recording's tempo, so 100 ms of wall time is 200 ms
    // of recording. Correcting by the raw error would be half of what's needed.
    const next = offsetFromTaps({
      errorsMs: [100],
      currentOffsetMs: 0,
      effectiveBpm: 240,
      sourceBpm: 120,
    });
    expect(next).toBe(200);
  });

  it("leaves the offset alone when nothing was tapped", () => {
    const next = offsetFromTaps({
      errorsMs: [],
      currentOffsetMs: 123,
      effectiveBpm: 120,
      sourceBpm: 120,
    });
    expect(next).toBe(123);
  });
});

describe("beatGridLines", () => {
  const at = (lines: { sec: number }[]) => lines.map((l) => l.sec);

  it("spaces lines by the recording's tempo, not the session's", () => {
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 2,
      sourceBpm: 120,
      offsetMs: 0,
    });
    expect(at(lines)).toEqual([0, 0.5, 1, 1.5, 2]);
  });

  it("shifts the whole grid by the offset", () => {
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 1,
      sourceBpm: 120,
      offsetMs: 100,
    });
    expect(at(lines)).toEqual([0.1, 0.6]);
  });

  it("marks bar starts from the meter and numbers them from 1", () => {
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 2,
      sourceBpm: 120,
      offsetMs: 0,
      beatsPerBar: 4,
    });
    expect(lines.map((l) => l.isBarStart)).toEqual([true, false, false, false, true]);
    expect(lines.map((l) => l.bar)).toEqual([1, 1, 1, 1, 2]);
  });

  it("follows a meter that isn't four to the bar", () => {
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 1.5,
      sourceBpm: 120,
      offsetMs: 0,
      beatsPerBar: 3,
    });
    expect(lines.map((l) => l.isBarStart)).toEqual([true, false, false, true]);
  });

  it("leaves beats before the tab's start unnumbered", () => {
    const lines = beatGridLines({
      windowStartSec: -1,
      windowEndSec: 0,
      sourceBpm: 120,
      offsetMs: 0,
    });
    expect(lines.map((l) => l.index)).toEqual([-2, -1, 0]);
    expect(lines.map((l) => l.bar)).toEqual([null, null, 1]);
  });

  it("covers a window that does not start at zero", () => {
    const lines = beatGridLines({
      windowStartSec: 10,
      windowEndSec: 11,
      sourceBpm: 60,
      offsetMs: 0,
    });
    expect(at(lines)).toEqual([10, 11]);
  });

  it("refuses to generate a line per pixel for an absurd window", () => {
    expect(
      beatGridLines({ windowStartSec: 0, windowEndSec: 100_000, sourceBpm: 240, offsetMs: 0 }),
    ).toEqual([]);
  });

  it("returns nothing for an inverted window", () => {
    expect(
      beatGridLines({ windowStartSec: 5, windowEndSec: 1, sourceBpm: 120, offsetMs: 0 }),
    ).toEqual([]);
  });
});

describe("offsetDeltaFromDrag", () => {
  it("dragging right reveals earlier audio, so the offset moves down", () => {
    expect(offsetDeltaFromDrag({ dragPx: 50, secondsPerPixel: 0.01 })).toBe(-500);
  });

  it("dragging left pushes the offset out", () => {
    expect(offsetDeltaFromDrag({ dragPx: -20, secondsPerPixel: 0.01 })).toBe(200);
  });

  it("reports no movement for a nonsense drag", () => {
    expect(offsetDeltaFromDrag({ dragPx: NaN, secondsPerPixel: 0.01 })).toBe(0);
  });

  it("scales with zoom — the same pixels mean less time when zoomed in", () => {
    expect(offsetDeltaFromDrag({ dragPx: 10, secondsPerPixel: 0.001 })).toBe(-10);
    expect(offsetDeltaFromDrag({ dragPx: 10, secondsPerPixel: 0.01 })).toBe(-100);
  });
});

describe("secondsPerBeat", () => {
  it("converts tempo to beat length", () => {
    expect(secondsPerBeat(120)).toBe(0.5);
  });

  it("falls back rather than dividing by zero", () => {
    expect(secondsPerBeat(0)).toBe(0.5);
  });
});

describe("firstOnsetIndex", () => {
  it("finds where the recording actually starts, past the silent lead-in", () => {
    expect(firstOnsetIndex([0, 0, 0.01, 0.02, 0.9, 0.8])).toBe(4);
  });

  it("measures the threshold against the loudest peak, not an absolute level", () => {
    // A quiet recording still has a clear start.
    expect(firstOnsetIndex([0, 0, 0.001, 0.05, 0.04])).toBe(3);
  });

  it("has no answer for silence", () => {
    expect(firstOnsetIndex([0, 0, 0])).toBeNull();
    expect(firstOnsetIndex([])).toBeNull();
  });
});

describe("tabNoteEvents", () => {
  /** `frets` is per slot, per string — the fret is what the lane draws. */
  const measure = (durations: number[], strings: number[][] = [], frets: number[][] = []) => ({
    beats: durations.map((duration, i) => ({
      duration,
      notes: (strings[i] ?? []).map((string, n) => ({ string, fret: frets[i]?.[n] ?? 0 })),
    })),
  });

  it("places notes at their beat, accumulating durations", () => {
    // Quarter, quarter, two eighths — notes on the 1st, 3rd and 4th slot.
    const events = tabNoteEvents([measure([1, 1, 0.5, 0.5], [[6], [], [1], [2]])]);

    expect(events.map((e) => e.beat)).toEqual([0, 2, 2.5]);
  });

  it("carries the beat count across bar lines", () => {
    const events = tabNoteEvents([measure([1, 1, 1, 1], [[6]]), measure([1], [[5]])]);

    expect(events.map((e) => e.beat)).toEqual([0, 4]);
  });

  it("keeps every string sounding on one beat", () => {
    const events = tabNoteEvents([measure([1], [[6, 5, 4]])]);

    expect(events[0].notes.map((note) => note.string)).toEqual([6, 5, 4]);
  });

  it("carries the fret, which is the whole point of drawing tab", () => {
    // Only the string used to survive this, so the lane could draw dots and
    // nothing else — six rails of identical marks.
    const events = tabNoteEvents([measure([1], [[6, 5]], [[3, 5]])]);

    expect(events[0].notes).toEqual([
      { string: 6, fret: 3 },
      { string: 5, fret: 5 },
    ]);
  });

  it("reads a missing fret as an open string rather than dropping the note", () => {
    const events = tabNoteEvents([
      { beats: [{ duration: 1, notes: [{ string: 4 } as { string: number; fret: number }] }] },
    ]);

    expect(events[0].notes).toEqual([{ string: 4, fret: 0 }]);
  });

  it("reports how long each slot lasts, so a lane can size a note", () => {
    const events = tabNoteEvents([measure([0.5, 1], [[6], [5]])]);

    expect(events.map((e) => e.durationBeats)).toEqual([0.5, 1]);
  });

  it("skips rests rather than emitting empty events", () => {
    const events = tabNoteEvents([measure([1, 1], [[], [3]])]);

    expect(events).toHaveLength(1);
    expect(events[0].beat).toBe(1);
  });

  it("treats a broken duration as a quarter rather than collapsing the timeline", () => {
    const events = tabNoteEvents([measure([0, 1], [[6], [5]])]);

    expect(events.map((e) => e.beat)).toEqual([0, 1]);
  });

  it("has nothing to draw without tablature", () => {
    expect(tabNoteEvents(undefined)).toEqual([]);
    expect(tabNoteEvents([])).toEqual([]);
  });
});

describe("snapSecToTransient", () => {
  /** Silence, then an attack at `onsetBucket` that decays away. */
  const withOnsetAt = (onsetBucket: number, length = 200): number[] =>
    Array.from({ length }, (_, i) => {
      if (i < onsetBucket) return 0.02;
      return Math.max(0.02, 1 - (i - onsetBucket) * 0.05);
    });

  const peaksPerSecond = 100;

  it("pulls a nearby drop onto the attack", () => {
    const peaks = withOnsetAt(50); // 0.50s
    const snapped = snapSecToTransient({
      sec: 0.53,
      peaks,
      peaksPerSecond,
      toleranceSec: 0.1,
    });

    expect(snapped).toBeCloseTo(0.5, 2);
  });

  it("leaves a drop alone when the attack is out of reach", () => {
    const peaks = withOnsetAt(50);
    const snapped = snapSecToTransient({
      sec: 1.2,
      peaks,
      peaksPerSecond,
      toleranceSec: 0.1,
    });

    expect(snapped).toBeNull();
  });

  it("does not snap inside a sustain, where there is no attack", () => {
    const peaks = Array.from({ length: 200 }, () => 0.8);
    const snapped = snapSecToTransient({
      sec: 1,
      peaks,
      peaksPerSecond,
      toleranceSec: 0.2,
    });

    expect(snapped).toBeNull();
  });

  it("picks the sharper of two attacks in reach", () => {
    const peaks = Array.from({ length: 200 }, () => 0.05);
    peaks[40] = 0.3; // a soft one
    peaks[60] = 1.0; // the real downbeat
    const snapped = snapSecToTransient({
      sec: 0.5,
      peaks,
      peaksPerSecond,
      toleranceSec: 0.25,
    });

    expect(snapped).toBeCloseTo(0.6, 2);
  });

  it("has nothing to offer without a waveform", () => {
    expect(
      snapSecToTransient({ sec: 1, peaks: null, peaksPerSecond, toleranceSec: 0.1 }),
    ).toBeNull();
    expect(
      snapSecToTransient({ sec: 1, peaks: [], peaksPerSecond, toleranceSec: 0.1 }),
    ).toBeNull();
  });

  it("reads a Float32Array as happily as an array", () => {
    const snapped = snapSecToTransient({
      sec: 0.52,
      peaks: Float32Array.from(withOnsetAt(50)),
      peaksPerSecond,
      toleranceSec: 0.1,
    });

    expect(snapped).toBeCloseTo(0.5, 2);
  });

  it("stays silent over the very start of the buffer", () => {
    expect(
      snapSecToTransient({ sec: 0, peaks: withOnsetAt(50), peaksPerSecond, toleranceSec: 0.005 }),
    ).toBeNull();
  });
});

describe("beatGridLines with a tempo map", () => {
  it("draws the same even grid as before when nothing is anchored", () => {
    const shared = { windowStartSec: 0, windowEndSec: 2, sourceBpm: 120, offsetMs: 0 };
    const plain = beatGridLines(shared);
    const mapped = beatGridLines({
      ...shared,
      tempoMap: createRecordingTempoMap({ anchors: [], offsetMs: 0, sourceBpm: 120 }),
    });

    expect(mapped).toEqual(plain);
  });

  it("opens the spacing out over a span the band dragged through", () => {
    // Beats 0–4 take 4s instead of 2 — half speed for the first bar.
    const tempoMap = createRecordingTempoMap({
      anchors: [{ beat: 4, sec: 4 }],
      offsetMs: 0,
      sourceBpm: 120,
    });
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 4,
      sourceBpm: 120,
      offsetMs: 0,
      tempoMap,
    });

    expect(lines.map((l) => l.index)).toEqual([0, 1, 2, 3, 4]);
    expect(lines.map((l) => l.sec)).toEqual([0, 1, 2, 3, 4]);
  });

  it("puts every bar line exactly where its bar was pinned", () => {
    const tempoMap = createRecordingTempoMap({
      anchors: [
        { beat: 4, sec: 2.3 },
        { beat: 8, sec: 4.4 },
      ],
      offsetMs: 0,
      sourceBpm: 120,
    });
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 5,
      sourceBpm: 120,
      offsetMs: 0,
      beatsPerBar: 4,
      tempoMap,
    });

    const barStarts = lines.filter((l) => l.isBarStart);
    expect(barStarts.map((l) => l.bar)).toEqual([1, 2, 3]);
    expect(barStarts.map((l) => Number(l.sec.toFixed(3)))).toEqual([0, 2.3, 4.4]);
  });

  it("still refuses to fill a window with a million lines", () => {
    const tempoMap = createRecordingTempoMap({
      anchors: [{ beat: 4000, sec: 1 }],
      offsetMs: 0,
      sourceBpm: 120,
    });
    const lines = beatGridLines({
      windowStartSec: 0,
      windowEndSec: 600,
      sourceBpm: 120,
      offsetMs: 0,
      tempoMap,
    });

    expect(lines.length).toBeLessThanOrEqual(2000);
  });
});

describe("barBeatsOf", () => {
  /** `beats` quarter notes' worth of slots, the way a parsed measure arrives. */
  const measure = (beats: number, duration = 1) => ({
    beats: Array.from({ length: Math.round(beats / duration) }, () => ({
      notes: [{ string: 1, fret: 0 }],
      duration,
    })),
  });

  it("reads four quarter notes out of a 4/4 tab", () => {
    expect(barBeatsOf([measure(4), measure(4)], 4)).toBe(4);
  });

  it("reads three out of a 3/4 tab, which the accent pattern never did", () => {
    expect(barBeatsOf([measure(3), measure(3), measure(3)], 4)).toBe(3);
  });

  it("counts 6/8 as the three quarter notes it actually lasts", () => {
    // Six eighths — the grid works in quarter notes, so the bar is three long.
    expect(barBeatsOf([measure(3, 0.5), measure(3, 0.5)], 4)).toBe(3);
  });

  it("is not fooled by a pickup bar into meterising the whole song wrong", () => {
    expect(barBeatsOf([measure(1), measure(4), measure(4), measure(4)], 4)).toBe(4);
  });

  it("falls back when there is no tab to read, or nothing usable in it", () => {
    expect(barBeatsOf(undefined, 3)).toBe(3);
    expect(barBeatsOf([], 3)).toBe(3);
    expect(barBeatsOf([{ beats: [] }], 3)).toBe(3);
  });
});
