import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderOneStringExercise: Exercise = {
  id: "spider_one_string",
  title: {
    pl: "Pająki na jednej strunie",
    en: "Single String Spider Exercise",
  },
  description: {
    pl: "Ćwiczenie chromatyczne na jednej strunie rozwijające niezależność palców i precyzję lewej ręki.",
    en: "Chromatic exercise on a single string developing finger independence and left hand precision.",
  },
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    {
      pl: "Zacznij od pierwszego progu na strunie E, używając palców 1-2-3-4.",
      en: "Start from the first fret on the E string, using fingers 1-2-3-4.",
    },
    {
      pl: "Graj kolejno: 1-2-3-4, potem 4-3-2-1, utrzymując równe tempo.",
      en: "Play sequentially: 1-2-3-4, then 4-3-2-1, maintaining even tempo.",
    },
    {
      pl: "Po opanowaniu, przesuń się o jeden próg wyżej i powtórz sekwencję.",
      en: "After mastering, move one fret higher and repeat the sequence.",
    },
    {
      pl: "Ćwicz na wszystkich strunach, zaczynając od najniższej E.",
      en: "Practice on all strings, starting from the low E.",
    }
  ],
  tips: [
    {
      pl: "Utrzymuj palce blisko progów, nie odrywaj ich zbyt wysoko.",
      en: "Keep fingers close to the frets, don't lift them too high.",
    },
    {
      pl: "Zwróć uwagę na równomierne brzmienie każdego dźwięku.",
      en: "Pay attention to the even sound of each note.",
    },
    {
      pl: "Zacznij powoli, zwiększaj tempo dopiero gdy sekwencja jest czysta.",
      en: "Start slowly, increase tempo only when the sequence is clean.",
    },
    {
      pl: "Używaj metronomu aby utrzymać stabilne tempo.",
      en: "Use a metronome to maintain stable tempo.",
    },
    {
      pl: "Ćwicz również w przeciwnym kierunku (4-3-2-1, 1-2-3-4).",
      en: "Practice also in reverse direction (4-3-2-1, 1-2-3-4).",
    }
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["alternate_picking",  "picking"],
  image: spiderBasicImage
};