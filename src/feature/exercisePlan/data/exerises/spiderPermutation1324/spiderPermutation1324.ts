import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import spiderPermutation1324Image from "public/images/exercises/spiderPermutation1324.png";

export const spiderPermutation1324Exercise: Exercise = {
  id: "spider_permutation_1324",
  title: {
    pl: "Pajączek - permutacja 1-3-2-4",
    en: "Spider Exercise - 1-3-2-4 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 1-3-2-4, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 1-3-2-4, developing finger independence and coordination.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    {
      pl: "Umieść palce lewej ręki na czterech kolejnych progach jednej struny (np. 1 palec na 5. progu, 2 na 6., 3 na 7., 4 na 8.).",
      en: "Place your left hand fingers on four consecutive frets of one string (e.g., 1st finger on 5th fret, 2nd on 6th, 3rd on 7th, 4th on 8th).",
    },
    {
      pl: "Zacznij grać według permutacji 1-3-2-4, czyli: palec 1, palec 3, palec 2, palec 4.",
      en: "Start playing according to the permutation 1-3-2-4, which means: finger 1, finger 3, finger 2, finger 4.",
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
      pl: "Utrzymuj równe tempo i odstępy między dźwiękami - używaj metronomu.",
      en: "Maintain even tempo and spacing between notes - use a metronome.",
    },
    {
      pl: "Używaj minimalnej siły nacisku na progi - tylko tyle, ile potrzeba do czystego dźwięku.",
      en: "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    },
    {
      pl: "Zwróć uwagę na nietypowe przejścia (np. 3-2), które mogą być trudniejsze.",
      en: "Pay attention to unusual transitions (e.g., 3-2), which may be more difficult.",
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
    max: 160,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation1324Image,
}; 