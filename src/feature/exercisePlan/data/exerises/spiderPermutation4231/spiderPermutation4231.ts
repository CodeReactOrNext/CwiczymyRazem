import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import spiderPermutation4231Image from "public/images/exercises/spiderPermutation4231.png";

export const spiderPermutation4231Exercise: Exercise = {
  id: "spider_permutation_4231",
  title: {
    pl: "Pajączek - permutacja 4-2-3-1",
    en: "Spider Exercise - 4-2-3-1 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 4-2-3-1, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 4-2-3-1, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 4-2-3-1, czyli: palec 4, palec 2, palec 3, palec 1.",
      en: "Start playing according to the permutation 4-2-3-1, which means: finger 4, finger 2, finger 3, finger 1.",
    },
  
  ],
  tips: [
    {
      pl: "Zakończenie sekwencji palcem 1 po palcu 3 wymaga precyzyjnego ruchu pod pozostałymi palcami.",
      en: "Ending the sequence with finger 1 after finger 3 requires precise movement under the other fingers.",
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
  image: spiderPermutation4231Image,
}; 