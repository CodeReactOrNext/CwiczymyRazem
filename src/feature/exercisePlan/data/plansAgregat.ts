import { advancedImprovisationPlan } from "feature/exercisePlan/data/plans/advancedImprovisation/advancedImprovisation";
import { basicImprovisationPractice } from "feature/exercisePlan/data/plans/basicImprovisationPractice/basicImprovisationPractice";
import { creativePhrasingPlan } from "feature/exercisePlan/data/plans/creativePhrasing/creativePhrasing";
import { expressiveLeadPlayingPlan } from "feature/exercisePlan/data/plans/expressiveLeadPlaying/expressiveLeadPlaying";
import { fretboardAwarenessPlan } from "feature/exercisePlan/data/plans/fretboardAwareness/fretboardAwareness";
import { harmonicVoiceLeadingPlan } from "feature/exercisePlan/data/plans/harmonicVoiceLeading/harmonicVoiceLeading";
import { musicianFitnessLvl1S1Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S1";
import { musicianFitnessLvl1S2Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S2";
import { musicianFitnessLvl1S3Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S3";
import { musicianFitnessLvl1S4Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S4";
import { musicianFitnessLvl1S5Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S5";
import { musicianFitnessLvl1S6Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S6";
import { musicianFitnessLvl1S7Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S7";
import { musicianFitnessLvl1S8Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S8";
import { musicianFitnessLvl2S9Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S9";
import { musicianFitnessLvl2S10Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S10";
import { musicianFitnessLvl2S11Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S11";
import { musicianFitnessLvl2S12Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S12";
import { musicianFitnessLvl2S13Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S13";
import { musicianFitnessLvl2S14Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S14";
import { musicianFitnessLvl2S15Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S15";
import { musicianFitnessLvl2S16Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S16";
import { musicianFitnessLvl2S17Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S17";
import { musicianFitnessLvl2S18Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S18";
import { musicianFitnessLvl2S19Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S19";
import { musicianFitnessLvl2S20Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl2S20";
import { pentatonicPlayalongPlan } from "feature/exercisePlan/data/plans/pentatonicPlayalong/pentatonicPlayalongPlan";
import { rhythmicPrecisionPlan } from "feature/exercisePlan/data/plans/rhythmicPrecision/rhythmicPrecision";
import { spiderPermutationPlan } from "feature/exercisePlan/data/plans/spiderPermutationPlan/spiderPermutationPlan";
import { spiderMasterPlan } from "feature/exercisePlan/data/plans/spiderMasterPlan/spiderMasterPlan";
import { theIntervalMapPlan } from "feature/exercisePlan/data/plans/theIntervalMap/theIntervalMap";
import { warmUp15MinutesPlan } from "feature/exercisePlan/data/plans/warmUp15Minutes/warmUp15Minutes";
import { warmUp30MinutesPlan } from "feature/exercisePlan/data/plans/warmUp30Minutes/warmUp30Minutes";
import { megaBeginnerFirstStepsPlan } from "feature/exercisePlan/data/plans/megaBeginnerFirstSteps/megaBeginnerFirstSteps";
import { earRhythmFundamentalsPlan } from "feature/exercisePlan/data/plans/earRhythmFundamentals/earRhythmFundamentals";
import { handHealthStrengthPlan } from "feature/exercisePlan/data/plans/handHealthStrength/handHealthStrength";
import { dailyDexterityStarterPlan } from "feature/exercisePlan/data/plans/dailyDexterityStarter/dailyDexterityStarter";
import { soloingExplorerPlan } from "feature/exercisePlan/data/plans/soloingExplorer/soloingExplorer";
import { speedBuildingProgressivePlan } from "feature/exercisePlan/data/plans/speedBuildingProgressive/speedBuildingProgressive";
import { legatoMasterPlan } from "feature/exercisePlan/data/plans/legatoMasterPlan/legatoMasterPlan";
import { completeDailyPracticePlan } from "feature/exercisePlan/data/plans/completeDailyPractice/completeDailyPractice";

import type { ExercisePlan } from "../types/exercise.types";

const difficultyOrder: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const defaultPlans: ExercisePlan[] = [
  spiderMasterPlan,
  spiderPermutationPlan,
  basicImprovisationPractice,
  warmUp15MinutesPlan,
  warmUp30MinutesPlan,
  pentatonicPlayalongPlan,
  fretboardAwarenessPlan,
  harmonicVoiceLeadingPlan,
  creativePhrasingPlan,
  advancedImprovisationPlan,
  expressiveLeadPlayingPlan,
  rhythmicPrecisionPlan,
  theIntervalMapPlan,
  megaBeginnerFirstStepsPlan,
  earRhythmFundamentalsPlan,
  handHealthStrengthPlan,
  dailyDexterityStarterPlan,
  soloingExplorerPlan,
  speedBuildingProgressivePlan,
  legatoMasterPlan,
  completeDailyPracticePlan,
  // metalGuitarExercisesPlan,
  musicianFitnessLvl1S1Plan,
  musicianFitnessLvl1S2Plan,
  musicianFitnessLvl1S3Plan,
  musicianFitnessLvl1S4Plan,
  musicianFitnessLvl1S5Plan,
  musicianFitnessLvl1S6Plan,
  musicianFitnessLvl1S7Plan,
  musicianFitnessLvl1S8Plan,
  musicianFitnessLvl2S9Plan,
  musicianFitnessLvl2S10Plan,
  musicianFitnessLvl2S11Plan,
  musicianFitnessLvl2S12Plan,
  musicianFitnessLvl2S13Plan,
  musicianFitnessLvl2S14Plan,
  musicianFitnessLvl2S15Plan,
  musicianFitnessLvl2S16Plan,
  musicianFitnessLvl2S17Plan,
  musicianFitnessLvl2S18Plan,
  musicianFitnessLvl2S19Plan,
  musicianFitnessLvl2S20Plan,
].sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));







