import { describe, expect, it } from "vitest";

import type { Spectrum } from "./chordTones";
import {
  CHORD_TONE_HIT,
  CHORD_TONE_HOLD_MS,
  createChordToneEvidence,
  harmonicFor,
  isChordToneSounding,
  isNoteSoundingAtAnyHarmonic,
  spectrumFromAnalyser,
} from "./chordTones";
import { createPcmSpectrum } from "./pcmSpectrum";

const RATE = 48000;
const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

const spectrumOf = (samples: Float32Array): Spectrum => {
  const pcm = createPcmSpectrum(RATE);
  pcm.push(samples);
  return pcm.read()!;
};

const sine = (freq: number, amplitude = 0.1, length = 8192) =>
  Float32Array.from(
    { length },
    (_, n) => amplitude * Math.sin((2 * Math.PI * freq * n) / RATE),
  );

const mix = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts[0].length);
  for (const part of parts)
    for (let i = 0; i < out.length; i++) out[i] += part[i];
  return out;
};

describe("harmonicFor", () => {
  it("reads high notes at their fundamental and the low strings at a harmonic", () => {
    const binHz = RATE / 8192;
    expect(harmonicFor(midiHz(64), binHz)).toBe(1); // E4
    expect(harmonicFor(midiHz(57), binHz)).toBe(1); // A3
    expect(harmonicFor(midiHz(40), binHz)).toBe(3); // E2 — its semitones are 5 Hz apart
  });
});

describe("isNoteSoundingAtAnyHarmonic", () => {
  /** A low note with the given harmonic levels, h1 first. */
  const note = (midi: number, levels: number[]) =>
    mix(...levels.map((level, i) => sine(midiHz(midi) * (i + 1), 0.1 * level)));
  const E2 = midiHz(40);
  // A dark low E: its 3rd harmonic — where E2 is first resolvable — all but gone.
  const dark = note(40, [1, 0.8, 0.02, 0.5, 0.4, 0.3]);

  it("hears a dark low note whose first resolvable harmonic is faint", () => {
    expect(harmonicFor(E2, RATE / 8192)).toBe(3);
    expect(isChordToneSounding(spectrumOf(dark), E2, CHORD_TONE_HIT)).toBe(false);
    expect(isNoteSoundingAtAnyHarmonic(spectrumOf(dark), E2, CHORD_TONE_HIT)).toBe(true);
  });

  it("still doesn't hear it in the note a fret away, dark or bright", () => {
    for (const levels of [[1, 0.8, 0.02, 0.5, 0.4, 0.3], [1, 0.7, 0.6, 0.5, 0.4, 0.3]]) {
      expect(isNoteSoundingAtAnyHarmonic(spectrumOf(note(39, levels)), E2, CHORD_TONE_HIT)).toBe(false);
      expect(isNoteSoundingAtAnyHarmonic(spectrumOf(note(41, levels)), E2, CHORD_TONE_HIT)).toBe(false);
    }
  });
});

describe("isChordToneSounding", () => {
  it("hears a note at its own frequency, a little out of tune included", () => {
    expect(
      isChordToneSounding(
        spectrumOf(sine(midiHz(57))),
        midiHz(57),
        CHORD_TONE_HIT,
      ),
    ).toBe(true);
    expect(
      isChordToneSounding(
        spectrumOf(sine(midiHz(57) * Math.pow(2, 20 / 1200))),
        midiHz(57),
        CHORD_TONE_HIT,
      ),
    ).toBe(true);
  });

  it("doesn't hear it in the note a fret away", () => {
    expect(
      isChordToneSounding(
        spectrumOf(sine(midiHz(58))),
        midiHz(57),
        CHORD_TONE_HIT,
      ),
    ).toBe(false);
    expect(
      isChordToneSounding(
        spectrumOf(sine(midiHz(56))),
        midiHz(57),
        CHORD_TONE_HIT,
      ),
    ).toBe(false);
  });

  it("doesn't hear a note lost far under the rest of the chord", () => {
    const heard = spectrumOf(
      mix(sine(midiHz(50), 0.3), sine(midiHz(57), 0.003)),
    );
    expect(isChordToneSounding(heard, midiHz(57), CHORD_TONE_HIT)).toBe(false);
  });

  it("hears nothing in silence", () => {
    const silent: Spectrum = {
      magnitudes: new Float32Array(400),
      binHz: RATE / 8192,
    };
    expect(isChordToneSounding(silent, 220, CHORD_TONE_HIT)).toBe(false);
  });
});

describe("createChordToneEvidence", () => {
  it("counts a tone once it has held across the hold time", () => {
    const evidence = createChordToneEvidence();
    expect(evidence.observe("a", 1, 1000, true)).toBe(false);
    expect(evidence.observe("a", 1, 1000 + CHORD_TONE_HOLD_MS - 1, true)).toBe(
      false,
    );
    expect(evidence.observe("a", 1, 1000 + CHORD_TONE_HOLD_MS, true)).toBe(
      true,
    );
  });

  it("starts over on a new attack, and ignores readings it wasn't heard in", () => {
    const evidence = createChordToneEvidence();
    evidence.observe("a", 1, 1000, true);
    expect(evidence.observe("a", 2, 1100, true)).toBe(false); // the next strum
    expect(evidence.observe("a", 2, 1200, false)).toBe(false);
    expect(evidence.observe("a", 2, 1200, true)).toBe(true);
    evidence.clear();
    expect(evidence.observe("a", 2, 1300, true)).toBe(false);
  });
});

describe("spectrumFromAnalyser", () => {
  it("turns the analyser's decibels into magnitudes, up to the guitar's top", () => {
    const analyser = {
      fftSize: 8192,
      context: { sampleRate: RATE },
      getFloatFrequencyData: (out: Float32Array) => out.fill(-20),
    } as unknown as AnalyserNode;
    const { magnitudes, binHz } = spectrumFromAnalyser(analyser);
    expect(binHz).toBeCloseTo(RATE / 8192);
    expect(magnitudes[10]).toBeCloseTo(0.1);
    expect(magnitudes.length * binHz).toBeLessThan(2010);
  });
});

// ── Strummed on a synthetic guitar ─────────────────────────────────────────
// Karplus–Strong strings, strummed with 5–35 ms between strings at random
// levels (−9…0 dB) and ±15 cents off, over the chord before them, read every
// 16 ms after the strum exactly the way useNoteMatching reads them.

let seed = 0x1234;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
};
const between = (lo: number, hi: number) => lo + (hi - lo) * rnd();

/** One string: plucked at `start`, damped (10 ms) at `stop` when it is struck again. */
const pluck = (
  out: Float32Array,
  start: number,
  freq: number,
  gain: number,
  stop = Infinity,
) => {
  const period = Math.round(RATE / freq);
  const line = new Float32Array(period);
  let smooth = 0;
  for (let i = 0; i < period; i++)
    line[i] = smooth = 0.5 * smooth + 0.5 * (rnd() * 2 - 1);
  const fade = 0.01 * RATE;
  for (let n = start, i = 0; n < out.length; n++) {
    const envelope = n < stop ? 1 : Math.max(0, 1 - (n - stop) / fade);
    if (envelope === 0) break;
    const a = line[i];
    const b = line[(i + 1) % period];
    out[n] += gain * envelope * a;
    line[i] = 0.997 * 0.5 * (a + b);
    i = (i + 1) % period;
  }
};

const OPEN = [0, 64, 59, 55, 50, 45, 40];
type Shape = [string: number, fret: number][];
const notesOf = (shape: Shape) =>
  shape.map(([string, fret]) => midiHz(OPEN[string] + fret));

const STRUM_AT = 1.0;

const strummed = (played: Shape, before: Shape) => {
  const audio = new Float32Array(Math.round(RATE * 1.5));
  for (const [string, fret] of before) {
    const struckAgain = played.some(([s]) => s === string);
    const stop = struckAgain ? Math.round((STRUM_AT + 0.02) * RATE) : Infinity;
    pluck(
      audio,
      Math.round(between(0, 0.03) * RATE),
      midiHz(OPEN[string] + fret),
      Math.pow(10, between(-6, 0) / 20),
      stop,
    );
  }
  for (let i = 0; i < audio.length; i++) audio[i] += 0.0005 * (rnd() * 2 - 1);
  const gapMs = between(5, 35);
  const order =
    rnd() < 0.7
      ? [...played].sort((a, b) => b[0] - a[0])
      : [...played].sort((a, b) => a[0] - b[0]);
  order.forEach(([string, fret], k) => {
    const detuned =
      midiHz(OPEN[string] + fret) * Math.pow(2, between(-15, 15) / 1200);
    pluck(
      audio,
      Math.round((STRUM_AT + (k * gapMs) / 1000) * RATE),
      detuned,
      Math.pow(10, between(-9, 0) / 20),
    );
  });
  return audio;
};

/** How often (%) each note of `expected` is credited when `played` is strummed after `before`. */
const creditRate = (
  expected: Shape,
  played: Shape,
  before: Shape,
  trials = 25,
): number[] => {
  const notes = notesOf(expected);
  const credited = notes.map(() => 0);
  for (let t = 0; t < trials; t++) {
    const audio = strummed(played, before);
    const pcm = createPcmSpectrum(RATE);
    const evidence = createChordToneEvidence();
    const counted = new Set<number>();
    // The onset is reported up to one window after the first string.
    let fed = 0;
    for (let ms = between(5, 45); ms <= 350; ms += 16) {
      const end = Math.round((STRUM_AT + ms / 1000) * RATE);
      pcm.push(audio.subarray(fed, end));
      fed = end;
      const heard = pcm.read();
      notes.forEach((freq, i) => {
        if (!heard || counted.has(i)) return;
        if (
          evidence.observe(
            String(i),
            1,
            ms,
            isChordToneSounding(heard, freq, CHORD_TONE_HIT),
          )
        )
          counted.add(i);
      });
    }
    counted.forEach((i) => credited[i]++);
  }
  return credited.map((count) => Math.round((100 * count) / trials));
};

const D_A: Shape = [
  [3, 2],
  [2, 3],
  [1, 2],
];
const G_TOP: Shape = [
  [3, 0],
  [2, 0],
  [1, 3],
];
const E_OPEN: Shape = [
  [6, 0],
  [5, 2],
  [4, 2],
  [3, 1],
  [2, 0],
  [1, 0],
];
const A_OPEN: Shape = [
  [5, 0],
  [4, 2],
  [3, 2],
  [2, 2],
  [1, 0],
];

describe("chord tones on a strummed guitar", () => {
  it("credits every note of a triad strummed right", () => {
    for (const rate of creditRate(D_A, D_A, G_TOP))
      expect(rate).toBeGreaterThanOrEqual(90);
  }, 30000);

  it("credits every string of an open chord, the low ones included", () => {
    for (const rate of creditRate(E_OPEN, E_OPEN, A_OPEN))
      expect(rate).toBeGreaterThanOrEqual(90);
  }, 30000);

  it("doesn't credit the major third of a minor chord", () => {
    expect(
      creditRate(
        D_A,
        [
          [3, 2],
          [2, 3],
          [1, 1],
        ],
        G_TOP,
      )[2],
    ).toBeLessThanOrEqual(10); // F instead of F#
    expect(
      creditRate(
        E_OPEN,
        [
          [6, 0],
          [5, 2],
          [4, 2],
          [3, 0],
          [2, 0],
          [1, 0],
        ],
        A_OPEN,
      )[3],
    ).toBeLessThanOrEqual(10); // G instead of G#
  }, 30000);

  it("doesn't credit a shape a fret off, or a string that wasn't played", () => {
    for (const rate of creditRate(
      D_A,
      [
        [3, 3],
        [2, 4],
        [1, 3],
      ],
      G_TOP,
    ))
      expect(rate).toBeLessThanOrEqual(10);
    expect(
      creditRate(
        D_A,
        [
          [3, 2],
          [2, 3],
        ],
        G_TOP,
      )[2],
    ).toBeLessThanOrEqual(10);
  }, 30000);
});
