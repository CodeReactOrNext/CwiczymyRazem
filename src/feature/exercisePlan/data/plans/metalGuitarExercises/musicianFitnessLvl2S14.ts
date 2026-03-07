import { musicianFitnessLvl2S14Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S14Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s14",
  title: "[Level 2] Week 14 Guitar Workout - MusicianFitness",
  description: "Pentatonic Triplets, Smooth Chord Changes",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S14Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
