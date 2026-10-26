// Whether each note of a chord is sounding, read off a magnitude spectrum.
//
// A chord can't be followed by a single pitch, so each of its notes is looked
// for where it actually sits: its own frequency, octave included, which the tab
// gives exactly. The note counts as sounding when the spectrum peaks there and
// stands up to the semitones on either side. A wrong fret puts its peak a
// semitone away, leaving only that peak's slope where the note should be.
//
// This replaced a chromagram (energy per pitch class, folded over every
// octave), which a 3rd harmonic fills with the fifth above and a 5th with the
// major third, so it credited notes nobody played and, normalised to the
// loudest class, missed quiet strings that were. Measured on synthetic strums
// (chordTones.test.ts): chord tones found 99% of the time instead of 44%, wrong
// frets credited 0–2% instead of up to 41%.

/** A linear magnitude spectrum: bin i sits at i × binHz. Any scale. */
export interface Spectrum {
  magnitudes: Float32Array;
  binHz: number;
}

export interface ToneCriteria {
  /** The note's peak against the louder of the two semitones beside it. */
  ratio: number;
  /** The note's peak against the loudest peak in the guitar's range. */
  floor: number;
}

/** What a chord tone has to show to be scored as hit. */
export const CHORD_TONE_HIT: ToneCriteria = { ratio: 0.6, floor: 0.05 };
/** What keeps an already-hit tone's fill growing: easier, as it decays. */
export const CHORD_TONE_SUSTAIN: ToneCriteria = { ratio: 0.4, floor: 0.03 };
/** A tone counts once it has been heard at two moments this far apart after
 *  its attack — a pick's transient is gone by then, a string is not. */
export const CHORD_TONE_HOLD_MS = 60;

/** The guitar's fundamentals — where the loudest peak is looked for. */
const BAND_LOW_HZ = 60;
const BAND_HIGH_HZ = 1400;
/** The highest frequency any check reads: a 24th-fret top E, a semitone above, and slack. */
export const SPECTRUM_TOP_HZ = 2000;
/** How far off its written pitch a string may sit (tuning, finger pressure). */
const SEARCH_CENTS = 30;
/** The note's semitone neighbours must sit this many bins away to be told
 *  apart from it; lower notes are looked for at a harmonic where they do. */
const MIN_SEMITONE_BINS = 1.8;
const SEMITONE = Math.pow(2, 1 / 12);

/** The harmonic a note is looked for at: its fundamental wherever the spectrum resolves it. */
export const harmonicFor = (freq: number, binHz: number): number =>
  Math.max(1, Math.ceil((MIN_SEMITONE_BINS * binHz) / (freq * (SEMITONE - 1))));

const binRange = (freq: number, binHz: number): [number, number] => [
  Math.round((freq * Math.pow(2, -SEARCH_CENTS / 1200)) / binHz),
  Math.round((freq * Math.pow(2, SEARCH_CENTS / 1200)) / binHz),
];

/** The strongest bin within SEARCH_CENTS of `freq`. */
const strongestBin = (
  { magnitudes, binHz }: Spectrum,
  freq: number,
): number => {
  const [lo, hi] = binRange(freq, binHz);
  let best = lo;
  for (let k = lo; k <= hi; k++)
    if ((magnitudes[k] ?? 0) > (magnitudes[best] ?? 0)) best = k;
  return best;
};

const levelAt = (spectrum: Spectrum, freq: number): number =>
  spectrum.magnitudes[strongestBin(spectrum, freq)] ?? 0;

/** The loudest peak in the guitar's range. */
export const spectrumPeak = ({ magnitudes, binHz }: Spectrum): number => {
  let peak = 0;
  const top = Math.min(magnitudes.length - 1, Math.ceil(BAND_HIGH_HZ / binHz));
  for (let k = Math.floor(BAND_LOW_HZ / binHz); k <= top; k++)
    if (magnitudes[k] > peak) peak = magnitudes[k];
  return peak;
};

/** Whether there is a peak at `at` (Hz) standing up to the semitones beside it. */
const peaksAt = (
  spectrum: Spectrum,
  at: number,
  criteria: ToneCriteria,
  peak: number,
): boolean => {
  const bin = strongestBin(spectrum, at);
  const { magnitudes } = spectrum;
  const level = magnitudes[bin] ?? 0;
  // A peak of its own, not the slope of one beside it.
  if (level < (magnitudes[bin - 1] ?? 0) || level < (magnitudes[bin + 1] ?? 0))
    return false;
  if (level < criteria.floor * peak) return false;
  return (
    level >
    criteria.ratio *
      Math.max(
        levelAt(spectrum, at / SEMITONE),
        levelAt(spectrum, at * SEMITONE),
      )
  );
};

/** Whether the note at `freq` is sounding in `spectrum`. */
export const isChordToneSounding = (
  spectrum: Spectrum,
  freq: number,
  criteria: ToneCriteria,
  peak: number = spectrumPeak(spectrum),
): boolean =>
  peak > 0 &&
  freq > 0 &&
  peaksAt(spectrum, freq * harmonicFor(freq, spectrum.binHz), criteria, peak);

/**
 * Like isChordToneSounding, but any of the note's first `count` resolvable
 * harmonics will do. Each is held to the same bar — a peak of its own, above the
 * semitones beside it — so a note a fret away passes none of them; it only
 * stops a dark tone (thumb, neck pickup), whose lowest resolvable harmonic can
 * be faint, from failing a note that is plainly there.
 */
export const isNoteSoundingAtAnyHarmonic = (
  spectrum: Spectrum,
  freq: number,
  criteria: ToneCriteria,
  peak: number = spectrumPeak(spectrum),
  count = 3,
): boolean => {
  if (peak <= 0 || freq <= 0) return false;
  const first = harmonicFor(freq, spectrum.binHz);
  for (let h = first; h < first + count && freq * h < SPECTRUM_TOP_HZ - 50; h++)
    if (peaksAt(spectrum, freq * h, criteria, peak)) return true;
  return false;
};

/**
 * Remembers when each chord tone was first heard after its attack. A tone
 * counts once it is heard again CHORD_TONE_HOLD_MS later — a passing transient
 * doesn't last that long. A new attack starts the tone over.
 */
export const createChordToneEvidence = (holdMs = CHORD_TONE_HOLD_MS) => {
  const firstHeard = new Map<string, { attack: number; atMs: number }>();
  return {
    /** Feeds one reading; true once `key` has been heard across holdMs since `attack`. */
    observe(
      key: string,
      attack: number,
      nowMs: number,
      heard: boolean,
    ): boolean {
      if (!heard) return false;
      const seen = firstHeard.get(key);
      if (!seen || seen.attack !== attack) {
        firstHeard.set(key, { attack, atMs: nowMs });
        return false;
      }
      return nowMs - seen.atMs >= holdMs;
    },
    clear() {
      firstHeard.clear();
    },
  };
};

/** The live spectrum of a Web Audio AnalyserNode, up to SPECTRUM_TOP_HZ. */
export const spectrumFromAnalyser = (analyser: AnalyserNode): Spectrum => {
  const binHz = analyser.context.sampleRate / analyser.fftSize;
  const decibels = new Float32Array(analyser.fftSize / 2);
  analyser.getFloatFrequencyData(decibels);
  const length = Math.min(
    decibels.length,
    Math.ceil(SPECTRUM_TOP_HZ / binHz) + 1,
  );
  const magnitudes = new Float32Array(length);
  for (let k = 0; k < length; k++)
    magnitudes[k] = Math.pow(10, decibels[k] / 20);
  return { magnitudes, binHz };
};
