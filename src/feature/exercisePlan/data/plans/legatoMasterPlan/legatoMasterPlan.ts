import { legatoContinuousFlowExercise } from "feature/exercisePlan/data/exerises/legatoContinuousFlow/legatoContinuousFlow";
import { legatoHammerPullRunExercise } from "feature/exercisePlan/data/exerises/legatoHammerPullRun/legatoHammerPullRun";
import { legatoSextuplets457Exercise } from "feature/exercisePlan/data/exerises/legatoSextuplets457/legatoSextuplets457";
import { legatoTrillSprintExercise } from "feature/exercisePlan/data/exerises/legatoTrillSprint/legatoTrillSprint";
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";

import type { ExercisePlan } from "../../../types/exercise.types";

export const legatoMasterPlan: ExercisePlan = {
  id: "legato_master_plan",
  title: "Legato Master Plan",
  description: "Complete legato technique training. Develops smooth hammer-on and pull-off execution, trill endurance, continuous legato flow, and advanced sextuplet patterns across the fretboard.",
  difficulty: "hard",
  category: "technique",
  exercises: [
    spiderLegatoBasicExercise,
    legatoHammerPullRunExercise,
    legatoContinuousFlowExercise,
    legatoTrillSprintExercise,
    legatoSextuplets457Exercise,
  ],
  userId: "system",
  image: null,
};
