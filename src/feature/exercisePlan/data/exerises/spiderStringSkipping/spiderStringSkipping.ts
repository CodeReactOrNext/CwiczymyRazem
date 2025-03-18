import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const SpiderStringSkippingExercise: Exercise = {
  id: "spider_string_skipping",
  title: {
    pl: "Pająki ze zmianą strun",
    en: "String Skipping Spider Exercise",
  },
  description: {
    pl: "Ćwiczenie rozwijające koordynację przy przeskakiwaniu między strunami i precyzję prawej ręki.",
    en: "Exercise developing coordination in string skipping and right hand precision.",
  },
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    {
      pl: "Rozpocznij od pierwszego progu na strunie E, następnie przeskocz jedną strunę.",
      en: "Start from the first fret on the E string, then skip one string.",
    },
    {
      pl: "Wykonuj wzór 1-2-3-4 na przemiennych strunach.",
      en: "Perform the 1-2-3-4 pattern on alternating strings.",
    },
    {
      pl: "Po każdym powtórzeniu przesuń się o jeden próg wyżej.",
      en: "After each repetition, move one fret higher.",
    },
    {
      pl: "Zwróć szczególną uwagę na czystość dźwięku przy przeskakiwaniu strun.",
      en: "Pay special attention to clean notes when skipping strings.",
    }
  ],
  tips: [
    {
      pl: "Kontroluj ruch kostki, unikając uderzania pomijanych strun.",
      en: "Control pick movement, avoiding hitting skipped strings.",
    },
    {
      pl: "Utrzymuj stabilną pozycję prawej ręki podczas przeskoków.",
      en: "Maintain stable right hand position during skips.",
    },
    {
      pl: "Zacznij od wolnego tempa, skupiając się na precyzji przeskoków.",
      en: "Start with slow tempo, focusing on skip precision.",
    },
    {
      pl: "Eksperymentuj z różnymi kombinacjami strun.",
      en: "Experiment with different string combinations.",
    },
    {
      pl: "Ćwicz również w przeciwnym kierunku (od wysokich do niskich strun).",
      en: "Practice also in reverse (from high to low strings).",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 160,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};