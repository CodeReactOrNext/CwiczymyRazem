import type { BendPoint, TablatureNote } from "feature/exercisePlan/types/exercise.types";

const BOOLEAN_FLAGS = [
  "isAccented",
  "isHammerOn",
  "isPullOff",
  "isBend",
  "isPreBend",
  "isRelease",
  "isVibrato",
  "isTap",
  "isDead",
  "isGhost",
  "isPalmMute",
  "isLetRing",
  "isStaccato",
] as const satisfies readonly (keyof TablatureNote)[];

const NUMBER_FIELDS = [
  "bendSemitones",
  "dynamics",
  "midiNote",
  "harmonicType",
  "slideIn",
  "slideOut",
] as const satisfies readonly (keyof TablatureNote)[];

const isBendCurve = (value: unknown): value is BendPoint[] =>
  Array.isArray(value) &&
  value.every(
    (point) =>
      typeof point?.position === "number" && typeof point?.cents === "number",
  );

/**
 * One note of a tab pasted into the editor as code. Keeps every technique the
 * tab carries, so a tab copied out of the editor comes back the way it left:
 * the importer used to drop all but four flags, which turned muted notes (x)
 * into open strings the microphone then expected to hear ringing.
 * Flags that are off stay off the note, as the editor's own export writes them.
 */
export function importedTabNote(raw: Record<string, unknown>): TablatureNote {
  const note: TablatureNote = {
    string: Number(raw.string),
    fret: Number(raw.fret) || 0,
  };
  for (const flag of BOOLEAN_FLAGS) {
    if (raw[flag]) note[flag] = true;
  }
  for (const field of NUMBER_FIELDS) {
    const value = raw[field];
    if (typeof value === "number" && Number.isFinite(value)) note[field] = value;
  }
  if (isBendCurve(raw.bendCurve)) note.bendCurve = raw.bendCurve;
  if (raw.finger === 1 || raw.finger === 2 || raw.finger === 3 || raw.finger === 4) {
    note.finger = raw.finger;
  }
  return note;
}
