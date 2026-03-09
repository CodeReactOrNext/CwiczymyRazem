import { musicianFitnessLvl2S13Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S13Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s13",
  title: "[Level 2] Week 13 Guitar Workout - MusicianFitness",
  description: "Power Chords, Dominant 7ths & Syncopated Strumming",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S13Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
