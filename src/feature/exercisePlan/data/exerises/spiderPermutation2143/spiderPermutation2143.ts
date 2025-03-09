import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import spiderPermutation2143Image from "public/images/exercises/spiderPermutation2143.png";

export const spiderPermutation2143Exercise: Exercise = {
  id: "spider_permutation_2143",
  title: {
    pl: "Pajączek - permutacja 2-1-4-3",
    en: "Spider Exercise - 2-1-4-3 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 2-1-4-3, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 2-1-4-3, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 2-1-4-3, czyli: palec 2, palec 1, palec 4, palec 3.",
      en: "Start playing according to the permutation 2-1-4-3, which means: finger 2, finger 1, finger 4, finger 3.",
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
      pl: "Ta permutacja łączy trudne przejścia 2-1 oraz 4-3 - wymagać będzie szczególnej kontroli każdego palca.",
      en: "This permutation combines challenging transitions 2-1 and 4-3 - it will require special control of each finger.",
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
  image: spiderPermutation2143Image,
}; 