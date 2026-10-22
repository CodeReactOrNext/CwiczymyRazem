import type {
  Exercise,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

import { CHORD_SHAPES } from "../data/colossus";
import type { BossDefinition, ChordVariation } from "../types/boss.types";

const BEATS_PER_BAR = 4;

/** The notes of a chord shape, low string first; muted strings left out. */
export const chordNotes = (chord: string): TablatureNote[] => {
  const frets = CHORD_SHAPES[chord];
  if (!frets) return [];
  // The shape runs from the low E (string 6) to the high e (string 1).
  return frets.flatMap((fret, i) => (fret === null ? [] : [{ string: 6 - i, fret }]));
};

/**
 * Where each strum of the pass sits in the tab — its bar and beat, which the
 * matcher's note keys carry — so a judged note can be traced to its chord.
 */
export const chordUnitPositions = (variation: Pick<ChordVariation, "units">) => {
  const positions: { measure: number; beat: number }[] = [];
  let measure = 0;
  let beat = 0;
  let filled = 0;
  for (const unit of variation.units) {
    positions.push({ measure, beat });
    beat += 1;
    filled += unit.beats;
    if (filled >= BEATS_PER_BAR) {
      measure += 1;
      beat = 0;
      filled = 0;
    }
  }
  return positions;
};

const unitIndexCache = new WeakMap<object, Map<string, number>>();

/**
 * The strum a matcher note key ("bar-beat-note") belongs to, or null for a key
 * outside the pass. Cached per drill — this runs on every judged note.
 */
export const chordUnitOf = (variation: Pick<ChordVariation, "units">, noteKey: string) => {
  let index = unitIndexCache.get(variation);
  if (!index) {
    index = new Map(
      chordUnitPositions(variation).map(({ measure, beat }, unit) => [`${measure}-${beat}`, unit]),
    );
    unitIndexCache.set(variation, index);
  }
  const [measure, beat] = noteKey.split("-");
  return index.get(`${measure}-${beat}`) ?? null;
};

/** Tones each strum of the pass has to sound. */
export const chordToneCount = (variation: Pick<ChordVariation, "units">, unit: number) =>
  chordNotes(variation.units[unit]?.chord ?? "").length;

/**
 * The pass as 4/4 bars: one down-strum per chord, the chord's name printed
 * over it. The tab loops it for as long as the phase lasts.
 */
export const buildChordTablature = (variation: Pick<ChordVariation, "units">): TablatureMeasure[] => {
  const measures: TablatureMeasure[] = [];
  let current: TablatureMeasure | null = null;
  let filled = 0;
  for (const unit of variation.units) {
    if (!current) {
      current = { timeSignature: [4, 4], beats: [] };
      measures.push(current);
    }
    current.beats.push({
      duration: unit.beats,
      notes: chordNotes(unit.chord),
      chordName: unit.chord,
      pickStroke: "down",
    });
    filled += unit.beats;
    if (filled >= BEATS_PER_BAR) {
      current = null;
      filled = 0;
    }
  }
  return measures;
};

/** The change into strum `unit` — "G>C" — the key misses are counted under. */
export const changeKey = (variation: Pick<ChordVariation, "units">, unit: number) => {
  const { units } = variation;
  const from = units[(unit - 1 + units.length) % units.length];
  const to = units[unit];
  return from && to ? `${from.chord}>${to.chord}` : null;
};

/** "G>C" as the player reads it. */
export const changeLabel = (key: string) => key.replace(">", " → ");

/** Every change the pass makes, once each, in the order it first makes them. */
export const changesOf = (variation: Pick<ChordVariation, "units">) => [
  ...new Set(
    variation.units
      .map((_, unit) => changeKey(variation, unit))
      .filter((key): key is string => key !== null),
  ),
];

/**
 * The fight's current progression as a session exercise. One id for the whole
 * fight, like the spider's — a new phase swaps the tab and tempo — and kept
 * off the leaderboards and goals by `_generatorConfig`.
 */
export const buildChordPhaseExercise = (
  boss: BossDefinition,
  variation: ChordVariation,
): Exercise => ({
  id: `boss-${boss.id}`,
  title: boss.name,
  description: boss.title,
  difficulty: "medium",
  category: "technique",
  // The fight decides when it ends — the session runs in free mode.
  timeInMinutes: 60,
  instructions: [],
  tips: [],
  metronomeSpeed: { min: variation.bpm, max: variation.bpm, recommended: variation.bpm },
  relatedSkills: ["chords"],
  tablature: buildChordTablature(variation),
  isHiddenFromLibrary: true,
  _generatorConfig: { kind: "boss", bossId: boss.id },
});
