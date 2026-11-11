import { describe, expect, it } from "vitest";

import type { EngineDspMessage } from "./guitarDspEngine";
import { createStampShifter } from "./nativeEngineStamps";

const message = (over: Omit<Partial<EngineDspMessage>, "readings"> & { readings?: Partial<EngineDspMessage["readings"]> } = {}): EngineDspMessage => ({
  type: "readings",
  events: [],
  attacks: [],
  timeMs: 1000,
  samples: new Float32Array(4),
  ...over,
  readings: {
    frequency: 220, volume: 0.5, rawVolume: 0.2, noiseFloor: 0.01, confidence: 0.9,
    lastOnsetTime: 0, lastTickTime: 0, lastAttackMs: 0, lastLowAttackMs: 0, lastSoftAttackMs: 0,
    inputPeak: 0.3, active: false,
    ...over.readings,
  },
});

describe("createStampShifter", () => {
  it("moves every time by the hand-off and leaves the rest alone", () => {
    const shift = createStampShifter();
    const original = message({
      readings: { lastOnsetTime: 1000, lastAttackMs: 980.5 },
      events: [{ onsetMs: 980.5, pitchHz: 220, peakVolume: 0.2, attack: null }],
    });
    const shifted = shift(original, 2);
    expect(shifted.timeMs).toBe(1002);
    expect(shifted.readings.lastOnsetTime).toBe(1002);
    expect(shifted.readings.lastAttackMs).toBe(982.5);
    expect(shifted.events[0].onsetMs).toBe(982.5);
    expect(shifted.readings.frequency).toBe(220);
    expect(shifted.samples).toBe(original.samples);
    // The message that came over the bridge is not written to.
    expect(original.timeMs).toBe(1000);
    expect(original.events[0].onsetMs).toBe(980.5);
  });

  it("leaves a time that never happened at zero", () => {
    const shifted = createStampShifter()(message(), 3);
    expect(shifted.readings.lastOnsetTime).toBe(0);
    expect(shifted.readings.lastSoftAttackMs).toBe(0);
  });

  it("keeps a time where it first put it, however the hand-off drifts", () => {
    const shift = createStampShifter();
    const first = shift(message({ readings: { lastOnsetTime: 1000 }, events: [{ onsetMs: 990, pitchHz: 0, peakVolume: 0.1, attack: "reading" }] }), 2);
    // Next window: the same onset is still the latest, and the event's attack
    // spectrum arrives — under a hand-off that has drifted.
    const second = shift(message({ timeMs: 1043, readings: { lastOnsetTime: 1000 }, attacks: [{ onsetMs: 990, attack: null }] }), 5);
    expect(second.readings.lastOnsetTime).toBe(first.readings.lastOnsetTime);
    expect(second.attacks[0].onsetMs).toBe(first.events[0].onsetMs);
    expect(second.timeMs).toBe(1048);
  });
});
