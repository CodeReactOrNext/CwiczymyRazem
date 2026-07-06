
import { chromaticSpiderWalkExercise } from "feature/exercisePlan/data/exerises/chromaticSpiderWalk/chromaticSpiderWalk";
import { fingerIndependence1aExercise } from "feature/exercisePlan/data/exerises/fingerIndependence1a/fingerIndependence1a";
import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { mutingDisciplineDrillExercise } from "feature/exercisePlan/data/exerises/mutingDisciplineDrill/mutingDisciplineDrill";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { spiderChromaticsExercise } from "feature/exercisePlan/data/exerises/spiderChromatics/spiderChromatics";
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";

import type { ExercisePlan } from "../../../types/exercise.types";
import warmUpImage from "./image.webp";


export const warmUp30MinutesPlan: ExercisePlan = {
  id: "warm_up_30_minutes",
  icon: "flame",
  color: "orange",
  title: "Warm-up - 30 Minutes",
  description: "Basic 30-minute warm-up before your main practice session",
  difficulty: "medium",
  category: "technique",
  exercises: [
    jpStretching,
    fingerIndependence1aExercise,
    spiderBasicExercise,
    chromaticSpiderWalkExercise,
    spiderLegatoBasicExercise,
    mutingDisciplineDrillExercise,
    spiderChromaticsExercise
  ],
  userId: "system",
  image: warmUpImage,
};
