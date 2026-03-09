import { musicianFitnessLvl2S9Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S9Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s9",
  title: "[Level 2] Beginner Guitar Workout #9 - MusicianFitness",
  description: "7th Chords, Syncopated Strumming",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S9Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
