import { describe, expect, it } from "vitest";

import {
  classifyLevel,
  computeAutoGain,
  MAX_GAIN,
  MIN_AUTO_FRAMES,
  TARGET_VOLUME,
  volumeToDb,
  volumeToMeter,
} from "./inputLevel";

const frames = (level: number, count = 60) => Array.from({ length: count }, () => level);

describe("volumeToDb / volumeToMeter", () => {
  it("reads volume units (RMS × 10) as dBFS", () => {
    expect(volumeToDb(1)).toBeCloseTo(-20);
    expect(volumeToDb(0.1)).toBeCloseTo(-40);
    expect(volumeToDb(0)).toBe(-Infinity);
  });

  it("puts the auto-gain target in the upper half of the meter, silence at zero", () => {
    expect(volumeToMeter(0)).toBe(0);
    expect(volumeToMeter(TARGET_VOLUME)).toBeGreaterThan(0.5);
    expect(volumeToMeter(TARGET_VOLUME)).toBeLessThan(0.8);
    expect(volumeToMeter(100)).toBe(1);
  });
});

describe("classifyLevel", () => {
  const base = { rawPeakHold: 0.3, gain: 3, noiseFloor: 0.001 };

  it("says nothing is playing when the level sits at the noise floor", () => {
    expect(classifyLevel({ ...base, rawHold: 0.002 })).toBe("silent");
  });

  it("calls playing quiet when the gained level is under the good zone", () => {
    expect(classifyLevel({ ...base, rawHold: 0.02 })).toBe("quiet");
  });

  it("calls it good once the gain lifts it into the zone", () => {
    expect(classifyLevel({ ...base, rawHold: 0.1 })).toBe("good");
  });

  it("flags clipping first, however good the level looks", () => {
    expect(classifyLevel({ ...base, rawHold: 0.1, rawPeakHold: 0.99 })).toBe("clipping");
  });
});

describe("computeAutoGain", () => {
  it("leaves the gain alone and says so when nothing was played", () => {
    const result = computeAutoGain({ rawLevels: frames(0.1, MIN_AUTO_FRAMES - 1), rawPeak: 0.2, noiseFloor: 0, currentGain: 3 });
    expect(result).toEqual({ status: "no_signal", gain: 3 });
  });

  it("aims the loud part of the playing at the target", () => {
    const result = computeAutoGain({ rawLevels: frames(0.1), rawPeak: 0.3, noiseFloor: 0.001, currentGain: 3 });
    expect(result.status).toBe("ok");
    expect(result.gain).toBeCloseTo(TARGET_VOLUME / 0.1);
  });

  it("does not let decaying tails drag the gain up", () => {
    const levels = [...frames(0.1, 50), ...frames(0.005, 10)];
    expect(computeAutoGain({ rawLevels: levels, rawPeak: 0.3, noiseFloor: 0, currentGain: 3 }).gain).toBeCloseTo(4);
  });

  it("reports a too-quiet input that even the maximum gain can't lift", () => {
    const result = computeAutoGain({ rawLevels: frames(0.01), rawPeak: 0.02, noiseFloor: 0, currentGain: 3 });
    expect(result).toEqual({ status: "at_max", gain: MAX_GAIN });
  });

  it("reports clipping and still lowers the gain", () => {
    const result = computeAutoGain({ rawLevels: frames(0.8), rawPeak: 1, noiseFloor: 0, currentGain: 3 });
    expect(result.status).toBe("clipping");
    expect(result.gain).toBe(0.5);
  });

  it("reports playing that barely stands above the room noise", () => {
    const result = computeAutoGain({ rawLevels: frames(0.06), rawPeak: 0.2, noiseFloor: 0.02, currentGain: 3 });
    expect(result.status).toBe("noisy");
  });
});
