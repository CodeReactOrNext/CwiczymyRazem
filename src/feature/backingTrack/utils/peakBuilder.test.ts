import { describe, expect, it } from "vitest";

import {
  blendForDisplay,
  createOnsetDetector,
  createPeakBuilder,
  packPeaks,
  unpackPeaks,
  unpackSeen,
} from "./peakBuilder";

/** 10 buckets a second keeps the arithmetic in the tests readable. */
const RATE = 10;

describe("createPeakBuilder", () => {
  it("sizes itself from the recording's length", () => {
    const builder = createPeakBuilder(3, RATE);
    expect(builder.snapshot()).toHaveLength(30);
    expect(builder.durationSec).toBe(3);
  });

  it("files a level under the second it was heard at", () => {
    const builder = createPeakBuilder(2, RATE);
    builder.observe(1.0, 1);

    const peaks = builder.snapshot();
    expect(peaks[10]).toBeCloseTo(1);
    expect(peaks[9]).toBe(0);
    expect(peaks[11]).toBe(0);
  });

  it("keeps the loudest moment in a bucket rather than the average", () => {
    // A transient is the peak inside its bucket; averaging would file the very
    // attacks the snap exists to find straight off.
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.5, 0.2);
    builder.observe(0.5, 0.9);
    builder.observe(0.5, 0.1);

    expect(builder.snapshot()[5]).toBeCloseTo(1); // 0.9 normalised against itself
  });

  it("normalises against the loudest thing heard anywhere", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.1, 0.25);
    builder.observe(0.5, 0.5);

    const peaks = builder.snapshot();
    expect(peaks[1]).toBeCloseTo(0.5);
    expect(peaks[5]).toBeCloseTo(1);
  });

  it("treats a negative sample as just as loud", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.2, -0.8);

    expect(builder.snapshot()[2]).toBeCloseTo(1);
  });

  it("lands a second pass on the same buckets as the first", () => {
    // Indexing by the recording's clock, not wall time, is what makes replaying
    // a section improve the picture instead of smearing it.
    const builder = createPeakBuilder(2, RATE);
    builder.observe(1.5, 0.4);
    builder.observe(1.5, 0.7);

    expect(builder.snapshot()[15]).toBeCloseTo(1);
    expect(builder.coverage()).toBeCloseTo(1 / 20);
  });

  it("counts silence as heard, because it is", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.3, 0);

    expect(builder.coverage()).toBeCloseTo(1 / 10);
  });

  it("reports coverage as the fraction actually listened to", () => {
    const builder = createPeakBuilder(1, RATE);
    expect(builder.coverage()).toBe(0);

    for (let i = 0; i < 5; i += 1) builder.observe(i / RATE, 0.5);
    expect(builder.coverage()).toBeCloseTo(0.5);
  });

  it("drops readings from outside the recording", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(-1, 1);
    builder.observe(99, 1);
    builder.observe(Number.NaN, 1);
    builder.observe(0.5, Number.NaN);

    expect(builder.coverage()).toBe(0);
  });

  it("survives a nonsense duration instead of allocating wildly", () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const builder = createPeakBuilder(bad, RATE);
      expect(builder.snapshot().length).toBeGreaterThan(0);
      expect(builder.durationSec).toBe(0);
    }
  });

  it("is all zeroes before anything is heard", () => {
    const peaks = createPeakBuilder(1, RATE).snapshot();
    expect(Array.from(peaks).every((p) => p === 0)).toBe(true);
  });
});

describe("packPeaks / unpackPeaks", () => {
  it("round-trips within a byte's precision", () => {
    const peaks = Float32Array.from([0, 0.25, 0.5, 1]);
    const back = unpackPeaks(packPeaks(peaks));

    for (let i = 0; i < peaks.length; i += 1) {
      expect(back[i]).toBeCloseTo(peaks[i], 2);
    }
  });

  it("clamps anything outside 0..1 rather than wrapping", () => {
    const packed = packPeaks(Float32Array.from([-1, 2]));
    expect(unpackPeaks(packed)[0]).toBeCloseTo(0, 2);
    expect(unpackPeaks(packed)[1]).toBeCloseTo(1, 2);
  });

  it("keeps heard silence apart from a gap", () => {
    // Without this a resumed pass would re-listen to quiet parts forever, and
    // coverage could never reach 1 on a song with a silent intro.
    const packed = packPeaks(Float32Array.from([0, 0]), Uint8Array.from([1, 0]));

    expect(Array.from(unpackSeen(packed))).toEqual([1, 0]);
    expect(Array.from(unpackPeaks(packed))).toEqual([0, 0]);
  });

  it("treats every bucket as heard when no mask is given", () => {
    expect(Array.from(unpackSeen(packPeaks(Float32Array.from([0, 0.5]))))).toEqual([1, 1]);
  });

  it("keeps a four-minute song small enough to store", () => {
    // 120 buckets a second is the resolution the waveform is drawn at.
    const packed = packPeaks(new Float32Array(240 * 120));
    expect(packed.byteLength).toBeLessThan(30 * 1024);
  });
});

describe("observeSpan", () => {
  it("fills every bucket the reading covered", () => {
    // One analyser read arrives per animation frame but covers tens of ms, so
    // it belongs to the whole span, not to a single instant.
    const builder = createPeakBuilder(2, RATE);
    builder.observeSpan(0.5, 1.0, 0.8);

    const peaks = builder.snapshot();
    for (let i = 5; i <= 10; i += 1) expect(peaks[i]).toBeCloseTo(1);
    expect(peaks[4]).toBe(0);
    expect(peaks[11]).toBe(0);
  });

  it("counts the whole span as covered", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observeSpan(0, 0.5, 0.5);

    expect(builder.coverage()).toBeCloseTo(0.6); // buckets 0..5 of 10
  });

  it("does not care which way round the two moments come", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observeSpan(0.6, 0.2, 0.5);

    expect(builder.coverage()).toBeCloseTo(0.5);
  });

  it("refuses to paint over a seek", () => {
    // The clock jumping thirty seconds means the player moved, not that this
    // reading described thirty seconds of audio.
    const builder = createPeakBuilder(60, RATE);
    builder.observeSpan(1, 40, 0.9);

    const peaks = builder.snapshot();
    expect(peaks[400]).toBeCloseTo(1); // the moment it landed on
    expect(peaks[200]).toBe(0); // nothing invented in between
  });

  it("keeps the louder of two passes over the same span", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observeSpan(0.1, 0.3, 0.3);
    builder.observeSpan(0.1, 0.3, 0.9);

    expect(builder.snapshot()[2]).toBeCloseTo(1);
  });

  it("clips a span that runs past the end of the recording", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observeSpan(0.8, 1.5, 0.5);

    expect(builder.coverage()).toBeCloseTo(0.2); // buckets 8 and 9
  });

  it("spots a jump that happens to land past the end of the recording", () => {
    // The guard has to be applied to the span the caller claimed, not to what
    // survives clipping: measured after clipping, a jump from the last second
    // of a recording to somewhere past its end looks like a two-bucket reading.
    const builder = createPeakBuilder(1, RATE);
    builder.observeSpan(0.8, 5, 0.5);

    expect(builder.coverage()).toBe(0);
  });

  it("refuses a span too long to have come from one block of audio", () => {
    // What a throttled tab used to do: one late reading painted more than a
    // second flat, and marked all of it heard so nothing would ever fix it.
    const builder = createPeakBuilder(10, RATE);
    builder.observeSpan(1, 3, 0.9);

    expect(builder.coverage()).toBeCloseTo(0.01); // the landing bucket alone
  });
});

describe("resuming a partial pass", () => {
  it("carries the previous pass forward instead of starting over", () => {
    const first = createPeakBuilder(1, RATE);
    first.observeSpan(0, 0.4, 0.5);
    const packed = packPeaks(first.snapshot(), first.seenMask());

    const second = createPeakBuilder(1, RATE, {
      peaks: unpackPeaks(packed),
      seen: unpackSeen(packed),
    });

    expect(second.coverage()).toBeCloseTo(first.coverage());
    expect(second.snapshot()[2]).toBeCloseTo(1);
  });

  it("adds new ground to what was already known", () => {
    const first = createPeakBuilder(1, RATE);
    first.observeSpan(0, 0.4, 0.5);
    const packed = packPeaks(first.snapshot(), first.seenMask());

    const second = createPeakBuilder(1, RATE, {
      peaks: unpackPeaks(packed),
      seen: unpackSeen(packed),
    });
    second.observeSpan(0.5, 0.9, 0.5);

    expect(second.coverage()).toBeCloseTo(1);
  });

  it("carries a shorter pass forward as the prefix it is", () => {
    // Saved under a provisional duration, reopened once the real one is known:
    // same grid, same origin, so the first buckets are still exactly right.
    const builder = createPeakBuilder(2, RATE, {
      peaks: new Float32Array(5),
      seen: Uint8Array.from([1, 1, 1, 1, 1]),
    });

    expect(builder.coverage()).toBeCloseTo(5 / 20);
  });

  it("discards a restore longer than the recording it is being put into", () => {
    // Longer than the grid means it was measured at another resolution; laying
    // it down would put every bucket somewhere slightly wrong.
    const builder = createPeakBuilder(1, RATE, {
      peaks: new Float32Array(40),
      seen: new Uint8Array(40).fill(1),
    });

    expect(builder.coverage()).toBe(0);
  });
});

describe("grow", () => {
  it("keeps recording once the recording turns out to be longer", () => {
    // The bug this exists for: a player that answers with a provisional length
    // sized the buffer short, and everything past it was dropped in silence.
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.5, 0.5);
    builder.observe(3, 1);
    expect(builder.snapshot()).toHaveLength(10);

    builder.grow(4);

    builder.observe(3, 1);
    expect(builder.snapshot()).toHaveLength(40);
    expect(builder.snapshot()[30]).toBeCloseTo(1);
    expect(builder.durationSec).toBe(4);
  });

  it("keeps every bucket already heard exactly where it was", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.4, 0.8);
    const before = builder.snapshot()[4];

    builder.grow(10);

    expect(builder.snapshot()[4]).toBeCloseTo(before);
    expect(builder.coverage()).toBeCloseTo(1 / 100);
  });

  it("never shrinks, so a momentary bad reading cannot throw work away", () => {
    const builder = createPeakBuilder(4, RATE);
    builder.observe(3, 1);

    builder.grow(1);

    expect(builder.durationSec).toBe(4);
    expect(builder.snapshot()[30]).toBeCloseTo(1);
  });

  it("ignores a nonsense length", () => {
    const builder = createPeakBuilder(2, RATE);
    builder.grow(Number.NaN);
    builder.grow(Number.POSITIVE_INFINITY);

    expect(builder.durationSec).toBe(2);
  });
});

describe("the onset channel", () => {
  it("keeps attacks apart from the body of the wave", () => {
    const builder = createPeakBuilder(1, RATE);
    // Loud and flat, then just as loud but with something starting.
    builder.observe(0.1, 1, 0);
    builder.observe(0.5, 1, 0.8);

    expect(builder.snapshot()[1]).toBeCloseTo(builder.snapshot()[5]);
    expect(builder.onsetSnapshot()[1]).toBe(0);
    expect(builder.onsetSnapshot()[5]).toBeCloseTo(1);
  });

  it("leaves the channel alone for a caller with nothing to say about attacks", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.5, 1);

    expect(builder.onsetSnapshot()[5]).toBe(0);
  });

  it("carries attacks across a resume, so a second pass does not lose them", () => {
    const first = createPeakBuilder(1, RATE);
    first.observe(0.2, 0.5, 0.9);
    const peaks = packPeaks(first.snapshot(), first.seenMask());
    const onsets = packPeaks(first.onsetSnapshot(), first.seenMask());

    const second = createPeakBuilder(1, RATE, {
      peaks: unpackPeaks(peaks),
      seen: unpackSeen(peaks),
      onsets: unpackPeaks(onsets),
    });

    expect(second.onsetSnapshot()[2]).toBeCloseTo(1);
  });
});

describe("createOnsetDetector", () => {
  it("calls nothing an attack until it has something to have risen above", () => {
    // Otherwise every resumed pass puts a spike wherever listening restarted.
    expect(createOnsetDetector().push(0.8)).toBe(0);
  });

  it("finds the hit rather than the loudness", () => {
    const detector = createOnsetDetector();
    for (let i = 0; i < 40; i += 1) detector.push(0.2);

    const attack = detector.push(0.9);
    const sustain = detector.push(0.9);

    expect(attack).toBeGreaterThan(0.5);
    expect(sustain).toBeLessThan(attack);
  });

  it("does not hear an attack in a level that never rose", () => {
    const detector = createOnsetDetector();
    let loudest = 0;
    for (let i = 0; i < 60; i += 1) loudest = Math.max(loudest, detector.push(0.4));

    expect(loudest).toBeLessThan(0.05);
  });

  it("forgets the run when told to, so a seek does not read as a hit", () => {
    const detector = createOnsetDetector();
    for (let i = 0; i < 40; i += 1) detector.push(0.05);

    detector.reset();

    expect(detector.push(0.9)).toBe(0);
  });
});

describe("blendForDisplay", () => {
  it("lets an attack stand above the body it sits in", () => {
    const blended = blendForDisplay(
      Float32Array.from([1, 1]),
      Float32Array.from([0, 0.9]),
    );

    expect(blended?.[1]).toBeGreaterThan(blended?.[0] ?? 0);
  });

  it("keeps a quiet passage distinguishable from one nobody has heard", () => {
    const blended = blendForDisplay(
      Float32Array.from([0.5, 0]),
      Float32Array.from([0, 0]),
    );

    // No onsets anywhere, so the body is the only picture there is.
    expect(blended?.[0]).toBeCloseTo(0.5);
  });

  it("draws a waveform saved before attacks were measured", () => {
    const peaks = Float32Array.from([0.4, 0.8]);

    expect(blendForDisplay(peaks, null)).toBe(peaks);
    expect(blendForDisplay(peaks, new Float32Array(5))).toBe(peaks);
  });

  it("has nothing to draw without peaks", () => {
    expect(blendForDisplay(null, Float32Array.from([1]))).toBeNull();
  });
});

describe("restoring the scale a pass was measured on", () => {
  it("puts a resumed pass back into the units the new one is measured in", () => {
    // Snapshots come out normalised, so a stored waveform has lost the scale it
    // was measured on. Restoring it as-is makes the old pass and the new one
    // different units — and the attack channel runs an order of magnitude below
    // full scale, so the resumed half would draw as a flat line beside the first.
    const first = createPeakBuilder(1, RATE);
    first.observe(0.1, 0.4, 0.05);
    const seen = first.seenMask();
    const scales = first.scales();

    const second = createPeakBuilder(1, RATE, {
      peaks: unpackPeaks(packPeaks(first.snapshot(), seen)),
      seen: unpackSeen(packPeaks(first.snapshot(), seen)),
      onsets: unpackPeaks(packPeaks(first.onsetSnapshot(), seen)),
      peakScale: scales.peak,
      onsetScale: scales.onset,
    });
    // A quieter hit heard on the second pass has to read as quieter.
    second.observe(0.5, 0.2, 0.025);

    expect(second.snapshot()[5] / second.snapshot()[1]).toBeCloseTo(0.5, 2);
    expect(second.onsetSnapshot()[5] / second.onsetSnapshot()[1]).toBeCloseTo(0.5, 2);
  });

  it("reports the scale each channel was divided by", () => {
    const builder = createPeakBuilder(1, RATE);
    builder.observe(0.1, 0.4, 0.05);

    expect(builder.scales()).toEqual({ peak: 0.4, onset: 0.05 });
  });

  it("treats a missing scale as one, for anything already on a 0..1 footing", () => {
    const builder = createPeakBuilder(1, RATE, {
      peaks: Float32Array.from([0.5, 0]),
      seen: Uint8Array.from([1, 0]),
    });

    expect(builder.scales().peak).toBeCloseTo(0.5);
  });
});
