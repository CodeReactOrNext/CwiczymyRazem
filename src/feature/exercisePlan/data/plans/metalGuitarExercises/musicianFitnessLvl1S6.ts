import { musicianFitnessLvl1S6Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl1S6Plan: ExercisePlan = {
  id: "musician_fitness_lvl1_s6",
  title: "Level #1 Session #6 - MusicianFitness",
  description: "Riffs, Chord Changes, Spider Crawls, and MORE!",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl1S6Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
