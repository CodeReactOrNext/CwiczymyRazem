import { musicianFitnessLvl2S19Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S19Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s19",
  title: "20 min Guitar Workout - Week 19 - MusicianFitness",
  description: "Master Fundamentals in 20 weeks!",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S19Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
