import { musicianFitnessLvl1S3Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const musicianFitnessLvl1S3Plan: ExercisePlan = {
  id: "musician_fitness_lvl1_s3",
  title: "Level #1 Session #3 - MusicianFitness",
  description: "Open Chords, Powerchords, Strumming, and Full Song",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl1S3Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
