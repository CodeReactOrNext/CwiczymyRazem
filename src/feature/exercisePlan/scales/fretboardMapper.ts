// Standard tuning MIDI notes for each open string
// String 1 (high E) = MIDI 64, String 6 (low E) = MIDI 40
const STANDARD_TUNING = [64, 59, 55, 50, 45, 40]; // E B G D A E

export interface FretPosition {
  string: number; // 1-6 (1 is high E)
  fret: number;
  midiNote: number;
}

/**
 * Get MIDI note for a given string and fret
 */
export function getMidiNote(stringNum: number, fret: number): number {
  // stringNum is 1-6, array is 0-indexed
  const openNote = STANDARD_TUNING[stringNum - 1];
  return openNote + fret;
}

/**
 * Get all positions on the fretboard for a given MIDI note
 * within a specific fret range
 */
export function getPositionsForNote(
  midiNote: number,
  minFret: number = 0,
  maxFret: number = 12
): FretPosition[] {
  const positions: FretPosition[] = [];

  for (let string = 1; string <= 6; string++) {
    const openNote = STANDARD_TUNING[string - 1];
    const fret = midiNote - openNote;

    if (fret >= minFret && fret <= maxFret && fret >= 0) {
      positions.push({ string, fret, midiNote });
    }
  }

  return positions;
}

/**
 * Get scale pattern in a specific position
 * Position system: position 1 starts at fret 0, position 2 at fret 2, etc.
 */
export function getScalePatternForPosition(
  rootMidi: number,
  scaleIntervals: number[],
  position: number, // 1-12 (fret where pattern starts)
  stringsToUse: number[] = [6, 5, 4, 3, 2, 1] // which strings to include
): FretPosition[] {
  const pattern: FretPosition[] = [];
  const startFret = position - 1; // position 1 = fret 0
  const endFret = startFret + 4; // 5-fret span

  // For each string (low to high)
  for (const string of stringsToUse) {
    // Get all notes in the scale
    const scaleNotes = scaleIntervals.map(interval => rootMidi + interval);

    // Find positions on this string within our fret range
    for (const scaleMidi of scaleNotes) {
      // Check all octaves within range
      for (let octave = -2; octave <= 2; octave++) {
        const targetMidi = scaleMidi + (octave * 12);
        const openNote = STANDARD_TUNING[string - 1];
        const fret = targetMidi - openNote;

        if (fret >= startFret && fret <= endFret && fret >= 0 && fret <= 24) {
          pattern.push({ string, fret, midiNote: targetMidi });
        }
      }
    }
  }

  // Sort by string (6->1) then by fret (low->high)
  return pattern.sort((a, b) => {
    if (a.string !== b.string) return b.string - a.string;
    return a.fret - b.fret;
  });
}

/**
 * Get positions for a single string within a fret range
 */
export function getScaleOnString(
  rootMidi: number,
  scaleIntervals: number[],
  stringNum: number,
  startFret: number,
  endFret: number
): FretPosition[] {
  const positions: FretPosition[] = [];
  const scaleNotes = scaleIntervals.map(interval => rootMidi + interval);

  for (const scaleMidi of scaleNotes) {
    // Check all octaves
    for (let octave = -2; octave <= 2; octave++) {
      const targetMidi = scaleMidi + (octave * 12);
      const openNote = STANDARD_TUNING[stringNum - 1];
      const fret = targetMidi - openNote;

      if (fret >= startFret && fret <= endFret && fret >= 0) {
        positions.push({ string: stringNum, fret, midiNote: targetMidi });
      }
    }
  }

  return positions.sort((a, b) => a.fret - b.fret);
}
