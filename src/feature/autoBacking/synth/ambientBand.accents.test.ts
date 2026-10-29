import { describe, expect, it, vi } from "vitest";

import { AmbientBand } from "./ambientBand";

/** An AudioParam that records nothing and accepts everything. */
const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
  cancelAndHoldAtTime: vi.fn(),
});

/** Any node: connects, starts and stops; any other property is a param. */
const node = (): any =>
  new Proxy({} as Record<string | symbol, unknown>, {
    get(target, key) {
      if (!(key in target)) {
        target[key] =
          key === "connect"
            ? (next: unknown) => next
            : key === "disconnect" || key === "start" || key === "stop"
              ? vi.fn()
              : param();
      }
      return target[key];
    },
  });

const fakeContext = () =>
  ({
    sampleRate: 8000,
    currentTime: 0,
    createBuffer: (channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
      numberOfChannels: channels,
    }),
    createGain: node,
    createBiquadFilter: node,
    createDynamicsCompressor: node,
    createConvolver: node,
    createDelay: node,
    createStereoPanner: node,
    createOscillator: node,
    createWaveShaper: node,
    createBufferSource: node,
  }) as unknown as BaseAudioContext;

const bandWithSpies = () => {
  const band = new AmbientBand(fakeContext(), node());
  // The voices are private; the test watches them all the same.
  const voices = band as unknown as Record<"clap" | "dip" | "thump" | "wash", (time: number, v: number) => void>;
  const spy = (name: keyof typeof voices) => vi.spyOn(voices, name);
  return { band, clap: spy("clap"), dip: spy("dip"), thump: spy("thump"), wash: spy("wash") };
};

describe("the band's fight accents", () => {
  it("rolls claps into an attack: eighths, then sixteenths over the last beat, louder on", () => {
    const { band, clap } = bandWithSpies();
    band.roll(2, 4, 0.5);
    const times = clap.mock.calls.map(([time]) => time);
    expect(times).toEqual([2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.625, 3.75, 3.875]);
    const velocities = clap.mock.calls.map(([, v]) => v as number);
    expect([...velocities].sort((a, b) => a - b)).toEqual(velocities);
  });

  it("muffles the band only for a hit taken", () => {
    const { band, dip, thump, wash } = bandWithSpies();
    band.accent("strike", 1);
    expect(thump).toHaveBeenCalled();
    expect(wash).toHaveBeenCalled();
    expect(dip).not.toHaveBeenCalled();
    band.accent("impact", 2);
    expect(dip).toHaveBeenCalledWith(2, expect.any(Number));
  });

  it("plays every layer until something steers it", () => {
    const { band } = bandWithSpies();
    expect(band.energyAt(1)).toBeNull();
    expect(band.plays(4, 1)).toBe(true);
    expect(band.plays(undefined, 1)).toBe(true);
    // The heartbeat only for a player in danger.
    expect(band.plays(-1, 1)).toBe(false);
    band.setDanger(true);
    expect(band.plays(-1, 1)).toBe(true);
  });

  it("plays the layers its energy reaches, a new call replacing the plans after it", () => {
    const { band } = bandWithSpies();
    band.setEnergy(1, 0);
    band.setEnergy(4, 2);
    band.setEnergy(2, 4);
    expect([0.5, 2.5, 4.5].map((t) => band.energyAt(t))).toEqual([1, 4, 2]);
    expect(band.plays(3, 2.5)).toBe(true);
    expect(band.plays(3, 4.5)).toBe(false);
    // A miss at 3 cuts the boost and drops the plan for 4.
    band.setEnergy(1, 3);
    expect([2.5, 3.5, 4.5].map((t) => band.energyAt(t))).toEqual([4, 1, 1]);
    band.resetLive();
    expect(band.energyAt(4.5)).toBeNull();
  });

  it("comes into a rage at the time it is given", () => {
    const { band } = bandWithSpies();
    const raging = (time: number) => (band as unknown as { raging: (t: number) => boolean }).raging(time);
    band.setRage(true, 8);
    expect(raging(7.9)).toBe(false);
    expect(raging(8)).toBe(true);
    band.setRage(false);
    expect(raging(9)).toBe(false);
  });
});
