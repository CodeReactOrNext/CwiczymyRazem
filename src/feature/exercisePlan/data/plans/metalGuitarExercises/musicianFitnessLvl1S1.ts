import { musicianFitnessLvl1S1Exercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";
import type { ExercisePlan } from "../../../types/exercise.types";
import authorAvatar from "public/images/avatars/musicfitnes.jpg";

export const musicianFitnessLvl1S1Plan: ExercisePlan = {
  id: "musician_fitness_lvl1_s1",
  title: "Level #1 Session #1 - MusicianFitness",
  description: "Spider Crawls, Strumming, Chord Kicks, Power Chords, Riffs!",
  difficulty: "easy",
  category: "technique",
  exercises: [musicianFitnessLvl1S1Exercise],
  userId: "MusicianFitness",
  image: null,
  author: {
    name: "Musician Fitness",
    avatar: authorAvatar,
  },
};
