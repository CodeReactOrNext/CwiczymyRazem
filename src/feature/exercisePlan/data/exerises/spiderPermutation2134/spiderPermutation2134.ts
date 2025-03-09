import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import spiderPermutation2134Image from "public/images/exercises/spiderPermutation2134.png";

export const spiderPermutation2134Exercise: Exercise = {
  id: "spider_permutation_2134",
  title: {
    pl: "Pajączek - permutacja 2-1-3-4",
    en: "Spider Exercise - 2-1-3-4 Permutation",
  },
  description: {
    pl: "Chromatyczne ćwiczenie z wykorzystaniem permutacji palców 2-1-3-4, rozwijające niezależność palców i koordynację.",
    en: "Chromatic exercise using finger permutation 2-1-3-4, developing finger independence and coordination.",
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
      pl: "Zacznij grać według permutacji 2-1-3-4, czyli: palec 2, palec 1, palec 3, palec 4.",
      en: "Start playing according to the permutation 2-1-3-4, which means: finger 2, finger 1, finger 3, finger 4.",
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
      pl: "Zwróć uwagę na przejście 2-1, które wymaga cofnięcia się po gryfie - to nietypowy ruch.",
      en: "Pay attention to the 2-1 transition, which requires moving backwards on the fretboard - this is an unusual movement.",
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
  image: spiderPermutation2134Image,
}; 