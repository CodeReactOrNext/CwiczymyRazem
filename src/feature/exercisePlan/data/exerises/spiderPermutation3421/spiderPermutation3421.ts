import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import spiderPermutation3421Image from "public/images/exercises/spiderPermutation3421.png";

export const spiderPermutation3421Exercise: Exercise = {
  id: "spider_permutation_3421",
  title: {
    pl: "Pajączek - permutacja 3-4-2-1",
    en: "Spider Exercise - 3-4-2-1 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 3-4-2-1, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 3-4-2-1, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 3-4-2-1, czyli: palec 3, palec 4, palec 2, palec 1.",
      en: "Start playing according to the permutation 3-4-2-1, which means: finger 3, finger 4, finger 2, finger 1.",
    },

   
  ],
  tips: [
    {
      pl: "Ta permutacja zawiera sekwencję wsteczną 4-2-1, która jest szczególnie wymagająca.",
      en: "This permutation contains a backward sequence 4-2-1, which is particularly demanding.",
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
  image: spiderPermutation3421Image,
}; 