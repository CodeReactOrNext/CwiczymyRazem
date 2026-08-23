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
 * all six strings — or only `strings` (1 = high e … 6 = low E) when given. Each
 * result carries its concrete octave (Math.floor(midi/12)-1) so the note-hunt can
 * light positions and track found octaves. Sorted by pitch.
 */
export function getNotePositionsInRange(
  pitchClass: number,
  startFret: number,
  endFret: number,
  strings?: readonly number[]
): (FretPosition & { octave: number })[] {
  const positions: (FretPosition & { octave: number })[] = [];

  for (let string = 1; string <= 6; string++) {
    if (strings && !strings.includes(string)) continue;
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

/** Membership test by pitch class, so every octave of a scale note counts. */
function scaleNoteTest(rootMidi: number, scaleIntervals: number[]): (midi: number) => boolean {
  const pitchClasses = new Set(scaleIntervals.map((interval) => (rootMidi + interval) % 12));
  return (midi: number) => pitchClasses.has(((midi % 12) + 12) % 12);
}

/**
 * Frets on the low E string where this scale's shapes begin — one per scale
 * degree, so seven for a diatonic scale or mode and five for a pentatonic.
 * A shape is anchored on a scale note, never between two, which is what keeps
 * consecutive shapes from collapsing onto the same fingering.
 */
export function getShapeStartFrets(rootMidi: number, scaleIntervals: number[]): number[] {
  const inScale = scaleNoteTest(rootMidi, scaleIntervals);
  const lowE = STANDARD_TUNING[5];
  const frets: number[] = [];
  for (let fret = 1; fret <= 12; fret++) {
    if (inScale(lowE + fret)) frets.push(fret);
  }
  return frets;
}

/**
 * The scale shape anchored at `startFret`: the run climbs from the lowest scale
 * note at or above that fret on the low E and takes `notesPerString` notes on
 * every string on the way up. Two per string draws the pentatonic boxes, three
 * draws the three-notes-per-string diatonic shapes — the two systems players
 * actually learn.
 *
 * Walking the scale by pitch is what makes this correct. The previous version
 * collected candidates as `rootMidi ± 2 octaves` and kept whatever landed inside
 * a five-fret window, which silently dropped every note more than two octaves
 * below the root octave: in the key of A the G on the low E's 3rd fret (MIDI 43,
 * three octaves under the G above the root) never existed, so Box 5 came out
 * with eleven notes instead of twelve. A hundred of the tree's 708 shapes were
 * short a note that way, all of them in the keys from F# up.
 *
 * The window also started a fret below the name it was given, which pulled a
 * note out of the neighbouring shape — "Fret 8" for C major began on the 7th.
 * Anchoring on a scale note removes that off-by-one by construction.
 */
export function getScaleShape(
  rootMidi: number,
  scaleIntervals: number[],
  startFret: number,
  notesPerString: number,
): FretPosition[] {
  const inScale = scaleNoteTest(rootMidi, scaleIntervals);

  // The tree names a pentatonic box after its lowest fret on any string, which
  // can sit below where the low E itself enters the shape (A minor's Box 5 is
  // "fret 2", but the low E starts on the 3rd). Climbing to the first scale note
  // at or above the name handles both that and a freely picked fret.
  let midi = STANDARD_TUNING[5] + Math.max(0, startFret);
  while (!inScale(midi)) midi++;

  const shape: FretPosition[] = [];
  for (const string of [6, 5, 4, 3, 2, 1]) {
    const openNote = STANDARD_TUNING[string - 1];
    for (let i = 0; i < notesPerString; i++) {
      shape.push({ string, fret: midi - openNote, midiNote: midi });
      do {
        midi++;
      } while (!inScale(midi));
    }
  }

  return shape;
}

/**
 * Every scale note on one string within a fret range, low to high. Tested by
 * pitch class for the same reason `getScaleShape` walks by pitch — an octave
 * window around the root leaves holes at the bottom of the low strings.
 */
export function getScaleOnString(
  rootMidi: number,
  scaleIntervals: number[],
  stringNum: number,
  startFret: number,
  endFret: number
): FretPosition[] {
  const inScale = scaleNoteTest(rootMidi, scaleIntervals);
  const openNote = STANDARD_TUNING[stringNum - 1];
  const positions: FretPosition[] = [];

  for (let fret = Math.max(0, startFret); fret <= endFret; fret++) {
    const midiNote = openNote + fret;
    if (inScale(midiNote)) positions.push({ string: stringNum, fret, midiNote });
  }

  return positions;
}
