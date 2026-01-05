import { musicianFitnessLvl1S2Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import type { ExercisePlan } from "../../../types/exercise.types";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

export const musicianFitnessLvl1S2Plan: ExercisePlan = {
  id: "musician_fitness_lvl1_s2",
  title: "Level #1 Session #2 - MusicianFitness",
  description: "Speeding Up and Changing Chords",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl1S2Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
