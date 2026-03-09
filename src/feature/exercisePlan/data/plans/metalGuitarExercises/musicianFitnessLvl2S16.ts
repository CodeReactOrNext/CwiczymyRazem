import { musicianFitnessLvl2S16Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S16Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s16",
  title: "COMPLETE 20 Min Guitar Workout | Week 16 - MusicianFitness",
  description: "20 Min Guitar Workout - Week 16",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S16Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
