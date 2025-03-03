// Tutaj będziemy importować kolejne ćwiczenia z innych planów

import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { Exercise } from "feature/exercisePlan/types/exercise.types";

// Eksportujemy wszystkie ćwiczenia jako jeden agregat
export const exercisesAgregat: Exercise[] = [
  spiderBasicExercise,
  // Tutaj będą kolejne ćwiczenia
];

// Możemy też eksportować ćwiczenia pogrupowane tematycznie
export const techniqueExercises = [spiderBasicExercise];
export const theoryExercises: Exercise[] = [];
export const hearingExercises: Exercise[] = [];
export const creativityExercises: Exercise[] = []; 