import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import type { BossDefinition } from "../types/boss.types";
import { buildChangesPhaseExercise } from "./changesTab";
import { buildChordPhaseExercise } from "./chordTab";
import type { PhasePlan } from "./phaseGenerator";
import { buildPhaseExercise } from "./spiderTab";

/** The phase being fought as the session's exercise, at the tempo it is played at. */
export const buildBossExercise = (boss: BossDefinition, plan: PhasePlan, bpm: number): Exercise =>
  plan.kind === "chords"
    ? buildChordPhaseExercise(boss, { ...plan.variation, bpm })
    : plan.kind === "changes"
      ? buildChangesPhaseExercise(boss, { ...plan.variation, bpm })
      : buildPhaseExercise(boss, { ...plan.variation, bpm });
