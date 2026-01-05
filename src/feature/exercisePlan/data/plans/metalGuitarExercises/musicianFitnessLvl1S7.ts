import { musicianFitnessLvl1S7Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import type { ExercisePlan } from "../../../types/exercise.types";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

export const musicianFitnessLvl1S7Plan: ExercisePlan = {
  id: "musician_fitness_lvl1_s7",
  title: "Level #1 Session #7 - MusicianFitness",
  description: "Spider Crawls, Common Chord Changes, EASY Songs!",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl1S7Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
