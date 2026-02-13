
export interface ChordDefinition {
  name: string;
  frets: (number | null)[]; // null = muted string, 0-24 = fret
  fingers?: (number | null)[]; // optional finger numbers
}

export const commonChords: Record<string, ChordDefinition> = {
  // Basic Major
  'A': { name: 'A Major', frets: [null, 0, 2, 2, 2, 0] },
  'C': { name: 'C Major', frets: [null, 3, 2, 0, 1, 0] },
  'D': { name: 'D Major', frets: [null, null, 0, 2, 3, 2] },
  'E': { name: 'E Major', frets: [0, 2, 2, 1, 0, 0] },
  'G': { name: 'G Major', frets: [3, 2, 0, 0, 0, 3] },
  'F': { name: 'F Major (Barre)', frets: [1, 3, 3, 2, 1, 1] },
  'B': { name: 'B Major (Barre)', frets: [null, 2, 4, 4, 4, 2] },
  'Bb': { name: 'Bb Major (Barre)', frets: [null, 1, 3, 3, 3, 1] },

  // Basic Minor
  'Am': { name: 'A Minor', frets: [null, 0, 2, 2, 1, 0] },
  'Dm': { name: 'D Minor', frets: [null, null, 0, 2, 3, 1] },
  'Em': { name: 'E Minor', frets: [0, 2, 2, 0, 0, 0] },
  'Bm': { name: 'B Minor (Barre)', frets: [null, 2, 4, 4, 3, 2] },
  'Fm': { name: 'F Minor (Barre)', frets: [1, 3, 3, 1, 1, 1] },
  'Gm': { name: 'G Minor (Barre)', frets: [3, 5, 5, 3, 3, 3] },

  // Dominant 7th
  'A7': { name: 'A Dominant 7', frets: [null, 0, 2, 0, 2, 0] },
  'B7': { name: 'B Dominant 7', frets: [null, 2, 1, 2, 0, 2] },
  'C7': { name: 'C Dominant 7', frets: [null, 3, 2, 3, 1, 0] },
  'D7': { name: 'D Dominant 7', frets: [null, null, 0, 2, 1, 2] },
  'E7': { name: 'E Dominant 7', frets: [0, 2, 0, 1, 0, 0] },
  'G7': { name: 'G Dominant 7', frets: [3, 2, 0, 0, 0, 1] },

  // Major 7th
  'Amaj7': { name: 'A Major 7', frets: [null, 0, 2, 1, 2, 0] },
  'Cmaj7': { name: 'C Major 7', frets: [null, 3, 2, 0, 0, 0] },
  'Dmaj7': { name: 'D Major 7', frets: [null, null, 0, 2, 2, 2] },
  'Emaj7': { name: 'E Major 7', frets: [0, 2, 1, 1, 0, 0] },
  'Gmaj7': { name: 'G Major 7', frets: [3, 2, 0, 0, 0, 2] },
  'Fmaj7': { name: 'F Major 7', frets: [null, null, 3, 2, 1, 0] },

  // Minor 7th
  'Am7': { name: 'A Minor 7', frets: [null, 0, 2, 0, 1, 0] },
  'Dm7': { name: 'D Minor 7', frets: [null, null, 0, 2, 1, 1] },
  'Em7': { name: 'E Minor 7', frets: [0, 2, 0, 0, 0, 0] },
  'Bm7': { name: 'B Minor 7 (Barre)', frets: [null, 2, 4, 2, 3, 2] },

  // Suspended
  'Asus2': { name: 'A Suspended 2', frets: [null, 0, 2, 2, 0, 0] },
  'Asus4': { name: 'A Suspended 4', frets: [null, 0, 2, 2, 3, 0] },
  'Dsus2': { name: 'D Suspended 2', frets: [null, null, 0, 2, 3, 0] },
  'Dsus4': { name: 'D Suspended 4', frets: [null, null, 0, 2, 3, 3] },
  'Esus4': { name: 'E Suspended 4', frets: [0, 2, 2, 2, 0, 0] },

  // Power Chords (5)
  'A5': { name: 'A Power Chord', frets: [null, 0, 2, 2, null, null] },
  'B5': { name: 'B Power Chord', frets: [null, 2, 4, 4, null, null] },
  'C5': { name: 'C Power Chord', frets: [null, 3, 5, 5, null, null] },
  'D5': { name: 'D Power Chord', frets: [null, null, 0, 2, 3, null] },
  'E5': { name: 'E Power Chord', frets: [0, 2, 2, null, null, null] },
  'F5': { name: 'F Power Chord', frets: [1, 3, 3, null, null, null] },
  'G5': { name: 'G Power Chord', frets: [3, 5, 5, null, null, null] },

  // Added note
  'Cadd9': { name: 'C Add 9', frets: [null, 3, 2, 0, 3, 0] },
  'Gadd9': { name: 'G Add 9', frets: [3, 2, 0, 2, 0, 3] },
};

export const beginnerChords = ['A', 'Am', 'C', 'D', 'Dm', 'E', 'Em', 'G', 'A7', 'E7', 'G7', 'Cmaj7', 'Am7'];
export const intermediateChords = ['F', 'B', 'Bm', 'Bb', 'D7', 'B7', 'Amaj7', 'Dmaj7', 'Gmaj7', 'Fmaj7', 'Dm7', 'Em7', 'Bm7', 'Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Esus4', 'Cadd9'];
export const advancedChords = ['Fm', 'Gm', 'A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'Gadd9'];

export interface ChordShape {
  name: string;
  intervals: number[];
}
