import { describe, expect, it } from "vitest";

import type { GuitarDetectors } from "./guitarBufferProcessor";
import { createGuitarBufferProcessor } from "./guitarBufferProcessor";

/** Fake aubio detectors: pitch returns queued per-hop values, onsets never fire. */
function makeDetectors(hopPitches: number[]): GuitarDetectors {
  let i = 0;
  return {
    pitch: {
      do: () => (i < hopPitches.length ? hopPitches[i++] : hopPitches[hopPitches.length - 1] ?? 0),
      getConfidence: () => 0.9,
    },
    onset: { do: () => false },
    tick: { do: () => false },
  };
}

/** Same as makeDetectors, but the onset detector fires (returns true) starting
 *  from the `onsetAfterCalls`-th hop-level call onward (4 hops per 2048-sample
 *  window) — lets a test put a specific window into the attack-phase branch. */
function makeDetectorsWithOnsetAfter(hopPitches: number[], onsetAfterCalls: number): GuitarDetectors {
  let i = 0;
  let onsetCalls = 0;
  return {
    pitch: {
      do: () => (i < hopPitches.length ? hopPitches[i++] : hopPitches[hopPitches.length - 1] ?? 0),
      getConfidence: () => 0.9,
    },
    onset: { do: () => { onsetCalls++; return onsetCalls > onsetAfterCalls; } },
    tick: { do: () => false },
  };
}

function makeTargets() {
  return {
    frequencyRef: { current: 0 },
    volumeRef: { current: 0 },
    rawVolumeRef: { current: 0 },
    noiseFloorRef: { current: 0 },
    confidenceRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 },
    lastTickTimeRef: { current: 0 },
    onsetChromaRef: { current: null as Float32Array | null },
  };
}

/** 2048 samples loud enough to pass the silence gate (rms ≈ 0.1). */
const loudWindow = () => new Float32Array(2048).fill(0.1);
/** Low-amplitude noise (not exact silence) — under VOLUME_THRESHOLD so it still
 *  counts as "confirmed silent", but with a measurable, non-zero RMS floor. */
const quietNoiseWindow = (amplitude: number) => {
  const buf = new Float32Array(2048);
  for (let i = 0; i < buf.length; i++) buf[i] = i % 2 === 0 ? amplitude : -amplitude;
  return buf;
};

describe("createGuitarBufferProcessor pitch stabilization", () => {
  it("reports the median of the window's per-hop estimates", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([110, 110, 110, 110]),
      targets,
      getGain: () => 1,
    });
    process(loudWindow());
    expect(targets.frequencyRef.current).toBeCloseTo(110);
  });

  it("locks onto a new note within a single window", () => {
    // Old behaviour pushed one estimate per 2048-sample window, so a saturated
    // 5-slot median needed ~3 windows (~128ms) to flip to a new note.
    const targets = makeTargets();
    const hops = [
      ...Array(20).fill(110), // 5 windows of the old note — median saturated at 110
      ...Array(4).fill(220),  // 1 window of the new note
    ];
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors(hops),
      targets,
      getGain: () => 1,
    });
    for (let w = 0; w < 5; w++) process(loudWindow());
    expect(targets.frequencyRef.current).toBeCloseTo(110);

    process(loudWindow()); // first window of the new note
    expect(targets.frequencyRef.current).toBeCloseTo(220);
  });

  it("rejects a single glitchy hop via the median", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([110, 110, 660, 110]),
      targets,
      getGain: () => 1,
    });
    process(loudWindow());
    expect(targets.frequencyRef.current).toBeCloseTo(110);
  });

  it("ignores hops with no detectable pitch instead of dropping the window", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([110, 110, 110, 0]), // last hop lost the pitch
      targets,
      getGain: () => 1,
    });
    process(loudWindow());
    expect(targets.frequencyRef.current).toBeCloseTo(110);
  });
});

describe("createGuitarBufferProcessor noise-floor tracking", () => {
  it("does not update the noise floor until silence is confirmed (2+ windows)", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([]),
      targets,
      getGain: () => 1,
    });
    process(quietNoiseWindow(0.0005)); // 1st quiet window — not yet "confirmed"
    expect(targets.noiseFloorRef.current).toBe(0);
  });

  it("measures the floor from confirmed-silent windows, in rawVolumeRef's units", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([]),
      targets,
      getGain: () => 1,
    });
    process(quietNoiseWindow(0.0005));
    process(quietNoiseWindow(0.0005)); // confirmed silent — same amplitude, EMA settles immediately
    expect(targets.noiseFloorRef.current).toBeCloseTo(0.005, 3);
  });

  it("never updates the noise floor while the signal is loud (playing)", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([110, 110, 110, 110]),
      targets,
      getGain: () => 1,
    });
    process(loudWindow());
    process(loudWindow());
    expect(targets.noiseFloorRef.current).toBe(0);
  });

  it("smooths a step change instead of jumping straight to it", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectors([]),
      targets,
      getGain: () => 1,
    });
    process(quietNoiseWindow(0.0005));
    process(quietNoiseWindow(0.0005)); // settles at ~0.005
    const before = targets.noiseFloorRef.current;
    process(quietNoiseWindow(0.0008)); // louder, but safely under VOLUME_THRESHOLD — still "silent"
    expect(targets.noiseFloorRef.current).toBeGreaterThan(before);
    expect(targets.noiseFloorRef.current).toBeLessThan(0.008); // hasn't jumped all the way there yet
  });
});

describe("createGuitarBufferProcessor attack-phase pitch handling", () => {
  it("holds the last stable pitch during the attack-phase window instead of zeroing it", () => {
    const targets = makeTargets();
    // Window 1: no onset, settles on 110. Window 2: onset fires (attack phase)
    // with noisy 440 hops that a real transient could plausibly produce.
    const process = createGuitarBufferProcessor({
      detectors: makeDetectorsWithOnsetAfter([110, 110, 110, 110, 440, 440, 440, 440], 4),
      targets,
      getGain: () => 1,
    });
    process(loudWindow());
    expect(targets.frequencyRef.current).toBeCloseTo(110);

    process(loudWindow()); // attack-phase window
    expect(targets.frequencyRef.current).toBeCloseTo(110); // held, not zeroed, not the noisy 440 either
  });

  it("still reports 0 during attack phase if there is no prior stable pitch to hold", () => {
    const targets = makeTargets();
    const process = createGuitarBufferProcessor({
      detectors: makeDetectorsWithOnsetAfter([110, 110, 110, 110], 0), // onset from the very first hop
      targets,
      getGain: () => 1,
    });
    process(loudWindow());
    expect(targets.frequencyRef.current).toBe(0);
  });
});
