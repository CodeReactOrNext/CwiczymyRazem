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
function getMidiNote(stringNum: number, fret: number): number {
  // stringNum is 1-6, array is 0-indexed
  const openNote = STANDARD_TUNING[stringNum - 1];
  return openNote + fret;
}

/**
 * Get all positions on the fretboard for a given MIDI note
 * within a specific fret range
 */
function getPositionsForNote(
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
 * Get every position of a pitch class (0=C … 11=B) within a fret window, across
 * all six strings. Each result carries its concrete octave (Math.floor(midi/12)-1)
 * so the note-hunt can light positions and track found octaves. Sorted by pitch.
 */
export function getNotePositionsInRange(
  pitchClass: number,
  startFret: number,
  endFret: number
): (FretPosition & { octave: number })[] {
  const positions: (FretPosition & { octave: number })[] = [];

  for (let string = 1; string <= 6; string++) {
    const openNote = STANDARD_TUNING[string - 1];
    for (let fret = Math.max(0, startFret); fret <= endFret; fret++) {
      const midiNote = openNote + fret;
      if (midiNote % 12 === ((pitchClass % 12) + 12) % 12) {
        positions.push({ string, fret, midiNote, octave: Math.floor(midiNote / 12) - 1 });
      }
    }
  }

  return positions.sort((a, b) => a.midiNote - b.midiNote);
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

  // Sort by MIDI pitch (pitch-ascending order)
  pattern.sort((a, b) => a.midiNote - b.midiNote);

  // A straight 5-fret box can capture the SAME pitch on two adjacent
  // strings — most often at the G→B transition, whose interval is a major
  // third (4 semitones) instead of a perfect fourth. The shared pitch then
  // sits at the top fret of the lower string AND the bottom fret of the
  // higher string, so after the pitch-sort it appears twice in a row and
  // the exercise made you play the same note twice. Keep a single fingering
  // per pitch; prefer the thicker (higher-numbered) string so the run keeps
  // climbing through the position before crossing to the next string.
  const deduped: FretPosition[] = [];
  for (const pos of pattern) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.midiNote === pos.midiNote) {
      if (pos.string > prev.string) deduped[deduped.length - 1] = pos;
      continue;
    }
    deduped.push(pos);
  }

  return deduped;
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
