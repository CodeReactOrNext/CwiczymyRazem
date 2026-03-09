import { musicianFitnessLvl2S20Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S20Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s20",
  title: "Guitar Fundamentals Mastered? - MusicianFitness",
  description: "Week 20 - Try To Keep Up!",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S20Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
