import { spiderPermutation3124Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation3124/spiderPermutation3124";
import { spiderPermutation3142Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation3142/spiderPermutation3142";
import { spiderPermutation3214Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation3214/spiderPermutation3214";
import { spiderPermutation3241Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation3241/spiderPermutation3241";
import { spiderPermutation3412Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation3412/spiderPermutation3412";
import { spiderPermutation3421Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation3421/spiderPermutation3421";
import { spiderPermutation4123Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation4123/spiderPermutation4123";
import { spiderPermutation4132Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation4132/spiderPermutation4132";
import { spiderPermutation4213Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation4213/spiderPermutation4213";
import { spiderPermutation4231Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation4231/spiderPermutation4231";
import { spiderPermutation4312Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation4312/spiderPermutation4312";
import { spiderPermutation4321Exercise } from "feature/exercisePlan/data/exerises/spiderPermutation4321/spiderPermutation4321";

import type { ExercisePlan } from "../../../types/exercise.types";
import { spiderPermutation1234Exercise } from "../../exerises/spiderPermutation1234/spiderPermutation1234";
import { spiderPermutation1243Exercise } from "../../exerises/spiderPermutation1243/spiderPermutation1243";
import { spiderPermutation1324Exercise } from "../../exerises/spiderPermutation1324/spiderPermutation1324";
import { spiderPermutation1342Exercise } from "../../exerises/spiderPermutation1342/spiderPermutation1342";
import { spiderPermutation1423Exercise } from "../../exerises/spiderPermutation1423/spiderPermutation1423";
import { spiderPermutation1432Exercise } from "../../exerises/spiderPermutation1432/spiderPermutation1432";
import { spiderPermutation2134Exercise } from "../../exerises/spiderPermutation2134/spiderPermutation2134";
import { spiderPermutation2143Exercise } from "../../exerises/spiderPermutation2143/spiderPermutation2143";
import { spiderPermutation2314Exercise } from "../../exerises/spiderPermutation2314/spiderPermutation2314";
import { spiderPermutation2341Exercise } from "../../exerises/spiderPermutation2341/spiderPermutation2341";
import { spiderPermutation2413Exercise } from "../../exerises/spiderPermutation2413/spiderPermutation2413";
import { spiderPermutation2431Exercise } from "../../exerises/spiderPermutation2431/spiderPermutation2431";
import spiderPermutationImage from "./image.webp";


export const spiderPermutationPart1Plan: ExercisePlan = {
  id: "spider_permutation_part1_index",
  icon: "spider",
  color: "fuchsia",
  title: "[Part 1] Spider Permutations – Index-Led",
  description: "Spider permutations that start on the index finger (1). The gentlest entry point for building finger independence.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    spiderPermutation1234Exercise,
    spiderPermutation1243Exercise,
    spiderPermutation1324Exercise,
    spiderPermutation1342Exercise,
    spiderPermutation1423Exercise,
    spiderPermutation1432Exercise,
  ],
  userId: "system",
  image: spiderPermutationImage,
};

export const spiderPermutationPart2Plan: ExercisePlan = {
  id: "spider_permutation_part2_middle",
  icon: "spider",
  color: "fuchsia",
  title: "[Part 2] Spider Permutations – Middle-Led",
  description: "Spider permutations that start on the middle finger (2). Trains control when leading with the second finger.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    spiderPermutation2134Exercise,
    spiderPermutation2143Exercise,
    spiderPermutation2314Exercise,
    spiderPermutation2341Exercise,
    spiderPermutation2413Exercise,
    spiderPermutation2431Exercise,
  ],
  userId: "system",
  image: spiderPermutationImage,
};

export const spiderPermutationPart3Plan: ExercisePlan = {
  id: "spider_permutation_part3_ring",
  icon: "spider",
  color: "fuchsia",
  title: "[Part 3] Spider Permutations – Ring-Led",
  description: "Spider permutations that start on the ring finger (3). Challenges the weaker third finger to lead each pattern.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    spiderPermutation3124Exercise,
    spiderPermutation3142Exercise,
    spiderPermutation3214Exercise,
    spiderPermutation3241Exercise,
    spiderPermutation3412Exercise,
    spiderPermutation3421Exercise,
  ],
  userId: "system",
  image: spiderPermutationImage,
};

export const spiderPermutationPart4Plan: ExercisePlan = {
  id: "spider_permutation_part4_pinky",
  icon: "spider",
  color: "fuchsia",
  title: "[Part 4] Spider Permutations – Pinky-Led",
  description: "Spider permutations that start on the pinky (4). The toughest set — builds strength and independence in the weakest finger.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    spiderPermutation4123Exercise,
    spiderPermutation4132Exercise,
    spiderPermutation4213Exercise,
    spiderPermutation4231Exercise,
    spiderPermutation4312Exercise,
    spiderPermutation4321Exercise,
  ],
  userId: "system",
  image: spiderPermutationImage,
};
