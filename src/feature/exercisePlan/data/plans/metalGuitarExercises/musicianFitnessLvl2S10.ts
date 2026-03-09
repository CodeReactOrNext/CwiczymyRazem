import { musicianFitnessLvl2S10Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl2S10Plan: ExercisePlan = {
  id: "musician_fitness_lvl2_s10",
  title: "[Level 2] Beginner Guitar Workout #10 - MusicianFitness",
  description: "Chord Progressions, Pentatonic Scale",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl2S10Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
