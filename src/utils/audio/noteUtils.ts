
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

/** Below this target frequency, a detected reading close to 2x the target is
 *  treated as a 2nd-harmonic misdetection rather than a genuinely different
 *  (much higher) note — see correctOctaveForLowStrings. */
export const LOW_STRING_OCTAVE_CORRECTION_MAX_HZ = 165;

/**
 * Corrects a common pitch-detector failure mode on low strings: aubio's
 * yinfft occasionally locks onto the 2nd harmonic instead of the fundamental
 * for low frequencies (E2/A2/D3 territory). If halving the detected frequency
 * lands closer to the target than the raw reading does, assume that's what
 * happened and return the halved value; otherwise return the reading
 * unchanged. Only ever *relaxes* detection for genuinely low targets — it
 * can't make a wrong note on a different string read as correct, since it's
 * anchored on how close the halved reading is to *this specific* target.
 */
export function correctOctaveForLowStrings(detectedFreq: number, targetFreq: number): number {
  if (targetFreq >= LOW_STRING_OCTAVE_CORRECTION_MAX_HZ) return detectedFreq;
  const halved = detectedFreq / 2;
  return Math.abs(getCentsDistance(halved, targetFreq)) < Math.abs(getCentsDistance(detectedFreq, targetFreq))
    ? halved
    : detectedFreq;
}

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
 * Converts a MIDI note number to its frequency in Hz.
 * Frequency = A4 * 2^((midi - 69) / 12)
 */
export const midiToFrequency = (midi: number): number =>
  A4 * Math.pow(2, (midi - 69) / 12);

/** Scientific pitch name for a MIDI note — 40 → "E2", 69 → "A4". Sharps only. */
export const midiToNoteName = (midi: number): string => {
  const name = NOTES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
};

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
//   • High-string split — the thin high strings (≥ E4) are quieter and decay
//     faster, so the fixed volume gate rejects legitimately-played high notes.
//     Relax it above the split.
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
/** Pitch confidence (0–1) at/above which the expectation tolerance bonus is fully applied. */
export const EXPECT_NEAR_CONFIDENCE = 0.9;
/** Confidence (0–1) at which the bonus ramp starts (0 bonus at/below this). Between
 *  this and EXPECT_NEAR_CONFIDENCE the bonus scales linearly — a smooth ramp
 *  instead of a hard cliff, so ordinary confidence jitter right at the boundary
 *  doesn't flicker a note between "gets the bonus" and "doesn't". */
export const EXPECT_NEAR_CONFIDENCE_RAMP_START = 0.75;
/** Extra cents of tolerance granted to a confidently-detected expected note (at full ramp). */
export const EXPECT_NEAR_CENTS_BONUS = 15;

export interface DetectionGates {
  /** True when relaxed high-string behaviour applies to this target. */
  isHighString: boolean;
  /** Minimum raw volume for the note to be considered "played". */
  volumeGate: number;
}

/**
 * Register-adaptive detection gates for an expected note. Notes at/above the
 * high-string split get a relaxed volume gate; everything below keeps the base
 * gate unchanged. A `targetFreq` of 0 (dead/muted notes with no pitch)
 * is treated as a low string, so those keep the base gates.
 */
export function getDetectionGates(targetFreq: number, baseVolumeGate: number): DetectionGates {
  const isHighString = targetFreq >= HIGH_STRING_MIN_FREQ - 1;
  return {
    isHighString,
    volumeGate: isHighString ? baseVolumeGate * HIGH_STRING_VOLUME_MULTIPLIER : baseVolumeGate,
  };
}

/**
 * Widens the cents tolerance for a note the player is already aiming at, ramping
 * linearly from 0 bonus at EXPECT_NEAR_CONFIDENCE_RAMP_START up to the full
 * EXPECT_NEAR_CENTS_BONUS at EXPECT_NEAR_CONFIDENCE. Anchored on the expected
 * note, so it forgives tuning drift without ever reaching a full semitone.
 */
export function getExpectationBiasedTolerance(baseToleranceCents: number, confidence: number): number {
  if (confidence <= EXPECT_NEAR_CONFIDENCE_RAMP_START) return baseToleranceCents;
  const rampProgress = Math.min(
    1,
    (confidence - EXPECT_NEAR_CONFIDENCE_RAMP_START) / (EXPECT_NEAR_CONFIDENCE - EXPECT_NEAR_CONFIDENCE_RAMP_START)
  );
  return baseToleranceCents + rampProgress * EXPECT_NEAR_CENTS_BONUS;
}

// ── Adaptive (noise-floor-relative) volume gate ─────────────────────────────────
//
// The base volume gate used to be a single fixed constant, the same whether the
// room/mic is dead silent or has a constant hum/hiss floor. That's a bad fit
// either way: set high enough to reject a noisy room's floor, it also rejects
// quiet fingerstyle playing in a quiet room; set low enough for quiet playing,
// it lets a noisy room's floor read as "played" in someone else's setup.
//
// Fix: measure the actual ambient floor per session (guitarBufferProcessor.ts
// tracks it during confirmed-silent windows) and require real signal to clear
// a multiple of it — "played" now means "clearly above THIS room's noise", not
// "above some number tuned for an average room". Bounded on both ends so it can
// only ever get stricter in a noisy room and only ever get more lenient in a
// quiet one than the original fixed constant — it never drifts to either
// extreme (a hair-trigger gate in a silent room, or a wall nothing clears in a
// loud one).

/** How many multiples of the measured noise floor real signal must clear. ~12dB
 *  above the floor — enough margin that normal floor jitter can't cross it. */
export const NOISE_GATE_MULTIPLIER = 4;
/** Absolute lower bound on the adaptive gate — a near-zero measured noise floor
 *  (very clean input) still shouldn't produce a hair-trigger gate. */
export const NOISE_GATE_ABSOLUTE_FLOOR = 0.002;
/** Absolute upper bound — a very noisy room shouldn't require *louder* playing
 *  than a well-tuned fixed gate ever did, only bring quieter rooms down to it. */
export const NOISE_GATE_ABSOLUTE_CEIL = 0.015;

/**
 * Adaptive volume gate: the measured ambient noise floor scaled by
 * `NOISE_GATE_MULTIPLIER`, clamped to `[NOISE_GATE_ABSOLUTE_FLOOR, NOISE_GATE_ABSOLUTE_CEIL]`.
 * Pass the result as `getDetectionGates`'s `baseVolumeGate`.
 */
export function getAdaptiveVolumeGate(noiseFloor: number): number {
  const scaled = noiseFloor * NOISE_GATE_MULTIPLIER;
  return Math.min(NOISE_GATE_ABSOLUTE_CEIL, Math.max(NOISE_GATE_ABSOLUTE_FLOOR, scaled));
}
