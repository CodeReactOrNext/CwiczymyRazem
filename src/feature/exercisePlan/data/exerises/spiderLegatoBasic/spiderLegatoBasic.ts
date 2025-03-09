import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderLegatoBasicImage from "./image.png";

export const spiderLegatoBasicExercise: Exercise = {
  id: "spider_legato_basic",
  title: {
    pl: "Pajączek Legato - podstawowy",
    en: "Spider Legato - Basic",
  },
  description: {
    pl: "Podstawowe ćwiczenie legato z wykorzystaniem czterech palców, rozwijające niezależność palców i płynność przejść.",
    en: "Basic legato exercise using four fingers, developing finger independence and transition smoothness.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    {
      pl: "Umieść palce lewej ręki na czterech kolejnych progach jednej struny.",
      en: "Place your left hand fingers on four consecutive frets of one string.",
    },
    {
      pl: "Uderz kostkę tylko dla pierwszej nuty, kolejne dźwięki wydobywaj tylko za pomocą lewej ręki (hammer-on/pull-off).",
      en: "Pick only the first note, produce subsequent notes using only your left hand (hammer-on/pull-off).",
    },
    {
      pl: "Graj w kolejności: 1-2-3-4, następnie 4-3-2-1, wszystko legato.",
      en: "Play in sequence: 1-2-3-4, then 4-3-2-1, all legato.",
    },
    {
      pl: "Powtarzaj wzór kilkakrotnie, dbając o równomierne brzmienie każdej nuty.",
      en: "Repeat the pattern several times, ensuring even sound for each note.",
    },
    {
      pl: "Przesuń całą pozycję o jeden próg w górę i powtórz ćwiczenie.",
      en: "Shift the entire position up one fret and repeat the exercise.",
    }
  ],
  tips: [
    {
      pl: "Skup się na równomiernej sile hammer-onów i pull-offów.",
      en: "Focus on even strength of hammer-ons and pull-offs.",
    },
    {
      pl: "Każda nuta powinna być wyraźnie słyszalna i mieć podobną głośność.",
      en: "Each note should be clearly audible and have similar volume.",
    },
    {
      pl: "Pracuj nad minimalizacją niepożądanych dźwięków podczas przejść między nutami.",
      en: "Work on minimizing unwanted sounds during note transitions.",
    },
    {
      pl: "Początkowo ćwicz wolno, zwiększaj tempo dopiero gdy osiągniesz dobrą kontrolę.",
      en: "Initially practice slowly, increase tempo only when you achieve good control.",
    },{
      pl: "Staraj się używać tyle siły ile potrzeba, nie przesadzaj z siłą",
      en: "Try to use as much force as needed, don't overdo it.",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "legato"],
  image: spiderLegatoBasicImage,
}; 