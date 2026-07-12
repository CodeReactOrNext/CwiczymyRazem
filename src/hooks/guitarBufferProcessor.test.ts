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

function makeTargets() {
  return {
    frequencyRef: { current: 0 },
    volumeRef: { current: 0 },
    rawVolumeRef: { current: 0 },
    confidenceRef: { current: 0 },
    lastOnsetTimeRef: { current: 0 },
    lastTickTimeRef: { current: 0 },
    onsetChromaRef: { current: null as Float32Array | null },
  };
}

/** 2048 samples loud enough to pass the silence gate (rms ≈ 0.1). */
const loudWindow = () => new Float32Array(2048).fill(0.1);

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
