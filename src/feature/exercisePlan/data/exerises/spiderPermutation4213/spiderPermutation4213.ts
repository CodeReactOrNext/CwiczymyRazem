import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4213Image from "./image.png";

export const spiderPermutation4213Exercise: Exercise = {
  id: "spider_permutation_4213",
  title: {
    pl: "Pajączek - permutacja 4-2-1-3",
    en: "Spider Exercise - 4-2-1-3 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 4-2-1-3, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 4-2-1-3, developing finger independence and coordination.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    {
      pl: "Umieść palce lewej ręki na czterech kolejnych progach jednej struny.",
      en: "Place your left hand fingers on four consecutive frets of one string.",
    },
    {
      pl: "Zacznij grać według permutacji 4-2-1-3, czyli: palec 4, palec 2, palec 1, palec 3.",
      en: "Start playing according to the permutation 4-2-1-3, which means: finger 4, finger 2, finger 1, finger 3.",
    },
    {
      pl: "Powtarzaj wzór kilkakrotnie, dbając o równomierne uderzenia i czystość dźwięku.",
      en: "Repeat the pattern several times, ensuring even attacks and clean sound.",
    },
  
  ],
  tips: [
    {
      pl: "Sekwencja 4-2-1 wymaga szczególnej kontroli - to ruch wsteczny zaczynający się od najsłabszego palca.",
      en: "The 4-2-1 sequence requires special control - it's a backward movement starting with the weakest finger.",
    },
    {
      pl: "Utrzymuj równe tempo i odstępy między dźwiękami - używaj metronomu.",
      en: "Maintain even tempo and spacing between notes - use a metronome.",
    },
    
          
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation4213Image,
}; 