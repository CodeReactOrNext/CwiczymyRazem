
const A4 = 440;
const SEMITONE = 69;
export const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export interface NoteData {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  error: number; // Error in cents
}

/**
 * Converts a frequency in Hz to a NoteData object.
 * @param frequency - The frequency in Hz.
 * @returns NoteData object or null if frequency is too low or invalid.
 */
export const getNoteFromFrequency = (frequency: number): NoteData | null => {
  if (!frequency || frequency < 20) return null;

  const noteNum = 12 * (Math.log(frequency / A4) / Math.log(2));
  const midiNote = Math.round(noteNum) + SEMITONE;
  const error = (noteNum - Math.round(noteNum)) * 100;

  const noteIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;

  return {
    note: NOTES[noteIndex],
    octave,
    cents: Math.round(error),
    frequency,
    error,
  };
};

/**
 * Returns the distance in cents between two frequencies.
 * Positive means freqA is sharp of freqB, negative means flat.
 * Returns Infinity if either frequency is invalid.
 */
export const getCentsDistance = (freqA: number, freqB: number): number => {
  if (freqA <= 0 || freqB <= 0) return Infinity;
  return 1200 * Math.log2(freqA / freqB);
};

// Standard tuning open-string MIDI notes. String 1 is high E, string 6 is low E.
export const STANDARD_OPEN_STRING_MIDI: Record<number, number> = {
  1: 64, // E4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
};

/**
 * Maps a frequency in Hz to a pitch class index 0–11 (C=0, C#=1, …, B=11).
 */
export function freqToPitchClass(freq: number): number {
  const semitones = 12 * Math.log2(freq / A4); // relative to A4 (= 9 semitones above C)
  return ((Math.round(semitones) % 12) + 12 + 9) % 12;
}

/**
 * Computes a 12-element chromagram from a Web Audio AnalyserNode.
 * Returns a Float32Array[12] with values 0–1 (normalized to the max bin energy).
 * Returns null when the analyser has no data or the signal is silent.
 */
export function computeChromagram(analyser: AnalyserNode): Float32Array | null {
  const fftSize = analyser.fftSize;
  const buf = new Float32Array(fftSize / 2);
  analyser.getFloatFrequencyData(buf); // dB values (typically -100 to 0)

  const sampleRate = analyser.context.sampleRate;
  const binHz = sampleRate / fftSize;
  const chroma = new Float32Array(12);

  for (let i = 1; i < buf.length; i++) {
    const freq = i * binHz;
    if (freq < 60 || freq > 1400) continue; // guitar fundamental range
    const amplitude = Math.pow(10, buf[i] / 20); // dB → linear
    chroma[freqToPitchClass(freq)] += amplitude;
  }

  let max = 0;
  for (let i = 0; i < 12; i++) if (chroma[i] > max) max = chroma[i];
  if (max < 1e-6) return null; // silence

  for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

/**
 * Converts a MIDI note number to its frequency in Hz.
 * Frequency = A4 * 2^((midi - 69) / 12)
 */
export const midiToFrequency = (midi: number): number =>
  A4 * Math.pow(2, (midi - 69) / 12);

/**
 * Calculates the frequency of a specific note on a guitar string and fret.
 * @param string - String number (1-6, 1 is High E).
 * @param fret - Fret number.
 * @param tuningOffsets - Per-string semitone offset from standard tuning
 *   (index 0 = string 1 … index 5 = string 6). Omit for standard tuning.
 * @returns Frequency in Hz.
 */
export const getFrequencyFromTab = (string: number, fret: number, tuningOffsets?: readonly number[]): number => {
  const openStringMidi = STANDARD_OPEN_STRING_MIDI[string];
  if (!openStringMidi) return 0;

  const offset = tuningOffsets?.[string - 1] ?? 0;
  const targetMidi = openStringMidi + fret + offset;

  // Frequency = A4 * 2^((midi - 69) / 12)
  return A4 * Math.pow(2, (targetMidi - 69) / 12);
}

// ── Detection gating (register-adaptive + expectation-biased) ───────────────────
//
// Two refinements adapted from the native (Unity) detector to the browser pitch
// path. Both only ever *relax* a gate, so they cut false negatives without ever
// grading a wrong fret as correct:
//   • High-string split — the thin high strings (≥ E4) are quieter, decay faster
//     and carry weaker chroma energy, so the fixed volume/chroma gates reject
//     legitimately-played high notes. Relax those gates above the split.
//   • Expectation bias — for a note the player is already aiming at, widen the
//     cents tolerance slightly, but only when the detector is highly confident.
//     Anchored on the expected note, so tuning drift is forgiven while the widen
//     never reaches a full semitone (a genuinely wrong fret still misses).

/** MIDI note at/above which relaxed "high-string" detection gates apply (E4). */
export const HIGH_STRING_MIN_MIDI = 64;
/** Frequency (Hz) of the high-string split — notes at/above are "high strings". */
export const HIGH_STRING_MIN_FREQ = midiToFrequency(HIGH_STRING_MIN_MIDI);
/** Volume-gate multiplier applied to high strings (they ring quieter). */
export const HIGH_STRING_VOLUME_MULTIPLIER = 0.5;
/** Chroma-threshold multiplier applied to high chord tones (weaker chroma energy). */
export const HIGH_STRING_CHROMA_MULTIPLIER = 0.8;
/** Pitch confidence (0–1) at/above which the expectation tolerance bonus applies. */
export const EXPECT_NEAR_CONFIDENCE = 0.9;
/** Extra cents of tolerance granted to a confidently-detected expected note. */
export const EXPECT_NEAR_CENTS_BONUS = 15;

export interface DetectionGates {
  /** True when relaxed high-string behaviour applies to this target. */
  isHighString: boolean;
  /** Minimum raw volume for the note to be considered "played". */
  volumeGate: number;
  /** Chroma-bin energy threshold for a chord tone to count as rung. */
  chordChromaThreshold: number;
}

/**
 * Register-adaptive detection gates for an expected note. Notes at/above the
 * high-string split get relaxed volume and chroma gates; everything below keeps
 * the base gates unchanged. A `targetFreq` of 0 (dead/muted notes with no pitch)
 * is treated as a low string, so those keep the base gates.
 */
export function getDetectionGates(
  targetFreq: number,
  baseVolumeGate: number,
  baseChordChromaThreshold: number,
): DetectionGates {
  const isHighString = targetFreq >= HIGH_STRING_MIN_FREQ - 1;
  return {
    isHighString,
    volumeGate: isHighString ? baseVolumeGate * HIGH_STRING_VOLUME_MULTIPLIER : baseVolumeGate,
    chordChromaThreshold: isHighString
      ? baseChordChromaThreshold * HIGH_STRING_CHROMA_MULTIPLIER
      : baseChordChromaThreshold,
  };
}

/**
 * Widens the cents tolerance for a note the player is already aiming at, but only
 * when the pitch detector is highly confident. Anchored on the expected note, so
 * it forgives tuning drift without ever reaching a full semitone.
 */
export function getExpectationBiasedTolerance(baseToleranceCents: number, confidence: number): number {
  return confidence >= EXPECT_NEAR_CONFIDENCE
    ? baseToleranceCents + EXPECT_NEAR_CENTS_BONUS
    : baseToleranceCents;
}
