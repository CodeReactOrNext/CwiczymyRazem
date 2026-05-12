
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

/**
 * Calculates the frequency of a specific note on a guitar string and fret.
 * Assumes Standard Tuning (E A D G B E).
 * @param string - String number (1-6, 1 is High E).
 * @param fret - Fret number.
 * @returns Frequency in Hz.
 */
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

export const getFrequencyFromTab = (string: number, fret: number): number => {
  // Standard Tuning Open String MIDI notes
  // 1: E4 (64)
  // 2: B3 (59)
  // 3: G3 (55)
  // 4: D3 (50)
  // 5: A2 (45)
  // 6: E2 (40)

  // Correction: String 1 is high E, String 6 is low E.
  // The previous implementation used standard tuning but let's be precise.

  const stringMidiMap: Record<number, number> = {
    1: 64, // E4
    2: 59, // B3
    3: 55, // G3
    4: 50, // D3
    5: 45, // A2
    6: 40  // E2
  };

  const openStringMidi = stringMidiMap[string];
  if (!openStringMidi) return 0;

  const targetMidi = openStringMidi + fret;

  // Frequency = A4 * 2^((midi - 69) / 12)
  return A4 * Math.pow(2, (targetMidi - 69) / 12);
}
