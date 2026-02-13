// Scale definitions using intervals (semitones from root)
// 0 = root, 2 = major second, 4 = major third, etc.

export type ScaleType =
  | 'major'
  | 'minor'
  | 'minor_pentatonic'
  | 'major_pentatonic'
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian';

export interface ScaleDefinition {
  name: string;
  intervals: number[]; // semitones from root
  description: string;
}

export const scaleDefinitions: Record<ScaleType, ScaleDefinition> = {
  // Basic Scales
  major: {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H
    description: 'Happy, bright sound. Foundation of Western music.'
  },
  minor: {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W
    description: 'Sad, melancholic sound. Relative minor of major scale.'
  },
  minor_pentatonic: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10], // 5-note scale
    description: 'Blues and rock foundation. Most common scale for soloing.'
  },
  major_pentatonic: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9], // 5-note scale
    description: 'Bright, uplifting sound. Country and pop melodies.'
  },

  // Modes (same as major/minor but listed separately for clarity)
  ionian: {
    name: 'Ionian (Major)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'Mode 1 - Major scale. Bright and resolved.'
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Mode 2 - Minor with major 6th. Jazz and funk favorite.'
  },
  phrygian: {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: 'Mode 3 - Dark, Spanish/flamenco sound.'
  },
  lydian: {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    description: 'Mode 4 - Dreamy, major with #4. Film music.'
  },
  mixolydian: {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    description: 'Mode 5 - Dominant sound. Rock and blues.'
  },
  aeolian: {
    name: 'Aeolian (Natural Minor)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'Mode 6 - Natural minor scale.'
  },
  locrian: {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    description: 'Mode 7 - Diminished, unstable. Rarely used.'
  },
};

// Root notes (chromatic)
export const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Get note name from MIDI number
export function getNoteNameFromMidi(midi: number): string {
  return rootNotes[midi % 12];
}

// Get MIDI number from note name
export function getMidiFromNoteName(noteName: string): number {
  const baseNote = rootNotes.indexOf(noteName);
  if (baseNote === -1) return 0;
  return baseNote;
}
