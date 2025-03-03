import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExercise: Exercise = {
  id: "spider_x",
  title: {
    pl: "Pająki w układzie X",
    en: "Spider X Pattern Exercise",
  },
  description: {
    pl: "Ćwiczenie wykorzystujące wzór krzyżowy do rozwoju niezależności palców i koordynacji rąk.",
    en: "Exercise using X-pattern to develop finger independence and hand coordination.",
  },
  difficulty: "intermediate",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    {
      pl: "Ułóż palce w kształt litery X na dwóch sąsiednich strunach.",
      en: "Position fingers in an X shape on two adjacent strings.",
    },
    {
      pl: "Graj naprzemiennie dźwięki z obu strun, zachowując wzór krzyżowy.",
      en: "Play alternating notes from both strings, maintaining the X pattern.",
    },
    {
      pl: "Przesuń wzór o jeden próg wyżej po każdym cyklu.",
      en: "Move the pattern one fret higher after each cycle.",
    },
    {
      pl: "Powtórz ćwiczenie na wszystkich parach sąsiadujących strun.",
      en: "Repeat the exercise on all adjacent string pairs.",
    }
  ],
  tips: [
    {
      pl: "Zwróć uwagę na czystość dźwięku przy krzyżowaniu palców.",
      en: "Pay attention to note clarity when crossing fingers.",
    },
    {
      pl: "Utrzymuj minimalne napięcie w dłoni mimo nietypowego układu.",
      en: "Maintain minimal hand tension despite unusual pattern.",
    },
    {
      pl: "Ćwicz powoli, skupiając się na dokładności ruchów.",
      en: "Practice slowly, focusing on movement accuracy.",
    },
    {
      pl: "Eksperymentuj z różnymi rytmami w ramach wzoru.",
      en: "Experiment with different rhythms within the pattern.",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};