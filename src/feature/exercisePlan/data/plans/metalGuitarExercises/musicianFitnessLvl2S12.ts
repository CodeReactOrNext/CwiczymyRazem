import { musicianFitnessLvl2S12Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S12Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s12",
  title: "[Level 2] Beginner Guitar Practice Session Week #12 - MusicianFitness",
  description: "Level 2 Practice Session Week 12",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S12Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
