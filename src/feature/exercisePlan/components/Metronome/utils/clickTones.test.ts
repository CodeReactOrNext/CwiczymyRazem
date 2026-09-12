import { describe, expect, it, vi } from "vitest";

import {
  type ClickKind,
  DEFAULT_METRONOME_SOUND,
  METRONOME_SOUND_ORDER,
  METRONOME_SOUNDS,
  type MetronomeSoundKey,
  normalizeMetronomeSound,
  scheduleClick,
} from "./clickTones";

// A minimal Web Audio stand-in: enough surface for every sound to build its
// graph, while recording what got scheduled so the tests can assert on it.
class FakeParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

function fakeNode() {
  return { connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
}

function makeContext() {
  const started: { start: number; stop: number }[] = [];
  const gains: FakeParam[] = [];
  const track = <T extends ReturnType<typeof fakeNode>>(node: T) => {
    node.start.mockImplementation((t: number) => {
      started.push({ start: t, stop: NaN });
    });
    node.stop.mockImplementation((t: number) => {
      started[started.length - 1].stop = t;
    });
    return node;
  };
  const context = {
    sampleRate: 48_000,
    destination: { connect: vi.fn() },
    createOscillator: vi.fn(() =>
      track({ ...fakeNode(), type: "sine", frequency: new FakeParam() }),
    ),
    createGain: vi.fn(() => {
      const gain = new FakeParam();
      gains.push(gain);
      return { ...fakeNode(), gain };
    }),
    createBiquadFilter: vi.fn(() => ({
      ...fakeNode(),
      type: "lowpass",
      frequency: new FakeParam(),
      Q: new FakeParam(),
    })),
    createBufferSource: vi.fn(() => track({ ...fakeNode(), buffer: null })),
    createBuffer: vi.fn((_ch: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
  };
  return {
    context: context as unknown as BaseAudioContext,
    raw: context,
    started,
    gains,
  };
}

const KINDS: ClickKind[] = ["accent", "beat", "sub"];

describe("METRONOME_SOUNDS", () => {
  it("lists every sound exactly once in the picker order", () => {
    const keys = Object.keys(METRONOME_SOUNDS).sort();
    expect([...METRONOME_SOUND_ORDER].sort()).toEqual(keys);
    expect(new Set(METRONOME_SOUND_ORDER).size).toBe(
      METRONOME_SOUND_ORDER.length,
    );
    expect(METRONOME_SOUND_ORDER).toContain(DEFAULT_METRONOME_SOUND);
  });

  it("gives every sound a label and a description", () => {
    for (const key of METRONOME_SOUND_ORDER) {
      expect(METRONOME_SOUNDS[key].label).not.toBe("");
      expect(METRONOME_SOUNDS[key].desc).not.toBe("");
    }
  });

  it.each(
    METRONOME_SOUND_ORDER.flatMap((s) => KINDS.map((k) => [s, k] as const)),
  )(
    "%s schedules a short click at the requested time for a %s",
    (sound, kind) => {
      const { context, raw, started } = makeContext();
      scheduleClick(
        context,
        raw.destination as unknown as AudioNode,
        1.25,
        kind,
        1,
        sound,
      );

      expect(started.length).toBeGreaterThan(0);
      for (const { start, stop } of started) {
        expect(start).toBe(1.25);
        // Every click is a short percussive hit — never a sustained tone.
        expect(stop).toBeGreaterThan(1.25);
        expect(stop).toBeLessThanOrEqual(1.25 + 0.2);
      }
    },
  );

  it.each(METRONOME_SOUND_ORDER)(
    "%s keeps a subdivision quieter than the beat",
    (sound) => {
      const peakFor = (kind: ClickKind) => {
        const { context, raw, gains } = makeContext();
        scheduleClick(
          context,
          raw.destination as unknown as AudioNode,
          0,
          kind,
          1,
          sound,
        );
        return Math.max(
          ...gains.map(
            (g) =>
              (g.linearRampToValueAtTime.mock.calls[0]?.[0] as number) ?? 0,
          ),
        );
      };
      expect(peakFor("sub")).toBeLessThan(peakFor("beat"));
    },
  );

  it("scales the peak by the volume and stays silent at zero", () => {
    const loud = makeContext();
    scheduleClick(
      loud.context,
      loud.raw.destination as unknown as AudioNode,
      0,
      "beat",
      1,
      "classic",
    );
    const quiet = makeContext();
    scheduleClick(
      quiet.context,
      quiet.raw.destination as unknown as AudioNode,
      0,
      "beat",
      0.5,
      "classic",
    );
    const peak = (c: ReturnType<typeof makeContext>) =>
      c.gains[0].linearRampToValueAtTime.mock.calls[0][0] as number;
    expect(peak(quiet)).toBeCloseTo(peak(loud) / 2);

    const muted = makeContext();
    scheduleClick(
      muted.context,
      muted.raw.destination as unknown as AudioNode,
      0,
      "beat",
      0,
      "classic",
    );
    expect(muted.started).toHaveLength(0);
  });

  it("keeps the classic click on the original 1200/800/600 Hz tones", () => {
    const freqFor = (kind: ClickKind) => {
      const { context, raw } = makeContext();
      scheduleClick(
        context,
        raw.destination as unknown as AudioNode,
        0,
        kind,
        1,
        "classic",
      );
      const osc = raw.createOscillator.mock.results[0].value as {
        frequency: FakeParam;
      };
      return osc.frequency.value;
    };
    expect(freqFor("accent")).toBe(1200);
    expect(freqFor("beat")).toBe(800);
    expect(freqFor("sub")).toBe(600);
  });

  it("reuses one noise buffer per context", () => {
    const { context, raw } = makeContext();
    scheduleClick(
      context,
      raw.destination as unknown as AudioNode,
      0,
      "beat",
      1,
      "hihat",
    );
    scheduleClick(
      context,
      raw.destination as unknown as AudioNode,
      1,
      "beat",
      1,
      "sticks",
    );
    expect(raw.createBuffer).toHaveBeenCalledTimes(1);
  });
});

describe("normalizeMetronomeSound", () => {
  it("keeps every known sound", () => {
    for (const key of METRONOME_SOUND_ORDER) {
      expect(normalizeMetronomeSound(key)).toBe(key);
    }
  });

  it("falls back to the classic click for anything unrecognised", () => {
    expect(normalizeMetronomeSound(undefined)).toBe(DEFAULT_METRONOME_SOUND);
    expect(normalizeMetronomeSound(null)).toBe(DEFAULT_METRONOME_SOUND);
    expect(normalizeMetronomeSound("")).toBe(DEFAULT_METRONOME_SOUND);
    expect(normalizeMetronomeSound("laser")).toBe(DEFAULT_METRONOME_SOUND);
    expect(normalizeMetronomeSound(42)).toBe(DEFAULT_METRONOME_SOUND);
    // Prototype keys must not sneak through the `in` check.
    expect(normalizeMetronomeSound("toString")).toBe(DEFAULT_METRONOME_SOUND);
  });

  it("falls through to the classic click when scheduling an unknown key", () => {
    const { context, raw } = makeContext();
    scheduleClick(
      context,
      raw.destination as unknown as AudioNode,
      0,
      "beat",
      1,
      "laser" as MetronomeSoundKey,
    );
    const osc = raw.createOscillator.mock.results[0].value as {
      frequency: FakeParam;
    };
    expect(osc.frequency.value).toBe(800);
  });
});
