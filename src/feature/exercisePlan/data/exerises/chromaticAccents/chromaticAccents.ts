import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import chromaticAccentsImage from "./image.png";


export const chromaticAccentsExercise: Exercise = {
  id: "chromatic_accents",
  title: {
    pl: "Akcenty chromatyczne",
    en: "Chromatic Accent Dynamics",
  },
  description: {
    pl: "Ćwiczenie rozwijające kontrolę dynamiki poprzez granie sekwencji chromatycznych z przesuwającymi się akcentami.",
    en: "Exercise developing dynamic control through playing chromatic sequences with shifting accents.",
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    {
      pl: "Wybierz fragment chromatycznej skali (np. od 5. do 9. progu na jednej strunie).",
      en: "Choose a section of the chromatic scale (e.g., from 5th to 9th fret on one string).",
    },
    {
      pl: "Graj sekwencję chromatycznych szesnastek, akcentując silnie PIERWSZY dźwięk każdej grupy czterech nut.",
      en: "Play a sequence of chromatic sixteenth notes, strongly accenting the FIRST note of each group of four.",
    },
    {
      pl: "Po opanowaniu, przesuń akcent na DRUGI dźwięk każdej czwórki, utrzymując pozostałe dźwięki ciszej.",
      en: "After mastering, shift the accent to the SECOND note of each group, keeping other notes quieter.",
    },
    {
      pl: "Kontynuuj, przesuwając akcent na TRZECI, a następnie CZWARTY dźwięk w każdej grupie.",
      en: "Continue by shifting the accent to the THIRD, then FOURTH note in each group.",
    },
    {
      pl: "Spróbuj łączyć różne wzory akcentów, np. akcentuj dźwięki 1 i 3, potem 2 i 4.",
      en: "Try combining different accent patterns, e.g., accent notes 1 and 3, then 2 and 4.",
    }
  ],
  tips: [
    {
      pl: "Różnica między akcentowanymi a nieakcentowanymi dźwiękami powinna być wyraźnie słyszalna.",
      en: "The difference between accented and non-accented notes should be clearly audible.",
    },
    {
      pl: "Kontroluj siłę uderzenia kostką - mocniejsze dla akcentów, lżejsze dla pozostałych dźwięków.",
      en: "Control your pick attack - stronger for accents, lighter for other notes.",
    },
    {
      pl: "Pracuj z metronomem, aby utrzymać równy timing pomimo zmian dynamicznych.",
      en: "Work with a metronome to maintain even timing despite dynamic changes.",
    },
    {
      pl: "Początkowo ćwicz wolno, zwiększając tempo dopiero gdy masz pełną kontrolę nad dynamiką.",
      en: "Initially practice slowly, increasing tempo only when you have full control over dynamics.",
    },

  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80
  }, 
  relatedSkills: [ "alternate_picking", "rhythm", "technique"],
  image: chromaticAccentsImage,
}; 