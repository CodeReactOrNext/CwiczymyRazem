
export const A4 = 440;
export const SEMITONE = 69;
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
