import { describe, expect, it } from "vitest";

import {
  BLOCK_SAMPLES,
  BLOCKS_PER_BATCH,
  TONE_BIN,
  toneFrequency,
  WAVEFORM_WORKLET_CODE,
} from "./waveformWorklet";

describe("the waveform worklet's source", () => {
  it("is valid JavaScript", () => {
    // It is a string until a browser loads it, so nothing else in the toolchain
    // will ever look at it. A typo in here would show up as a waveform that
    // silently never fills in, on the audio thread, in production only.
    expect(() => new Function(WAVEFORM_WORKLET_CODE)).not.toThrow();
  });

  it("registers itself under the name the capture asks for", () => {
    expect(WAVEFORM_WORKLET_CODE).toContain("registerProcessor('waveform-listener'");
  });

  it("carries the defaults the capture passes in", () => {
    expect(WAVEFORM_WORKLET_CODE).toContain(`opts.blocksPerBatch || ${BLOCKS_PER_BATCH}`);
    expect(WAVEFORM_WORKLET_CODE).toContain(`opts.toneBin || ${TONE_BIN}`);
  });
});

describe("toneFrequency", () => {
  it("lands exactly on a bin, so the detector is looking where the burst is", () => {
    // Off-bin, the Goertzel leaks across neighbours and the burst stops standing
    // out from the music around it.
    const frequency = toneFrequency(48_000);

    expect(frequency).toBe(15_000);
    expect((frequency * BLOCK_SAMPLES) / 48_000).toBe(TONE_BIN);
  });

  it("follows the device rather than assuming 48 kHz", () => {
    expect(toneFrequency(44_100)).toBeCloseTo((TONE_BIN * 44_100) / BLOCK_SAMPLES, 6);
  });

  it("stays inside what a capture at 44.1 kHz can carry", () => {
    // Above Nyquist the burst would not survive the trip back at all.
    expect(toneFrequency(44_100)).toBeLessThan(44_100 / 2);
  });
});
