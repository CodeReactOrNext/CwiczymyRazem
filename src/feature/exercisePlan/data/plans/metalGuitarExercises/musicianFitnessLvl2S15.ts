import { musicianFitnessLvl2S15Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S15Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s15",
  title: "[Level 2] Week 15 Guitar Workout - MusicianFitness",
  description: "Rhythm Changes, Smooth Strumming",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S15Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
