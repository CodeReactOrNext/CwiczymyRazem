import type { ChordSpan } from "./harmonize";
import type { KeyEstimate } from "./keyDetection";
import type { TabContent } from "./noteEvents";
import type { Chord, ChordQuality, ScaleId } from "./theory";
import { chordTonesOf, scaleById } from "./theory";

/**
 * Colour for the pad: the harmonizer picks plain triads (they are what the
 * notes are judged against), and the pad then plays them the way ambient
 * music voices chords — maj7, add9, m9, sus2 — wherever that's safe.
 */

/** Colours to try for each chord, best first. A chord with none stays as it is. */
const COLOURS: Partial<Record<ChordQuality, readonly ChordQuality[]>> = {
  maj: ["maj7", "add9", "6"],
  min: ["min9", "min7", "madd9"],
  "5": ["sus2"],
  "7": ["9"],
  min7: ["min9"],
  dim: ["m7b5"],
};

/**
 * The seven-note scale a key's colours are drawn from: a pentatonic's added
 * tones come from its parent mode (A minor pentatonic → A minor, so Am9 is
 * fine), and the blues takes its ninths from mixolydian, as blues players do.
 */
const COLOUR_SCALE: Partial<Record<ScaleId, ScaleId>> = {
  minorPentatonic: "minor",
  majorPentatonic: "major",
  blues: "mixolydian",
};

export function colourScale(key: KeyEstimate): Set<number> {
  const scale = scaleById(COLOUR_SCALE[key.scale.id] ?? key.scale.id);
  return new Set(
    scale.intervals.map((interval) => (key.tonic + interval) % 12),
  );
}

/** A melody note placed on the backing's timeline (backing beats). */
export interface BackingNote {
  pc: number;
  start: number;
  duration: number;
  weight: number;
}

/** The tab's notes laid out over the backing, repeats included. */
export function melodyOnBacking(
  content: TabContent,
  barMap: readonly number[],
): BackingNote[] {
  const notes: BackingNote[] = [];
  let backingStart = 0;
  for (const tabBar of barMap) {
    const bar = content.bars[tabBar];
    for (const note of content.notes) {
      if (note.bar !== tabBar) continue;
      notes.push({
        pc: note.pc,
        start: backingStart + note.posInBar,
        duration: note.duration,
        weight: note.weight,
      });
    }
    backingStart += bar.length;
  }
  return notes;
}

/** A held melody note this long, a semitone above an added tone, rubs against it. */
const HELD = 0.75;
/** How much of a chord's melody may rub before the colour is dropped. */
const RUB_LIMIT = 0.12;

/**
 * The richest colour that stays inside the key and doesn't rub against what
 * the melody holds over it. A long C over Cmaj7's B is the classic clash — an
 * arranger plays C6 or Cadd9 there instead — while a quick passing C isn't
 * heard as one.
 */
export function colourChord(
  chord: Chord,
  melody: readonly BackingNote[],
  keyPcs: ReadonlySet<number>,
): Chord {
  const base = new Set(chordTonesOf(chord));
  const total = melody.reduce((sum, note) => sum + note.weight, 0);
  for (const quality of COLOURS[chord.quality] ?? []) {
    const candidate: Chord = { root: chord.root, quality };
    const added = chordTonesOf(candidate).filter((tone) => !base.has(tone));
    if (!added.every((tone) => keyPcs.has(tone))) continue;
    const rub = melody
      .filter(
        (note) =>
          note.duration >= HELD &&
          added.some((tone) => (tone + 1) % 12 === note.pc),
      )
      .reduce((sum, note) => sum + note.weight, 0);
    if (total > 0 && rub / total > RUB_LIMIT) continue;
    return candidate;
  }
  return chord;
}

/** The pad's chords: each span coloured against the melody sounding under it. */
export function colourSpans(
  spans: readonly ChordSpan[],
  melody: readonly BackingNote[],
  keyPcs: ReadonlySet<number>,
): ChordSpan[] {
  return spans.map((span) => {
    const under = melody.filter(
      (note) =>
        note.start >= span.start - 1e-6 &&
        note.start < span.start + span.length - 1e-6,
    );
    return { ...span, chord: colourChord(span.chord, under, keyPcs) };
  });
}
