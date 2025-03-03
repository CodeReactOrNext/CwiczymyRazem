import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";

export const spiderStairsExercise: Exercise = {
  id: "spider_stairs",
  title: {
    pl: "Pająki schodkowe",
    en: "Spider Stairs Exercise",
  },
  description: {
    pl: "Ćwiczenie rozwijające koordynację palców poprzez przechodzenie między strunami w układzie schodkowym.",
    en: "Exercise developing finger coordination through string crossing in a stair-like pattern.",
  },
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    {
      pl: "Zacznij od pierwszego progu na strunie E, używając palców 1-2-3-4.",
      en: "Start from the first fret on the E string, using fingers 1-2-3-4.",
    },
    {
      pl: "Po zagraniu czwartego dźwięku, przejdź na następną strunę i zacznij od drugiego progu.",
      en: "After playing the fourth note, move to the next string and start from the second fret.",
    },
    {
      pl: "Kontynuuj wzór, przesuwając się o jeden próg wyżej na każdej kolejnej strunie.",
      en: "Continue the pattern, moving one fret higher on each subsequent string.",
    },
    {
      pl: "Po dotarciu do ostatniej struny, wykonaj ćwiczenie w przeciwnym kierunku.",
      en: "After reaching the last string, perform the exercise in reverse.",
    }
  ],
  tips: [
    {
      pl: "Zwróć szczególną uwagę na płynne przejścia między strunami.",
      en: "Pay special attention to smooth transitions between strings.",
    },
    {
      pl: "Utrzymuj wszystkie palce blisko gryfu podczas zmiany strun.",
      en: "Keep all fingers close to the fretboard when changing strings.",
    },
    {
      pl: "Upewnij się, że każdy dźwięk wybrzmiewa czysto i wyraźnie.",
      en: "Make sure each note rings out clearly and distinctly.",
    },
    {
      pl: "Pracuj nad równomiernym tempem, szczególnie podczas zmiany strun.",
      en: "Work on maintaining even tempo, especially during string changes.",
    },
    {
      pl: "Eksperymentuj z różnymi wariantami palcowania (1-2-3-4, 4-3-2-1).",
      en: "Experiment with different fingering patterns (1-2-3-4, 4-3-2-1).",
    },
    {
      pl: "Zacznij od wolnego tempa i stopniowo zwiększaj prędkość.",
      en: "Start at a slow tempo and gradually increase speed.",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 160,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "picking", "legato"],
  image: spiderBasicImage,
};