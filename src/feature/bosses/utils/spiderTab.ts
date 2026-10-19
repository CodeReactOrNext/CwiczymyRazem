import type {
  Exercise,
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

import type { BossDefinition, SpiderVariation } from "../types/boss.types";

export interface TabPosition {
  string: number;
  fret: number;
}

/** Low E to high e. */
const STRINGS_UP = [6, 5, 4, 3, 2, 1] as const;
/** One string forward, two back: every step skips a string. */
const SKIP_UP = [6, 4, 5, 3, 4, 2, 3, 1] as const;

/** Strings one position plays, in order. */
export const stringsPerPosition = (route: SpiderVariation["route"]) =>
  route === "skip" ? SKIP_UP.length : STRINGS_UP.length;

const stringOrder = (variation: SpiderVariation, ascending: boolean) => {
  const up = variation.route === "skip" ? SKIP_UP : STRINGS_UP;
  return ascending ? [...up] : [...up].reverse();
};

/**
 * One pass of the drill, note by note. Each position is played across the
 * strings — up on even entries, down on odd ones — with the next finger order
 * dealt on every string. Fingers map to frets from the index finger's fret.
 */
export const spiderPassNotes = (variation: SpiderVariation): TabPosition[] => {
  const notes: TabPosition[] = [];
  let upDealt = 0;
  let downDealt = 0;

  variation.positions.forEach((position, posIndex) => {
    const ascending = posIndex % 2 === 0;
    const patterns = ascending
      ? variation.patterns
      : (variation.descendPatterns ?? variation.patterns);

    stringOrder(variation, ascending).forEach((string, step) => {
      const pattern = ascending
        ? patterns[upDealt++ % patterns.length]
        : patterns[downDealt++ % patterns.length];
      const base =
        variation.route === "diagonal"
          ? ascending
            ? position + step
            : position - step
          : position;
      for (const finger of pattern) {
        notes.push({ string, fret: base - 1 + Number(finger) });
      }
    });
  });

  return notes;
};

/** Notes in one 4/4 bar at the drill's subdivision. */
export const notesPerBar = (variation: Pick<SpiderVariation, "notesPerBeat">) =>
  variation.notesPerBeat * 4;

/**
 * The pass as 4/4 bars at one tempo; the tab loops it for as long as the phase
 * lasts. The generator only deals passes that fill whole bars
 * (phaseGenerator.test checks it), so no bar needs padding.
 */
export const buildSpiderTablature = (variation: SpiderVariation): TablatureMeasure[] => {
  const notes = spiderPassNotes(variation);
  const perBar = notesPerBar(variation);
  const duration = 1 / variation.notesPerBeat;
  const measures: TablatureMeasure[] = [];

  for (let i = 0; i < notes.length; i += perBar) {
    const beats: TablatureBeat[] = notes
      .slice(i, i + perBar)
      .map(({ string, fret }) => ({
        duration,
        notes: [{ string, fret }],
        ...(variation.notesPerBeat === 3 && { tuplet: 3 }),
      }));
    measures.push({ timeSignature: [4, 4], beats });
  }
  return measures;
};

/** Notes per second at the drill's tempo. */
export const notesPerSecond = (variation: Pick<SpiderVariation, "bpm" | "notesPerBeat">) =>
  (variation.bpm / 60) * variation.notesPerBeat;

/**
 * The fight's current drill as a session exercise. One id for the whole
 * fight — a new phase swaps the tab and tempo, not the exercise — and
 * generated, not in the catalogue: `_generatorConfig` keeps it off the
 * leaderboards and out of goals.
 */
export const buildPhaseExercise = (
  boss: BossDefinition,
  variation: SpiderVariation,
): Exercise => ({
  id: `boss-${boss.id}`,
  title: boss.name,
  description: boss.title,
  difficulty: "hard",
  category: "technique",
  // The fight decides when it ends — the session runs in free mode — so this
  // only has to outlast it.
  timeInMinutes: 60,
  instructions: [],
  tips: [],
  metronomeSpeed: { min: variation.bpm, max: variation.bpm, recommended: variation.bpm },
  relatedSkills: ["finger_independence"],
  tablature: buildSpiderTablature(variation),
  isHiddenFromLibrary: true,
  _generatorConfig: { kind: "boss", bossId: boss.id },
});
