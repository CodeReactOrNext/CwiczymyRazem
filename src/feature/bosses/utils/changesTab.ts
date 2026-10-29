import type { Exercise, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

import type { BossDefinition, ChangesVariation, ChordUnit } from "../types/boss.types";

/** The changeling's bars: 4/4 throughout. */
export const BEATS_PER_BAR = 4;

/** Where each chord of the pass starts and ends, in beats from the top of the pass. */
export interface UnitSpan {
  start: number;
  end: number;
}

const spanCache = new WeakMap<object, UnitSpan[]>();

/** The beats each chord of the pass holds. Cached per drill — read on every frame. */
export const unitSpans = (variation: { units: readonly ChordUnit[] }): UnitSpan[] => {
  let spans = spanCache.get(variation);
  if (!spans) {
    let at = 0;
    spans = variation.units.map((unit) => {
      const span = { start: at, end: at + unit.beats };
      at = span.end;
      return span;
    });
    spanCache.set(variation, spans);
  }
  return spans;
};

/**
 * The pass as 4/4 bars of rests, each chord's name printed over the beat it
 * starts on: nothing to read, but the session's clock runs on it and the
 * boss's score follows the names (bossBacking's tabHarmony). The board laid
 * over it shows what to play.
 */
export const buildChangesTablature = (variation: Pick<ChangesVariation, "units">): TablatureMeasure[] => {
  const measures: TablatureMeasure[] = [];
  let current: TablatureMeasure | null = null;
  let filled = 0;
  for (const unit of variation.units) {
    if (!current) {
      current = { timeSignature: [4, 4], beats: [] };
      measures.push(current);
    }
    current.beats.push({ duration: unit.beats, notes: [], chordName: unit.chord });
    filled += unit.beats;
    if (filled >= BEATS_PER_BAR) {
      current = null;
      filled = 0;
    }
  }
  return measures;
};

/**
 * The fight's current progression as a session exercise — one id for the
 * whole fight like the other bosses', kept off the leaderboards and goals by
 * `_generatorConfig`.
 */
export const buildChangesPhaseExercise = (
  boss: BossDefinition,
  variation: ChangesVariation,
): Exercise => ({
  id: `boss-${boss.id}`,
  title: boss.name,
  description: boss.title,
  difficulty: "medium",
  category: "creativity",
  // The fight decides when it ends — the session runs in free mode.
  timeInMinutes: 60,
  instructions: [],
  tips: [],
  metronomeSpeed: { min: variation.bpm, max: variation.bpm, recommended: variation.bpm },
  relatedSkills: ["improvisation"],
  tablature: buildChangesTablature(variation),
  isHiddenFromLibrary: true,
  _generatorConfig: { kind: "boss", bossId: boss.id },
});
