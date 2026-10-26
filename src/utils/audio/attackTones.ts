// Which note an attack struck, read off what got louder at it.
//
// A let-ring arpeggio keeps three or four strings sounding at once, and the
// pitch detector follows only one of them: whichever dominates, usually the
// bass. Under a ringing B2 a freshly picked B3 reads as B2 (the two together
// repeat at B2's period), so a note played right was never credited.
//
// What sets the struck note apart is that it is new. Each attack is looked at
// twice — just before it and just after it — and only what rose counts:
// strings that were already ringing hold level or fade and drop out, however
// loud they are. On that rise the note has to show at its own harmonics, and
// then beat every note it could be mistaken for on the harmonics only one of
// the two can have:
//   • a fret or two away, a third, a fourth or a fifth: the target's own
//     harmonics have to rise more than the other note's own;
//   • an octave or an octave and a fifth above (2f, 3f — every harmonic of
//     which is also the target's): the harmonics only the target has must
//     rise too;
//   • a note the target is a harmonic of (f/2 … f/8 — which has every
//     harmonic the target has): the harmonics only that lower note has must
//     not rise.
//
// It only ever adds: a note it confirms counts, a note it can't confirm is left
// to the pitch detector exactly as before. Re-picking a string that still rings
// barely changes its spectrum, and in a let-ring passage most notes are just
// that — so it must never stand between a player and a note the pitch heard.

import { createFft } from "./fft";

/** What an attack changed: the magnitude spectrum just before it and just after it. */
export interface AttackSpectra {
  before: Float32Array;
  after: Float32Array;
  binHz: number;
}

/** An attack's spectra as they stand: still being captured, read, or not readable. */
export type AttackReading = AttackSpectra | null | "reading";

/** The spectra once they're in — null while still reading or when there are none. */
export const spectraOf = (reading: AttackReading | undefined): AttackSpectra | null =>
  reading && reading !== "reading" ? reading : null;

/** Each look spans ~85 ms — enough bins to tell a semitone apart at a note's
 *  2nd–5th harmonic, short enough to end before the next eighth at 160 BPM. */
const WINDOW_MS = 85;
/** "Before" stops short of the attack: the onset is timed to ±10 ms. */
const PRE_GAP_MS = 10;
/** "After" starts once the pick's own noise is over. The verdict comes ~170 ms
 *  after the attack (see settledAfter) — inside every note's hit window. */
const POST_GAP_MS = 20;
/** The onset detector reports an attack up to this many samples after it
 *  happened: its own 2048-sample window, a capture window, and a hop. */
const ONSET_REPORT_SAMPLES = 2 * 2048 + 512;
/** Everything checked sits below this: a high E's 4th harmonic, and slack. */
const TOP_HZ = 2000;
/** Nothing below this is read — mains hum and rumble live there. */
const LOWEST_HZ = 60;
/** Rivals are looked for from a semitone under the low E up to here. */
const RIVAL_RANGE_HZ: [number, number] = [75, 1400];

export const attackFftSize = (sampleRate: number): number =>
  2 ** Math.min(15, Math.max(11, Math.round(Math.log2((sampleRate * WINDOW_MS) / 1000))));

/** The Blackman window, as the chord spectrum uses (pcmSpectrum.ts). */
const blackman = (size: number): Float64Array =>
  Float64Array.from({ length: size }, (_, n) => {
    const phase = (2 * Math.PI * n) / size;
    return 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(2 * phase);
  });

export interface AttackSpectraTap {
  /** Appends captured samples (raw, any block size). Settles every attack whose verdict is now due. */
  push(samples: Float32Array): void;
  /**
   * Looks at the attack at absolute sample `onset` (counted from the first
   * push). `receive` gets both looks once the "after" is in (~170 ms past the
   * attack) — or null when it can't be read cleanly: the next attack came
   * before its "after" was over (a fast run, where the pitch path already does
   * well), or the "before" has already left the buffer.
   */
  mark(onset: number, receive: (spectra: AttackSpectra | null) => void): void;
  /** Samples pushed so far. */
  readonly written: number;
}

export function createAttackSpectraTap(sampleRate: number): AttackSpectraTap {
  const size = attackFftSize(sampleRate);
  const binHz = sampleRate / size;
  const bins = Math.min(size / 2, Math.ceil(TOP_HZ / binHz) + 2);
  const preGap = Math.round((PRE_GAP_MS / 1000) * sampleRate);
  const postGap = Math.round((POST_GAP_MS / 1000) * sampleRate);
  /** An attack landing this soon after another cuts that one's "after" short. */
  const cutoff = postGap + 0.75 * size;
  // Held until any attack that could cut it short would have been reported —
  // the detector reports late, and a verdict out first can't be taken back.
  const settledAfter = postGap + Math.max(size, cutoff + ONSET_REPORT_SAMPLES);
  // Room for "before", the wait for the verdict, and a capture block.
  const ringSize = 2 ** Math.ceil(Math.log2(size + preGap + settledAfter + 2 * 2048));
  const ring = new Float32Array(ringSize);
  const taper = blackman(size);
  const fft = createFft(size);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let written = 0;
  let pending: { onset: number; before: Float32Array; receive: (spectra: AttackSpectra | null) => void }[] = [];

  const spectrumFrom = (start: number): Float32Array => {
    for (let i = 0; i < size; i++) {
      re[i] = ring[(start + i) % ringSize] * taper[i];
      im[i] = 0;
    }
    fft(re, im);
    const magnitudes = new Float32Array(bins);
    for (let k = 0; k < bins; k++) magnitudes[k] = Math.hypot(re[k], im[k]);
    return magnitudes;
  };

  const settle = () => {
    pending = pending.filter(({ onset, before, receive }) => {
      if (written < onset + settledAfter) return true;
      receive({ before, after: spectrumFrom(onset + postGap), binHz });
      return false;
    });
  };

  return {
    push(samples) {
      for (let i = 0; i < samples.length; i++) ring[(written + i) % ringSize] = samples[i];
      written += samples.length;
      settle();
    },
    mark(onset, receive) {
      // This attack lands inside the one before's "after" (past its tapered
      // tail): that look would hold both notes, so it is dropped.
      pending = pending.filter((earlier) => {
        if (onset >= earlier.onset + cutoff) return true;
        earlier.receive(null);
        return false;
      });
      // Its "before" has to be all there: not reaching back past the first
      // sample, nor out of the buffer already.
      if (onset - preGap - size < Math.max(0, written - ringSize)) {
        receive(null);
        return;
      }
      // Read now: by the verdict it may have left the buffer.
      const before = spectrumFrom(onset - preGap - size);
      pending.push({ onset, before, receive });
      settle();
    },
    get written() {
      return written;
    },
  };
}

// ── Reading an attack ──────────────────────────────────────────────────────

/** How far off its written pitch a string may sit (cents) — as chordTones.ts. */
const SEARCH_CENTS = 30;
/** Harmonics of two notes closer than this (bins) can't be told apart. */
const SEPARATE_BINS = 2.5;
/** How many harmonics each comparison averages over. */
const HARMONICS = 4;
/** Presence: the note's first harmonics rose by at least this share of the
 *  strongest rise anywhere — it is a real part of what the attack brought. */
const PRESENT = 0.08;
/** A note a fret or more away: the target's own harmonics must rise more than its own. */
const BEATS_NEIGHBOUR = 1;
/** 2f / 3f: the harmonics only the target has must rise at least this share of the shared ones. */
const OWN_ABOVE = 0.45;
/** f/2, f/3: no harmonic only that lower note has may rise past this share of the shared ones. */
const NONE_BELOW = 0.5;
/** Every note an attack is most often mistaken for, as a frequency ratio to the
 *  target: a fret to a fifth either way, and the notes it is a harmonic of or
 *  that are harmonics of it — a high note's comb is a lower note's upper half. */
const RIVALS: number[] = [
  ...[-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7].map((semitones) => Math.pow(2, semitones / 12)),
  2, 3, 4,
  1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8,
];

const levelNear = (spectrum: Float32Array, binHz: number, freq: number): number => {
  const lo = Math.round((freq * Math.pow(2, -SEARCH_CENTS / 1200)) / binHz);
  const hi = Math.round((freq * Math.pow(2, SEARCH_CENTS / 1200)) / binHz);
  let level = 0;
  for (let k = lo; k <= hi; k++) level = Math.max(level, spectrum[k] ?? 0);
  return level;
};

/** The first harmonics of `freq`, from the fundamental up. */
const harmonicsOf = (freq: number): number[] => {
  const out: number[] = [];
  for (let h = 1; out.length < HARMONICS && h * freq < TOP_HZ - 50; h++) if (h * freq >= LOWEST_HZ) out.push(h * freq);
  return out;
};

/** Harmonics of `a` that no harmonic of `b` sits on — where only `a` can put energy. */
const ownHarmonics = (a: number, b: number, binHz: number): number[] => {
  const out: number[] = [];
  for (let h = 1; out.length < HARMONICS && h * a < TOP_HZ - 50; h++) {
    const x = h * a;
    if (x < LOWEST_HZ) continue;
    if (Math.abs(x - Math.max(1, Math.round(x / b)) * b) < SEPARATE_BINS * binHz) continue;
    out.push(x);
  }
  return out;
};

interface Rise {
  at: (freq: number) => number;
  mean: (freqs: number[]) => number;
  top: number;
  binHz: number;
}

const riseCache = new WeakMap<AttackSpectra, Rise>();

/** What rose at the attack, bin by bin: strings that held level or faded are gone. */
const riseOf = (attack: AttackSpectra): Rise => {
  const cached = riseCache.get(attack);
  if (cached) return cached;
  const { before, after, binHz } = attack;
  // Measured against the partials' last level, not against a guess of how they
  // would have faded: such a guess (tried 2026-10-26) caught 3% more strings
  // picked again while ringing, and let a string merely ringing on pass for a
  // new attack 28% of the time instead of 8%.
  const rise = Float32Array.from(after, (level, k) => Math.max(0, level - before[k]));
  let top = 0;
  for (let k = Math.floor(LOWEST_HZ / binHz); k < rise.length; k++) top = Math.max(top, rise[k]);
  const at = (freq: number) => levelNear(rise, binHz, freq);
  const result: Rise = { at, top, binHz, mean: (freqs) => (freqs.length ? freqs.reduce((sum, f) => sum + at(f), 0) / freqs.length : 0) };
  riseCache.set(attack, result);
  return result;
};

function struckOn(rise: Rise, freq: number): boolean {
  // Presence: the note's first harmonics are a real part of what the attack brought.
  if (rise.top <= 0 || rise.mean(harmonicsOf(freq)) < PRESENT * rise.top) return false;
  // Identity: it beats every note it could be mistaken for.
  for (const ratio of RIVALS) {
    const rival = freq * ratio;
    if (rival < RIVAL_RANGE_HZ[0] || rival > RIVAL_RANGE_HZ[1]) continue;
    const mine = ownHarmonics(freq, rival, rise.binHz);
    const theirs = ownHarmonics(rival, freq, rise.binHz);
    if (mine.length > 0 && theirs.length > 0) {
      if (rise.mean(mine) <= BEATS_NEIGHBOUR * rise.mean(theirs)) return false;
    } else if (mine.length > 0) {
      if (rise.mean(mine) < OWN_ABOVE * rise.mean(harmonicsOf(rival))) return false;
    } else if (theirs.length > 0) {
      // A lower note's own harmonics often share bins with strings fading at
      // the same moment, which hides its rise there — so any one of them showing is enough.
      if (Math.max(...theirs.map(rise.at)) > NONE_BELOW * rise.mean(harmonicsOf(freq))) return false;
    }
  }
  return true;
}

/** Whether the attack struck the note at `freq` — and not one it could be mistaken for. */
export const isStruckAt = (attack: AttackSpectra, freq: number): boolean =>
  freq > 0 && struckOn(riseOf(attack), freq);
