import { musicianFitnessLvl2S17Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S17Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s17",
  title: "COMPLETE 20 Min Guitar Workout | Week 17 - MusicianFitness",
  description: "20 Min Guitar Workout - Week 17",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S17Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
