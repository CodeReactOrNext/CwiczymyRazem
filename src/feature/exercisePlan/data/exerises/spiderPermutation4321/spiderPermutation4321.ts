import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4321Image from "./image.png";


export const spiderPermutation4321Exercise: Exercise = {
  id: "spider_permutation_4321",
  title: {
    pl: "Pajączek - permutacja 4-3-2-1",
    en: "Spider Exercise - 4-3-2-1 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 4-3-2-1, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 4-3-2-1, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 4-3-2-1, czyli: palec 4, palec 3, palec 2, palec 1.",
      en: "Start playing according to the permutation 4-3-2-1, which means: finger 4, finger 3, finger 2, finger 1.",
    },

   
  ],
  tips: [
    {
      pl: "Ta permutacja jest całkowicie wsteczna - wymaga szczególnej kontroli nad każdym palcem.",
      en: "This permutation is completely backward - requires special control over each finger.",
    },
    {
      pl: "Utrzymuj równe tempo i odstępy między dźwiękami - używaj metronomu.",
      en: "Maintain even tempo and spacing between notes - use a metronome.",
    },
    {
      pl: "Używaj minimalnej siły nacisku na progi - tylko tyle, ile potrzeba do czystego dźwięku.",
      en: "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    },
    
   
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation4321Image,
}; 