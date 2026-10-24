import { describe, expect, it } from "vitest";

import {
  canHearPilot,
  createPilotTracker,
  createProbeSignal,
  isProbeHeard,
  PILOT_HOLD_MS,
  PILOT_HZ,
  PILOT_SNR_DB,
  pilotSnrDb,
  PROBE_DROPS,
  PROBE_HEARD_CORRELATION,
  PROBE_MS,
  probeCaptureLength,
  probeMatch,
} from "./playbackLeak";

const RATE = 48000;

/** Deterministic noise (mulberry32), so a run can't pass by luck. */
const noise = (length: number, amplitude: number, seed = 1): Float32Array => {
  let state = seed;
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    out[i] = amplitude * ((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1);
  }
  return out;
};

/** A D/A triad on the top strings with harmonics up to the 8th — guitar in the probe's band. */
const strum = (length: number, sampleRate = RATE): Float32Array => {
  const out = new Float32Array(length);
  for (const f of [220, 293.66, 369.99]) {
    for (let h = 1; h <= 8; h++) {
      for (let n = 0; n < length; n++) {
        out[n] +=
          (0.08 / h) *
          Math.exp(-n / sampleRate / 0.6) *
          Math.sin((2 * Math.PI * f * h * n) / sampleRate);
      }
    }
  }
  return out;
};

// ── The metronome, rendered offline after clickTones.ts ────────────────────
// It plays out of the speakers for honest players too, so none of its sounds
// may pass for the probe.

type Wave = "sine" | "square" | "triangle";
type Kind = "accent" | "beat" | "sub";
const PITCH_RATIO: Record<Kind, number> = { accent: 1.5, beat: 1, sub: 0.75 };
const CLASSIC_HZ: Record<Kind, number> = { accent: 1200, beat: 800, sub: 600 };

const wave = (type: Wave, phase: number) =>
  type === "sine"
    ? Math.sin(phase)
    : type === "square"
      ? Math.sin(phase) >= 0
        ? 1
        : -1
      : (2 / Math.PI) * Math.asin(Math.sin(phase));

/** A tone with an exponential release, optionally gliding to `glideTo`. */
const tone = (
  out: Float32Array,
  start: number,
  freq: number,
  peak: number,
  seconds: number,
  type: Wave = "sine",
  glideTo?: number,
) => {
  let phase = 0;
  for (let n = 0; n < seconds * RATE && start + n < out.length; n++) {
    const t = n / RATE;
    phase +=
      (2 *
        Math.PI *
        (glideTo ? freq * Math.pow(glideTo / freq, t / seconds) : freq)) /
      RATE;
    out[start + n] +=
      peak * Math.pow(0.0001 / peak, t / seconds) * wave(type, phase);
  }
};

/** A high-passed noise burst with an exponential release. */
const hiss = (
  out: Float32Array,
  start: number,
  peak: number,
  seconds: number,
  highPassHz: number,
) => {
  const burst = noise(Math.round(seconds * RATE), 1, start + 11);
  const a = Math.exp((-2 * Math.PI * highPassHz) / RATE);
  let previousIn = 0;
  let previousOut = 0;
  for (let n = 0; n < burst.length && start + n < out.length; n++) {
    previousOut = a * (previousOut + burst[n] - previousIn);
    previousIn = burst[n];
    out[start + n] +=
      peak * Math.pow(0.0001 / peak, n / RATE / seconds) * previousOut;
  }
};

const METRONOME: Record<
  string,
  (out: Float32Array, start: number, kind: Kind, peak: number) => void
> = {
  classic: (o, s, k, p) => tone(o, s, CLASSIC_HZ[k], p, 0.1),
  wood: (o, s, k, p) => {
    const base = 900 * PITCH_RATIO[k];
    tone(o, s, base, p, 0.07, "sine", base * 0.45);
    tone(o, s, base * 2.4, p * 0.25, 0.025, "triangle");
  },
  digital: (o, s, k, p) =>
    tone(o, s, 1000 * PITCH_RATIO[k], p * 0.6, 0.035, "square"),
  sticks: (o, s, k, p) => {
    hiss(o, s, p, 0.02, 2500 * PITCH_RATIO[k]);
    tone(o, s, 1800 * PITCH_RATIO[k], p * 0.5, 0.015, "triangle");
  },
  hihat: (o, s, k, p) =>
    hiss(o, s, p * 0.8, k === "accent" ? 0.09 : 0.05, 7000),
  cowbell: (o, s, k, p) => {
    const base = 587 * PITCH_RATIO[k];
    tone(o, s, base, p * 0.5, 0.12, "square");
    tone(o, s, base * 1.44, p * 0.5, 0.12, "square");
  },
};

/** A click every 125 ms — eighths at 240 BPM, as busy as the click gets — at full volume. */
const clicks = (length: number, sound = "classic"): Float32Array => {
  const out = new Float32Array(length);
  const kinds: Kind[] = ["accent", "sub", "beat", "sub"];
  for (let i = 0, start = 0; start < length; i++, start += RATE / 8) {
    const kind = kinds[i % kinds.length];
    METRONOME[sound](out, start, kind, 0.85 * (kind === "sub" ? 0.5 : 1));
  }
  return out;
};

/** The probe as a room returns it: delayed, quieter, with an echo, over what the mic hears anyway. */
const throughRoom = (
  bed: Float32Array,
  delayMs: number,
  gain: number,
  sampleRate = RATE,
): Float32Array => {
  const out = Float32Array.from(bed);
  const probe = createProbeSignal(sampleRate);
  const delay = Math.round((delayMs / 1000) * sampleRate);
  const echo = Math.round(0.012 * sampleRate);
  for (let n = 0; n < probe.length; n++) {
    if (delay + n < out.length) out[delay + n] += gain * probe[n];
    if (delay + echo + n < out.length)
      out[delay + echo + n] += 0.5 * gain * probe[n];
  }
  return out;
};

const capture = (sampleRate = RATE) => probeCaptureLength(sampleRate);

/** Only some of the probe's drops, exactly as it plays them, the rest left silent. */
const someDrops = (keep: number[]): Float32Array => {
  const probe = createProbeSignal(RATE);
  const out = new Float32Array(capture());
  const at = Math.round(0.4 * RATE);
  PROBE_DROPS.forEach(({ atMs }, i) => {
    if (!keep.includes(i)) return;
    const endMs = PROBE_DROPS[i + 1]?.atMs ?? PROBE_MS;
    const end = Math.min(probe.length, Math.round((endMs / 1000) * RATE));
    for (let n = Math.round((atMs / 1000) * RATE); n < end; n++)
      out[at + n] = 0.3 * probe[n];
  });
  return out;
};

/** A linear sweep at a flat level — the kind of figure the probe used to be. */
const chirp = (fromHz: number, toHz: number, ms: number): Float32Array => {
  const out = new Float32Array(capture());
  const seconds = ms / 1000;
  const rate = (toHz - fromHz) / seconds;
  for (let n = 0; n < seconds * RATE; n++) {
    const t = n / RATE;
    out[2000 + n] =
      0.3 * Math.sin(2 * Math.PI * (fromHz * t + 0.5 * rate * t * t));
  }
  return out;
};

/** A string squeaking under a sliding hand: noise through a resonance that sweeps up and down. */
const squeak = (seed: number): Float32Array => {
  const excitation = noise(capture(), 0.02, seed);
  const out = new Float32Array(excitation.length);
  let y1 = 0;
  let y2 = 0;
  for (let n = 0; n < out.length; n++) {
    const hz =
      1500 + 2500 * (0.5 + 0.5 * Math.sin((2 * Math.PI * 2.3 * n) / RATE));
    const pole = 0.995;
    const y =
      excitation[n] +
      2 * pole * Math.cos((2 * Math.PI * hz) / RATE) * y1 -
      pole * pole * y2;
    y2 = y1;
    y1 = y;
    out[n] = y;
  }
  return out;
};

describe("probeMatch", () => {
  it("hears the probe after a Bluetooth-sized delay, under noise and an echo, and how loud it came back", () => {
    const match = probeMatch(
      throughRoom(noise(capture(), 0.02), 320, 0.05),
      RATE,
    );
    expect(isProbeHeard(match)).toBe(true);
    expect(match.level).toBeCloseTo(0.05, 2);
  });

  it("hears it under a strummed chord and the metronome", () => {
    const bed = strum(capture());
    const click = clicks(capture());
    const roomNoise = noise(capture(), 0.01, 7);
    for (let i = 0; i < bed.length; i++) bed[i] += click[i] + roomNoise[i];
    expect(isProbeHeard(probeMatch(throughRoom(bed, 80, 0.08), RATE))).toBe(
      true,
    );
  });

  it("hears it at the interface's own rate", () => {
    const rate = 44100;
    const recording = throughRoom(noise(capture(rate), 0.02), 150, 0.05, rate);
    expect(isProbeHeard(probeMatch(recording, rate))).toBe(true);
  });

  it("doesn't take noise or guitar for the probe", () => {
    const length = capture();
    for (const seed of [1, 2, 3]) {
      expect(
        probeMatch(noise(length, 0.05, seed), RATE).correlation,
      ).toBeLessThan(PROBE_HEARD_CORRELATION / 2);
    }
    expect(probeMatch(strum(length), RATE).correlation).toBeLessThan(
      PROBE_HEARD_CORRELATION / 2,
    );
  });

  it.each([[[0]], [[1]], [[2]], [[0, 1]], [[1, 2]], [[0, 2]]])(
    "doesn't take drops %j alone for the probe — the figure needs all three",
    (keep) => {
      expect(isProbeHeard(probeMatch(someDrops(keep), RATE))).toBe(false);
    },
  );

  it("doesn't take a lone sweep or a squeaking string for the probe", () => {
    expect(isProbeHeard(probeMatch(chirp(1500, 5000, 250), RATE))).toBe(false);
    for (const seed of [1, 2, 3])
      expect(isProbeHeard(probeMatch(squeak(seed), RATE))).toBe(false);
  });

  it.each(Object.keys(METRONOME))(
    "doesn't take the %s metronome for the probe, and still hears the probe over it",
    (sound) => {
      const length = capture();
      expect(probeMatch(clicks(length, sound), RATE).correlation).toBeLessThan(
        PROBE_HEARD_CORRELATION / 2,
      );
      // A probe at a tenth of the click's level.
      expect(
        isProbeHeard(
          probeMatch(throughRoom(clicks(length, sound), 300, 0.085), RATE),
        ),
      ).toBe(true);
    },
  );

  it("reads nothing in silence", () => {
    expect(probeMatch(new Float32Array(capture()), RATE)).toEqual({
      correlation: 0,
      weakestDrop: 0,
      level: 0,
    });
  });
});

describe("pilotSnrDb", () => {
  const pilotTone = (amplitude: number, length = 2048, sampleRate = RATE) =>
    Float32Array.from(
      { length },
      (_, n) => amplitude * Math.sin((2 * Math.PI * PILOT_HZ * n) / sampleRate),
    );

  it("picks out a quiet pilot over the room's noise", () => {
    const bed = noise(2048, 0.01);
    const pilot = pilotTone(0.002);
    for (let i = 0; i < bed.length; i++) bed[i] += pilot[i];
    expect(pilotSnrDb(bed, RATE)).toBeGreaterThanOrEqual(PILOT_SNR_DB);
  });

  it("stays low for noise, a strum and the metronome", () => {
    expect(pilotSnrDb(noise(2048, 0.05), RATE)!).toBeLessThan(PILOT_SNR_DB);
    expect(pilotSnrDb(strum(2048), RATE)!).toBeLessThan(PILOT_SNR_DB);
    for (const sound of Object.keys(METRONOME)) {
      expect(pilotSnrDb(clicks(2048, sound), RATE)!).toBeLessThan(PILOT_SNR_DB);
    }
  });

  it("has nothing to say where the input can't carry the pilot", () => {
    expect(canHearPilot(16000)).toBe(false);
    expect(pilotSnrDb(new Float32Array(2048), 32000)).toBeNull();
  });
});

describe("createPilotTracker", () => {
  it("hears the pilot only once it has stood unbroken", () => {
    const tracker = createPilotTracker();
    const windowMs = (2048 / RATE) * 1000;
    const windows = Math.ceil(PILOT_HOLD_MS / windowMs);
    for (let i = 0; i < windows - 1; i++)
      expect(tracker.push(PILOT_SNR_DB + 6, windowMs)).toBe(false);
    expect(tracker.push(PILOT_SNR_DB - 1, windowMs)).toBe(false); // a break starts it over
    for (let i = 0; i < windows - 1; i++)
      tracker.push(PILOT_SNR_DB + 6, windowMs);
    expect(tracker.push(PILOT_SNR_DB + 6, windowMs)).toBe(true);
  });
});
