import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import jpStretchingImage from "./image.png";


export const jpStretching: Exercise = {
  id: "jp_stretching",
  title: {
    pl: "Rozciąganie Johna Petrucci",
    en: "JP stretching",
  },
  description: {
    pl: "Rozciąganie Johna Petrucci z Rock Discipline - ćwiczenie poprawiające elastyczność palców",
    en: "JP stretching from Rock Discipline - exercise improving finger flexibility",
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [

    {
      pl: "Po wykonaniu sekwencji, przesuń się o jeden próg niżej i powtórz.",
      en: "After completing the sequence, move one fret lower and repeat.",
    },
    {
      pl: "Kontynuuj przesuwanie się w dół gryfu aż do pierwszego progu.",
      en: "Continue moving down the fretboard until you reach the first fret.",
    },
    {
      pl: "Powtórz ćwiczenie na wszystkich strunach.",
      en: "Repeat the exercise on all strings.",
    }
  ],
  tips: [
    {
      pl: "Skup się na rozciąganiu palców, a nie na szybkości wykonania.",
      en: "Focus on stretching your fingers, not on speed.",
    },
    {
      pl: "Utrzymuj nadgarstek w neutralnej pozycji, aby uniknąć napięcia.",
      en: "Keep your wrist in a neutral position to avoid tension.",
    },
    {
      pl: "Jeśli czujesz ból (nie dyskomfort), przerwij ćwiczenie.",
      en: "If you feel pain (not discomfort), stop the exercise.",
    },
   
    {
      pl: "Pamiętaj o rozluźnieniu dłoni między powtórzeniami.",
      en: "Remember to relax your hand between repetitions.",
    }
  ],
  metronomeSpeed: null,
  relatedSkills: [],
  image: jpStretchingImage
};