import { NOTES, STANDARD_OPEN_STRING_MIDI } from "utils/audio/noteUtils";

export const CLICK_HUNT_NOTE_SOUND_KEY = "riffquest.clickHunt.noteSound";

/**
 * Whether click-mode hunts sound the target note by themselves. Defaults to on —
 * the reference tone is the point of the feature — and the toggle in the panel
 * persists the player's choice for every later session.
 */
export function loadClickHuntNoteSoundPreference(): boolean {
  try {
    const raw = localStorage.getItem(CLICK_HUNT_NOTE_SOUND_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function saveClickHuntNoteSoundPreference(enabled: boolean): void {
  try {
    localStorage.setItem(CLICK_HUNT_NOTE_SOUND_KEY, String(enabled));
  } catch {}
}

/** MIDI note a (string, fret) cell sounds — standard tuning, the same tuning the
 *  hunt's target positions are computed against (see fretboardMapper). */
export function midiForPosition(string: number, fret: number): number {
  const open = STANDARD_OPEN_STRING_MIDI[string];
  return open === undefined ? -1 : open + fret;
}

// Middle-register floor for the fallback reference pitch: G3, the open 3rd
// string. Low enough to still read as a guitar, high enough to stay audible on
// laptop speakers.
const REFERENCE_MIDI_FLOOR = 55;

/**
 * Which pitch to sound as "this is the note you're hunting for". Prefers the
 * lowest position actually inside the exercise's window, so the reference is a
 * note the player can literally play right there; falls back to the note's
 * middle-register octave when the window holds no positions at all.
 * Returns null for an unknown note name.
 */
export function pickReferenceMidi(
  positions: readonly { string: number; fret: number }[],
  note: string,
): number | null {
  const fromBoard = positions
    .map((p) => midiForPosition(p.string, p.fret))
    .filter((midi) => midi >= 0);
  if (fromBoard.length > 0) return Math.min(...fromBoard);

  const pitchClass = NOTES.indexOf(note);
  if (pitchClass < 0) return null;
  return REFERENCE_MIDI_FLOOR + ((((pitchClass - REFERENCE_MIDI_FLOOR) % 12) + 12) % 12);
}
