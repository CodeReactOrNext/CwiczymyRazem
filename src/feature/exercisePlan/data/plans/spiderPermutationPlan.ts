import type { ExercisePlan } from "../../types/exercise.types";
import { spiderPermutation1243Exercise } from "../exerises/spiderPermutation1243/spiderPermutation1243";
import { spiderPermutation1324Exercise } from "../exerises/spiderPermutation1324/spiderPermutation1324";
import { spiderPermutation1342Exercise } from "../exerises/spiderPermutation1342/spiderPermutation1342";
import { spiderPermutation1423Exercise } from "../exerises/spiderPermutation1423/spiderPermutation1423";
import { spiderPermutation1432Exercise } from "../exerises/spiderPermutation1432/spiderPermutation1432";
import { spiderPermutation2134Exercise } from "../exerises/spiderPermutation2134/spiderPermutation2134";
import { spiderPermutation2143Exercise } from "../exerises/spiderPermutation2143/spiderPermutation2143";
import { spiderPermutation2314Exercise } from "../exerises/spiderPermutation2314/spiderPermutation2314";
import { spiderPermutation2341Exercise } from "../exerises/spiderPermutation2341/spiderPermutation2341";
import { spiderPermutation2413Exercise } from "../exerises/spiderPermutation2413/spiderPermutation2413";
import { spiderPermutation2431Exercise } from "../exerises/spiderPermutation2431/spiderPermutation2431";
// importuj pozostałe permutacje

export const spiderPermutationPlan: ExercisePlan = {
  id: "spider_permutation_complete",
  title: "Kompletny trening pajączków - permutacje palców",
  description: "Zaawansowany plan treningowy zawierający wszystkie permutacje pajączków dla doskonalenia niezależności palców i techniki gry.",
  difficulty: "advanced",
  category: "technique",
  exercises: [
    spiderPermutation1243Exercise,
    spiderPermutation1324Exercise,
    spiderPermutation1342Exercise,
    spiderPermutation1423Exercise,
    spiderPermutation1432Exercise,
    spiderPermutation2134Exercise,
    spiderPermutation2143Exercise,
    spiderPermutation2314Exercise,
    spiderPermutation2341Exercise,
    spiderPermutation2413Exercise,
    spiderPermutation2431Exercise,
    // dodaj pozostałe permutacje
  ],
  userId: "system",
}; 