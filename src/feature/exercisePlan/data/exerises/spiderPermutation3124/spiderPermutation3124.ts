import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation3124Image from "./image.png";

export const spiderPermutation3124Exercise: Exercise = {
  id: "spider_permutation_3124",
  title: {
    pl: "Pajączek - permutacja 3-1-2-4",
    en: "Spider Exercise - 3-1-2-4 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 3-1-2-4, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 3-1-2-4, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 3-1-2-4, czyli: palec 3, palec 1, palec 2, palec 4.",
      en: "Start playing according to the permutation 3-1-2-4, which means: finger 3, finger 1, finger 2, finger 4.",
    },
    {
      pl: "Powtarzaj wzór kilkakrotnie, dbając o równomierne uderzenia i czystość dźwięku.",
      en: "Repeat the pattern several times, ensuring even attacks and clean sound.",
    },
    {
      pl: "Przesuń całą pozycję o jeden próg w górę i powtórz ćwiczenie.",
      en: "Shift the entire position up one fret and repeat the exercise.",
    },
    {
      pl: "Kontynuuj przez całą długość gryfu, a następnie wypróbuj ćwiczenie na innych strunach.",
      en: "Continue throughout the length of the fretboard, then try the exercise on other strings.",
    }
  ],
  tips: [
    {
      pl: "Przejście 3-1 wymaga dużej kontroli - palec 1 musi przeskoczyć pod palcem 3.",
      en: "The 3-1 transition requires great control - finger 1 must jump under finger 3.",
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
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation3124Image,
}; 