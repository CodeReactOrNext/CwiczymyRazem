import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation3214Image from "./image.png";

export const spiderPermutation3214Exercise: Exercise = {
  id: "spider_permutation_3214",
  title: {
    pl: "Pajączek - permutacja 3-2-1-4",
    en: "Spider Exercise - 3-2-1-4 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 3-2-1-4, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 3-2-1-4, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 3-2-1-4, czyli: palec 3, palec 2, palec 1, palec 4.",
      en: "Start playing according to the permutation 3-2-1-4, which means: finger 3, finger 2, finger 1, finger 4.",
    },

  ],
  tips: [
    {
      pl: "Zwróć uwagę na sekwencję wsteczną 3-2-1, która wymaga precyzyjnej kontroli.",
      en: "Pay attention to the backward sequence 3-2-1, which requires precise control.",
    },
    {
      pl: "Utrzymuj równe tempo i odstępy między dźwiękami - używaj metronomu.",
      en: "Maintain even tempo and spacing between notes - use a metronome.",
    },
    {
      pl: "Używaj minimalnej siły nacisku na progi - tylko tyle, ile potrzeba do czystego dźwięku.",
      en: "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    },
    {
      pl: "Staraj się utrzymać pozostałe palce blisko strun, gotowe do użycia.",
      en: "Try to keep other fingers close to the strings, ready to use.",
    },
    {
      pl: "Początkowo ćwicz wolno, skupiając się na precyzji, a nie prędkości.",
      en: "Initially practice slowly, focusing on precision rather than speed.",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation3214Image,
}; 