import { musicianFitnessLvl1S8Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl1S8Plan: ExercisePlan = {
  id: "musician_fitness_lvl1_s8",
  title: "Level #1 Session #8 - MusicianFitness",
  description: "Full Musician Fitness practice session!",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl1S8Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
