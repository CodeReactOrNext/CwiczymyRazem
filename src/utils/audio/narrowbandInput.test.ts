import { describe, expect, it } from "vitest";

import { createGatedInputWatch, isCallModeRate, pickOtherInput } from "./narrowbandInput";

const RATE = 16000;
const BLOCK = 2048;

/** Feeds `seconds` of input built sample by sample; returns the first verdict. */
function watch(seconds: number, sampleAt: (n: number) => number) {
  const w = createGatedInputWatch(RATE);
  for (let off = 0; off < seconds * RATE; off += BLOCK) {
    const block = new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i++) block[i] = sampleAt(off + i);
    const verdict = w.feed(block);
    if (verdict) return verdict;
  }
  return null;
}

const noise = (n: number) => 0.001 * Math.sin(n * 12.9898) * Math.cos(n * 78.233) + 0.0005;
const tone = (n: number) => 0.05 * Math.sin((2 * Math.PI * 147 * n) / RATE);

describe("isCallModeRate", () => {
  it("covers a headset's 8 and 16 kHz, not a normal input", () => {
    expect(isCallModeRate(16000)).toBe(true);
    expect(isCallModeRate(8000)).toBe(true);
    expect(isCallModeRate(44100)).toBe(false);
    expect(isCallModeRate(undefined)).toBe(false);
  });
});

describe("createGatedInputWatch", () => {
  it("names an input that goes digitally silent between short bursts", () => {
    // 300 ms of sound, 700 ms muted — what the earbuds did to held notes.
    expect(watch(5, (n) => (n % RATE < 0.3 * RATE ? tone(n) : 0))).toBe("gated");
  });

  it("clears a microphone: its noise is never exactly zero for long", () => {
    expect(watch(5, (n) => (n % RATE < 0.3 * RATE ? tone(n) : noise(n)))).toBe("clean");
  });

  it("clears a steady tone, whose wave only crosses zero", () => {
    expect(watch(5, (n) => Math.round(tone(n) * 32767) / 32767)).toBe("clean");
  });

  it("waits for the input to produce something before judging it", () => {
    // Two seconds of nothing at all, then a clean signal.
    expect(watch(2, () => 0)).toBeNull();
    expect(watch(6, (n) => (n < 2 * RATE ? 0 : noise(n)))).toBe("clean");
  });

  it("gives its verdict once", () => {
    const w = createGatedInputWatch(RATE);
    const block = new Float32Array(RATE * 4).map((_, n) => noise(n));
    expect(w.feed(block)).toBe("clean");
    expect(w.feed(block)).toBeNull();
  });
});

describe("pickOtherInput", () => {
  const device = (deviceId: string, groupId = deviceId, kind: MediaDeviceKind = "audioinput") => ({ deviceId, groupId, kind });

  it("takes the phone's microphone in place of the headset", () => {
    const devices = [device("default"), device("buds", "g-buds"), device("buds-alias", "g-buds"), device("out", "out", "audiooutput"), device("phone")];
    expect(pickOtherInput(devices, { deviceId: "buds", groupId: "g-buds" }, new Set())).toBe("phone");
  });

  it("skips inputs already found muted and gives up when none is left", () => {
    const devices = [device("buds"), device("other-buds"), device("phone")];
    expect(pickOtherInput(devices, { deviceId: "buds" }, new Set(["other-buds"]))).toBe("phone");
    expect(pickOtherInput(devices, { deviceId: "buds" }, new Set(["other-buds", "phone"]))).toBeNull();
  });
});
